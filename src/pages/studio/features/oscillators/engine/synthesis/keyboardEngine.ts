import { SynthesisParameters, CompleteNoteEvent } from '../../api/types.ts';
import { drumSoundManager } from './drumEngine.ts';
import { Waveform } from '../../../../../../features/keyboard/store/slices/keyboard.slice.ts';
import { AdditiveOscillator } from './AdditiveOscillator.ts';

// Re-export AdditiveOscillator so it can be imported from the same location
export { AdditiveOscillator };

class KeyboardAudioManager {
    // Core audio settings
    private readonly MASTER_VOLUME = 0.8;
    private readonly DEFAULT_GAIN = 0.6;
    private readonly DEFAULT_VELOCITY = 100;

    // Default envelope settings
    private readonly DEFAULT_ATTACK = 50;    // milliseconds
    private readonly DEFAULT_DECAY = 100;    // milliseconds
    private readonly DEFAULT_SUSTAIN = 70;   // percentage
    private readonly DEFAULT_RELEASE = 150;  // milliseconds

    // Audio context and routing
    private audioContext: AudioContext | null = null;
    private mainGain: GainNode | null = null;
    private isInitialized = false;
    private currentMode: 'tunable' | 'drums' = 'tunable';
    private isGlobalOscillatorMode = true; // Default to global mode

    // Parameter storage
    private tunings = new Map<number, number>();
    private velocities = new Map<number, number>();
    private envelopeParams = new Map<number, {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    }>();

    private waveforms = new Map<number, Waveform>();
    private globalWaveform: Waveform = 'sine';
    private globalActiveWaveforms: Waveform[] = []; // Store global active waveforms

    // Add new filter parameter storage
    private filterParams = new Map<number, {
        cutoff: number;
        resonance: number;
    }>();

    // Add unison settings for each note
    private unisonSettings = new Map<number, {
        count: number;         // Number of unison voices (1-8)
        detune: number;        // Detune amount in cents (0-100)
        width: number;         // Stereo width (0-100%)
    }>();

    // Default unison settings
    private readonly DEFAULT_UNISON_COUNT = 1;  // Changed to 1 to make unison off by default
    private readonly DEFAULT_UNISON_DETUNE = 30; // Increased to 30 cents
    private readonly DEFAULT_UNISON_WIDTH = 100; // Full stereo width

    // Add filter node storage to active voices
    private activeVoices = new Map<number, {
        oscillator: OscillatorNode;
        filterNode: BiquadFilterNode;  // Add this
        gainNode: GainNode;
        baseFrequency: number;
        currentTuning: number;
        currentVelocity: number;
        startTime: number;
        noteStartTime: number;
        envelope: {
            attack: number;
            decay: number;
            sustain: number;
            release: number;
        };
        waveform: Waveform;
        filter: {
            cutoff: number;
            resonance: number;
        };
        unisonVoices?: Array<{
            oscillator: OscillatorNode;
            gainNode: GainNode;
            panNode: StereoPannerNode;
        }>;
        allOscillators?: OscillatorNode[];
        oscillators: any[];
    }>();


    // Default filter settings
    private readonly DEFAULT_FILTER_CUTOFF = 19000;  // Hz
    private readonly DEFAULT_FILTER_RESONANCE = 0.707;  // Q value

    // Add a new property to store active waveforms
    private activeWaveforms = new Map<number, Waveform[]>();
    private editableWaveform = new Map<number, Waveform>();

    // Just after the 'private envelopeParams' declaration, add:
    private oscillatorParams = new Map<number, Map<Waveform, {
        attack?: number;
        decay?: number;
        sustain?: number;
        release?: number;
        tuning?: number;
        velocity?: number;
        filterCutoff?: number;
        filterResonance?: number;
        unisonCount?: number;
        unisonDetune?: number;
        unisonWidth?: number;
        unison?: {
            count: number;
            detune: number;
            width: number;
        };
    }>>();

    // Add the baseOctave property near the other class member declarations
    private baseOctave = 3; // Lower default octave to prevent keyboard from being too high pitched

    // Add a new property to store the harmonic settings
    private harmonicSettings = new Map<number, Map<Waveform, number[]>>();

