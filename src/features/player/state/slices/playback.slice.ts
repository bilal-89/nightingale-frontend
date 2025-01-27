// src/features/player/state/slices/playback.slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { PlaybackState, LoopRegion, SchedulingConfig } from '../../types/playback';

// The complete state interface for our playback functionality, combining
// both musical timing and playback system configuration
interface PlaybackSliceState {
    // Core playback state
    isPlaying: boolean;          // Whether playback is currently active
    currentTime: number;         // Current playback position in seconds
    tempo: number;              // Tempo in beats per minute (BPM)

    // Loop region configuration
    loopRegion?: LoopRegion;    // Optional loop start/end points
    loopEnabled: boolean;        // Whether looping is active

    // Scheduling configuration - controls how far ahead we schedule audio events
    schedulingConfig: SchedulingConfig;

    // Additional playback settings for musician-friendly features
    metronomeEnabled: boolean;   // Whether metronome is active
    countInEnabled: boolean;     // Whether count-in is enabled
    prerollBars: number;         // Number of bars for count-in
}

// Initialize our state with sensible defaults for music production
const initialState: PlaybackSliceState = {
    isPlaying: false,
    currentTime: 0,
    tempo: 120,                 // Default to standard 120 BPM
    loopEnabled: false,
    schedulingConfig: {
        scheduleAheadTime: 0.1,  // Schedule 100ms ahead for stable playback
        schedulerInterval: 25     // Update scheduler every 25ms
    },
    metronomeEnabled: false,
    countInEnabled: false,
    prerollBars: 1
};

// Our playback slice manages all timing and playback-related state changes
const playbackSlice = createSlice({
    name: 'playback',
    initialState,
    reducers: {
        // Basic transport controls that any DAW would have
        startPlayback: (state) => {
            state.isPlaying = true;
        },

        stopPlayback: (state) => {
            state.isPlaying = false;
        },

        // Time management - handles both continuous playback and user-initiated changes
        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            state.currentTime = action.payload;

            // Automatically handle loop points during playback
            if (state.loopEnabled && state.loopRegion) {
                if (state.currentTime >= state.loopRegion.end) {
                    state.currentTime = state.loopRegion.start;
                }
            }
        },

        setPlaybackPosition: (state, action: PayloadAction<number>) => {
            state.currentTime = Math.max(0, action.payload); // Prevent negative time
        },

        // Tempo management with reasonable limits
        setTempo: (state, action: PayloadAction<number>) => {
            state.tempo = Math.max(20, Math.min(300, action.payload)); // Clamp between 20-300 BPM
        },

        // Loop region management - essential for music production workflow
        setLoopRegion: (state, action: PayloadAction<LoopRegion>) => {
            state.loopRegion = action.payload;
            state.loopEnabled = true;  // Enable looping when setting a region
        },

        clearLoopRegion: (state) => {
            state.loopRegion = undefined;
            state.loopEnabled = false;
        },

        toggleLoopEnabled: (state) => {
            // Only toggle if we have a valid loop region
            if (state.loopRegion) {
                state.loopEnabled = !state.loopEnabled;
            }
        },

        // Scheduling configuration - allows fine-tuning of playback engine
        updateSchedulingConfig: (state, action: PayloadAction<Partial<SchedulingConfig>>) => {
            state.schedulingConfig = {
                ...state.schedulingConfig,
                ...action.payload
            };
        },

        // Musician-friendly playback settings
        toggleMetronome: (state) => {
            state.metronomeEnabled = !state.metronomeEnabled;
        },

        toggleCountIn: (state) => {
            state.countInEnabled = !state.countInEnabled;
        },

        setPrerollBars: (state, action: PayloadAction<number>) => {
            state.prerollBars = Math.max(0, Math.min(4, action.payload)); // Limit to 0-4 bars
        }
    }
});

// Export actions for use in components and middleware
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

// Export selectors with descriptive names for clarity
export const selectIsPlaying = (state: RootState) => state.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.playback.currentTime;
export const selectTempo = (state: RootState) => state.playback.tempo;
export const selectLoopRegion = (state: RootState) => state.playback.loopRegion;
export const selectIsLoopEnabled = (state: RootState) => state.playback.loopEnabled;
export const selectSchedulingConfig = (state: RootState) => state.playback.schedulingConfig;
export const selectMetronomeEnabled = (state: RootState) => state.playback.metronomeEnabled;
export const selectCountInEnabled = (state: RootState) => state.playback.countInEnabled;
export const selectPrerollBars = (state: RootState) => state.playback.prerollBars;

// A compound selector that provides the complete playback state in one call
export const selectPlaybackState = (state: RootState): PlaybackState => ({
    isPlaying: state.playback.isPlaying,
    currentTime: state.playback.currentTime,
    tempo: state.playback.tempo,
    loopRegion: state.playback.loopEnabled ? state.playback.loopRegion : undefined
});

export default playbackSlice.reducer;