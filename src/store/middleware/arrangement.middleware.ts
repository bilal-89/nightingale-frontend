// src/store/middleware/arrangement.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager'
import {
    addNoteEvent,
    updateNoteEvent,
    addClip,
} from '../slices/arrangement/arrangement.slice';
import { NoteEvent, Clip } from '../../types/arrangement';

// Constants
const MILLISECONDS_PER_MINUTE = 60000;
const SIXTEENTH_NOTE_DIVISION = 4;

interface DebugData {
    note?: number;
    timestamp?: number;
    mode?: string;
    duration?: number;
    notesCount?: number;
    length?: number;
    track?: number;
    lastNoteEndTime?: number;
}

// Utilities
const debug = (message: string, data?: DebugData): void => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Arrangement Middleware] ${message}`, data || '');
    }
};

const findMatchingNoteStart = (
    recordingBuffer: NoteEvent[],
    note: number
): NoteEvent | undefined => {
    return [...recordingBuffer]
        .reverse()
        .find(event => event.note === note && event.duration === undefined);
};

const calculateClipLength = (
    recordingBuffer: NoteEvent[],
    tempo: number
): number => {
    const lastNoteEndTime = Math.max(
        ...recordingBuffer.map(note =>
            note.timestamp + ((note.duration || 0) * 1000)
        )
    );

    return Math.ceil(
        lastNoteEndTime / (MILLISECONDS_PER_MINUTE / tempo / SIXTEENTH_NOTE_DIVISION)
    );
};

const createClip = (
    recordingBuffer: NoteEvent[],
    currentTrack: number,
    clipLength: number
): Clip => ({
    id: Date.now().toString(),
    startCell: 0,
    length: clipLength,
    track: currentTrack,
    isSelected: false,
    notes: recordingBuffer,
    parameters: {
        velocity: 100,
        pitch: 60,
        tuning: 0
    }
});

export const arrangementMiddleware: Middleware = store => next => action => {
    const result = next(action);
    const state = store.getState() as RootState;

    switch (action.type) {
        case 'keyboard/noteOn': {
            if (!state.arrangement.isRecording) break;

            const timestamp = Date.now() - state.arrangement.recordingStartTime!;
            const synthesis = keyboardAudioManager.getCurrentSynthesis(action.payload);

            debug('Recording note start:', {
                note: action.payload,
                timestamp,
                mode: keyboardAudioManager.getCurrentMode()
            });

            store.dispatch(addNoteEvent({
                note: action.payload,
                timestamp,
                velocity: 100,
                synthesis
            }));
            break;
        }

        case 'keyboard/noteOff': {
            if (!state.arrangement.isRecording) break;

            const timestamp = Date.now() - state.arrangement.recordingStartTime!;
            const noteEvent = findMatchingNoteStart(
                state.arrangement.recordingBuffer,
                action.payload
            );

            if (noteEvent) {
                const duration = (timestamp - noteEvent.timestamp) / 1000;

                debug('Recording note end:', {
                    note: action.payload,
                    duration,
                    timestamp
                });

                store.dispatch(updateNoteEvent({
                    note: action.payload,
                    timestamp: noteEvent.timestamp,
                    duration
                }));
            }
            break;
        }

        case 'arrangement/stopRecording': {
            const { recordingBuffer, currentTrack, tempo } = state.arrangement;

            debug('Recording stopped, buffer:', { notesCount: recordingBuffer.length });

            if (recordingBuffer.length > 0) {
                const clipLength = calculateClipLength(recordingBuffer, tempo);
                const newClip = createClip(recordingBuffer, currentTrack, clipLength);

                debug('Creating clip:', {
                    notesCount: recordingBuffer.length,
                    length: clipLength,
                    track: currentTrack
                });

                store.dispatch(addClip(newClip));
            }
            break;
        }

        case 'arrangement/addClip': {
            debug('Clip added:', action.payload);
            break;
        }

        case 'arrangement/moveClip': {
            debug('Clip moved:', action.payload);
            break;
        }

        case 'arrangement/updateClipLength': {
            debug('Clip length updated:', action.payload);
            break;
        }
    }

    return result;
};

export default arrangementMiddleware;