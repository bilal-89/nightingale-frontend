import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { PlaybackState, LoopRegion, SchedulingConfig } from '../../types/playback';

// Helper to convert percentage to milliseconds
const percentToMs = (percent: number, totalDuration: number) => {
    return Math.floor(percent * totalDuration);
};

// Helper to convert milliseconds to percentage
const msToPercent = (ms: number, totalDuration: number) => {
    return ms / totalDuration;
};

interface PlaybackSliceState {
    isPlaying: boolean;
    currentTime: number;         // In milliseconds
    tempo: number;
    totalDuration: number;       // Total duration in milliseconds

    // Loop configuration
    loopRegion?: LoopRegion;    // Using existing LoopRegion type
    loopEnabled: boolean;
    isSettingLoopPoints: boolean;// Track if we're in loop point setting mode
    temporaryLoopStart?: number; // For storing first click position

    schedulingConfig: SchedulingConfig;
    metronomeEnabled: boolean;
    countInEnabled: boolean;
    prerollBars: number;
}

const initialState: PlaybackSliceState = {
    isPlaying: false,
    currentTime: 0,
    tempo: 120,
    totalDuration: 4 * 60 * 1000, // Default 4 bars at 120bpm = 8000ms
    loopEnabled: false,
    isSettingLoopPoints: false,
    schedulingConfig: {
        scheduleAheadTime: 0.1,
        schedulerInterval: 25
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
        },

        stopPlayback: (state) => {
            state.isPlaying = false;
        },

        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            const newTime = action.payload;

            if (state.loopEnabled && state.loopRegion) {
                if (newTime >= state.loopRegion.end) {
                    state.currentTime = state.loopRegion.start;
                } else {
                    state.currentTime = newTime;
                }
            } else {
                state.currentTime = newTime;
            }
        },

        setPlaybackPosition: (state, action: PayloadAction<number>) => {
            state.currentTime = Math.max(0, action.payload);
        },

        // New action for handling continuous loop point setting
        startSettingLoopPoints: (state) => {
            state.isSettingLoopPoints = true;
            state.temporaryLoopStart = undefined;
            state.loopRegion = undefined;
            state.loopEnabled = false;
        },

        // Handle first click of loop point setting
        setTemporaryLoopStart: (state, action: PayloadAction<number>) => {
            const position = percentToMs(action.payload, state.totalDuration);
            state.temporaryLoopStart = position;
        },

        // Handle second click and finalize loop points
        finalizeLoopPoints: (state, action: PayloadAction<number>) => {
            if (state.temporaryLoopStart !== undefined) {
                const endPosition = percentToMs(action.payload, state.totalDuration);
                const startPosition = state.temporaryLoopStart;

                // Ensure start is before end
                const start = Math.min(startPosition, endPosition);
                const end = Math.max(startPosition, endPosition);

                state.loopRegion = { start, end };
                state.loopEnabled = true;
                state.isSettingLoopPoints = false;
                state.temporaryLoopStart = undefined;
            }
        },

        // Update loop points through drag operations
        updateLoopPoints: (state, action: PayloadAction<{ start?: number; end?: number }>) => {
            if (!state.loopRegion) return;

            const { start, end } = action.payload;
            if (start !== undefined) {
                const startMs = percentToMs(start, state.totalDuration);
                if (startMs < state.loopRegion.end) {
                    state.loopRegion.start = startMs;
                }
            }
            if (end !== undefined) {
                const endMs = percentToMs(end, state.totalDuration);
                if (endMs > state.loopRegion.start) {
                    state.loopRegion.end = endMs;
                }
            }
        },

        clearLoopPoints: (state) => {
            state.loopRegion = undefined;
            state.loopEnabled = false;
            state.isSettingLoopPoints = false;
            state.temporaryLoopStart = undefined;
        },

        toggleLoopEnabled: (state) => {
            if (state.loopRegion) {
                state.loopEnabled = !state.loopEnabled;
            }
        },

        setTempo: (state, action: PayloadAction<number>) => {
            state.tempo = Math.max(20, Math.min(300, action.payload));
            // Update total duration based on new tempo
            state.totalDuration = (4 * 60 * 1000 * 120) / state.tempo;
        },

        setTotalDuration: (state, action: PayloadAction<number>) => {
            state.totalDuration = action.payload;
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

// Export actions
export const {
    startPlayback,
    stopPlayback,
    updatePlaybackPosition,
    setPlaybackPosition,
    startSettingLoopPoints,
    setTemporaryLoopStart,
    finalizeLoopPoints,
    updateLoopPoints,
    clearLoopPoints,
    toggleLoopEnabled,
    setTempo,
    setTotalDuration,
    updateSchedulingConfig,
    toggleMetronome,
    toggleCountIn,
    setPrerollBars
} = playbackSlice.actions;

// Enhanced selectors
export const selectIsPlaying = (state: RootState) => state.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.playback.currentTime;
export const selectTempo = (state: RootState) => state.playback.tempo;
export const selectLoopRegion = (state: RootState) => state.playback.loopRegion;
export const selectIsLoopEnabled = (state: RootState) => state.playback.loopEnabled;
export const selectIsSettingLoopPoints = (state: RootState) => state.playback.isSettingLoopPoints;
export const selectTemporaryLoopStart = (state: RootState) => state.playback.temporaryLoopStart;

// New selector for converting loop points to percentages
export const selectLoopRegionAsPercentages = (state: RootState) => {
    if (!state.playback.loopRegion) return undefined;
    const { start, end } = state.playback.loopRegion;
    return {
        start: msToPercent(start, state.playback.totalDuration),
        end: msToPercent(end, state.playback.totalDuration)
    };
};

export const selectPlaybackState = (state: RootState): PlaybackState => ({
    isPlaying: state.playback.isPlaying,
    currentTime: state.playback.currentTime,
    tempo: state.playback.tempo,
    loopRegion: state.playback.loopEnabled ? state.playback.loopRegion : undefined
});

export default playbackSlice.reducer;