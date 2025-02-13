// src/features/audio/store/slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Waveform } from '../../keyboard/store/slices/keyboard.slice';

// Define parameter types
interface KeyParameters {
    tuning?: number;
    velocity?: number;
    filterCutoff?: number;
    filterResonance?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
}

// Define the state structure
interface AudioState {
    isInitialized: boolean;
    mode: 'tunable' | 'drums';
    globalWaveform: Waveform;
    keyWaveforms: Record<number, Waveform>;
    keyParameters: Record<number, KeyParameters>;
    context: AudioContext | null;
}

// Initial state
const initialState: AudioState = {
    isInitialized: false,
    mode: 'tunable',
    globalWaveform: 'sine',
    keyWaveforms: {},
    keyParameters: {},
    context: null
};

// Create the slice
const audioSlice = createSlice({
    name: 'audio',
    initialState,
    reducers: {
        initializeAudio: (state) => {
            state.isInitialized = true;
        },
        cleanup: (state) => {
            state.isInitialized = false;
            state.context = null;
        },
        setContext: (state, action: PayloadAction<AudioContext>) => {
            state.context = action.payload;
        },
        setMode: (state, action: PayloadAction<'tunable' | 'drums'>) => {
            state.mode = action.payload;
        },
        setGlobalWaveform: (state, action: PayloadAction<Waveform>) => {
            state.globalWaveform = action.payload;
        },
        setKeyWaveform: (state, action: PayloadAction<{ keyNumber: number; waveform: Waveform }>) => {
            const { keyNumber, waveform } = action.payload;
            state.keyWaveforms[keyNumber] = waveform;
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
            state.keyParameters[keyNumber][parameter] = value;
        },
        resetKeyParameters: (state, action: PayloadAction<number>) => {
            const keyNumber = action.payload;
            delete state.keyParameters[keyNumber];
        },
        resetAllParameters: (state) => {
            state.keyParameters = {};
            state.keyWaveforms = {};
            state.globalWaveform = 'sine';
        }
    }
});

// Export actions and reducer
export const {
    initializeAudio,
    cleanup,
    setContext,
    setMode,
    setGlobalWaveform,
    setKeyWaveform,
    setKeyParameter,
    resetKeyParameters,
    resetAllParameters
} = audioSlice.actions;

export default audioSlice.reducer;

// Export types
export type { AudioState, KeyParameters };