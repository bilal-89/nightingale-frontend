// src/features/player/state/slices/playback.slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { PlaybackState, LoopRegion, SchedulingConfig } from '../../types/playback';

interface PlaybackSliceState {
    // Core playback state
    isPlaying: boolean;
    currentTime: number;         // Now stored in milliseconds for continuous timing
    tempo: number;

    // Loop region configuration (also in milliseconds)
    loopRegion?: LoopRegion;
    loopEnabled: boolean;

    // Scheduling configuration for stable audio playback
    schedulingConfig: SchedulingConfig;

    // Additional playback features
    metronomeEnabled: boolean;
    countInEnabled: boolean;
    prerollBars: number;
}

const initialState: PlaybackSliceState = {
    isPlaying: false,
    currentTime: 0,
    tempo: 120,
    loopEnabled: false,
    schedulingConfig: {
        scheduleAheadTime: 0.1,  // 100ms look-ahead for stability
        schedulerInterval: 25     // Update scheduler every 25ms
    },
    metronomeEnabled: false,
    countInEnabled: false,
    prerollBars: 1
};

const playbackSlice = createSlice({
    name: 'playback',
    initialState,
    reducers: {
        startPlayback: (state) => {
            state.isPlaying = true;
            // console.log('Playback started at:', state.currentTime);
        },

        stopPlayback: (state) => {
            state.isPlaying = false;
            // console.log('Playback stopped at:', state.currentTime);
        },

        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            // Update position with millisecond precision
            const newTime = action.payload;

            // Handle loop points if enabled
            if (state.loopEnabled && state.loopRegion) {
                if (newTime >= state.loopRegion.end) {
                    state.currentTime = state.loopRegion.start;
                    // console.log('Loop point reached, resetting to:', state.currentTime);
                } else {
                    state.currentTime = newTime;
                }
            } else {
                state.currentTime = newTime;
            }

            // Log for debugging timing issues
            // console.log('Position updated:', {
            //     time: state.currentTime,
            //     isPlaying: state.isPlaying,
            //     loopActive: state.loopEnabled && state.loopRegion
            // });
        },

        setPlaybackPosition: (state, action: PayloadAction<number>) => {
            state.currentTime = Math.max(0, action.payload);
            console.log('Position manually set to:', state.currentTime);
        },

        setTempo: (state, action: PayloadAction<number>) => {
            state.tempo = Math.max(20, Math.min(300, action.payload));
        },

        setLoopRegion: (state, action: PayloadAction<LoopRegion>) => {
            state.loopRegion = action.payload;
            state.loopEnabled = true;
            console.log('Loop region set:', action.payload);
        },

        clearLoopRegion: (state) => {
            state.loopRegion = undefined;
            state.loopEnabled = false;
        },

        toggleLoopEnabled: (state) => {
            if (state.loopRegion) {
                state.loopEnabled = !state.loopEnabled;
            }
        },

        updateSchedulingConfig: (state, action: PayloadAction<Partial<SchedulingConfig>>) => {
            state.schedulingConfig = {
                ...state.schedulingConfig,
                ...action.payload
            };
        },

        toggleMetronome: (state) => {
            state.metronomeEnabled = !state.metronomeEnabled;
        },

        toggleCountIn: (state) => {
            state.countInEnabled = !state.countInEnabled;
        },

        setPrerollBars: (state, action: PayloadAction<number>) => {
            state.prerollBars = Math.max(0, Math.min(4, action.payload));
        }
    }
});

// Export all actions
export const {
    startPlayback,
    stopPlayback,
    updatePlaybackPosition,
    setPlaybackPosition,
    setTempo,
    setLoopRegion,
    clearLoopRegion,
    toggleLoopEnabled,
    updateSchedulingConfig,
    toggleMetronome,
    toggleCountIn,
    setPrerollBars
} = playbackSlice.actions;

// Export selectors with proper time unit handling
export const selectIsPlaying = (state: RootState) => state.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.playback.currentTime;
export const selectTempo = (state: RootState) => state.playback.tempo;
export const selectLoopRegion = (state: RootState) => state.playback.loopRegion;
export const selectIsLoopEnabled = (state: RootState) => state.playback.loopEnabled;
export const selectSchedulingConfig = (state: RootState) => state.playback.schedulingConfig;
export const selectMetronomeEnabled = (state: RootState) => state.playback.metronomeEnabled;
export const selectCountInEnabled = (state: RootState) => state.playback.countInEnabled;
export const selectPrerollBars = (state: RootState) => state.playback.prerollBars;

// Combined playback state selector
export const selectPlaybackState = (state: RootState): PlaybackState => ({
    isPlaying: state.playback.isPlaying,
    currentTime: state.playback.currentTime,
    tempo: state.playback.tempo,
    loopRegion: state.playback.loopEnabled ? state.playback.loopRegion : undefined
});

export default playbackSlice.reducer;