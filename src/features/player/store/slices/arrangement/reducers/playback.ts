// src/features/player/store/slices/arrangement/reducers/playback.ts
import { PayloadAction } from '@reduxjs/toolkit';
import type { ArrangementState } from '../types.ts';

// Helper function for playback
const getArrangementEndTime = (state: ArrangementState): number => {
    if (state.clips.length === 0) return 0;
    return Math.max(...state.clips.map(clip => clip.startCell + clip.length)) * (60 / state.tempo);
};

export const playbackReducers = {
    startPlayback: (state: ArrangementState) => {
        state.playback.isPlaying = true;
        if (state.playback.currentTime >= getArrangementEndTime(state)) {
            state.playback.currentTime = state.playback.loopRegion?.start || 0;
        }
    },

    stopPlayback: (state: ArrangementState) => {
        state.playback.isPlaying = false;
    },

    updatePlaybackPosition: (state: ArrangementState, action: PayloadAction<number>) => {
        state.playback.currentTime = action.payload;
        if (state.playback.loopRegion) {
            const { start, end } = state.playback.loopRegion;
            if (state.playback.currentTime >= end) {
                state.playback.currentTime = start;
            }
        }
    },

    setPlaybackPosition: (state: ArrangementState, action: PayloadAction<number>) => {
        state.playback.currentTime = action.payload;
    },

    setLoopRegion: (state: ArrangementState, action: PayloadAction<{ start: number; end: number } | undefined>) => {
        state.playback.loopRegion = action.payload;

        if (state.playback.isPlaying && action.payload) {
            if (state.playback.currentTime < action.payload.start ||
                state.playback.currentTime >= action.payload.end) {
                state.playback.currentTime = action.payload.start;
            }
        }
    },

    clearLoopRegion: (state: ArrangementState) => {
        state.playback.loopRegion = undefined;
    }
};