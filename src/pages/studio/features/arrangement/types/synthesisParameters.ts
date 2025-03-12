export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface EnvelopeParameters {
    attack?: number;  // seconds
    decay?: number;   // seconds
    sustain?: number; // 0-1 value
    release?: number; // seconds
}

export interface FilterParameters {
    frequency?: number; // Hz
    Q?: number;        // resonance
    type?: BiquadFilterType;
}

export interface EffectsParameters {
    filter?: FilterParameters;
    // Add other effects as needed
}

export interface UnisonParameters {
    count?: number;  // Number of voices
    detune?: number; // Cents
    width?: number;  // Pan width (0-100)
}

export interface NoteSynthesis {
    mode?: 'tunable' | 'drums' | 'sampler'; 
    envelope?: EnvelopeParameters;
    effects?: EffectsParameters;
    unison?: UnisonParameters;
}

export interface SynthesisParameters extends NoteSynthesis {
    waveform?: Waveform;
} 