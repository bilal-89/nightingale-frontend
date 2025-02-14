export interface SynthesisParameters {
    mode: 'tunable' | 'drums';
    waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
    envelope: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    };
    gain: number;
    tuning?: number;
    effects?: {
        filter?: {
            type: 'lowpass';
            frequency: number;
            Q: number;
        };
    };
} 