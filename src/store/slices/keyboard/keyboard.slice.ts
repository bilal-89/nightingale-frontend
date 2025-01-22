import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the structure for a single parameter
export interface Parameter {
    value: number;
    defaultValue: number;
}

// Define the structure for all parameters of a key
export interface KeyParameters {
    // Core parameters
    tuning: Parameter;
    velocity: Parameter;
    warbleRate: Parameter;
    warbleDepth: Parameter;

    // ADSR envelope parameters
    attack: Parameter;
    decay: Parameter;
    sustain: Parameter;
    release: Parameter;
}

export type SynthMode = 'tunable' | 'drums';

export interface KeyboardState {
    activeNotes: number[];
    selectedKey: number | null;  // Tracks which key's parameters are being shown
    keyParameters: Record<number, Partial<KeyParameters>>;
    baseOctave: number;
    isInitialized: boolean;
    mode: SynthMode;
    isParameterPanelVisible: boolean;  // Rename from isPanelVisible
}

const defaultParameters: KeyParameters = {
    tuning: { value: 0, defaultValue: 0 },
    velocity: { value: 100, defaultValue: 100 },
    warbleRate: { value: 5, defaultValue: 5 },
    warbleDepth: { value: 30, defaultValue: 30 },
    attack: { value: 50, defaultValue: 50 },
    decay: { value: 100, defaultValue: 100 },
    sustain: { value: 70, defaultValue: 70 },
    release: { value: 150, defaultValue: 150 }
};

const initialState: KeyboardState = {
    activeNotes: [],
    selectedKey: null,
    keyParameters: {},
    baseOctave: 4,
    isInitialized: false,
    mode: 'tunable',
    isParameterPanelVisible: false
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
                // If panel is visible, update the selected key
                if (state.isPanelVisible) {
                    state.selectedKey = note;
                }
            }
        },

        noteOff: (state, action: PayloadAction<number>) => {
            const note = action.payload;
            state.activeNotes = state.activeNotes.filter(n => n !== note);
        },

        togglePanel: (state) => {
            state.isPanelVisible = !state.isPanelVisible;
            // If hiding panel, clear selected key
            if (!state.isPanelVisible) {
                state.selectedKey = null;
            }
        },

        setKeyParameter: (state, action: PayloadAction<{
            keyNumber: number;
            parameter: keyof KeyParameters;
            value: number;
        }>) => {
            const { keyNumber, parameter, value } = action.payload;

            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }

            if (!state.keyParameters[keyNumber][parameter]) {
                state.keyParameters[keyNumber][parameter] = {
                    value: defaultParameters[parameter].defaultValue,
                    defaultValue: defaultParameters[parameter].defaultValue
                };
            }

            state.keyParameters[keyNumber][parameter]!.value = value;
        },

        resetKeyParameters: (state, action: PayloadAction<number>) => {
            const keyNumber = action.payload;
            delete state.keyParameters[keyNumber];
            if (state.selectedKey === keyNumber) {
                state.selectedKey = null;
            }
        },

        resetAllParameters: (state) => {
            state.keyParameters = {};
            state.selectedKey = null;
        },

        setMode: (state, action: PayloadAction<SynthMode>) => {
            state.mode = action.payload;
            state.activeNotes = [];
            state.selectedKey = null;
        },

        cleanup: (state) => {
            state.activeNotes = [];
            state.isInitialized = false;
            state.selectedKey = null;
            state.isPanelVisible = false;
        }
    }
});

export const {
    initializeAudio,
    noteOn,
    noteOff,
    togglePanel,
    setKeyParameter,
    resetKeyParameters,
    resetAllParameters,
    setMode,
    cleanup
} = keyboardSlice.actions;

// Selectors
export const selectActiveNotes = (state: { keyboard: KeyboardState }) =>
    state.keyboard.activeNotes;

export const selectSelectedKey = (state: { keyboard: KeyboardState }) =>
    state.keyboard.selectedKey;

export const selectIsPanelVisible = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isPanelVisible;

export const selectKeyParameters = (state: { keyboard: KeyboardState }, keyNumber: number) =>
    state.keyboard.keyParameters[keyNumber] ?? {};

export const selectParameter = (
    state: { keyboard: KeyboardState },
    keyNumber: number,
    parameter: keyof KeyParameters
) => state.keyboard.keyParameters[keyNumber]?.[parameter]?.value ??
    defaultParameters[parameter].defaultValue;

export const selectIsInitialized = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isInitialized;

export const selectBaseOctave = (state: { keyboard: KeyboardState }) =>
    state.keyboard.baseOctave;

export const selectMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.mode;

export default keyboardSlice.reducer;