    // Update the playTunableNoteRT method to use AdditiveOscillator
    private async playTunableNoteRT(note: number, velocity: number): Promise<CompleteNoteEvent> {
        if (!this.audioContext) throw new Error('Audio context not initialized');

        const now = this.audioContext.currentTime;
        console.log(`[DEBUG] Playing tunable note ${note} with velocity ${velocity} at time ${now}`);
        
        // Get parameters
        const baseFrequency = this.getFrequency(note);
        const envelope = this.getEnvelopeParams(note);
        const synthesis = this.getCurrentSynthesis(note);
        
        // Get this note's specific waveform if it exists, otherwise use global
        const noteWaveform = this.getWaveformForNote(note);
        
        // Get all active waveforms for this note, or default to the note's specific waveform
        let waveforms = this.getActiveWaveformsForNote(note);
        if (waveforms.length === 0) {
            // If no waveforms are specified for multi-oscillator mode,
            // use the note-specific waveform (or global fallback)
            waveforms = [noteWaveform];
        }
        
        // If we're in a global mode, check if we need to apply the globally stored waveforms
        if (this.isGlobalOscillatorMode) {
            // Check if there are any global active waveforms stored
            const globalWaveforms = this.globalActiveWaveforms;
            if (globalWaveforms && globalWaveforms.length > 0) {
                console.log(`[AUDIO ENGINE] Using global active waveforms for new note ${note}: [${globalWaveforms.join(', ')}]`);
                waveforms = [...globalWaveforms];
                
                // Also store these waveforms for this note
                this.activeWaveforms.set(note, [...globalWaveforms]);
            }
        }
        
        console.log(`[DEBUG] Using waveforms ${waveforms.join(', ')} for note ${note}`);
        
        // Create a filter node that will be shared by all oscillators
        const filterNode = this.audioContext.createBiquadFilter();
        const filterParams = this.filterParams.get(note) ?? {
            cutoff: this.DEFAULT_FILTER_CUTOFF,
            resonance: this.DEFAULT_FILTER_RESONANCE
        };
        
        // Configure filter
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(filterParams.cutoff, now);
        filterNode.Q.setValueAtTime(filterParams.resonance, now);

        // Create a gain node that will be shared by all oscillators
        const gainNode = this.audioContext.createGain();
        const maxGain = this.velocityToGain(velocity);
        
        // Apply envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + envelope.attack);
        gainNode.gain.linearRampToValueAtTime(
            maxGain * envelope.sustain,
            now + envelope.attack + envelope.decay
        );
        
        // Get unison settings
        const unisonSettings = this.getUnisonSettings(note);
        
        // Track the oscillators we create for this voice
        const oscillators: any[] = [];

        // Only create one oscillator per unique waveform
        // Use a Set to ensure we don't have duplicates
        const uniqueWaveforms = new Set(waveforms);
        
        for (const waveform of uniqueWaveforms) {
            console.log(`[DEBUG AUDIO] Creating oscillator with waveform ${waveform} for note ${note}`);
            
            // Create additive oscillator with the specified waveform type
            const baseFreq = this.getFrequency(note, 0); // Get base frequency without tuning
            const additiveOsc = new AdditiveOscillator(this.audioContext, baseFreq, waveform);
            
            // Apply custom frequency/tuning if available
            const customParams = this.oscillatorParams.get(note)?.get(waveform);
            const tuningCents = customParams?.tuning ?? (this.tunings.get(note) ?? 0);
            const adjustedFreq = baseFreq * Math.pow(2, tuningCents / 1200);
            additiveOsc.setFrequency(adjustedFreq);
            
            // Check for custom harmonic settings and apply if available
            const customHarmonics = this.harmonicSettings.get(note)?.get(waveform);
            if (customHarmonics) {
                additiveOsc.setHarmonics(customHarmonics);
            } else {
                // No custom harmonics, use default for this waveform type
                // Note: We're NOT calling setWaveform() here because that would reset 
                // the harmonic amplitudes based on the waveform type.
                // We want to keep whatever harmonic settings the oscillator was created with.
            }
            
            // Calculate velocity-based gain with custom velocity if available
            const velocityValue = customParams?.velocity ?? velocity;
            // Use a less aggressive normalization
            const oscillatorCount = uniqueWaveforms.size;
            const gainMultiplier = oscillatorCount <= 1 ? 1.0 : 1.0 / Math.pow(oscillatorCount, 0.3);
            const gainValue = this.velocityToGain(velocityValue) * gainMultiplier;
            
            // Set the gain directly on the additive oscillator
            additiveOsc.setGain(gainValue);
            console.log(`[DEBUG AUDIO] Set gain for ${waveform} oscillator: ${gainValue}`);
            
            // Create a gain node for envelope modulation
            const envelopeGain = this.audioContext.createGain();
            envelopeGain.gain.setValueAtTime(1.0, now); // Set to full, as we're using it just for the envelope
            
            // Apply envelope to the envelope gain node
            envelopeGain.gain.setValueAtTime(0, now);
            envelopeGain.gain.linearRampToValueAtTime(1.0, now + envelope.attack);
            envelopeGain.gain.linearRampToValueAtTime(
                envelope.sustain,
                now + envelope.attack + envelope.decay
            );
            
            // Create filter if needed
            let filter: BiquadFilterNode | undefined;
            if (customParams?.filterCutoff !== undefined || customParams?.filterResonance !== undefined) {
                filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                
                // Set custom filter parameters if available
                const cutoff = customParams?.filterCutoff ?? (this.filterParams.get(note)?.cutoff ?? this.DEFAULT_FILTER_CUTOFF);
                const resonance = customParams?.filterResonance ?? (this.filterParams.get(note)?.resonance ?? this.DEFAULT_FILTER_RESONANCE);
                
                filter.frequency.setValueAtTime(cutoff, now);
                filter.Q.setValueAtTime(resonance, now);
                
                // Connect additiveOsc -> filter -> envelope gain -> voice output
                additiveOsc.connect(filter);
                filter.connect(envelopeGain);
            } else {
                // Connect additiveOsc directly to its gain node
                additiveOsc.connect(envelopeGain);
            }
            
            // Connect to the voice output node
            envelopeGain.connect(filterNode);
            
            // Start the oscillator
            additiveOsc.start();
            
            // Create envelope object for reference
            const envelopeParams = {
                attack: (customParams?.attack ?? (this.envelopeParams.get(note)?.attack ?? this.DEFAULT_ATTACK)) / 1000,
                decay: (customParams?.decay ?? (this.envelopeParams.get(note)?.decay ?? this.DEFAULT_DECAY)) / 1000,
                sustain: (customParams?.sustain ?? (this.envelopeParams.get(note)?.sustain ?? this.DEFAULT_SUSTAIN)) / 100,
                release: (customParams?.release ?? (this.envelopeParams.get(note)?.release ?? this.DEFAULT_RELEASE)) / 1000
            };
            
            console.log(`[DEBUG AUDIO] ${waveform} oscillator envelope: attack=${envelopeParams.attack}s, decay=${envelopeParams.decay}s, sustain=${envelopeParams.sustain}, release=${envelopeParams.release}s`);
            
            // Store oscillator info
            oscillators.push({
                oscillator: additiveOsc, // Store additive oscillator instance
                gainNode: envelopeGain, // Store the envelope gain node
                filter,
                type: waveform,
                envelope: envelopeParams
            });
            
            console.log(`[DEBUG AUDIO] Created additive oscillator with waveform ${waveform} for note ${note}`);
        }
        
        // Connect filter to gain node, and gain node to main output
        filterNode.connect(gainNode);
        gainNode.connect(this.mainGain!);
        
        // Store voice with additive oscillators
        const voice = {
            oscillator: oscillators[0].oscillator, // Store primary oscillator (first one)
            filterNode,
            gainNode,
            baseFrequency,
            currentTuning: this.tunings.get(note) ?? 0,
            currentVelocity: velocity,
            startTime: now,
            noteStartTime: now,
            envelope: oscillators[0].envelope,
            waveform: waveforms[0], // Store primary waveform (first one)
            filter: oscillators[0].filter,
            unisonVoices: [],
            allOscillators: oscillators.map(osc => osc.oscillator), // Store all oscillators references
            oscillators, // Store the full oscillator objects with their properties
        };
        
        this.activeVoices.set(note, voice);
        
        // If unison is enabled (count > 1), create additional voices for each oscillator
        // Always enable unison with at least the default count
        const actualUnisonCount = unisonSettings.count;

        if (actualUnisonCount > 1) {
            console.log(`[DEBUG UNISON] Creating ${actualUnisonCount} unison voices for note ${note} with base frequency ${baseFrequency.toFixed(2)}Hz`);
            
            // First clear any existing unison voices to avoid stacking
            voice.unisonVoices = [];
            
            // Add the unison voices - create all voices (0 to count-1)
            for (let i = 0; i < actualUnisonCount; i++) {
                this.addUnisonVoice(note, i, actualUnisonCount, baseFrequency);
            }
        }

        return {
            note,
            timestamp: now,
            velocity,
            duration: 0,
            tuning: this.tunings.get(note) || 0,
            synthesis
        };
    }

    // Add filter parameter setters
    setNoteParameter(note: number, parameter: string, value: number): void {
        if (this.currentMode === 'drums') return;

        console.log(`[DEBUG AUDIO] Setting parameter: ${parameter} = ${value} for note ${note}`);

        switch (parameter) {
            case 'tuning':
                this.setNoteTuning(note, value);
                break;
            case 'velocity':
                this.setNoteVelocity(note, value);
                break;
            case 'filterCutoff':
                this.setFilterCutoff(note, value);
                break;
            case 'filterResonance':
                this.setFilterResonance(note, value);
                break;
            case 'attack':
                this.setAttack(note, value);
                break;
            case 'decay':
                this.setDecay(note, value);
                break;
            case 'sustain':
                this.setSustain(note, value);
                break;
            case 'release':
                this.setRelease(note, value);
                break;
            case 'unisonCount':
            case 'unisonDetune':
            case 'unisonWidth':
                this.setUnisonParameter(note, parameter, value);
                break;
            case 'waveform':
                // This is handled separately through setNoteWaveform
                break;
            default:
                console.warn(`[DEBUG AUDIO] Unknown parameter: ${parameter}`);
        }
    }

