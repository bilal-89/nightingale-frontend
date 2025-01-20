// src/store/middleware/arrangement.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import {
    addNoteEvent,
    updateNoteEvent,
    stopRecording,
    addClip,
    startPlayback,
    stopPlayback,
    updatePlaybackPosition
} from '../slices/arrangement/arrangement.slice';

// Debug logging helper for tracking the recording and playback process
const debug = (message: string, data?: any) => {
    console.log(`[Arrangement Middleware] ${message}`, data || '');
};

export const arrangementMiddleware: Middleware = store => next => action => {
    const result = next(action);

    // Handle note start events during recording
    if (action.type === 'keyboard/noteOn' && store.getState().arrangement.isRecording) {
        const state = store.getState();
        const timestamp = Date.now() - state.arrangement.recordingStartTime!;

        debug('Recording note start:', {
            note: action.payload,
            timestamp,
            mode: keyboardAudioManager.getCurrentMode()
        });

        // Capture the current synthesis settings at the start of the note
        const synthesis = keyboardAudioManager.getCurrentSynthesis(action.payload);

        // Add the note to the recording buffer without a duration
        // Duration will be calculated and added when the note is released
        store.dispatch(addNoteEvent({
            note: action.payload,
            timestamp,
            velocity: 100,
            synthesis
        }));
    }

    // Handle note end events during recording
    if (action.type === 'keyboard/noteOff' && store.getState().arrangement.isRecording) {
        const state = store.getState();
        const timestamp = Date.now() - state.arrangement.recordingStartTime!;

        // Find the matching note start event in the buffer
        // We look for the most recent note of the same pitch that doesn't have a duration yet
        const noteEvent = [...state.arrangement.recordingBuffer]
            .reverse()
            .find(event =>
                event.note === action.payload &&
                event.duration === undefined
            );

        if (noteEvent) {
            // Calculate the exact duration in seconds from the timestamps
            const duration = (timestamp - noteEvent.timestamp) / 1000;

            debug('Recording note end:', {
                note: action.payload,
                duration,
                timestamp
            });

            // Update the note in the buffer with its actual duration
            store.dispatch(updateNoteEvent({
                note: action.payload,
                timestamp: noteEvent.timestamp,
                duration
            }));
        }
    }

    // Handle the end of recording and create a clip from the recorded notes
    if (action.type === 'arrangement/stopRecording') {
        const state = store.getState();
        const { recordingBuffer, currentTrack } = state.arrangement;

        debug('Recording stopped, buffer:', recordingBuffer);

        if (recordingBuffer.length > 0) {
            // Calculate the length of the clip based on the last note's end time
            const lastNoteEndTime = Math.max(
                ...recordingBuffer.map(note =>
                    note.timestamp + ((note.duration || 0) * 1000)
                )
            );

            // Convert the duration from milliseconds to musical cells
            // Each cell represents a sixteenth note at the current tempo
            const clipLengthInCells = Math.ceil(
                lastNoteEndTime / (60000 / state.arrangement.tempo / 4)
            );

            debug('Creating clip:', {
                notesCount: recordingBuffer.length,
                length: clipLengthInCells,
                track: currentTrack,
                lastNoteEndTime
            });

            // Create a new clip containing all the recorded notes
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

    // Debug logging for clip operations
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

export default arrangementMiddleware;