/**
 * Basic waveform types available for synthesizers
 */
export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

/**
 * Parameter types that can be adjusted for oscillators
 */
export type ParameterType = 
  | 'tuning'           // cents (-100 to +100)
  | 'velocity'         // MIDI velocity (0-127)
  | 'filterCutoff'     // Hz (20-20000)
  | 'filterResonance'  // Q factor (0.1-20)
  | 'attack'           // seconds (0-2)
  | 'decay'            // seconds (0-2) 
  | 'sustain'          // level (0-1)
  | 'release';         // seconds (0-5)

/**
 * Envelope parameters for shaping sound over time
 */
export interface EnvelopeParameters {
  attack?: number;    // seconds
  decay?: number;     // seconds
  sustain?: number;   // 0-1 value
  release?: number;   // seconds
}

/**
 * Filter parameters for tone shaping
 */
export interface FilterParameters {
  frequency?: number;  // Hz
  Q?: number;          // resonance
  type?: BiquadFilterType;
}

/**
 * Unison parameters for creating width/depth
 */
export interface UnisonParameters {
  count?: number;    // Number of voices
  detune?: number;   // Cents
  width?: number;    // Pan width (0-100)
}

/**
 * Complete synthesis parameters for a note
 */
export interface SynthesisParameters {
  mode?: 'tunable' | 'drums' | 'sampler';
  waveform?: Waveform;
  envelope?: EnvelopeParameters;
  filter?: FilterParameters;
  unison?: UnisonParameters;
  gain?: number;     // Overall gain (0-1)
  harmonics?: number[]; // Amplitudes for harmonics
} 