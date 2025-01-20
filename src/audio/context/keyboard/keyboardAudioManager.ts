import { SynthesisParameters, CompleteNoteEvent } from '../../types/audioTypes';

class KeyboardAudioManager {
    // Core audio system configuration
    private readonly MASTER_VOLUME = 0.3;
    private readonly DEFAULT_GAIN = 0.3;      // Consistent base volume
    private readonly MIN_GAIN = 0.0001;       // Prevent true zero
    private readonly DEFAULT_VELOCITY = 100;
    private readonly RELEASE_TIME = 0.005;    // Quick release to prevent clicks

    // Audio context and main output
    private audioContext: AudioContext | null = null;
    private mainGain: GainNode | null = null;
    private isInitialized = false;

    // Synthesis state with separate gain and frequency tracking
    private activeVoices = new Map<number, {
        oscillator: OscillatorNode,
        gainNode: GainNode,
        baseFrequency: number,     // Store original frequency
        currentTuning: number      // Store current tuning in cents
    }>();

    private tunings = new Map<number, number>();
    private currentMode: 'tunable' | 'drums' = 'tunable';

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new AudioContext();
            this.mainGain = this.audioContext.createGain();
            this.mainGain.gain.setValueAtTime(this.MASTER_VOLUME, this.audioContext.currentTime);
            this.mainGain.connect(this.audioContext.destination);

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            throw error;
        }
    }

    getCurrentMode(): 'tunable' | 'drums' {
        return this.currentMode;
    }

    setMode(mode: 'tunable' | 'drums'): void {
        if (this.currentMode !== mode) {
            Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
            this.currentMode = mode;
        }
    }

    // Improved frequency calculation
    private getFrequency(note: number): number {
        const baseMidiNote = note - 69;  // A4 = 69 is reference
        return 440 * Math.pow(2, baseMidiNote / 12);
    }

    // Separate tuning calculation
    private getTuningMultiplier(cents: number): number {
        return Math.pow(2, cents / 1200);
    }

    // Improved velocity to gain conversion
    private velocityToGain(velocity: number): number {
        const normalizedVelocity = Math.min(Math.max(velocity, 1), 127) / 127;
        return Math.max(this.DEFAULT_GAIN * normalizedVelocity, this.MIN_GAIN);
    }

    setNoteTuning(note: number, cents: number): void {
        this.tunings.set(note, cents);

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            const baseFreq = voice.baseFrequency;
            const tuningMultiplier = this.getTuningMultiplier(cents);
            const newFrequency = baseFreq * tuningMultiplier;

            // Update frequency without touching gain
            voice.oscillator.frequency.setValueAtTime(
                newFrequency,
                this.audioContext.currentTime
            );
            voice.currentTuning = cents;
        }
    }

    async playNote(note: number, velocity: number = this.DEFAULT_VELOCITY): Promise<CompleteNoteEvent> {
        if (!this.isInitialized) await this.initialize();
        if (!this.audioContext) throw new Error('Audio system not initialized');

        // Clean up existing note
        this.stopNote(note);

        const baseFrequency = this.getFrequency(note);
        const tuningCents = this.tunings.get(note) || 0;
        const tuningMultiplier = this.getTuningMultiplier(tuningCents);
        const finalFrequency = baseFrequency * tuningMultiplier;

        // Create and configure oscillator
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(finalFrequency, this.audioContext.currentTime);

        // Create and configure gain stage
        const gainNode = this.audioContext.createGain();
        const noteGain = this.velocityToGain(velocity);

        // Apply gain with anti-click ramp
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(this.MIN_GAIN, now);
        gainNode.gain.linearRampToValueAtTime(noteGain, now + 0.005);

        // Set up audio routing
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);

        // Start oscillator and store voice
        oscillator.start();
        this.activeVoices.set(note, {
            oscillator,
            gainNode,
            baseFrequency,
            currentTuning: tuningCents
        });

        // Return complete note event
        return {
            note,
            timestamp: now,
            velocity,
            duration: 0,
            synthesis: {
                mode: this.currentMode,
                waveform: 'sine',
                envelope: {
                    attack: 0.005,
                    decay: 0,
                    sustain: noteGain,
                    release: this.RELEASE_TIME
                },
                gain: noteGain,
                effects: {}
            }
        };
    }

    stopNote(note: number): void {
        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;

            // Apply release ramp to prevent clicks
            voice.gainNode.gain.linearRampToValueAtTime(this.MIN_GAIN, now + this.RELEASE_TIME);

            // Schedule cleanup after release
            setTimeout(() => {
                try {
                    voice.oscillator.stop();
                    voice.oscillator.disconnect();
                    voice.gainNode.disconnect();
                } catch (error) {
                    console.error('Error cleaning up note:', error);
                }
            }, this.RELEASE_TIME * 1000 + 10);

            this.activeVoices.delete(note);
        } catch (error) {
            console.error('Error stopping note:', error);
            this.forceCleanupVoice(voice);
            this.activeVoices.delete(note);
        }
    }

    private forceCleanupVoice(voice: { oscillator: OscillatorNode; gainNode: GainNode }) {
        try {
            voice.oscillator.disconnect();
            voice.gainNode.disconnect();
        } catch (error) {
            console.error('Error in force cleanup:', error);
        }
    }

    cleanup(): void {
        Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
        this.activeVoices.clear();
        this.tunings.clear();

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