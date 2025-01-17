import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TuningState {
    cents: number;
}

export type SynthMode = 'tunable' | 'birdsong' | 'drums';

export interface KeyboardState {
    activeNotes: number[];
    tunings: Record<number, TuningState>;
    baseOctave: number;
    isInitialized: boolean;
    mode: SynthMode;
}

export type KeyboardActionTypes =
    | 'keyboard/initializeAudio'
    | 'keyboard/noteOn'
    | 'keyboard/noteOff'
    | 'keyboard/setTuning'
    | 'keyboard/clearTuning'
    | 'keyboard/resetTunings'
    | 'keyboard/setMode'
    | 'keyboard/cleanup';

const initialState: KeyboardState = {
    activeNotes: [],
    tunings: {},
    baseOctave: 4,  // Middle C octave
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

        setTuning: (state, action: PayloadAction<{ note: number; cents: number }>) => {
            const { note, cents } = action.payload;
            state.tunings[note] = { cents };
        },

        clearTuning: (state, action: PayloadAction<number>) => {
            const note = action.payload;
            delete state.tunings[note];
        },

        resetTunings: (state) => {
            state.tunings = {};
        },

        setMode: (state, action: PayloadAction<SynthMode>) => {
            state.mode = action.payload;
            // Reset active notes when changing modes
            state.activeNotes = [];
        },

        cleanup: (state) => {
            state.activeNotes = [];
            state.isInitialized = false;
        }
    }
});

export const {
    initializeAudio,
    noteOn,
    noteOff,
    setTuning,
    clearTuning,
    resetTunings,
    setMode,
    cleanup
} = keyboardSlice.actions;

// Selectors
export const selectActiveNotes = (state: { keyboard: KeyboardState }) =>
    state.keyboard.activeNotes;

export const selectTuning = (state: { keyboard: KeyboardState }, note: number) =>
    state.keyboard.tunings[note]?.cents ?? 0;

export const selectIsInitialized = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isInitialized;

export const selectBaseOctave = (state: { keyboard: KeyboardState }) =>
    state.keyboard.baseOctave;

export const selectMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.mode;

export default keyboardSlice.reducer;