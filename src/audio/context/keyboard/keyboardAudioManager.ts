import './types';

class KeyboardAudioManager {
    private static instance: AudioContext | null = null;
    private static activeNotes: Map<number, {
        oscillator: OscillatorNode;
        gainNode: GainNode;
        tuning: number;
    }> = new Map();
    private static mainGain: GainNode | null = null;
    private static isInitialized = false;

    /**
     * Initialize the audio context and main gain node
     */
    static async initialize() {
        if (!this.isInitialized) {
            try {
                if (!this.instance) {
                    this.instance = new (window.AudioContext || window.webkitAudioContext)();
                    this.mainGain = this.instance.createGain();
                    this.mainGain.gain.value = 0.5; // Set initial volume
                    this.mainGain.connect(this.instance.destination);
                }

                if (this.instance.state === 'suspended') {
                    await this.instance.resume();
                }

                this.isInitialized = true;
                console.log('Keyboard audio system initialized');
            } catch (error) {
                console.error('Failed to initialize audio system:', error);
                throw error;
            }
        }
    }

    /**
     * Calculate frequency for a given note and tuning
     */
    private static calculateFrequency(note: number, cents: number = 0): number {
        // Base frequency for A4 (MIDI note 69) = 440Hz
        return 440 * Math.pow(2, (note - 69) / 12 + cents / 1200);
    }

    /**
     * Get the audio context, initializing if necessary
     */
    private static getContext(): AudioContext {
        if (!this.instance || !this.isInitialized) {
            throw new Error('Audio system not initialized');
        }
        return this.instance;
    }

    /**
     * Start playing a note
     */
    static async playNote(note: number, cents: number = 0) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Stop note if already playing
        if (this.activeNotes.has(note)) {
            this.stopNote(note);
        }

        const ctx = this.getContext();
        const frequency = this.calculateFrequency(note, cents);

        // Create and configure oscillator
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Connect audio chain
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);

        // Store note information
        this.activeNotes.set(note, {
            oscillator,
            gainNode,
            tuning: cents
        });

        // Smooth attack
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);

        oscillator.start();
        console.log(`Playing note ${note} at ${frequency}Hz (${cents}¢)`);
    }

    /**
     * Update the tuning of a playing note
     */
    static setNoteTuning(note: number, cents: number) {
        const noteData = this.activeNotes.get(note);
        if (noteData && this.instance) {
            const frequency = this.calculateFrequency(note, cents);
            const currentTime = this.instance.currentTime;

            // Smoothly transition to new frequency
            noteData.oscillator.frequency.setValueAtTime(
                noteData.oscillator.frequency.value,
                currentTime
            );
            noteData.oscillator.frequency.exponentialRampToValueAtTime(
                Math.max(frequency, 0.01), // Prevent 0Hz
                currentTime + 0.02
            );

            noteData.tuning = cents;
            console.log(`Updated note ${note} to ${frequency}Hz (${cents}¢)`);
        }
    }

    /**
     * Stop playing a note
     */
    static stopNote(note: number) {
        const noteData = this.activeNotes.get(note);
        if (noteData && this.instance) {
            const currentTime = this.instance.currentTime;

            // Smooth release
            noteData.gainNode.gain.setValueAtTime(
                noteData.gainNode.gain.value,
                currentTime
            );
            noteData.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.02);

            // Clean up after release
            setTimeout(() => {
                noteData.oscillator.stop();
                noteData.oscillator.disconnect();
                noteData.gainNode.disconnect();
                this.activeNotes.delete(note);
            }, 50);
        }
    }

    /**
     * Clean up audio resources
     */
    static cleanup() {
        Array.from(this.activeNotes.keys()).forEach(note => this.stopNote(note));
        this.activeNotes.clear();

        if (this.instance) {
            this.instance.close();
            this.instance = null;
            this.mainGain = null;
        }

        this.isInitialized = false;
        console.log('Keyboard audio system cleaned up');
    }
}

export default KeyboardAudioManager;