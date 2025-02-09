// src/features/player/store/slices/arrangement/reducers/recording.ts
import { PayloadAction } from '@reduxjs/toolkit';
import {ArrangementState, NoteColor, NoteEvent} from '../types.ts';

export const recordingReducers = {
    startRecording: (state: ArrangementState) => {
        state.isRecording = true;
        state.recordingStartTime = Date.now();
        state.recordingBuffer = [];
    },

    stopRecording: (state: ArrangementState) => {
        state.isRecording = false;
        state.recordingStartTime = null;
    },

    // src/features/player/store/slices/arrangement/reducers/recording.ts
    addNoteEvent: (state: ArrangementState, action: PayloadAction<Omit<NoteEvent, 'color'>>) => {
        if (state.isRecording) {
            // Get current track's color
            const currentTrack = state.tracks.find(t => t.id === state.currentTrack);
            const noteWithColor = {
                ...action.payload,
                color: currentTrack?.color || NoteColor.Red // Add the track's color to new notes
            };
            state.recordingBuffer.push(noteWithColor);
        }
    },

    updateNoteEvent: (state: ArrangementState, action: PayloadAction<{
        note: number;
        timestamp: number;
        duration: number;
    }>) => {
        const eventIndex = state.recordingBuffer.findIndex(event =>
            event.note === action.payload.note &&
            event.timestamp === action.payload.timestamp
        );

        if (eventIndex !== -1) {
            state.recordingBuffer[eventIndex] = {
                ...state.recordingBuffer[eventIndex],
                duration: action.payload.duration
            };
        }
    }
};