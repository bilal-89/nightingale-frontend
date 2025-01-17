import './types';

class KeyboardAudioManager {
    private static instance: AudioContext | null = null;
    private static activeNotes: Map<number, {
        oscillator: OscillatorNode;
        gainNode: GainNode;
        modulatorOsc?: OscillatorNode;
        modulatorGain?: GainNode;
        tuning: number;
    }> = new Map();
    private static mainGain: GainNode | null = null;
    private static isInitialized = false;
    private static currentMode: 'tunable' | 'birdsong' | 'drums' = 'tunable';

    static async initialize() {
        if (!this.isInitialized) {
            try {
                if (!this.instance) {
                    this.instance = new (window.AudioContext || window.webkitAudioContext)();
                    this.mainGain = this.instance.createGain();
                    this.mainGain.gain.value = 0.5;
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

    static getCurrentMode(): 'tunable' | 'birdsong' | 'drums' {
        return this.currentMode;
    }

    static setMode(mode: 'tunable' | 'birdsong' | 'drums') {
        if (this.currentMode !== mode) {
            Array.from(this.activeNotes.keys()).forEach(note => this.stopNote(note));
            this.currentMode = mode;
            console.log(`Switched to ${mode} mode`);
        }
    }

    private static calculateFrequency(note: number, cents: number = 0): number {
        return 440 * Math.pow(2, (note - 69) / 12 + cents / 1200);
    }

    private static getContext(): AudioContext {
        if (!this.instance || !this.isInitialized) {
            throw new Error('Audio system not initialized');
        }
        return this.instance;
    }

    static async playNote(note: number, cents: number = 0, params?: {
        waveform?: string;
        attack?: number;
        release?: number;
        modulationFrequency?: number;
        modulationDepth?: number;
    }) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.activeNotes.has(note)) {
            this.stopNote(note);
        }

        const ctx = this.getContext();
        const frequency = this.calculateFrequency(note, cents);

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        let modulatorOsc: OscillatorNode | undefined;
        let modulatorGain: GainNode | undefined;

        switch (this.currentMode) {
            case 'birdsong': {
                oscillator.type = (params?.waveform as OscillatorType) || 'sine';

                // Create modulation system for warbling
                modulatorOsc = ctx.createOscillator();
                modulatorGain = ctx.createGain();
                modulatorOsc.frequency.value = params?.modulationFrequency || 10;
                modulatorGain.gain.value = params?.modulationDepth || 5;
                modulatorOsc.connect(modulatorGain);
                modulatorGain.connect(oscillator.frequency);
                modulatorOsc.start();

                gainNode.gain.cancelScheduledValues(ctx.currentTime);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + (params?.attack || 0.05));
                oscillator.frequency.setValueAtTime(frequency * 1.01, ctx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(frequency, ctx.currentTime + 0.1);
                break;
            }
            case 'drums': {
                oscillator.type = 'triangle';
                gainNode.gain.cancelScheduledValues(ctx.currentTime);
                gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(frequency * 2, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(frequency, ctx.currentTime + 0.05);
                break;
            }
            default: {
                oscillator.type = 'sine';
                gainNode.gain.cancelScheduledValues(ctx.currentTime);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + (params?.attack || 0.02));
                oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
                break;
            }
        }

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);

        this.activeNotes.set(note, {
            oscillator,
            gainNode,
            modulatorOsc,
            modulatorGain,
            tuning: cents
        });

        oscillator.start();
        console.log(`Playing note ${note} at ${frequency}Hz (${cents}¢) in ${this.currentMode} mode`);

        if (this.currentMode === 'drums') {
            setTimeout(() => this.stopNote(note), 200);
        }
    }

    static setNoteTuning(note: number, cents: number) {
        const noteData = this.activeNotes.get(note);
        if (noteData && this.instance) {
            const frequency = this.calculateFrequency(note, cents);
            const currentTime = this.instance.currentTime;

            noteData.oscillator.frequency.cancelScheduledValues(currentTime);
            noteData.oscillator.frequency.setValueAtTime(
                noteData.oscillator.frequency.value,
                currentTime
            );
            noteData.oscillator.frequency.exponentialRampToValueAtTime(
                Math.max(frequency, 0.01),
                currentTime + 0.02
            );

            noteData.tuning = cents;
            console.log(`Updated note ${note} to ${frequency}Hz (${cents}¢)`);
        }
    }

    static stopNote(note: number) {
        const noteData = this.activeNotes.get(note);
        if (noteData && this.instance) {
            const currentTime = this.instance.currentTime;

            // Cancel any scheduled envelope changes
            noteData.gainNode.gain.cancelScheduledValues(currentTime);
            noteData.gainNode.gain.setValueAtTime(noteData.gainNode.gain.value, currentTime);

            const releaseTime = this.currentMode === 'birdsong' ? 0.1 : 0.02;
            noteData.gainNode.gain.linearRampToValueAtTime(0, currentTime + releaseTime);

            setTimeout(() => {
                try {
                    if (noteData.modulatorOsc) {
                        noteData.modulatorOsc.stop();
                        noteData.modulatorOsc.disconnect();
                    }
                    if (noteData.modulatorGain) {
                        noteData.modulatorGain.disconnect();
                    }
                    noteData.oscillator.stop();
                    noteData.oscillator.disconnect();
                    noteData.gainNode.disconnect();
                    this.activeNotes.delete(note);
                } catch (error) {
                    console.error('Error cleaning up note:', error);
                    this.activeNotes.delete(note);
                }
            }, releaseTime * 1000 + 10);
        }
    }

    static cleanup() {
        Array.from(this.activeNotes.entries()).forEach(([note, noteData]) => {
            try {
                if (noteData.modulatorOsc) {
                    noteData.modulatorOsc.stop();
                    noteData.modulatorOsc.disconnect();
                }
                if (noteData.modulatorGain) {
                    noteData.modulatorGain.disconnect();
                }
                noteData.oscillator.stop();
                noteData.oscillator.disconnect();
                noteData.gainNode.disconnect();
            } catch (error) {
                console.error(`Error cleaning up note ${note}:`, error);
            }
        });
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