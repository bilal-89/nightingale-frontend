import { KeyboardEngine } from '../engine/synthesis/keyboardEngine';
import { DrumEngine } from '../engine/synthesis/drumEngine';
import {
    VoiceParams,
    DrumVoice,
    Voice,
    SynthMode,
    KeyParameters,
    OscillatorType
} from '../types';

export class VoiceService {
    private keyboardEngine: KeyboardEngine;
    private drumEngine: DrumEngine;
    private activeVoices: Map<number, string>;
    private parameters: Map<number, Partial<KeyParameters>>;
    private currentGlobalWaveform: OscillatorType = 'sine';

    constructor(context: AudioContext) {
        this.keyboardEngine = new KeyboardEngine(context);
        this.drumEngine = new DrumEngine(context);
        this.activeVoices = new Map();
        this.parameters = new Map();
    }

    setGlobalWaveform(waveform: OscillatorType): void {
        this.currentGlobalWaveform = waveform;
        // Update all active voices that don't have a specific waveform set
        this.activeVoices.forEach((voiceId, note) => {
            if (!this.parameters.get(note)?.waveform) {
                this.keyboardEngine.updateVoice(voiceId, { waveform });
            }
        });
    }

    setKeyWaveform(note: number, waveform: OscillatorType): void {
        if (!this.parameters.has(note)) {
            this.parameters.set(note, {});
        }
        const params = this.parameters.get(note)!;
        this.parameters.set(note, { ...params, waveform });

        // Update active voice if it exists
        const voiceId = this.activeVoices.get(note);
        if (voiceId) {
            this.keyboardEngine.updateVoice(voiceId, { waveform });
        }
    }

    async handleNoteOn(note: number, mode: SynthMode, velocity = 100): Promise<void> {
        try {
            if (mode === 'drums') {
                const voice = this.drumEngine.createVoice(note, 0, this.getParameter(note, 'tuning'));
                this.activeVoices.set(note, voice.id);
            } else {
                const voice = this.keyboardEngine.createVoice({
                    note,
                    velocity,
                    tuning: this.getParameter(note, 'tuning'),
                    envelope: {
                        attack: this.getParameter(note, 'attack') / 1000,
                        decay: this.getParameter(note, 'decay') / 1000,
                        sustain: this.getParameter(note, 'sustain') / 100,
                        release: this.getParameter(note, 'release') / 1000
                    },
                    filter: {
                        cutoff: this.getParameter(note, 'filterCutoff'),
                        resonance: this.getParameter(note, 'filterResonance')
                    },
                    waveform: this.parameters.get(note)?.waveform ?? this.currentGlobalWaveform
                });
                this.activeVoices.set(note, voice.id);
            }
        } catch (error) {
            console.error('Error in handleNoteOn:', error);
        }
    }

    handleNoteOff(note: number, mode: SynthMode): void {
        const voiceId = this.activeVoices.get(note);
        if (!voiceId) return;

        // For drums, we don't need to do anything special on note off
        // The cleanup is handled by the scheduled cleanup in DrumEngine
        if (mode === 'tunable') {
            this.keyboardEngine.releaseVoice(voiceId);
        }
        this.activeVoices.delete(note);
    }

    setParameter(note: number, parameter: keyof KeyParameters, value: number): void {
        if (!this.parameters.has(note)) {
            this.parameters.set(note, {});
        }
        const params = this.parameters.get(note)!;
        params[parameter] = { value, defaultValue: value };

        const voiceId = this.activeVoices.get(note);
        if (voiceId) {
            switch (parameter) {
                case 'tuning': {
                    this.keyboardEngine.updateVoice(voiceId, {
                        tuning: value,
                        note // Pass the note for proper base frequency calculation
                    });
                    break;
                }
                case 'filterCutoff':
                case 'filterResonance':
                    this.keyboardEngine.updateVoice(voiceId, {
                        filter: {
                            cutoff: parameter === 'filterCutoff' ? value : this.getParameter(note, 'filterCutoff'),
                            resonance: parameter === 'filterResonance' ? value : this.getParameter(note, 'filterResonance')
                        }
                    });
                    break;
                case 'velocity':
                    this.keyboardEngine.updateVoice(voiceId, { velocity: value });
                    break;
                case 'attack':
                case 'decay':
                case 'sustain':
                case 'release':
                    this.keyboardEngine.updateVoice(voiceId, {
                        envelope: {
                            attack: parameter === 'attack' ? value / 1000 : this.getParameter(note, 'attack') / 1000,
                            decay: parameter === 'decay' ? value / 1000 : this.getParameter(note, 'decay') / 1000,
                            sustain: parameter === 'sustain' ? value / 100 : this.getParameter(note, 'sustain') / 100,
                            release: parameter === 'release' ? value / 1000 : this.getParameter(note, 'release') / 1000
                        }
                    });
                    break;
            }
        }
    }

    private getParameter(note: number, parameter: keyof KeyParameters): number {
        const defaultValues = {
            tuning: 0,
            velocity: 100,
            attack: 50,
            decay: 100,
            sustain: 70,
            release: 150,
            filterCutoff: 20000,
            filterResonance: 0.707
        };

        return this.parameters.get(note)?.[parameter]?.value ?? defaultValues[parameter];
    }

    cleanup(): void {
        this.keyboardEngine.cleanup();
        this.drumEngine.cleanup();
        this.activeVoices.clear();
        this.parameters.clear();
    }
}