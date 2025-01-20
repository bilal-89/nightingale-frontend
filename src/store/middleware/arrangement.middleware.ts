// src/store/middleware/arrangement.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import { addNoteEvent, stopRecording, addClip } from '../slices/arrangement/arrangement.slice';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';

const debug = (message: string, data?: any) => {
    console.log(`[Arrangement Middleware] ${message}`, data || '');
};

export const arrangementMiddleware: Middleware = store => next => action => {
    const result = next(action);

    // When a note is played while recording, capture it
    if (action.type === 'keyboard/noteOn' && store.getState().arrangement.isRecording) {
        const state = store.getState();
        const timestamp = Date.now() - state.arrangement.recordingStartTime!;

        debug('Recording note:', { note: action.payload, timestamp });

        // Get current synthesis settings from the keyboard manager
        const synthesis = keyboardAudioManager.getCurrentSynthesis(action.payload);

        store.dispatch(addNoteEvent({
            note: action.payload,
            timestamp,
            velocity: 100,
            duration: 0.1, // We'll make this dynamic later
            synthesis
        }));
    }

    // When recording stops, create a clip from the buffer
    if (action.type === 'arrangement/stopRecording') {
        const state = store.getState();
        const { recordingBuffer, currentTrack } = state.arrangement;

        debug('Recording stopped, buffer:', recordingBuffer);

        if (recordingBuffer.length > 0) {
            // Calculate clip length based on last note timestamp
            const lastNoteTime = Math.max(...recordingBuffer.map(n => n.timestamp));
            const clipLengthInCells = Math.ceil(lastNoteTime / (60000 / state.arrangement.tempo / 4));

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

    return result;
};