import { KeyParameters } from '../../../store/slices/keyboard/keyboard.slice';

export type ParameterContext = 'keyboard' | 'note';
export type ParameterGroup = 'envelope' | 'note' | 'filter';

// Define base note properties that can be accessed by parameter id
export interface NoteProperties {
    tuning?: number;
    velocity?: number;
    microTiming?: number;
    // Add other parameters as needed
}

export interface EnvelopeParameters {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
}

export interface FilterParameters {
    frequency: number;
    Q: number;
}

export interface SynthesisEffects {
    filter: FilterParameters;
}

export interface NoteSynthesis {
    envelope: EnvelopeParameters;
    effects: SynthesisEffects;
}

// Now NoteEvent includes both synthesis data and parameter properties
export interface NoteEvent extends NoteProperties {
    id: string;
    note: number;
    synthesis: NoteSynthesis;
}

// Define the keyboard parameter value structure
export interface ParameterValue {
    value: number;
    // Add other properties as needed
}

// Define the structure for key parameters
export interface KeyParameterState {
    [key: string]: ParameterValue;
}

export interface Parameter {
    id: string;
    name: string;
    min: number;
    max: number;
    step: number;
    unit?: string;
    defaultValue: number;
    contexts: ParameterContext[];
    extraControls?: boolean;
    group?: ParameterGroup;
}

// Helper function to check if a property exists on NoteProperties
export const isNoteProperty = (id: string): id is keyof NoteProperties => {
    return ['tuning', 'velocity', 'microTiming'].includes(id);
};

export const isValidParameterId = (id: string): id is keyof KeyParameters => {
    return ['tuning', 'velocity', 'attack', 'decay', 'sustain', 'release', 'filterCutoff', 'filterResonance'].includes(id);
};

export const isEnvelopeParam = (id: string): id is keyof EnvelopeParameters => {
    return ['attack', 'decay', 'sustain', 'release'].includes(id);
};