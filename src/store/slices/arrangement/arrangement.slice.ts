// src/store/slices/arrangement/arrangement.slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';
import { SynthesisParameters } from '../../../audio/types/audioTypes';

interface NoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis: SynthesisParameters;
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

interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    loopRegion?: {
        start: number;
        end: number;
    };
}

interface ArrangementState {
    isRecording: boolean;
    recordingStartTime: number | null;
    currentTrack: number;
    clips: Clip[];
    recordingBuffer: NoteEvent[];
    tempo: number;
    playback: PlaybackState;
}

const initialState: ArrangementState = {
    isRecording: false,
    recordingStartTime: null,
    currentTrack: 0,
    clips: [],
    recordingBuffer: [],
    tempo: 120,
    playback: {
        isPlaying: false,
        currentTime: 0
    }
};

const arrangementSlice = createSlice({
    name: 'arrangement',
    initialState,
    reducers: {
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
                state.recordingBuffer.push(action.payload);
            }
        },

        setCurrentTrack: (state, action: PayloadAction<number>) => {
            state.currentTrack = action.payload;
        },

        addClip: (state, action: PayloadAction<Clip>) => {
            state.clips.push(action.payload);
        },

        updateClipLength: (state, action: PayloadAction<{
            id: string;
            length: number;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.length = action.payload.length;
            }
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

        // Add this to your reducers in arrangement.slice.ts
        updateNoteEvent: (state, action: PayloadAction<{
            note: number;
            timestamp: number;
            duration: number;
        }>) => {
            // Find the exact note event in the buffer
            const eventIndex = state.recordingBuffer.findIndex(event =>
                event.note === action.payload.note &&
                event.timestamp === action.payload.timestamp
            );

            if (eventIndex !== -1) {
                // Update its duration with the exact measured duration
                state.recordingBuffer[eventIndex] = {
                    ...state.recordingBuffer[eventIndex],
                    duration: action.payload.duration
                };
            }
        },

        startPlayback: (state) => {
            state.playback.isPlaying = true;
            if (state.playback.currentTime >= getArrangementEndTime(state)) {
                state.playback.currentTime = 0;
            }
        },

        stopPlayback: (state) => {
            state.playback.isPlaying = false;
        },

        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = action.payload;
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
    return Math.max(...state.clips.map(clip => clip.startCell + clip.length)) * (60 / state.tempo);
};



// Export actions
export const {
    startRecording,
    stopRecording,
    addNoteEvent,
    setCurrentTrack,
    addClip,
    updateClipLength,
    toggleClipSelection,
    moveClip,
    updateClipParameters,
    startPlayback,
    stopPlayback,
    updateNoteEvent,
    updatePlaybackPosition,
    setPlaybackPosition,
    setLoopRegion
} = arrangementSlice.actions;

// Export selectors
export const selectIsRecording = (state: RootState) => state.arrangement.isRecording;
export const selectCurrentTrack = (state: RootState) => state.arrangement.currentTrack;
export const selectClips = (state: RootState) => state.arrangement.clips;
export const selectSelectedClips = (state: RootState) =>
    state.arrangement.clips.filter(clip => clip.isSelected);
export const selectTempo = (state: RootState) => state.arrangement.tempo;
export const selectIsPlaying = (state: RootState) => state.arrangement.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.arrangement.playback.currentTime;
export const selectLoopRegion = (state: RootState) => state.arrangement.playback.loopRegion;

export default arrangementSlice.reducer;