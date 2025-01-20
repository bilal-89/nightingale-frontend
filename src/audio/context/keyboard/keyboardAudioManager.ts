// src/audio/context/keyboard/keyboardAudioManager.ts

import { SynthesisParameters, CompleteNoteEvent } from '../../types/audioTypes';
import { drumSoundManager } from '../drums/drumSoundManager';

// The KeyboardAudioManager handles both tunable synthesis (flute-like sounds)
// and delegation to the drum sound manager for percussion sounds
class KeyboardAudioManager {
    // Core audio system configuration - these control the overall sound characteristics
    private readonly MASTER_VOLUME = 0.3;
    private readonly DEFAULT_GAIN = 0.3;
    private readonly MIN_GAIN = 0.0001;
    private readonly DEFAULT_VELOCITY = 100;

    // Envelope timing parameters for natural sound shaping
    private readonly ATTACK_TIME = 0.05;    // 50ms smooth fade-in
    private readonly RELEASE_TIME = 0.15;   // 150ms natural fade-out
    private readonly SUSTAIN_LEVEL = 0.7;   // 70% of full volume while held

    // Audio system state
    private audioContext: AudioContext | null = null;
    private mainGain: GainNode | null = null;
    private isInitialized = false;
    private currentMode: 'tunable' | 'drums' = 'tunable';

    // Active sound management - tracks currently playing notes with their timing information
    private activeVoices = new Map<number, {
        oscillator: OscillatorNode;
        gainNode: GainNode;
        baseFrequency: number;
        currentTuning: number;
        startTime: number;        // When the note began playing
        noteStartTime: number;    // The musical timing of the note
        envelope: {
            attack: number;
            release: number;
            sustainLevel: number;
        };
    }>();

    // Tuning system for microtonal adjustments
    private tunings = new Map<number, number>();

    // Public interface methods
    getContext(): AudioContext | null {
        return this.audioContext;
    }

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

    getCurrentMode(): 'tunable' | 'drums' {
        return this.currentMode;
    }

    setMode(mode: 'tunable' | 'drums'): void {
        if (this.currentMode !== mode) {
            // Clean up any playing notes before switching modes
            Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
            this.currentMode = mode;
        }
    }

