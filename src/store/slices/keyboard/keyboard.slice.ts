import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the structure for a single parameter
export interface Parameter {
    value: number;
    defaultValue: number;
}

// Define the structure for all parameters of a key
export interface KeyParameters {
    tuning: Parameter;
    velocity: Parameter;
    warbleRate: Parameter;
    warbleDepth: Parameter;
}

export type SynthMode = 'tunable' | 'drums';

export interface KeyboardState {
    activeNotes: number[];
    selectedKey: number | null;  // New field to track selected key
    keyParameters: Record<number, Partial<KeyParameters>>;  // New flexible parameter storage
    baseOctave: number;
    isInitialized: boolean;
    mode: SynthMode;
    // We'll keep the old tunings field for TypeScript but won't use it directly
    tunings: Record<number, { cents: number }>;
}

const defaultParameters: KeyParameters = {
    tuning: { value: 0, defaultValue: 0 },
    velocity: { value: 100, defaultValue: 100 },
    warbleRate: { value: 5, defaultValue: 5 },
    warbleDepth: { value: 30, defaultValue: 30 }
};

const initialState: KeyboardState = {
    activeNotes: [],
    selectedKey: null,
    keyParameters: {},
    baseOctave: 4,
    isInitialized: false,
    mode: 'tunable'
};

const keyboardSlice = createSlice({
    name: 'keyboard',
    initialState,
    reducers: {
        initializeAudio: (state) => {
            state.isInitialized = true;
        },

        noteOn: (state, action: PayloadAction<number>) => {
            const note = action.payload;
            if (!state.activeNotes.includes(note)) {
                state.activeNotes.push(note);
            }
        },

        noteOff: (state, action: PayloadAction<number>) => {
            const note = action.payload;
            state.activeNotes = state.activeNotes.filter(n => n !== note);
        },

        selectKey: (state, action: PayloadAction<number | null>) => {
            state.selectedKey = action.payload;
        },

        // New action for setting any parameter
        setKeyParameter: (state, action: PayloadAction<{
            keyNumber: number;
            parameter: keyof KeyParameters;
            value: number;
        }>) => {
            const { keyNumber, parameter, value } = action.payload;

            // Initialize parameters for this key if they don't exist
            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }

            // Initialize this parameter if it doesn't exist
            if (!state.keyParameters[keyNumber][parameter]) {
                state.keyParameters[keyNumber][parameter] = {
                    value: defaultParameters[parameter].defaultValue,
                    defaultValue: defaultParameters[parameter].defaultValue
                };
            }

            // Update the value
            state.keyParameters[keyNumber][parameter]!.value = value;
        },

        // For backward compatibility with existing tuning system
        setTuning: (state, action: PayloadAction<{ note: number; cents: number }>) => {
            const { note, cents } = action.payload;
            if (!state.keyParameters[note]) {
                state.keyParameters[note] = {};
            }
            state.keyParameters[note].tuning = {
                value: cents,
                defaultValue: 0
            };
        },

        resetKeyParameters: (state, action: PayloadAction<number>) => {
            const keyNumber = action.payload;
            delete state.keyParameters[keyNumber];
        },

        resetAllParameters: (state) => {
            state.keyParameters = {};
        },

        setMode: (state, action: PayloadAction<SynthMode>) => {
            state.mode = action.payload;
            state.activeNotes = [];
        },

        cleanup: (state) => {
            state.activeNotes = [];
            state.isInitialized = false;
            state.selectedKey = null;
        }
    }
});

export const {
    initializeAudio,
    noteOn,
    noteOff,
    selectKey,
    setKeyParameter,
    setTuning,
    resetKeyParameters,
    resetAllParameters,
    setMode,
    cleanup
} = keyboardSlice.actions;

// Updated selectors
export const selectActiveNotes = (state: { keyboard: KeyboardState }) =>
    state.keyboard.activeNotes;

export const selectSelectedKey = (state: { keyboard: KeyboardState }) =>
    state.keyboard.selectedKey;

export const selectKeyParameters = (state: { keyboard: KeyboardState }, keyNumber: number) =>
    state.keyboard.keyParameters[keyNumber] ?? {};

export const selectParameter = (
    state: { keyboard: KeyboardState },
    keyNumber: number,
    parameter: keyof KeyParameters
) => state.keyboard.keyParameters[keyNumber]?.[parameter]?.value ?? defaultParameters[parameter].defaultValue;

export const selectIsInitialized = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isInitialized;

export const selectBaseOctave = (state: { keyboard: KeyboardState }) =>
    state.keyboard.baseOctave;

export const selectMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.mode;

// Add back the selectTuning selector for compatibility
export const selectTuning = (state: { keyboard: KeyboardState }, note: number) =>
    state.keyboard.keyParameters[note]?.tuning?.value ?? 0;

export default keyboardSlice.reducer;