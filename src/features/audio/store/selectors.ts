// src/features/audio/store/selectors.ts

import { RootState } from '../../../store';
import type { KeyParameters } from './slice';

// Basic state selectors
export const selectAudioState = (state: RootState) => state.audio;
export const selectIsAudioInitialized = (state: RootState) => state.audio.isInitialized;
export const selectAudioContext = (state: RootState) => state.audio.context;
export const selectAudioMode = (state: RootState) => state.audio.mode;

// Waveform selectors
export const selectGlobalWaveform = (state: RootState) => state.audio.globalWaveform;
export const selectKeyWaveform = (state: RootState, keyNumber: number) =>
    state.audio.keyWaveforms[keyNumber] ?? state.audio.globalWaveform;

// Parameter selectors
export const selectKeyParameters = (state: RootState, keyNumber: number) =>
    state.audio.keyParameters[keyNumber];

export const selectKeyParameter = (
    state: RootState,
    keyNumber: number,
    parameter: keyof KeyParameters
) => state.audio.keyParameters[keyNumber]?.[parameter];

// Specialized selectors for common parameters
export const selectKeyTuning = (state: RootState, keyNumber: number) =>
    selectKeyParameter(state, keyNumber, 'tuning') ?? 0;

export const selectKeyVelocity = (state: RootState, keyNumber: number) =>
    selectKeyParameter(state, keyNumber, 'velocity') ?? 100;

export const selectKeyEnvelope = (state: RootState, keyNumber: number) => ({
    attack: selectKeyParameter(state, keyNumber, 'attack') ?? 50,
    decay: selectKeyParameter(state, keyNumber, 'decay') ?? 100,
    sustain: selectKeyParameter(state, keyNumber, 'sustain') ?? 70,
    release: selectKeyParameter(state, keyNumber, 'release') ?? 150
});

export const selectKeyFilter = (state: RootState, keyNumber: number) => ({
    cutoff: selectKeyParameter(state, keyNumber, 'filterCutoff') ?? 20000,
    resonance: selectKeyParameter(state, keyNumber, 'filterResonance') ?? 0.707
});

// Memoized selector for active keys with non-default parameters
export const selectKeysWithCustomParameters = (state: RootState) =>
    Object.keys(state.audio.keyParameters)
        .filter(key => Object.keys(state.audio.keyParameters[Number(key)]).length > 0)
        .map(Number);