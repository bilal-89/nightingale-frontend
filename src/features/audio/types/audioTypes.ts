// src/audio/types/audioTypes.ts

// Define all the audio-related types
export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type BiquadFilterType = 'lowpass' | 'highpass' | 'bandpass';

export interface SynthesisParameters {
    mode: 'tunable' | 'drums';
    waveform: OscillatorType;

    envelope: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    };

    frequencyModulation?: {
        initialFrequency: number;
        targetFrequency: number;
        modulationTime: number;
    };

    gain: number;

    effects: {
        filter?: {
            type: BiquadFilterType;
            frequency: number;
            Q: number;
        };
    };
}

export interface CompleteNoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration: number;
    synthesis: SynthesisParameters;
    parameterChanges?: {
        parameter: string;
        value: number;
        timeOffset: number;
    }[];
}