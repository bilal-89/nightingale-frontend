// src/features/player/store/slices/arrangement/reducers/recording.ts
import { PayloadAction } from '@reduxjs/toolkit';
import type { ArrangementState, NoteEvent } from '../types.ts';

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

    addNoteEvent: (state: ArrangementState, action: PayloadAction<NoteEvent>) => {
        if (state.isRecording) {
            state.recordingBuffer.push(action.payload);
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