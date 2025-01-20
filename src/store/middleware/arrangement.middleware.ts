// src/store/middleware/arrangement.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import {
    addNoteEvent,
    stopRecording,
    addClip,
    startPlayback,
    stopPlayback,
    updatePlaybackPosition
} from '../slices/arrangement/arrangement.slice';

const debug = (message: string, data?: any) => {
    console.log(`[Arrangement Middleware] ${message}`, data || '');
};

export const arrangementMiddleware: Middleware = store => next => action => {
    const result = next(action);

    // When a note is played while recording, capture it
    if (action.type === 'keyboard/noteOn' && store.getState().arrangement.isRecording) {
        const state = store.getState();
        const timestamp = Date.now() - state.arrangement.recordingStartTime!;

        debug('Recording note:', {
            note: action.payload,
            timestamp,
            mode: keyboardAudioManager.getCurrentMode()
        });

        // Get current synthesis settings
        const synthesis = keyboardAudioManager.getCurrentSynthesis(action.payload);

        store.dispatch(addNoteEvent({
            note: action.payload,
            timestamp,
            velocity: 100,
            duration: 0.1,
            synthesis
        }));
    }

    // When a note is released while recording, update its duration
    if (action.type === 'keyboard/noteOff' && store.getState().arrangement.isRecording) {
        const state = store.getState();
        const timestamp = Date.now() - state.arrangement.recordingStartTime!;

        // Find the corresponding note in the buffer and update its duration
        const buffer = [...state.arrangement.recordingBuffer];
        const lastNoteIndex = buffer.findIndex(note =>
            note.note === action.payload && !note.duration
        );

        if (lastNoteIndex !== -1) {
            const duration = (timestamp - buffer[lastNoteIndex].timestamp) / 1000;
            buffer[lastNoteIndex] = {
                ...buffer[lastNoteIndex],
                duration
            };
            debug('Updated note duration:', {
                note: action.payload,
                duration
            });
        }
    }

    // When recording stops, create a clip from the buffer
    if (action.type === 'arrangement/stopRecording') {
        const state = store.getState();
        const { recordingBuffer, currentTrack } = state.arrangement;

        debug('Recording stopped, buffer:', recordingBuffer);

        if (recordingBuffer.length > 0) {
            // Calculate clip length based on last note timestamp plus its duration
            const lastNoteTime = Math.max(
                ...recordingBuffer.map(n => n.timestamp + ((n.duration || 0.1) * 1000))
            );
            const clipLengthInCells = Math.ceil(
                lastNoteTime / (60000 / state.arrangement.tempo / 4)
            );

            debug('Creating clip:', {
                notesCount: recordingBuffer.length,
                length: clipLengthInCells,
                track: currentTrack
            });

            store.dispatch(addClip({
                id: Date.now().toString(),
                startCell: 0,
                length: clipLengthInCells,
                track: currentTrack,
                isSelected: false,
                notes: recordingBuffer,
                parameters: {
                    velocity: 100,
                    pitch: 60,
                    tuning: 0
                }
            }));
        }
    }

    // Add debugging for clip-related actions
    if (action.type === 'arrangement/addClip') {
        debug('Clip added:', action.payload);
    }

    if (action.type === 'arrangement/moveClip') {
        debug('Clip moved:', action.payload);
    }

    if (action.type === 'arrangement/updateClipLength') {
        debug('Clip length updated:', action.payload);
    }

    return result;
};