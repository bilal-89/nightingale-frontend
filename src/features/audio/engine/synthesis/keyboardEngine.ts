import { SynthesisParameters, CompleteNoteEvent } from '../../api/types';
import { drumSoundManager } from './drumEngine';
import { Waveform } from '../../../keyboard/store/slices/keyboard.slice';

class KeyboardAudioManager {
    // Core audio settings
    private readonly MASTER_VOLUME = 0.3;
    private readonly DEFAULT_GAIN = 0.3;
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
    private readonly DEFAULT_UNISON_COUNT = 1;
    private readonly DEFAULT_UNISON_DETUNE = 10;
    private readonly DEFAULT_UNISON_WIDTH = 50;

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
            panNode: StereoPannerNode | PannerNode;
        }>;
    }>();


    // Default filter settings
    private readonly DEFAULT_FILTER_CUTOFF = 19000;  // Hz
    private readonly DEFAULT_FILTER_RESONANCE = 0.707;  // Q value

    // Modify playTunableNoteRT to include filter
    private async playTunableNoteRT(note: number, velocity: number): Promise<CompleteNoteEvent> {
        if (!this.audioContext) throw new Error('Audio context not initialized');

        const now = this.audioContext.currentTime;
        
        // Create main oscillator and nodes
        const oscillator = this.audioContext.createOscillator();
        const filterNode = this.audioContext.createBiquadFilter();
        const gainNode = this.audioContext.createGain();

        // Get parameters
        const baseFrequency = this.getFrequency(note);
        const envelope = this.getEnvelopeParams(note);
        const synthesis = this.getCurrentSynthesis(note);
        const waveform = this.getWaveformForNote(note);
        const filterParams = this.filterParams.get(note) ?? {
            cutoff: this.DEFAULT_FILTER_CUTOFF,
            resonance: this.DEFAULT_FILTER_RESONANCE
        };
        const unisonSettings = this.getUnisonSettings(note);

        // Configure oscillator
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(baseFrequency, now);

        // Configure filter
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(filterParams.cutoff, now);
        filterNode.Q.setValueAtTime(filterParams.resonance, now);

        // Configure envelope - adjust gain based on unison count
        // For single voice, use normal gain. For unison, we'll handle gain in the unison voices
        const maxGain = this.velocityToGain(velocity);
        
        // Apply envelope to main oscillator
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + envelope.attack);
        gainNode.gain.linearRampToValueAtTime(
            maxGain * envelope.sustain,
            now + envelope.attack + envelope.decay
        );

        // Create main voice
        const voice = {
            oscillator,
            filterNode,
            gainNode,
            baseFrequency,
            currentTuning: this.tunings.get(note) || 0,
            currentVelocity: velocity,
            startTime: now,
            noteStartTime: now,
            envelope,
            waveform,
            filter: filterParams,
            unisonVoices: []
        };

        // Store voice
        this.activeVoices.set(note, voice);

        // Connect audio path for main oscillator
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.mainGain!);
        
        // Start the main oscillator
        oscillator.start(now);

        // If unison is enabled (count > 1), create additional voices
        if (unisonSettings.count > 1) {
            console.log(`Creating ${unisonSettings.count} unison voices for note ${note}`);
            
            for (let i = 0; i < unisonSettings.count; i++) {
                this.addUnisonVoice(note, i, unisonSettings.count, baseFrequency);
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

        // console.log(`Setting parameter: ${parameter} = ${value} for note ${note}`); // Debug log

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
            case 'unisonCount':
                this.setUnisonParameter(note, 'count', value);
                break;
            case 'unisonDetune':
                this.setUnisonParameter(note, 'detune', value);
                break;
            case 'unisonWidth':
                this.setUnisonParameter(note, 'width', value);
                break;
            case 'attack':
            case 'decay':
            case 'sustain':
            case 'release': {
                const currentParams = this.envelopeParams.get(note) ?? {
                    attack: this.DEFAULT_ATTACK,
                    decay: this.DEFAULT_DECAY,
                    sustain: this.DEFAULT_SUSTAIN,
                    release: this.DEFAULT_RELEASE
                };
                this.envelopeParams.set(note, {
                    ...currentParams,
                    [parameter]: value
                });
                break;
            }
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
        const baseMidiNote = note - 69;
        const baseFrequency = 440 * Math.pow(2, baseMidiNote / 12);
        const actualTuning = (tuning !== undefined ? tuning : this.tunings.get(note)) || 0;
        return actualTuning === 0 ? baseFrequency : baseFrequency * Math.pow(2, actualTuning / 1200);
    }

    private getWaveformForNote(note: number): Waveform {
        return this.waveforms.get(note) ?? this.globalWaveform;
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
        this.waveforms.set(note, waveform);
        // Update voice if active
        const voice = this.activeVoices.get(note);
        if (voice) {
            voice.oscillator.type = waveform;
        }
    }

    // Initialize audio context
    async initialize() {
        if (this.isInitialized && this.audioContext) return this.audioContext;

        try {
            this.audioContext = new AudioContext();
            this.mainGain = this.audioContext.createGain();
            this.mainGain.gain.setValueAtTime(this.MASTER_VOLUME, this.audioContext.currentTime);
            this.mainGain.connect(this.audioContext.destination);

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isInitialized = true;
            return this.audioContext;
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            throw error;
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
        if (!this.audioContext) return;

        console.log(`[DIAG] KeyboardAudioManager.playExactNote:`, {
            note: noteEvent.note,
            scheduledTime: time.toFixed(4),
            currentTime: this.audioContext.currentTime.toFixed(4),
            timeDelta: (time - this.audioContext.currentTime).toFixed(4),
            audioContextState: this.audioContext.state,
            synthesisMode: noteEvent.synthesis.mode,
            waveform: noteEvent.synthesis.waveform
        });

        const previousMode = this.currentMode;
        this.currentMode = noteEvent.synthesis.mode;

        try {
            if (this.currentMode === 'drums') {
                drumSoundManager.initialize();
                const tuning = this.tunings.get(noteEvent.note) || 0;
                drumSoundManager.playDrumSoundAt(
                    noteEvent.note,
                    time,
                    tuning
                );
            } else {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const envelope = noteEvent.synthesis.envelope;
                const maxGain = this.velocityToGain(noteEvent.velocity);

                // Configure oscillator
                oscillator.type = noteEvent.synthesis.waveform;
                oscillator.frequency.setValueAtTime(
                    this.getFrequency(noteEvent.note, noteEvent.tuning),
                    time
                );

                // Calculate envelope timings
                const attackEndTime = time + envelope.attack;
                const decayEndTime = attackEndTime + envelope.decay;
                const releaseStartTime = time + noteEvent.duration;
                const releaseEndTime = releaseStartTime + envelope.release;

                // Set envelope stages using linearRampToValueAtTime instead
                gainNode.gain.setValueAtTime(0, time);

                // Attack
                gainNode.gain.linearRampToValueAtTime(maxGain, attackEndTime);

                // Decay to sustain
                const sustainLevel = maxGain * envelope.sustain;
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
        if (this.currentMode === 'drums') return;

        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const releaseTime = voice.envelope.release;

            // Cancel scheduled changes and start release phase for main voice
            voice.gainNode.gain.cancelScheduledValues(now);
            voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
            voice.gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);

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
                    voice.oscillator.stop(now + releaseTime + 0.1);
                    voice.oscillator.disconnect();
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
        this.tunings.set(note, cents);

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            const newFreq = this.getFrequency(note);
            voice.oscillator.frequency.setValueAtTime(
                newFreq,
                this.audioContext.currentTime
            );
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
        if (this.currentMode !== mode) {
            Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
            this.currentMode = mode;
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

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.mainGain = null;
            this.isInitialized = false;
        }
    }

    private velocityToGain(velocity: number): number {
        const normalizedVelocity = velocity / 127;
        // Use cubic curve for more natural velocity response
        return Math.pow(normalizedVelocity, 3) * this.DEFAULT_GAIN;
    }

    // Add this function to check audio context state
    checkAudioContextState() {
        if (!this.audioContext) {
            console.log(`[DIAG] Audio context doesn't exist!`);
            return;
        }

        console.log(`[DIAG] Audio context state:`, {
            state: this.audioContext.state,
            sampleRate: this.audioContext.sampleRate,
            currentTime: this.audioContext.currentTime.toFixed(4),
            baseLatency: this.audioContext.baseLatency?.toFixed(4) || 'N/A',
        });

        // Check if in suspended state and try to resume
        if (this.audioContext.state === 'suspended') {
            console.log(`[DIAG] Attempting to resume suspended audio context...`);
            this.audioContext.resume().then(() => {
                console.log(`[DIAG] Audio context resumed:`, this.audioContext.state);
            }).catch(err => {
                console.error(`[DIAG] Failed to resume audio context:`, err);
            });
        }
    }

    // Method to get unison settings for a note
    private getUnisonSettings(note: number) {
        return this.unisonSettings.get(note) || {
            count: this.DEFAULT_UNISON_COUNT,
            detune: this.DEFAULT_UNISON_DETUNE,
            width: this.DEFAULT_UNISON_WIDTH
        };
    }

    // Method to set unison parameters
    setUnisonParameter(note: number, parameter: string, value: number): void {
        if (this.currentMode === 'drums') return;

        const currentSettings = this.getUnisonSettings(note);
        
        switch (parameter) {
            case 'count':
                currentSettings.count = Math.max(1, Math.min(8, Math.floor(value)));
                break;
            case 'detune':
                currentSettings.detune = Math.max(0, Math.min(100, value));
                break;
            case 'width':
                currentSettings.width = Math.max(0, Math.min(100, value));
                break;
        }
        
        this.unisonSettings.set(note, currentSettings);
        
        // If the note is currently playing, update unison voices
        if (this.activeVoices.has(note)) {
            this.updateUnisonVoices(note);
        }
    }

    // Update the active voices for a note when unison parameters change
    private updateUnisonVoices(note: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        const unisonSettings = this.getUnisonSettings(note);
        const currentCount = voice.unisonVoices ? voice.unisonVoices.length : 0;
        
        // If unison count has decreased, remove excess voices
        if (currentCount > unisonSettings.count) {
            for (let i = unisonSettings.count; i < currentCount; i++) {
                if (voice.unisonVoices && voice.unisonVoices[i]) {
                    voice.unisonVoices[i].oscillator.stop();
                    voice.unisonVoices[i].oscillator.disconnect();
                    voice.unisonVoices[i].gainNode.disconnect();
                    voice.unisonVoices[i].panNode.disconnect();
                }
            }
            
            if (voice.unisonVoices) {
                voice.unisonVoices = voice.unisonVoices.slice(0, unisonSettings.count);
            }
        }
        
        // If unison count has increased, add new voices
        if (currentCount < unisonSettings.count) {
            if (!voice.unisonVoices) {
                voice.unisonVoices = [];
            }
            
            const baseFrequency = voice.baseFrequency;
            
            for (let i = currentCount; i < unisonSettings.count; i++) {
                this.addUnisonVoice(note, i, unisonSettings.count, baseFrequency);
            }
        }
        
        // Update detune and stereo width for all unison voices
        if (voice.unisonVoices) {
            for (let i = 0; i < voice.unisonVoices.length; i++) {
                this.updateUnisonVoiceParameters(voice.unisonVoices[i], i, unisonSettings);
            }
        }
    }

    // Add a new unison voice to the active voice
    private addUnisonVoice(note: number, index: number, totalVoices: number, baseFrequency: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;
        
        const unisonSettings = this.getUnisonSettings(note);
        const now = this.audioContext.currentTime;
        
        // Create oscillator for unison voice
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner ? 
            this.audioContext.createStereoPanner() : 
            this.audioContext.createPanner();
        
        // Set oscillator type to match main oscillator
        oscillator.type = voice.waveform || 'sine';
        
        // Configure oscillator with base frequency
        oscillator.frequency.setValueAtTime(baseFrequency, now);
        
        // Apply envelope to gain - divide by square root of count for better volume scaling
        const maxGain = this.velocityToGain(voice.currentVelocity) / Math.sqrt(unisonSettings.count);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + voice.envelope.attack);
        gainNode.gain.linearRampToValueAtTime(
            maxGain * voice.envelope.sustain,
            now + voice.envelope.attack + voice.envelope.decay
        );
        
        // Connect nodes
        oscillator.connect(gainNode);
        
        // Connect panning based on browser support
        if (this.audioContext.createStereoPanner) {
            gainNode.connect(panNode);
            panNode.connect(this.mainGain!); // Connect directly to main gain, not through filter
        } else {
            // Fallback for older browsers
            gainNode.connect(panNode);
            panNode.connect(this.mainGain!); // Connect directly to main gain
        }
        
        // Start oscillator
        oscillator.start(now);
        
        // Create unison voice object
        const unisonVoice = {
            oscillator,
            gainNode,
            panNode
        };
        
        // Update parameters for the new voice
        this.updateUnisonVoiceParameters(unisonVoice, index, unisonSettings);
        
        // Add unison voice to the active voice
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
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Calculate factors for voice position
        const totalVoices = settings.count;
        
        // If only one voice, center it and don't detune
        if (totalVoices === 1) {
            unisonVoice.oscillator.detune.setValueAtTime(0, now);
            
            if (this.audioContext.createStereoPanner) {
                (unisonVoice.panNode as StereoPannerNode).pan.setValueAtTime(0, now);
            } else {
                (unisonVoice.panNode as PannerNode).setPosition(0, 0, 0.1);
            }
            return;
        }
        
        // Calculate normalized position (-1 to 1) for this voice
        // We use a special distribution to avoid bunching voices in the center
        let normalizedPosition;
        if (totalVoices === 2) {
            // For 2 voices, place them symmetrically
            normalizedPosition = index === 0 ? -1 : 1;
        } else {
            // For 3+ voices, distribute them across the range
            normalizedPosition = (index / (totalVoices - 1)) * 2 - 1;
        }
        
        // Apply detuning based on position and detune amount
        // Scale detune to be (+/- settings.detune)
        const detuneAmount = normalizedPosition * settings.detune;
        unisonVoice.oscillator.detune.setValueAtTime(detuneAmount, now);
        
        // Apply stereo width based on position and width amount
        const panPosition = normalizedPosition * (settings.width / 100);
        
        // Log the detune and pan values for debugging
        console.log(`Unison voice ${index}/${totalVoices-1}: detune=${detuneAmount.toFixed(1)} cents, pan=${panPosition.toFixed(2)}`);
        
        // Set panning based on browser support
        if (this.audioContext.createStereoPanner) {
            (unisonVoice.panNode as StereoPannerNode).pan.setValueAtTime(panPosition, now);
        } else {
            // For older browsers using PannerNode
            (unisonVoice.panNode as PannerNode).setPosition(panPosition, 0, 0.1);
        }
    }
}

const keyboardAudioManager = new KeyboardAudioManager();
export default keyboardAudioManager;