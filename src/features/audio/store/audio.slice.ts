import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SynthMode } from '../types';

interface AudioState {
    isInitialized: boolean;
    mode: SynthMode;
    mainVolume: number;
}

const initialState: AudioState = {
    isInitialized: false,
    mode: 'tunable',
    mainVolume: 0.7
};

const audioSlice = createSlice({
    name: 'audio',
    initialState,
    reducers: {
        initialized: (state) => {
            state.isInitialized = true;
        },
        setMode: (state, action: PayloadAction<SynthMode>) => {
            state.mode = action.payload;
        },
        setMainVolume: (state, action: PayloadAction<number>) => {
            state.mainVolume = action.payload;
        },
        cleanup: (state) => {
            state.isInitialized = false;
        }
    }
});

export const { initialized, setMode, setMainVolume, cleanup } = audioSlice.actions;
export default audioSlice.reducer;
