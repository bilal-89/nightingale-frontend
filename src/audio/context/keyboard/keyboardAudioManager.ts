// src/audio/context/keyboard/keyboardAudioManager.ts

import { SynthesisParameters, CompleteNoteEvent } from '../../types/audioTypes';
import { drumSoundManager } from '../drums/drumSoundManager';

class KeyboardAudioManager {
    private readonly MASTER_VOLUME = 0.3;
    private readonly DEFAULT_GAIN = 0.3;
    private readonly DEFAULT_VELOCITY = 100;
    private readonly ATTACK_TIME = 0.05;
    private readonly RELEASE_TIME = 0.15;
    private readonly SUSTAIN_LEVEL = 0.7;

    private audioContext: AudioContext | null = null;
    private mainGain: GainNode | null = null;
    private isInitialized = false;
    private currentMode: 'tunable' | 'drums' = 'tunable';

    // Add velocity map alongside tunings
    private tunings = new Map<number, number>();
    private velocities = new Map<number, number>();

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
            release: number;
            sustainLevel: number;
        };
    }>();

    // Convert MIDI velocity (0-127) to gain value (0-1)
    private velocityToGain(velocity: number): number {
        const normalizedVelocity = velocity / 127;
        // Use a power curve for more natural velocity response
        return Math.pow(normalizedVelocity, 1.5) * this.SUSTAIN_LEVEL;
    }

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
            Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
            this.currentMode = mode;
        }
    }

    getCurrentSynthesis(note: number): SynthesisParameters {
        const velocity = this.velocities.get(note) ?? this.DEFAULT_VELOCITY;

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
                    attack: this.ATTACK_TIME,
                    decay: 0,
                    sustain: this.SUSTAIN_LEVEL,
                    release: this.RELEASE_TIME
                },
                gain: this.velocityToGain(velocity),
                effects: {}
            };
        }
    }

    async playNote(note: number): Promise<CompleteNoteEvent> {
        if (!this.isInitialized) await this.initialize();
        if (!this.audioContext) throw new Error('Audio system not initialized');

        const tuning = this.tunings.get(note) || 0;
        const velocity = this.velocities.get(note) ?? this.DEFAULT_VELOCITY;

        if (this.currentMode === 'drums') {
            drumSoundManager.initialize();
            drumSoundManager.playDrumSound(note, tuning);

            return {
                note,
                timestamp: this.audioContext.currentTime,
                velocity,
                duration: 0.15,
                synthesis: this.getCurrentSynthesis(note)
            };
        } else {
            return this.playTunableNoteRT(note, velocity);
        }
    }

    playExactNote(noteEvent: CompleteNoteEvent, time: number) {
        if (!this.audioContext) return;

        const previousMode = this.currentMode;
        this.currentMode = noteEvent.synthesis.mode;

        try {
            if (this.currentMode === 'drums') {
                drumSoundManager.initialize();
                const tuning = this.tunings.get(noteEvent.note) || 0;
                drumSoundManager.playDrumSoundAt(noteEvent.note, time, tuning);
            } else {
                this.playTunableSound(noteEvent, time);
            }
        } finally {
            this.currentMode = previousMode;
        }
    }

    stopNote(note: number): void {
        if (this.currentMode === 'drums') return;

        const voice = this.activeVoices.get(note);
        if (!voice || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const noteDuration = now - voice.startTime;

            voice.gainNode.gain.cancelScheduledValues(now);
            voice.gainNode.gain.setValueAtTime(
                this.velocityToGain(voice.currentVelocity) * voice.envelope.sustainLevel,
                now
            );
            voice.gainNode.gain.linearRampToValueAtTime(0, now + voice.envelope.release);

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
            console.log(`Note ${note} played for ${noteDuration.toFixed(3)} seconds`);
        } catch (error) {
            console.error('Error stopping note:', error);
            voice.oscillator.disconnect();
            voice.gainNode.disconnect();
            this.activeVoices.delete(note);
        }
    }

    setNoteParameter(note: number, parameter: string, value: number): void {
        if (this.currentMode === 'drums') return;

        switch (parameter) {
            case 'tuning':
                this.setNoteTuning(note, value);
                break;
            case 'velocity':
                this.setNoteVelocity(note, value);
                break;
        }
    }

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

    setNoteVelocity(note: number, velocity: number): void {
        this.velocities.set(note, velocity);

        const voice = this.activeVoices.get(note);
        if (voice && this.audioContext) {
            const gain = this.velocityToGain(velocity);
            voice.currentVelocity = velocity;
            voice.gainNode.gain.linearRampToValueAtTime(
                gain * voice.envelope.sustainLevel,
                this.audioContext.currentTime + 0.02
            );
        }
    }

    private getFrequency(note: number): number {
        const baseMidiNote = note - 69;
        const baseFrequency = 440 * Math.pow(2, baseMidiNote / 12);
        const tuning = this.tunings.get(note) || 0;
        if (tuning === 0) return baseFrequency;
        return baseFrequency * Math.pow(2, tuning / 1200);
    }

    private playTunableSound(noteEvent: CompleteNoteEvent, time: number) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = noteEvent.synthesis.waveform;
        const frequency = this.getFrequency(noteEvent.note);
        oscillator.frequency.setValueAtTime(frequency, time);

        const attack = this.ATTACK_TIME;
        const release = this.RELEASE_TIME;
        const gain = this.velocityToGain(noteEvent.velocity);
        const duration = noteEvent.duration || 0.1;

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(gain, time + attack);
        gainNode.gain.setValueAtTime(gain, time + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, time + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);
        oscillator.start(time);
        oscillator.stop(time + duration + release + 0.1);

        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, (time + duration + release + 0.2 - this.audioContext.currentTime) * 1000);
    }

    private async playTunableNoteRT(note: number, velocity: number): Promise<CompleteNoteEvent> {
        if (!this.audioContext) throw new Error('Audio context not initialized');

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const baseFrequency = this.getFrequency(note);

        const envelope = {
            attack: this.ATTACK_TIME,
            release: this.RELEASE_TIME,
            sustainLevel: this.SUSTAIN_LEVEL
        };

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFrequency, now);

        const gain = this.velocityToGain(velocity);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(gain, now + envelope.attack);

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain!);
        oscillator.start(now);

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
            synthesis: this.getCurrentSynthesis(note)
        };
    }

    cleanup(): void {
        Array.from(this.activeVoices.keys()).forEach(note => this.stopNote(note));
        this.activeVoices.clear();
        this.tunings.clear();
        this.velocities.clear();

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