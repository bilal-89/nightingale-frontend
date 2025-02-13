// src/features/audio/api/types.ts

// Audio Types
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

// Drum Types
export type DrumType =
    | '808_low'
    | '808_mid'
    | 'hihat_closed'
    | 'hihat_open'
    | 'rimshot'
    | 'crash'
    | 'conga_low'
    | 'conga_mid'
    | 'conga_high'
    | 'bongo_low'
    | 'bongo_high'
    | 'cowbell';

export interface DrumSound {
    type: DrumType;
    baseFreq: number;
    label: string;
    color: string;
}