// src/features/player/store/reducers/recording.ts
import { PayloadAction } from '@reduxjs/toolkit';
import { PlayerState } from '../types';
import { NoteEvent } from '../../types';
import { NoteColor } from '../types';

export const recordingReducers = {
    startRecording: (state: PlayerState) => {
        state.isRecording = true;
        state.recordingStartTime = Date.now();
        state.recordingBuffer = [];
    },

    stopRecording: (state: PlayerState) => {
        state.isRecording = false;
        state.recordingStartTime = null;
    },

    addNoteEvent: (state: PlayerState, action: PayloadAction<Omit<NoteEvent, 'color'>>) => {
        if (state.isRecording) {
            const currentTrack = state.tracks.find(t => t.id === state.currentTrack.toString());
            const noteWithColor = {
                ...action.payload,
                color: currentTrack?.color || NoteColor.Red
            };
            state.recordingBuffer.push(noteWithColor);
        }
    },

    updateNoteEvent: (state: PlayerState, action: PayloadAction<{
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