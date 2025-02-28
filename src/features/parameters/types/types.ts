// src/features/parameters/types/types.ts
import { KeyParameters } from '../../keyboard/store/slices/keyboard.slice';

export type ParameterContext = 'keyboard' | 'note';
// Update to include 'unison' in the ParameterGroup type
export type ParameterGroup = 'envelope' | 'note' | 'filter' | 'unison';

// Define base note properties that can be accessed by parameter id
export interface NoteProperties {
    tuning?: number;
    velocity?: number;
    // microTiming?: number;
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

// Add an interface for Unison parameters
export interface UnisonParameters {
    count: number;
    detune: number;
    width: number;
}

export interface SynthesisEffects {
    filter: FilterParameters;
}

// Update NoteSynthesis to include unison
export interface NoteSynthesis {
    envelope: EnvelopeParameters;
    effects: SynthesisEffects;
    unison?: UnisonParameters;  // Make it optional since not all notes might have it
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
    return ['tuning', 'velocity'].includes(id);
};

// Update to include unison parameters
export const isValidParameterId = (id: string): id is keyof KeyParameters => {
    return [
        'tuning', 'velocity',
        'attack', 'decay', 'sustain', 'release',
        'filterCutoff', 'filterResonance',
        'unisonCount', 'unisonDetune', 'unisonWidth'
    ].includes(id);
};

export const isEnvelopeParam = (id: string): id is keyof EnvelopeParameters => {
    return ['attack', 'decay', 'sustain', 'release'].includes(id);
};

// Add a helper function for unison parameters
export const isUnisonParam = (id: string): id is keyof UnisonParameters => {
    // Map from UI parameter IDs to internal property names
    const mapping: Record<string, keyof UnisonParameters> = {
        'unisonCount': 'count',
        'unisonDetune': 'detune',
        'unisonWidth': 'width'
    };
    
    return id in mapping;
};

// Add a helper function to convert UI parameter IDs to internal property names
export const mapUnisonParamToProperty = (id: string): keyof UnisonParameters | undefined => {
    const mapping: Record<string, keyof UnisonParameters> = {
        'unisonCount': 'count',
        'unisonDetune': 'detune',
        'unisonWidth': 'width'
    };
    
    return mapping[id];
};