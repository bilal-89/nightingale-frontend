// Basic audio types
import {DrumSound} from "../../../audio/types/drumTypes.ts";

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type BiquadFilterType = 'lowpass' | 'highpass' | 'bandpass';
export type SynthMode = 'tunable' | 'drums';

// Synthesis parameters and configuration
export interface EnvelopeParams {
    attack: number;   // seconds
    decay: number;    // seconds
    sustain: number;  // ratio (0-1)
    release: number;  // seconds
}

export interface FilterParams {
    cutoff: number;    // Hz
    resonance: number; // Q value
}

export interface VoiceParams {
    tuning: number;
    note: number;
    velocity: number;
    envelope: EnvelopeParams;
    filter: FilterParams;
    waveform: OscillatorType;
}

// Voice types for both keyboard and drums
export interface Voice {
    id: string;
    oscillator: OscillatorNode;
    filterNode: BiquadFilterNode;
    gainNode: GainNode;
    baseFrequency: number;
    currentTuning: number;
    currentVelocity: number;
    startTime: number;
    noteStartTime: number;
    envelope: EnvelopeParams;
    waveform: OscillatorType;
    filter: FilterParams;
}

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

export interface DrumVoice {
    id: string;
    type: DrumType;
    nodes: AudioNode[];
    startTime: number;
    duration: number;
}


// Synthesis and note event types
export interface SynthesisParameters {
    mode: SynthMode;
    waveform: OscillatorType;
    envelope: EnvelopeParams;
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

// Keyboard parameter types
export interface Parameter {
    value: number;
    defaultValue: number;
}

export interface KeyParameters {
    tuning: Parameter;
    velocity: Parameter;
    attack: Parameter;
    decay: Parameter;
    sustain: Parameter;
    release: Parameter;
    filterCutoff: Parameter;
    filterResonance: Parameter;
    waveform?: OscillatorType;
}

// Drum sounds mapping
export const DRUM_SOUNDS: Record<number, DrumSound> = {
    60: { type: '808_low', baseFreq: 60, label: '808', color: '#ece4e4' },
    61: { type: '808_mid', baseFreq: 80, label: '808', color: '#ece4e4' },
    62: { type: 'hihat_closed', baseFreq: 2000, label: 'HH', color: '#ece4e4' },
    63: { type: 'hihat_open', baseFreq: 2000, label: 'OH', color: '#ece4e4' },
    64: { type: 'rimshot', baseFreq: 1000, label: 'Rim', color: '#ece4e4' },
    65: { type: 'crash', baseFreq: 3000, label: 'Crash', color: '#ece4e4' },
    66: { type: 'conga_low', baseFreq: 200, label: 'Conga', color: '#ece4e4' },
    67: { type: 'conga_mid', baseFreq: 300, label: 'Conga', color: '#ece4e4' },
    68: { type: 'conga_high', baseFreq: 400, label: 'Conga', color: '#ece4e4' },
    69: { type: 'bongo_low', baseFreq: 500, label: 'Bongo', color: '#ece4e4' },
    70: { type: 'bongo_high', baseFreq: 600, label: 'Bongo', color: '#ece4e4' },
    71: { type: 'cowbell', baseFreq: 800, label: 'Bell', color: '#ece4e4' }
};
