import { SynthesisParameters, CompleteNoteEvent } from '../../types/audioTypes';
import { drumSoundManager } from '../drums/drumSoundManager';

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

    // Active voice tracking
    private activeVoices = new Map<number, {
        oscillator: OscillatorNode;
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
    }>();

    // Required context getter for playback system
    getContext(): AudioContext | null {
        return this.audioContext;
    }

    getCurrentTime(): number {
        return this.audioContext?.currentTime ?? 0;
    }

    // Utility function to convert velocity to gain
    private velocityToGain(velocity: number): number {
        const normalizedVelocity = velocity / 127;
        return Math.pow(normalizedVelocity, 1.5) * this.DEFAULT_GAIN;
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
    private getFrequency(note: number): number {
        const baseMidiNote = note - 69; // A4 = 69
        const baseFrequency = 440 * Math.pow(2, baseMidiNote / 12);
        const tuning = this.tunings.get(note) || 0;
        return tuning === 0 ? baseFrequency : baseFrequency * Math.pow(2, tuning / 1200);
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

        const previousMode = this.currentMode;
        this.currentMode = noteEvent.synthesis.mode;

        try {
            if (this.currentMode === 'drums') {
                // Initialize drum system for playback
                drumSoundManager.initialize();

                // Get the tuning for this drum note
                const tuning = this.tunings.get(noteEvent.note) || 0;

                // Schedule the drum sound to play at the exact time
                drumSoundManager.playDrumSoundAt(
                    noteEvent.note,
                    time, // Use the scheduled time from the playback system
                    tuning
                );

                // We don't need to store voice info for drums since DrumSoundManager
                // handles its own cleanup
            } else {
                // Your existing synth code for non-drum sounds
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const envelope = noteEvent.synthesis.envelope;
                const maxGain = this.velocityToGain(noteEvent.velocity);

                // Set up the oscillator
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(
                    this.getFrequency(noteEvent.note),
                    time
                );

                // Calculate envelope timings
                const attackEndTime = time + envelope.attack;
                const decayEndTime = attackEndTime + envelope.decay;
                const releaseStartTime = time + noteEvent.duration;
                const releaseEndTime = releaseStartTime + envelope.release;

                // Set initial gain
                gainNode.gain.setValueAtTime(0, time);

                // Handle attack phase differently based on attack time
                if (envelope.attack <= 0.001) {
                    // For immediate attack, directly set the value
                    gainNode.gain.setValueAtTime(maxGain, time);
                } else {
                    // For normal attack, use the curve
                    gainNode.gain.setValueCurveAtTime(
                        this.createAttackCurve(noteEvent.velocity),
                        time,
                        envelope.attack
                    );
                }

                // Rest of envelope remains the same
                const sustainLevel = maxGain * envelope.sustain;
                gainNode.gain.setTargetAtTime(
                    sustainLevel,
                    attackEndTime,
                    envelope.decay / 4
                );

                gainNode.gain.setTargetAtTime(
                    0,
                    releaseStartTime,
                    envelope.release / 3
                );

                // Connect audio path
                oscillator.connect(gainNode);
                gainNode.connect(this.mainGain!);

                // Schedule precise start/stop times
                oscillator.start(time);
                oscillator.stop(releaseEndTime + 0.1);

                // Clean up
                setTimeout(() => {
                    try {
                        oscillator.disconnect();
                        gainNode.disconnect();
                    } catch (error) {
                        console.error('Error cleaning up note:', error);
                    }
                }, (releaseEndTime + 0.2 - this.audioContext.currentTime) * 1000);
            }
        } catch (error) {
            console.error('Error in playExactNote:', error);
        } finally {
            this.currentMode = previousMode;
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

// Update velocityToGain for smoother dynamics
    private velocityToGain(velocity: number): number {
        const normalizedVelocity = velocity / 127;
        // Use cubic curve for more natural velocity response
        return Math.pow(normalizedVelocity, 3) * this.DEFAULT_GAIN;
    }

    // Create and configure a new note
    private async playTunableNoteRT(note: number, velocity: number): Promise<CompleteNoteEvent> {
        if (!this.audioContext) throw new Error('Audio context not initialized');

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const baseFrequency = this.getFrequency(note);
        const envelope = this.getEnvelopeParams(note);
        const synthesis = this.getCurrentSynthesis(note);

        // Configure oscillator
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFrequency, now);

        // Configure envelope
        const maxGain = this.velocityToGain(velocity);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + envelope.attack);
        gainNode.gain.linearRampToValueAtTime(
            maxGain * envelope.sustain,
            now + envelope.attack + envelope.decay
        );

        // Connect audio path
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);
        oscillator.start(now);

        // Store voice information
        this.activeVoices.set(note, {
            oscillator,
            gainNode,
            baseFrequency,
            currentTuning: this.tunings.get(note) || 0,
            currentVelocity: velocity,
            startTime: now,
            noteStartTime: now,
            envelope
        });

        return {
            note,
            timestamp: now,
            velocity,
            duration: 0,
            synthesis
        };
    }

    // Stop a playing note
    stopNote(note: number): void {
        if (this.currentMode === 'drums') return;

        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const releaseTime = voice.envelope.release;

            // Cancel scheduled changes and start release phase
            voice.gainNode.gain.cancelScheduledValues(now);
            voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
            voice.gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);

            // Schedule cleanup
            setTimeout(() => {
                try {
                    voice.oscillator.stop(now + releaseTime + 0.1);
                    voice.oscillator.disconnect();
                    voice.gainNode.disconnect();
                } catch (error) {
                    console.error('Error cleaning up note:', error);
                }
            }, releaseTime * 1000 + 200);

            this.activeVoices.delete(note);
        } catch (error) {
            console.error('Error stopping note:', error);
            voice.oscillator.disconnect();
            voice.gainNode.disconnect();
            this.activeVoices.delete(note);
        }
    }

    // Set any parameter for a note
    setNoteParameter(note: number, parameter: string, value: number): void {
        if (this.currentMode === 'drums') return;

        switch (parameter) {
            case 'tuning':
                this.setNoteTuning(note, value);
                break;
            case 'velocity':
                this.setNoteVelocity(note, value);
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

    // Get current synthesis parameters
    getCurrentSynthesis(note: number): SynthesisParameters {
        const velocity = this.velocities.get(note) ?? this.DEFAULT_VELOCITY;
        const envelope = this.getEnvelopeParams(note);

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
                waveform: 'sine',
                envelope: {
                    attack: envelope.attack,
                    decay: envelope.decay,
                    sustain: envelope.sustain,
                    release: envelope.release
                },
                gain: this.velocityToGain(velocity),
                effects: {}
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
    cleanup(): void {
        Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
        this.activeVoices.clear();
        this.tunings.clear();
        this.velocities.clear();
        this.envelopeParams.clear();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.mainGain = null;
            this.isInitialized = false;
        }
    }
}

const keyboardAudioManager = new KeyboardAudioManager();
export default keyboardAudioManager;