    private setFilterCutoff(note: number, frequency: number): void {
        console.log('Setting filter cutoff:', frequency); // Debug log

        const currentParams = this.filterParams.get(note) ?? {
            cutoff: this.DEFAULT_FILTER_CUTOFF,
            resonance: this.DEFAULT_FILTER_RESONANCE
        };

        this.filterParams.set(note, {
            ...currentParams,
            cutoff: frequency
        });

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            console.log('Applying cutoff to active voice:', frequency);
            // Use exponential ramp for smoother changes
            const now = this.audioContext.currentTime;
            voice.filterNode.frequency.cancelScheduledValues(now);
            voice.filterNode.frequency.exponentialRampToValueAtTime(
                Math.max(20, frequency), // Ensure we don't go below 20Hz
                now + 0.01
            );
        }
    }

    private setFilterResonance(note: number, resonance: number): void {
        console.log('Setting filter resonance:', resonance); // Debug log

        const currentParams = this.filterParams.get(note) ?? {
            cutoff: this.DEFAULT_FILTER_CUTOFF,
            resonance: this.DEFAULT_FILTER_RESONANCE
        };

        this.filterParams.set(note, {
            ...currentParams,
            resonance: resonance
        });

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            console.log('Applying resonance to active voice:', resonance);
            // Use linear ramp for smoother changes
            const now = this.audioContext.currentTime;
            voice.filterNode.Q.cancelScheduledValues(now);
            voice.filterNode.Q.linearRampToValueAtTime(
                resonance,
                now + 0.01
            );
        }
    }

    // Add these methods after the setFilterResonance method
    private setAttack(note: number, attackMs: number): void {
        console.log(`[DEBUG AUDIO] Setting attack for note ${note}: ${attackMs}ms`);

        const currentParams = this.envelopeParams.get(note) ?? {
            attack: this.DEFAULT_ATTACK,
            decay: this.DEFAULT_DECAY,
            sustain: this.DEFAULT_SUSTAIN,
            release: this.DEFAULT_RELEASE
        };

        this.envelopeParams.set(note, {
            ...currentParams,
            attack: attackMs
        });

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            console.log(`[DEBUG AUDIO] Applying attack to active voice ${note}: ${attackMs}ms`);
            // Update envelope for active voice
            voice.envelope.attack = attackMs / 1000; // convert to seconds
        }
    }

    private setDecay(note: number, decayMs: number): void {
        console.log(`[DEBUG AUDIO] Setting decay for note ${note}: ${decayMs}ms`);

        const currentParams = this.envelopeParams.get(note) ?? {
            attack: this.DEFAULT_ATTACK,
            decay: this.DEFAULT_DECAY,
            sustain: this.DEFAULT_SUSTAIN,
            release: this.DEFAULT_RELEASE
        };

        this.envelopeParams.set(note, {
            ...currentParams,
            decay: decayMs
        });

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            console.log(`[DEBUG AUDIO] Applying decay to active voice ${note}: ${decayMs}ms`);
            // Update envelope for active voice
            voice.envelope.decay = decayMs / 1000; // convert to seconds
        }
    }

    private setSustain(note: number, sustainPercent: number): void {
        console.log(`[DEBUG AUDIO] Setting sustain for note ${note}: ${sustainPercent}%`);

        const currentParams = this.envelopeParams.get(note) ?? {
            attack: this.DEFAULT_ATTACK,
            decay: this.DEFAULT_DECAY,
            sustain: this.DEFAULT_SUSTAIN,
            release: this.DEFAULT_RELEASE
        };

        this.envelopeParams.set(note, {
            ...currentParams,
            sustain: sustainPercent
        });

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            console.log(`[DEBUG AUDIO] Applying sustain to active voice ${note}: ${sustainPercent}%`);
            // Update envelope for active voice
            voice.envelope.sustain = sustainPercent / 100; // convert to ratio
        }
    }

    private setRelease(note: number, releaseMs: number): void {
        console.log(`[DEBUG AUDIO] Setting release for note ${note}: ${releaseMs}ms`);

        const currentParams = this.envelopeParams.get(note) ?? {
            attack: this.DEFAULT_ATTACK,
            decay: this.DEFAULT_DECAY,
            sustain: this.DEFAULT_SUSTAIN,
            release: this.DEFAULT_RELEASE
        };

        this.envelopeParams.set(note, {
            ...currentParams,
            release: releaseMs
        });

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            console.log(`[DEBUG AUDIO] Applying release to active voice ${note}: ${releaseMs}ms`);
            // Update envelope for active voice
            voice.envelope.release = releaseMs / 1000; // convert to seconds
        }
    }

    // Required context getter for playback system
    getContext(): AudioContext | null {
        return this.audioContext;
    }

    getCurrentTime(): number {
        return this.audioContext?.currentTime ?? 0;
    }

    // Get envelope parameters for a note, with conversion to proper units
    private getEnvelopeParams(note: number) {
        const params = this.envelopeParams.get(note) ?? {
            attack: this.DEFAULT_ATTACK,
            decay: this.DEFAULT_DECAY,
            sustain: this.DEFAULT_SUSTAIN,
            release: this.DEFAULT_RELEASE
        };

        return {
            attack: params.attack / 1000,    // Convert ms to seconds
            decay: params.decay / 1000,      // Convert ms to seconds
            sustain: params.sustain / 100,   // Convert percentage to ratio
            release: params.release / 1000   // Convert ms to seconds
        };
    }

    // Calculate frequency for a note including tuning
    private getFrequency(note: number, tuning?: number): number {
        // MIDI note 69 is A4 (440Hz)
        // Calculate offset from A4 without adding baseOctave
        const semitoneOffset = note - 69; 
        const baseFrequency = 440.0 * Math.pow(2, semitoneOffset / 12);
        
        // Apply tuning if provided, otherwise use the note's tuning from the map
        const tuningCents = tuning !== undefined ? tuning : (this.tunings.get(note) ?? 0);
        
        // Apply tuning (convert cents to frequency multiplier)
        const adjustedFrequency = baseFrequency * Math.pow(2, tuningCents / 1200);
        
        console.log(`[DEBUG PITCH] Calculating frequency for note ${note}, offset=${semitoneOffset}, base=${baseFrequency.toFixed(2)}Hz, tuning=${tuningCents}c, final=${adjustedFrequency.toFixed(2)}Hz`);
        
        return adjustedFrequency;
    }

    private getWaveformForNote(note: number): Waveform {
        // First check if this note has a custom waveform set
        const customWaveform = this.waveforms.get(note);
        
        // Get all registered notes with custom waveforms for debugging
        const notesWithCustomWaveforms = [...this.waveforms.entries()]
            .map(([noteNum, waveform]) => `${noteNum}:${waveform}`);
        
        // Debug output to track waveform selection
        console.log(`[AUDIO ENGINE] Getting waveform for note ${note}:
            - Custom waveform for this note: ${customWaveform || 'none'}
            - Global waveform: ${this.globalWaveform}
            - Will use: ${customWaveform || this.globalWaveform}
            - All custom waveforms: [${notesWithCustomWaveforms.join(', ')}]`);
        
        // If this note has a custom waveform, use that
        if (customWaveform) {
            return customWaveform;
        }
        
        // Otherwise use the global waveform
        return this.globalWaveform;
    }

    setGlobalWaveform(waveform: Waveform): void {
        this.globalWaveform = waveform;
        // Update all active voices that use global waveform
        this.activeVoices.forEach((voice, note) => {
            if (!this.waveforms.has(note)) {
                voice.oscillator.type = waveform;
            }
        });
    }

    setNoteWaveform(note: number, waveform: Waveform): void {
        console.log(`[AUDIO ENGINE] Setting waveform for note ${note} to ${waveform}`);
        
        // Store the custom waveform for this note
        this.waveforms.set(note, waveform);
        
        // If the note is currently playing, update its waveform
        const voice = this.activeVoices.get(note);
        if (voice) {
            try {
                console.log(`[AUDIO ENGINE] Updating active voice for note ${note} to waveform ${waveform}`);
                
                // For backwards compatibility with older implementation
                if (voice.oscillator) {
                    voice.oscillator.type = waveform;
                    voice.waveform = waveform;
                    console.log(`[AUDIO ENGINE] Updated main oscillator type to ${waveform}`);
                }
                
                // For multi-oscillator implementation
                if (voice.allOscillators && voice.allOscillators.length > 0) {
                    // Update the waveform of the first oscillator
                    voice.allOscillators[0].type = waveform;
                    console.log(`[AUDIO ENGINE] Updated first oscillator in allOscillators to ${waveform}`);
                }
                
                // Also update unison voices if they exist
                if (voice.unisonVoices && voice.unisonVoices.length > 0) {
                    voice.unisonVoices.forEach(unisonVoice => {
                        if (unisonVoice.oscillator) {
                            unisonVoice.oscillator.type = waveform;
                            console.log(`[AUDIO ENGINE] Updated unison oscillator to ${waveform}`);
                        }
                    });
                }
                
                // Update the voice's stored waveform property for future reference
                voice.waveform = waveform;
                
                // Force a redraw of the waveform by stopping and recreating the oscillator
                // This is a more aggressive approach but ensures the waveform changes
                if (!voice.allOscillators && voice.oscillator && voice.oscillator.type !== waveform) {
                    console.log(`[AUDIO ENGINE] Recreating oscillator for note ${note} with waveform ${waveform}`);
                    
                    // Get current values
                    const now = this.audioContext!.currentTime;
                    const currentFreq = voice.baseFrequency;
                    
                    // Create new oscillator with the correct waveform
                    const newOscillator = this.audioContext!.createOscillator();
                    newOscillator.type = waveform;
                    newOscillator.frequency.setValueAtTime(currentFreq, now);
                    
                    // Connect to the same destinations
                    newOscillator.connect(voice.filterNode);
                    
                    // Schedule the old oscillator to stop
                    voice.oscillator.stop(now + 0.01);
                    
                    // Start the new oscillator
                    newOscillator.start(now);
                    
                    // Replace the old oscillator
                    voice.oscillator = newOscillator;
                }
            } catch (error) {
                console.error(`Error updating waveform for note ${note}:`, error);
            }
        }
    }

    // Initialize audio context
    async initialize() {
        try {
            console.log('[AUDIO ENGINE] Initializing keyboard audio manager');
            
            if (!this.audioContext) {
                console.log('[AUDIO ENGINE] Creating new audio context');
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                console.log('[AUDIO ENGINE] Audio context created, state:', this.audioContext.state);
                
                // Force resuming the audio context if it's in a suspended state
                if (this.audioContext.state === 'suspended') {
                    console.log('[AUDIO ENGINE] Audio context is suspended, attempting to resume');
                    await this.audioContext.resume();
                    console.log('[AUDIO ENGINE] Audio context resumed, new state:', this.audioContext.state);
                }
                
                // Create main gain node for master volume
                this.mainGain = this.audioContext.createGain();
                this.mainGain.gain.value = this.MASTER_VOLUME;
                this.mainGain.connect(this.audioContext.destination);
                console.log('[AUDIO ENGINE] Main gain node created and connected');
            } else {
                console.log('[AUDIO ENGINE] Audio context already exists, state:', this.audioContext.state);
                
                // Make sure it's running
                if (this.audioContext.state !== 'running') {
                    console.log('[AUDIO ENGINE] Existing audio context not running, attempting to resume');
                    await this.audioContext.resume();
                    console.log('[AUDIO ENGINE] Audio context resumed, new state:', this.audioContext.state);
                }
            }
            
            // Add a simple test tone to verify audio output
            try {
                // Only run this test if audio context is new
                if (!this.isInitialized) {
                    console.log('[AUDIO ENGINE] Playing test tone to verify audio');
                    const testOsc = this.audioContext.createOscillator();
                    const testGain = this.audioContext.createGain();
                    testOsc.frequency.value = 440;
                    testGain.gain.value = 0.1;
                    testOsc.connect(testGain);
                    testGain.connect(this.audioContext.destination);
                    testOsc.start();
                    testOsc.stop(this.audioContext.currentTime + 0.2);
                    console.log('[AUDIO ENGINE] Test tone scheduled');
                }
            } catch (e) {
                console.error('[AUDIO ENGINE] Error playing test tone:', e);
            }
            
            this.isInitialized = true;
            console.log('[AUDIO ENGINE] Keyboard audio manager initialized successfully');
            return true;
        } catch (error) {
            console.error('[AUDIO ENGINE] Error initializing audio:', error);
            return false;
        }
    }

    // Play a new note with current parameters
    async playNote(note: number): Promise<CompleteNoteEvent> {
        if (!this.isInitialized) await this.initialize();
        if (!this.audioContext) throw new Error('Audio system not initialized');

        const velocity = this.velocities.get(note) ?? this.DEFAULT_VELOCITY;
        const synthesis = this.getCurrentSynthesis(note);

        if (this.currentMode === 'drums') {
            drumSoundManager.initialize();
            drumSoundManager.playDrumSound(note);

            return {
                note,
                timestamp: this.audioContext.currentTime,
                velocity,
                duration: 0.15,
                synthesis
            };
        } else {
            return this.playTunableNoteRT(note, velocity);
        }
    }

    // Play a note at a specific time (for playback)
    playExactNote(noteEvent: CompleteNoteEvent, time: number) {
        if (!this.audioContext) {
            console.error("AudioContext not initialized");
            return;
        }

        const previousMode = this.currentMode;
        // Handle case where mode is undefined by defaulting to 'tunable'
        this.currentMode = noteEvent.synthesis.mode || 'tunable';

        try {
            if (this.currentMode === 'drums') {
                // Play drum sound with tuning (if applicable)
                drumSoundManager.initialize();
                // Make sure we're using the correct drum sound API
                drumSoundManager.playDrumSoundAt(
                    noteEvent.note,
                    time
                );
            } else {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                // Configure oscillator
                // Set a default waveform if undefined
                oscillator.type = noteEvent.synthesis.waveform || 'sine';
                oscillator.frequency.setValueAtTime(
                    this.getFrequency(noteEvent.note, noteEvent.tuning),
                    time
                );

                // Calculate envelope timings
                const envelope = this.getEnvelopeParams(noteEvent.note);
                const attackEndTime = time + envelope.attack;
                const decayEndTime = attackEndTime + envelope.decay;
                const releaseStartTime = time + noteEvent.duration;
                const releaseEndTime = releaseStartTime + envelope.release;

                // Set envelope stages using linearRampToValueAtTime instead
                gainNode.gain.setValueAtTime(0, time);

                // Attack
                gainNode.gain.linearRampToValueAtTime(this.velocityToGain(noteEvent.velocity), attackEndTime);

                // Decay to sustain
                const sustainLevel = this.velocityToGain(noteEvent.velocity) * envelope.sustain;
                gainNode.gain.linearRampToValueAtTime(sustainLevel, decayEndTime);

                // Sustain (no automation needed, stays at sustainLevel)

                // Release
                gainNode.gain.setValueAtTime(sustainLevel, releaseStartTime);
                gainNode.gain.linearRampToValueAtTime(0, releaseEndTime);

                // Connect audio path
                oscillator.connect(gainNode);
                gainNode.connect(this.mainGain!);

                // Schedule precise start/stop times
                oscillator.start(time);
                oscillator.stop(releaseEndTime + 0.01);

                // Clean up
                setTimeout(() => {
                    try {
                        oscillator.disconnect();
                        gainNode.disconnect();
                    } catch (error) {
                        console.error('Error cleaning up note:', error);
                    }
                }, (releaseEndTime + 0.02 - this.audioContext.currentTime) * 1000);

                // Apply unison settings if available
                if (noteEvent.synthesis?.unison) {
                    const { count, detune, width } = noteEvent.synthesis.unison;
                    
                    // Create multiple oscillators for unison effect
                    if (count > 1) {
                        const unisonOscillators = [];
                        
                        for (let i = 1; i < count; i++) {
                            const unisonOsc = this.audioContext.createOscillator();
                            unisonOsc.type = noteEvent.synthesis.waveform || 'sine';
                            
                            // Calculate detune value based on position in unison spread
                            const spreadFactor = (i / (count - 1)) * 2 - 1; // Range from -1 to 1
                            const detuneValue = spreadFactor * detune;
                            unisonOsc.detune.value = detuneValue;
                            
                            // Calculate pan position for stereo width
                            const panPosition = spreadFactor * (width / 100);
                            
                            // Create stereo panner for width
                            const panner = this.audioContext.createStereoPanner();
                            panner.pan.value = panPosition;
                            
                            // Connect oscillator to panner to gain
                            unisonOsc.connect(panner);
                            panner.connect(gainNode);
                            
                            // Start oscillator
                            unisonOsc.start(time);
                            unisonOsc.stop(releaseEndTime);
                            
                            unisonOscillators.push(unisonOsc);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[DIAG] Error in playExactNote:', error);
        } finally {
            this.currentMode = previousMode;
            console.log(`[DIAG] Note scheduled successfully`);
        }
    }

// Helper method to create a smooth attack curve
    private createAttackCurve(velocity: number): Float32Array {
        const numSamples = 44100;  // High resolution for smooth curve
        const curve = new Float32Array(numSamples);
        const maxGain = this.velocityToGain(velocity);

        for (let i = 0; i < numSamples; i++) {
            // Use exponential curve for more natural attack
            const x = i / numSamples;
            curve[i] = maxGain * Math.pow(x, 2);  // Quadratic curve for smooth attack
        }

        return curve;
    }

    // Stop a playing note
    stopNote(note: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const releaseTime = voice.envelope.release;

            // Apply release envelope to all oscillators
            if (voice.allOscillators) {
                voice.allOscillators.forEach(osc => {
                    if (osc instanceof AdditiveOscillator) {
                        // For additive oscillators, use their built-in methods
                        osc.linearRampToGain(0, now + releaseTime);
                        
                        // Schedule stopping a bit later to let release finish
                        setTimeout(() => {
                            try {
                                osc.stop();
                                osc.dispose();
                            } catch (e) {
                                console.warn('Error stopping AdditiveOscillator:', e);
                            }
                        }, releaseTime * 1000 + 100);
                    } else {
                        // For standard oscillators
                        osc.stop(now + releaseTime + 0.1);
                    }
                });
            } else {
                // Legacy code for backwards compatibility
                voice.oscillator.stop(now + releaseTime + 0.1);
            }

            // Handle unison voices release
            if (voice.unisonVoices && voice.unisonVoices.length > 0) {
                voice.unisonVoices.forEach(unisonVoice => {
                    unisonVoice.gainNode.gain.cancelScheduledValues(now);
                    unisonVoice.gainNode.gain.setValueAtTime(unisonVoice.gainNode.gain.value, now);
                    unisonVoice.gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);
                });
            }

            // Schedule cleanup
            setTimeout(() => {
                try {
                    // Stop and disconnect main oscillator
                    if (voice.oscillator instanceof AdditiveOscillator) {
                        voice.oscillator.dispose();
                    } else {
                        voice.oscillator.stop(now + releaseTime + 0.1);
                        voice.oscillator.disconnect();
                    }
                    
                    voice.gainNode.disconnect();
                    voice.filterNode.disconnect();

                    // Stop and disconnect unison voices
                    if (voice.unisonVoices) {
                        voice.unisonVoices.forEach(unisonVoice => {
                            unisonVoice.oscillator.stop(now + releaseTime + 0.1);
                            unisonVoice.oscillator.disconnect();
                            unisonVoice.gainNode.disconnect();
                            unisonVoice.panNode.disconnect();
                        });
                    }
                } catch (error) {
                    console.error('Error cleaning up note:', error);
                }
            }, releaseTime * 1000 + 200);

            this.activeVoices.delete(note);
        } catch (error) {
            console.error('Error stopping note:', error);

            // Force cleanup on error
            voice.oscillator.disconnect();
            voice.gainNode.disconnect();
            voice.filterNode.disconnect();

            // Cleanup unison voices
            if (voice.unisonVoices) {
                voice.unisonVoices.forEach(unisonVoice => {
                    try {
                        unisonVoice.oscillator.disconnect();
                        unisonVoice.gainNode.disconnect();
                        unisonVoice.panNode.disconnect();
                    } catch (e) {
                        console.error('Error cleaning up unison voice:', e);
                    }
                });
            }

            this.activeVoices.delete(note);
        }
    }

    stopAllNotes(): void {
        // Stop all currently playing tunable notes
        if (this.currentMode === 'tunable') {
            Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
        }

        // Stop all drum sounds (if needed)
        if (this.audioContext) {
            // If you need to stop drum sounds, add drum-specific stopping code here
        }

        console.log('Stopped all active notes');
    }

    // Update tuning for a note
    setNoteTuning(note: number, cents: number): void {
        if (this.currentMode === 'drums') return;
        
        console.log(`[DEBUG AUDIO] Setting tuning of note ${note} to ${cents} cents`);
        
        // Store the tuning value
        this.tunings.set(note, cents);
        
        // Calculate the adjusted frequency based on tuning
        const frequency = this.getFrequency(note, cents);
        
        // If the note is currently playing, update its frequency in real-time
        const voice = this.activeVoices.get(note);
        if (voice) {
            // Update all oscillators for this voice
            voice.oscillators?.forEach(osc => {
                if (osc.oscillator instanceof OscillatorNode) {
                    // Apply the frequency change immediately
                    osc.oscillator.frequency.setValueAtTime(frequency, this.audioContext?.currentTime || 0);
                } else if (osc.oscillator instanceof AdditiveOscillator) {
                    // For additive oscillators
                    osc.oscillator.setFrequency(frequency);
                }
            });
        }
    }

    // Update velocity for a note
    setNoteVelocity(note: number, velocity: number): void {
        this.velocities.set(note, velocity);

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            const gain = this.velocityToGain(velocity);
            voice.currentVelocity = velocity;
            voice.gainNode.gain.linearRampToValueAtTime(
                gain * voice.envelope.sustain,
                this.audioContext.currentTime + 0.02
            );
        }
    }
    // Update getCurrentSynthesis to include filter parameters
    getCurrentSynthesis(note: number): SynthesisParameters {
        const velocity = this.velocities.get(note) ?? this.DEFAULT_VELOCITY;
        const envelope = this.getEnvelopeParams(note);
        const filterParams = this.filterParams.get(note) ?? {
            cutoff: this.DEFAULT_FILTER_CUTOFF,
            resonance: this.DEFAULT_FILTER_RESONANCE
        };
        const unisonSettings = this.getUnisonSettings(note);

        if (this.currentMode === 'drums') {
            return {
                mode: 'drums',
                waveform: 'triangle',
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0,
                    release: 0.1
                },
                gain: this.velocityToGain(velocity),
                effects: {
                    filter: {
                        type: 'lowpass',
                        frequency: 150,
                        Q: 1
                    }
                }
            };
        } else {
            return {
                mode: 'tunable',
                waveform: this.getWaveformForNote(note),
                envelope: {
                    attack: envelope.attack,
                    decay: envelope.decay,
                    sustain: envelope.sustain,
                    release: envelope.release
                },
                gain: this.velocityToGain(velocity),
                effects: {
                    filter: {
                        type: 'lowpass',
                        frequency: filterParams.cutoff,
                        Q: filterParams.resonance
                    }
                }
            };
        }
    }

    // Mode management
    getCurrentMode(): 'tunable' | 'drums' {
        return this.currentMode;
    }

    setMode(mode: 'tunable' | 'drums'): void {
        console.log(`[AUDIO ENGINE] Setting mode to ${mode}`);
        
        // Stop all active notes when changing modes
        if (this.currentMode !== mode) {
            Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
        }
        
        this.currentMode = mode;
    }

    setOscillatorMode(isGlobal: boolean): void {
        console.log(`[AUDIO ENGINE] Setting oscillator mode to ${isGlobal ? 'global' : 'local'}`);
        this.isGlobalOscillatorMode = isGlobal;
        
        // If switching to global mode, update all active notes with the global waveforms
        if (isGlobal && this.globalActiveWaveforms.length > 0) {
            console.log(`[AUDIO ENGINE] Applying global waveforms to all notes: [${this.globalActiveWaveforms.join(', ')}]`);
            
            // Update all active voices
            this.activeVoices.forEach((voice, note) => {
                this.activeWaveforms.set(note, [...this.globalActiveWaveforms]);
                this.updateActiveVoiceWaveforms(note);
            });
        }
    }

    // Clean up resources
    // Update cleanup to include filter parameters
    cleanup(): void {
        Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
        this.activeVoices.clear();
        this.tunings.clear();
        this.velocities.clear();
        this.envelopeParams.clear();
        this.filterParams.clear();  // Add this
        this.waveforms.clear();
        this.unisonSettings.clear(); // Clear unison settings
        this.globalWaveform = 'sine';
        this.activeWaveforms.clear();
        this.editableWaveform.clear();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.mainGain = null;
            this.isInitialized = false;
        }
    }

    private velocityToGain(velocity: number): number {
        // Use a more aggressive curve that gives higher gain values
        // Normalize velocity (0-127) to range (0.1-1.0)
        const normalizedVelocity = 0.1 + (velocity / 127) * 0.9;
        
        // Apply a curve that boosts mid to high velocities
        const boostedGain = Math.pow(normalizedVelocity, 0.7); // Less aggressive curve (was 0.5)
        
        // Scale by the default gain for consistency
        return boostedGain * this.DEFAULT_GAIN;
    }

    // Add this function to check audio context state
    checkAudioContextState() {
        if (!this.audioContext) {
            return; // Exit if audioContext is null
        }

        // Only try to resume if it's suspended
        if (this.audioContext.state === 'suspended') {
            console.log(`[DIAG] Attempting to resume suspended audio context...`);
            this.audioContext.resume().then(() => {
                console.log(`[DIAG] Audio context resumed:`, this.audioContext?.state);
            }).catch(err => {
                console.error(`[DIAG] Failed to resume audio context:`, err);
            });
        }
    }

    // Method to get unison settings for a note
    private getUnisonSettings(note: number) {
        // Get the user-defined unison settings for this note if available
        const settings = this.unisonSettings.get(note);
        
        // If nothing is defined for this note, use the defaults
        if (!settings) {
            return {
                count: this.DEFAULT_UNISON_COUNT,
                detune: this.DEFAULT_UNISON_DETUNE,
                width: this.DEFAULT_UNISON_WIDTH
            };
        }
        
        // Respect user's choice for count, don't force a minimum
        return {
            count: settings.count ?? this.DEFAULT_UNISON_COUNT,
            detune: settings.detune ?? this.DEFAULT_UNISON_DETUNE,
            width: settings.width ?? this.DEFAULT_UNISON_WIDTH
        };
    }

    // Method to set unison parameters
    setUnisonParameter(note: number, parameter: string, value: number): void {
        if (this.currentMode === 'drums') return;

        console.log(`[DEBUG UNISON] Setting unison parameter ${parameter}=${value} for note ${note}`);
        
        const currentSettings = this.getUnisonSettings(note);
        
        switch (parameter) {
            case 'unisonCount':
                currentSettings.count = Math.max(1, Math.min(8, Math.floor(value)));
                break;
            case 'unisonDetune':
                currentSettings.detune = Math.max(0, Math.min(100, value));
                break;
            case 'unisonWidth':
                currentSettings.width = Math.max(0, Math.min(100, value));
                break;
        }
        
        this.unisonSettings.set(note, currentSettings);
        
        // If the note is currently playing, update unison voices
        if (this.activeVoices.has(note)) {
            this.updateUnisonVoices(note);
        }
        
        // Log the updated settings
        console.log(`[DEBUG UNISON] Updated unison settings for note ${note}:`, 
            JSON.stringify(currentSettings));
    }

    // Update the active voices for a note when unison parameters change
    private updateUnisonVoices(note: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        const unisonSettings = this.getUnisonSettings(note);
        
        // Check if we need to change the count
        // Calculate how many voices we need to add or remove
        const currentCount = voice.unisonVoices ? voice.unisonVoices.length : 0;
        const targetCount = unisonSettings.count;
        
        console.log(`[DEBUG UNISON] Updating unison voices for note ${note}: current=${currentCount}, target=${targetCount}`);
        
        // If current and target counts don't match, we need to adjust
        if (currentCount !== targetCount) {
            // Get base frequency from the primary oscillator
            const baseFrequency = voice.baseFrequency;
            
            if (currentCount < targetCount) {
                // We need to add more voices
                if (!voice.unisonVoices) {
                    voice.unisonVoices = [];
                }
                
                for (let i = currentCount; i < targetCount; i++) {
                    this.addUnisonVoice(note, i, targetCount, baseFrequency);
                }
            } else {
                // We need to remove some voices
                if (voice.unisonVoices && voice.unisonVoices.length > 0) {
                    // First, stop oscillators for voices we're removing
                    for (let i = targetCount; i < currentCount; i++) {
                        const unisonVoice = voice.unisonVoices[i];
                        if (unisonVoice) {
                            unisonVoice.oscillator.stop(this.audioContext.currentTime);
                        }
                    }
                    
                    // Then, slice the array to remove them
                    voice.unisonVoices = voice.unisonVoices.slice(0, targetCount);
                }
            }
        }
        
        // Update detune and stereo width for all unison voices
        if (voice.unisonVoices && voice.unisonVoices.length > 0) {
            for (let i = 0; i < voice.unisonVoices.length; i++) {
                this.updateUnisonVoiceParameters(voice.unisonVoices[i], i, unisonSettings);
            }
        }
    }

    // Completely rewrite the addUnisonVoice method
    private addUnisonVoice(note: number, index: number, totalVoices: number, baseFrequency: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        console.log(`[DEBUG UNISON] Adding unison voice ${index}/${totalVoices} for note ${note} with base frequency ${baseFrequency.toFixed(2)}Hz`);
        const unisonSettings = this.getUnisonSettings(note);
        const now = this.audioContext.currentTime;
        
        // Create oscillator for unison voice
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();
        
        // Set oscillator type to match main oscillator
        const waveform = voice.waveform || this.getWaveformForNote(note);
        oscillator.type = waveform;
        
        // Normalize index to [-1, 1] range for an even distribution across voices
        // For 3 voices this would be: -1, 0, 1
        // For 5 voices this would be: -1, -0.5, 0, 0.5, 1
        const normalizedIndex = (index / (totalVoices - 1)) * 2 - 1;
        
        // Calculate a more aggressive detune amount
        // The main voice (index = Math.floor(totalVoices/2)) will have minimal detune
        const detuneAmount = normalizedIndex * unisonSettings.detune;
        
        // Apply a slight randomization to the detuning to avoid a robotic sound
        const randomization = Math.random() * 2 - 1; // Random value between -1 and 1
        const finalDetune = detuneAmount + (randomization * 2); // Add up to +/- 2 cents of random variation
        
        console.log(`[UNISON] Voice ${index}/${totalVoices} detune: ${finalDetune.toFixed(2)} cents, normalized index: ${normalizedIndex.toFixed(2)}`);
        
        // Set the frequency and apply detune
        oscillator.frequency.setValueAtTime(baseFrequency, now);
        oscillator.detune.setValueAtTime(finalDetune, now);
        
        // Apply envelope to gain node
        // Slightly reduce the gain to avoid clipping when using many unison voices
        const voiceGain = this.velocityToGain(voice.currentVelocity) * (1.0 / Math.sqrt(totalVoices));
        gainNode.gain.setValueAtTime(0, now); // Start silent
        gainNode.gain.linearRampToValueAtTime(voiceGain, now + voice.envelope.attack);
        gainNode.gain.linearRampToValueAtTime(
            voiceGain * voice.envelope.sustain,
            now + voice.envelope.attack + voice.envelope.decay
        );
        
        // Apply panning based on normalized index and width setting
        const panValue = normalizedIndex * (unisonSettings.width / 100);
        console.log(`[UNISON] Voice ${index}/${totalVoices} panning: ${panValue.toFixed(2)}`);
        panNode.pan.setValueAtTime(panValue, now);
        
        // Connect the audio nodes
        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.mainGain!); // Connect directly to main gain
        
        // Start the oscillator
        oscillator.start(now);
        
        // Store the unison voice
        const unisonVoice = {
            oscillator,
            gainNode,
            panNode,
            index
        };
        
        // Add to the active voice
        if (!voice.unisonVoices) {
            voice.unisonVoices = [];
        }
        
        voice.unisonVoices.push(unisonVoice);
    }

    // Update parameters for a unison voice
    private updateUnisonVoiceParameters(
        unisonVoice: { oscillator: OscillatorNode, gainNode: GainNode, panNode: any },
        index: number,
        settings: { count: number, detune: number, width: number }
    ): void {
        // Remove the entire method
    }

    // Public method to get the current tuning of a key (for debugging)
    getKeyTuning(note: number): number {
        return this.tunings.get(note) || 0;
    }

    // Add a public method to get the waveform for a specific key
    getKeyWaveform(note: number): Waveform | undefined {
        return this.waveforms.get(note);
    }

    // Add a new method to get all active waveforms for a note
    private getActiveWaveformsForNote(note: number): Waveform[] {
        // First check if this note has custom active waveforms
        const noteWaveforms = this.activeWaveforms.get(note);
        
        // For debugging, log some details about what waveforms we found
        console.log(`[AUDIO ENGINE] Getting active waveforms for note ${note}:
            - Note-specific waveforms: ${noteWaveforms ? '['+noteWaveforms.join(',')+']' : 'none'}
            - Global waveforms: [${this.globalActiveWaveforms.join(',')}]
            - Is global mode: ${this.isGlobalOscillatorMode}`);
        
        // If we're in global mode and have global waveforms, prioritize those
        if (this.isGlobalOscillatorMode && this.globalActiveWaveforms.length > 0) {
            return [...this.globalActiveWaveforms];
        }
        
        // If this note has custom active waveforms, use those
        if (noteWaveforms && noteWaveforms.length > 0) {
            return [...noteWaveforms];  // Return a copy to prevent modification
        }
        
        // If no waveforms for this note, and we're accessing globally, use the global waveform
        return [this.getWaveformForNote(note)];  // Fallback to the single waveform for note
    }

    // Add methods to manage active waveforms
    setActiveWaveforms(note: number, waveforms: Waveform[]): void {
        this.activeWaveforms.set(note, [...waveforms]);
        
        // Update active voice if note is currently playing
        this.updateActiveVoiceWaveforms(note);
    }
    
    setGlobalActiveWaveforms(waveforms: Waveform[]): void {
        console.log(`[AUDIO ENGINE] Setting global active waveforms: ${waveforms.join(', ')}`);
        
        // Store the global waveforms for future reference - this is critical
        this.globalActiveWaveforms = [...waveforms];
        
        // Update the global waveform to be the first active waveform
        if (waveforms.length > 0) {
            this.globalWaveform = waveforms[0];
        }
        
        // First, store all waveforms in a global reference so new notes will use them
        // We use a new array to ensure we're not modifying the input array
        const globalWaveformsCopy = [...waveforms];
        
        // Debug info: log all active notes
        const activeNotes = Array.from(this.activeVoices.keys());
        console.log(`[AUDIO ENGINE] Active notes that will receive global waveforms: [${activeNotes.join(', ')}]`);
        
        // Update ALL active voices with the new waveforms, regardless of whether they have custom waveforms
        // In global mode, we want all notes to use the same set of waveforms
        this.activeVoices.forEach((voice, note) => {
            // Always update in global mode - override any existing custom waveforms
            this.activeWaveforms.set(note, [...globalWaveformsCopy]);
            console.log(`[AUDIO ENGINE] Applying global waveforms to note ${note}: ${waveforms.join(', ')}`);
            
            // Update the oscillators for this note
            this.updateActiveVoiceWaveforms(note);
        });
        
        // DO NOT clear all activeWaveforms here - it prevents new notes from using the correct waveforms
        // Instead, store a global reference that will be used for new notes
    }
    
    // Helper method to update the waveforms of an active voice
    private updateActiveVoiceWaveforms(note: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        const waveforms = this.getActiveWaveformsForNote(note);
        console.log(`[AUDIO ENGINE] Updating voice waveforms for note ${note}: ${waveforms.join(', ')}`);
        
        // Calculate per-oscillator gain to prevent excessive volume with multiple oscillators
        const oscillatorCount = waveforms.length;
        const perOscillatorGain = oscillatorCount > 0 ? 1 / Math.sqrt(oscillatorCount) : 1;
        console.log(`[AUDIO ENGINE] Using ${oscillatorCount} oscillators with per-oscillator gain of ${perOscillatorGain}`);
        
        // If no custom oscillators yet, create them based on the active waveforms
        if (!voice.allOscillators) {
            const now = this.audioContext.currentTime;
            const oscillators: OscillatorNode[] = [];
            
            // Create oscillators for each waveform
            for (const waveform of waveforms) {
                // Create a gain node for this oscillator to adjust its volume
                const oscillatorGain = this.audioContext.createGain();
                oscillatorGain.gain.setValueAtTime(perOscillatorGain, now);
                
                // Create and configure the oscillator
                const oscillator = this.audioContext.createOscillator();
                oscillator.type = waveform;
                oscillator.frequency.setValueAtTime(voice.baseFrequency, now);
                
                // Connect oscillator to its gain node, then to the shared filter
                oscillator.connect(oscillatorGain);
                oscillatorGain.connect(voice.filterNode);
                
                // Store the gain node with the oscillator for future reference
                (oscillator as any).gainNode = oscillatorGain;
                
                // Start oscillator
                oscillator.start(now);
                oscillators.push(oscillator);
                
                console.log(`[AUDIO ENGINE] Created new oscillator with waveform ${waveform} for note ${note}`);
            }
            
            // Store all oscillators
            voice.allOscillators = oscillators;
        } else {
            // Update existing oscillators or create new ones as needed
            const existingCount = voice.allOscillators.length;
            const targetCount = waveforms.length;
            const now = this.audioContext.currentTime;
            
            console.log(`[AUDIO ENGINE] Updating oscillators for note ${note}: existing=${existingCount}, target=${targetCount}`);
            
            // Update the gain for all oscillators (existing and new)
            for (let i = 0; i < existingCount; i++) {
                if (i < targetCount) {
                    // Update type of existing oscillator
                    voice.allOscillators[i].type = waveforms[i];
                    
                    // Update its gain
                    const oscillatorGain = (voice.allOscillators[i] as any).gainNode;
                    if (oscillatorGain) {
                        oscillatorGain.gain.setValueAtTime(perOscillatorGain, now);
                    }
                    
                    console.log(`[AUDIO ENGINE] Updated oscillator ${i} to waveform ${waveforms[i]} for note ${note}`);
                }
            }
            
            // Create additional oscillators if needed
            if (targetCount > existingCount) {
                for (let i = existingCount; i < targetCount; i++) {
                    // Create a gain node for this oscillator
                    const oscillatorGain = this.audioContext.createGain();
                    oscillatorGain.gain.setValueAtTime(perOscillatorGain, now);
                    
                    // Create and configure the oscillator
                    const oscillator = this.audioContext.createOscillator();
                    oscillator.type = waveforms[i];
                    oscillator.frequency.setValueAtTime(voice.baseFrequency, now);
                    
                    // Connect oscillator to its gain node, then to the shared filter
                    oscillator.connect(oscillatorGain);
                    oscillatorGain.connect(voice.filterNode);
                    
                    // Store the gain node with the oscillator
                    (oscillator as any).gainNode = oscillatorGain;
                    
                    // Start oscillator
                    oscillator.start(now);
                    voice.allOscillators.push(oscillator);
                    
                    console.log(`[AUDIO ENGINE] Added new oscillator ${i} with waveform ${waveforms[i]} for note ${note}`);
                }
            }
            
            // Stop excess oscillators
            if (targetCount < existingCount) {
                for (let i = targetCount; i < existingCount; i++) {
                    try {
                        // Stop the oscillator
                        voice.allOscillators[i].stop(now);
                        
                        // Disconnect its gain node if it exists
                        const oscillatorGain = (voice.allOscillators[i] as any).gainNode;
                        if (oscillatorGain) {
                            oscillatorGain.disconnect();
                        }
                        
                        console.log(`[AUDIO ENGINE] Stopped excess oscillator ${i} for note ${note}`);
                    } catch (error) {
                        console.error(`Error stopping oscillator ${i} for note ${note}:`, error);
                    }
                }
                
                // Remove excess oscillators from the array
                voice.allOscillators = voice.allOscillators.slice(0, targetCount);
            }
        }
        
        // Also update the primary oscillator and waveform properties for compatibility
        if (voice.allOscillators && voice.allOscillators.length > 0) {
            voice.oscillator = voice.allOscillators[0];
            voice.waveform = waveforms[0] || 'sine';
        }
    }

    // After the setNoteParameter method, add this new method:
    setOscillatorParameter(note: number, waveform: Waveform, parameter: string, value: number): void {
        if (this.currentMode === 'drums') return;
        
        console.log(`[DEBUG AUDIO] Setting oscillator parameter: ${parameter} = ${value} for note ${note}, oscillator ${waveform}`);
        
        // Initialize the oscillator parameters map for this note if it doesn't exist
        if (!this.oscillatorParams.has(note)) {
            this.oscillatorParams.set(note, new Map());
        }
        
        // Initialize the parameters object for this oscillator if it doesn't exist
        if (!this.oscillatorParams.get(note)?.has(waveform)) {
            this.oscillatorParams.get(note)?.set(waveform, {});
        }
        
        // Get the parameters object for this oscillator
        const oscillatorParams = this.oscillatorParams.get(note)?.get(waveform);
        if (!oscillatorParams) return;
        
        // Update the parameter
        switch (parameter) {
            case 'tuning':
                oscillatorParams.tuning = value;
                this.updateOscillatorTuning(note, waveform, value);
                break;
            case 'velocity':
                oscillatorParams.velocity = value;
                this.updateOscillatorVelocity(note, waveform, value);
                break;
            case 'filterCutoff':
                oscillatorParams.filterCutoff = value;
                this.updateOscillatorFilterCutoff(note, waveform, value);
                break;
            case 'filterResonance':
                oscillatorParams.filterResonance = value;
                this.updateOscillatorFilterResonance(note, waveform, value);
                break;
            case 'attack':
                oscillatorParams.attack = value;
                this.updateOscillatorAttack(note, waveform, value);
                break;
            case 'decay':
                oscillatorParams.decay = value;
                this.updateOscillatorDecay(note, waveform, value);
                break;
            case 'sustain':
                oscillatorParams.sustain = value;
                this.updateOscillatorSustain(note, waveform, value);
                break;
            case 'release':
                oscillatorParams.release = value;
                this.updateOscillatorRelease(note, waveform, value);
                break;
            case 'unisonCount':
            case 'unisonDetune':
            case 'unisonWidth':
                // Store the unison parameter for this oscillator
                if (!oscillatorParams.unison) {
                    oscillatorParams.unison = {
                        count: 1, // Default to 1 (unison off)
                        detune: this.DEFAULT_UNISON_DETUNE,
                        width: this.DEFAULT_UNISON_WIDTH
                    };
                }
                
                // Update the specific unison parameter
                if (parameter === 'unisonCount') {
                    oscillatorParams.unison.count = Math.max(1, Math.min(8, Math.floor(value)));
                } else if (parameter === 'unisonDetune') {
                    oscillatorParams.unison.detune = Math.max(0, Math.min(100, value));
                } else if (parameter === 'unisonWidth') {
                    oscillatorParams.unison.width = Math.max(0, Math.min(100, value));
                }
                
                // Log for debugging
                console.log(`[DEBUG UNISON] Setting oscillator-specific unison parameter ${parameter}=${value} for note ${note}, waveform ${waveform}`);
                console.log(`[DEBUG UNISON] Updated unison settings:`, JSON.stringify(oscillatorParams.unison));
                
                // Apply the unison settings to active voices if this oscillator is playing
                if (this.activeVoices.has(note)) {
                    const voice = this.activeVoices.get(note);
                    const currentWaveform = this.getWaveformForNote(note);
                    
                    // Only update if this is the active waveform for this note
                    if (currentWaveform === waveform && voice) {
                        // Apply the unison settings to the note globally so they affect all oscillators
                        // This is necessary because unison voices are shared across all oscillators
                        const unisonSettings = {
                            count: oscillatorParams.unison.count,
                            detune: oscillatorParams.unison.detune,
                            width: oscillatorParams.unison.width
                        };
                        
                        // Use the existing method to update unison voices
                        this.unisonSettings.set(note, unisonSettings);
                        
                        // Update all voices with the new settings
                        this.updateUnisonVoices(note);
                    }
                }
                break;
            default:
                console.warn(`[DEBUG AUDIO] Unknown oscillator parameter: ${parameter}`);
        }
    }

    // Add methods to update individual oscillator parameters
    private updateOscillatorTuning(note: number, waveform: Waveform, cents: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its frequency
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform) {
                const baseFreq = this.getFrequency(note);
                const adjustedFreq = baseFreq * Math.pow(2, cents / 1200);
                if (this.audioContext) { // Extra null check
                    osc.oscillator.frequency.setValueAtTime(adjustedFreq, this.audioContext.currentTime);
                    console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} tuning for note ${note}: ${cents} cents (${adjustedFreq} Hz)`);
                }
            }
        });
    }

    private updateOscillatorVelocity(note: number, waveform: Waveform, velocity: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its gain
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform) {
                const gain = this.velocityToGain(velocity);
                if (this.audioContext) { // Extra null check
                    osc.gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
                    console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} velocity for note ${note}: ${velocity} (gain: ${gain})`);
                }
            }
        });
    }

    private updateOscillatorFilterCutoff(note: number, waveform: Waveform, frequency: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its filter cutoff
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.filter) {
                if (this.audioContext) { // Extra null check
                    osc.filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} filter cutoff for note ${note}: ${frequency} Hz`);
                }
            }
        });
    }

    private updateOscillatorFilterResonance(note: number, waveform: Waveform, resonance: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its filter resonance
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.filter) {
                if (this.audioContext) { // Extra null check
                    osc.filter.Q.setValueAtTime(resonance, this.audioContext.currentTime);
                    console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} filter resonance for note ${note}: ${resonance}`);
                }
            }
        });
    }

    private updateOscillatorAttack(note: number, waveform: Waveform, attackMs: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its envelope
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.envelope) {
                osc.envelope.attack = attackMs / 1000; // convert to seconds
                console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} attack for note ${note}: ${attackMs}ms`);
            }
        });
    }

    private updateOscillatorDecay(note: number, waveform: Waveform, decayMs: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its envelope
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.envelope) {
                osc.envelope.decay = decayMs / 1000; // convert to seconds
                console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} decay for note ${note}: ${decayMs}ms`);
            }
        });
    }

    private updateOscillatorSustain(note: number, waveform: Waveform, sustainPercent: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its envelope
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.envelope) {
                osc.envelope.sustain = sustainPercent / 100; // convert to ratio
                console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} sustain for note ${note}: ${sustainPercent}%`);
            }
        });
    }

    private updateOscillatorRelease(note: number, waveform: Waveform, releaseMs: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        // Find the oscillator with the matching waveform and update its envelope
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.envelope) {
                osc.envelope.release = releaseMs / 1000; // convert to seconds
                console.log(`[DEBUG AUDIO] Updated oscillator ${waveform} release for note ${note}: ${releaseMs}ms`);
            }
        });
    }

    // Add new methods for harmonic control
    
    /**
     * Set harmonic amplitudes for a specific note and waveform
     */
    setNoteHarmonics(note: number, waveform: Waveform, harmonics: number[]): void {
        if (this.currentMode === 'drums') return;
        
        console.log(`[DEBUG AUDIO] Setting harmonics for note ${note}, waveform ${waveform}: ${harmonics.join(', ')}`);
        
        // Initialize the harmonic settings map for this note if it doesn't exist
        if (!this.harmonicSettings.has(note)) {
            this.harmonicSettings.set(note, new Map());
        }
        
        // Store the harmonic settings
        this.harmonicSettings.get(note)?.set(waveform, [...harmonics]);
        
        // Update active voice if this note is currently playing
        this.updateActiveVoiceHarmonics(note, waveform, harmonics);
    }
    
    /**
     * Set global harmonic amplitudes for a waveform
     */
    setGlobalHarmonics(waveform: Waveform, harmonics: number[]): void {
        if (this.currentMode === 'drums') return;
        
        console.log(`[DEBUG AUDIO] Setting global harmonics for waveform ${waveform}: ${harmonics.join(', ')}`);
        
        // Apply to all currently playing voices with this waveform
        this.activeVoices.forEach((voice, note) => {
            // Find oscillators with this waveform
            voice.oscillators?.forEach(osc => {
                if (osc.type === waveform && osc.oscillator instanceof AdditiveOscillator) {
                    osc.oscillator.setHarmonics(harmonics);
                }
            });
        });
    }
    
    /**
     * Update harmonics for a currently playing note
     */
    private updateActiveVoiceHarmonics(note: number, waveform: Waveform, harmonics: number[]): void {
        const voice = this.activeVoices.get(note);
        if (!voice) return;
        
        // Find oscillators with this waveform
        voice.oscillators?.forEach(osc => {
            if (osc.type === waveform && osc.oscillator instanceof AdditiveOscillator) {
                osc.oscillator.setHarmonics(harmonics);
                console.log(`[DEBUG AUDIO] Updated harmonics for playing note ${note}, waveform ${waveform}`);
            }
        });
    }

    // Add a getter for active voices
    getActiveVoices() {
        return this.activeVoices.entries();
    }
}

const keyboardAudioManager = new KeyboardAudioManager();
export default keyboardAudioManager;