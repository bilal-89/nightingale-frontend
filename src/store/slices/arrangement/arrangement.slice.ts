// src/store/slices/arrangement/arrangement.slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import keyboardAudioManager from "../../../audio/context/keyboard/keyboardAudioManager.ts";
import {SynthesisParameters} from "../../../audio/types/audioTypes.ts";

interface NoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis: SynthesisParameters;  // Add this
}

interface Clip {
    id: string;
    startCell: number;
    length: number;
    track: number;
    isSelected: boolean;
    notes: NoteEvent[];
    parameters: {
        velocity: number;
        pitch: number;
        tuning: number;
    };
}

// New interface for playback state
interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    loopRegion?: {
        start: number;
        end: number;
    };
}

// Updated arrangement state with playback
interface ArrangementState {
    // Existing state
    isRecording: boolean;
    recordingStartTime: number | null;
    currentTrack: number;
    clips: Clip[];
    recordingBuffer: NoteEvent[];
    tempo: number;

    // New playback state
    playback: PlaybackState;
}

const initialState: ArrangementState = {
    // Existing initial state
    isRecording: false,
    recordingStartTime: null,
    currentTrack: 0,
    clips: [],
    recordingBuffer: [],
    tempo: 120,

    // New playback initial state
    playback: {
        isPlaying: false,
        currentTime: 0
    }
};

const arrangementSlice = createSlice({
    name: 'arrangement',
    initialState,
    reducers: {
        // Existing recording actions
        startRecording: (state) => {
            state.isRecording = true;
            state.recordingStartTime = Date.now();
            state.recordingBuffer = [];
        },

        stopRecording: (state) => {
            state.isRecording = false;
            state.recordingStartTime = null;
        },

        addNoteEvent: (state, action: PayloadAction<NoteEvent>) => {
            if (state.isRecording) {
                // Make sure we have the complete synthesis parameters
                const completeEvent = {
                    ...action.payload,
                    synthesis: action.payload.synthesis ||
                        keyboardAudioManager.getCurrentSynthesis(action.payload.note)
                };
                state.recordingBuffer.push(completeEvent);
            }
        },

        setCurrentTrack: (state, action: PayloadAction<number>) => {
            state.currentTrack = action.payload;
        },

        addClip: (state, action: PayloadAction<Clip>) => {
            state.clips.push(action.payload);
        },

        toggleClipSelection: (state, action: PayloadAction<string>) => {
            const clip = state.clips.find(c => c.id === action.payload);
            if (clip) {
                clip.isSelected = !clip.isSelected;
            }
        },

        moveClip: (state, action: PayloadAction<{
            id: string;
            startCell: number;
            track: number;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.startCell = action.payload.startCell;
                clip.track = action.payload.track;
            }
        },

        updateClipParameters: (state, action: PayloadAction<{
            id: string;
            parameters: Partial<Clip['parameters']>;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.parameters = {
                    ...clip.parameters,
                    ...action.payload.parameters
                };
            }
        },

        // New playback actions
        startPlayback: (state) => {
            state.playback.isPlaying = true;
            // If we're at the end, restart from beginning
            if (state.playback.currentTime >= getArrangementEndTime(state)) {
                state.playback.currentTime = 0;
            }
        },

        stopPlayback: (state) => {
            state.playback.isPlaying = false;
        },

        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = action.payload;

            // Handle loop region if active
            if (state.playback.loopRegion) {
                const { start, end } = state.playback.loopRegion;
                if (state.playback.currentTime >= end) {
                    state.playback.currentTime = start;
                }
            }
        },

        setPlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = action.payload;
        },

        setLoopRegion: (state, action: PayloadAction<{ start: number; end: number } | undefined>) => {
            state.playback.loopRegion = action.payload;
        }
    }
});

// Helper function to get the end time of the arrangement
const getArrangementEndTime = (state: ArrangementState): number => {
    if (state.clips.length === 0) return 0;

    return Math.max(
        ...state.clips.map(clip => clip.startCell + clip.length)
    ) * (60 / state.tempo);
};

// Export existing actions
export const {
    startRecording,
    stopRecording,
    addNoteEvent,
    setCurrentTrack,
    addClip,
    toggleClipSelection,
    moveClip,
    updateClipParameters,
    // Export new playback actions
    startPlayback,
    stopPlayback,
    updatePlaybackPosition,
    setPlaybackPosition,
    setLoopRegion
} = arrangementSlice.actions;

// Existing selectors
export const selectIsRecording = (state: RootState) => state.arrangement.isRecording;
export const selectCurrentTrack = (state: RootState) => state.arrangement.currentTrack;
export const selectClips = (state: RootState) => state.arrangement.clips;
export const selectSelectedClips = (state: RootState) =>
    state.arrangement.clips.filter(clip => clip.isSelected);
export const selectTempo = (state: RootState) => state.arrangement.tempo;

// New playback selectors
export const selectIsPlaying = (state: RootState) => state.arrangement.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.arrangement.playback.currentTime;
export const selectLoopRegion = (state: RootState) => state.arrangement.playback.loopRegion;

export default arrangementSlice.reducer;