import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TuningState {
    cents: number;
}

export interface KeyboardState {
    activeNotes: number[];
    tunings: Record<number, TuningState>;
    baseOctave: number;
    isInitialized: boolean;
}

export type KeyboardActionTypes =
    | 'keyboard/initializeAudio'
    | 'keyboard/noteOn'
    | 'keyboard/noteOff'
    | 'keyboard/setTuning'
    | 'keyboard/clearTuning'
    | 'keyboard/resetTunings'
    | 'keyboard/cleanup';

const initialState: KeyboardState = {
    activeNotes: [],
    tunings: {},
    baseOctave: 4,  // Middle C octave
    isInitialized: false
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

export default keyboardSlice.reducer;