    getCurrentSynthesis(note: number): SynthesisParameters {
        // Provide synthesis parameters based on the current mode
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
                gain: this.DEFAULT_GAIN,
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
                    attack: this.ATTACK_TIME,
                    decay: 0,
                    sustain: this.SUSTAIN_LEVEL,
                    release: this.RELEASE_TIME
                },
                gain: this.DEFAULT_GAIN,
                effects: {}
            };
        }
    }

    // Real-time playback system for immediate note triggering
    async playNote(note: number): Promise<CompleteNoteEvent> {
        if (!this.isInitialized) await this.initialize();
        if (!this.audioContext) throw new Error('Audio system not initialized');

        const tuning = this.tunings.get(note) || 0;

        if (this.currentMode === 'drums') {
            // Delegate drum sounds to the drum manager
            drumSoundManager.initialize();
            drumSoundManager.playDrumSound(note, tuning);

            return {
                note,
                timestamp: this.audioContext.currentTime,
                velocity: this.DEFAULT_VELOCITY,
                duration: 0.15,
                synthesis: this.getCurrentSynthesis(note)
            };
        } else {
            // Use tunable synthesis for flute-like sounds
            return this.playTunableNoteRT(note);
        }
    }

    // Scheduled playback system for precise timing during playback
    playExactNote(noteEvent: CompleteNoteEvent, time: number) {
        if (!this.audioContext) return;

        const previousMode = this.currentMode;
        this.currentMode = noteEvent.synthesis.mode;

        try {
            if (this.currentMode === 'drums') {
                // Schedule drum sounds
                drumSoundManager.initialize();
                const tuning = this.tunings.get(noteEvent.note) || 0;
                drumSoundManager.playDrumSoundAt(noteEvent.note, time, tuning);
            } else {
                // Schedule tunable sounds
                this.playTunableSound(noteEvent, time);
            }
        } finally {
            this.currentMode = previousMode;
        }
    }

    stopNote(note: number): void {
        if (this.currentMode === 'drums') {
            return; // Drums handle their own cleanup
        }

        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const noteDuration = now - voice.startTime;

            // Apply release envelope
            voice.gainNode.gain.cancelScheduledValues(now);
            voice.gainNode.gain.setValueAtTime(voice.envelope.sustainLevel, now);
            voice.gainNode.gain.linearRampToValueAtTime(0, now + voice.envelope.release);

            // Schedule cleanup after release
            setTimeout(() => {
                try {
                    voice.oscillator.stop(now + voice.envelope.release + 0.1);
                    voice.oscillator.disconnect();
                    voice.gainNode.disconnect();
                } catch (error) {
                    console.error('Error cleaning up note:', error);
                }
            }, voice.envelope.release * 1000 + 200);

            this.activeVoices.delete(note);

            // Log the duration for debugging
            console.log(`Note ${note} played for ${noteDuration.toFixed(3)} seconds`);
        } catch (error) {
            console.error('Error stopping note:', error);
            voice.oscillator.disconnect();
            voice.gainNode.disconnect();
            this.activeVoices.delete(note);
        }
    }

    setNoteTuning(note: number, cents: number): void {
        this.tunings.set(note, cents);

        if (this.currentMode === 'drums') {
            return; // Drums handle their own tuning
        }

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            const newFreq = this.getFrequency(note);
            voice.oscillator.frequency.setValueAtTime(
                newFreq,
                this.audioContext.currentTime
            );
        }
    }

    private getFrequency(note: number): number {
        const baseMidiNote = note - 69; // A4 = 69 is our reference note
        const baseFrequency = 440 * Math.pow(2, baseMidiNote / 12);
        const tuning = this.tunings.get(note) || 0;
        if (tuning === 0) return baseFrequency;
        return baseFrequency * Math.pow(2, tuning / 1200);
    }

    private playTunableSound(noteEvent: CompleteNoteEvent, time: number) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Configure oscillator
        oscillator.type = noteEvent.synthesis.waveform;
        const frequency = this.getFrequency(noteEvent.note);
        oscillator.frequency.setValueAtTime(frequency, time);

        // Apply envelope
        const attack = this.ATTACK_TIME;
        const release = this.RELEASE_TIME;
        const gain = this.SUSTAIN_LEVEL * (noteEvent.velocity / 127);
        const duration = noteEvent.duration || 0.1;

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(gain, time + attack);
        gainNode.gain.setValueAtTime(gain, time + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, time + duration);

        // Connect and schedule playback
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);
        oscillator.start(time);
        oscillator.stop(time + duration + release + 0.1);

        // Schedule cleanup
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, (time + duration + release + 0.2 - this.audioContext.currentTime) * 1000);
    }

    private async playTunableNoteRT(note: number): Promise<CompleteNoteEvent> {
        if (!this.audioContext) throw new Error('Audio context not initialized');

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const baseFrequency = this.getFrequency(note);

        // Create envelope configuration
        const envelope = {
            attack: this.ATTACK_TIME,
            release: this.RELEASE_TIME,
            sustainLevel: this.SUSTAIN_LEVEL
        };

        // Configure oscillator
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFrequency, now);

        // Apply attack envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(envelope.sustainLevel, now + envelope.attack);

        // Connect and start
        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);
        oscillator.start(now);

        // Store voice with timing information
        this.activeVoices.set(note, {
            oscillator,
            gainNode,
            baseFrequency,
            currentTuning: this.tunings.get(note) || 0,
            startTime: now,
            noteStartTime: now,
            envelope
        });

        return {
            note,
            timestamp: now,
            velocity: this.DEFAULT_VELOCITY,
            duration: 0, // Will be calculated when the note stops
            synthesis: this.getCurrentSynthesis(note)
        };
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