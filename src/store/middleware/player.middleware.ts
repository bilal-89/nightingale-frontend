// src/store/middleware/player.middleware.ts

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import {
    commitRecordingBuffer
} from '../../features/player/state/slices/player.slice';
import type { NoteEvent } from '../../features/player/types';

const activeNotes = new Map();

function logNoteTiming(stage: string, data: any) {
    console.log(`[Note Timing] ${stage}:`, {
        ...data,
        timestamp: Date.now(),
    });
}

const isPlayerAction = (action: unknown): action is AnyAction & { payload?: any } => {
    return typeof action === 'object' && action !== null && 'type' in action;
};

export const playerMiddleware: Middleware = store => next => action => {
    if (!isPlayerAction(action)) return next(action);

    const result = next(action);
    const state = store.getState();
    const keyboardState = state.keyboard;

    switch (action.type) {
        case 'keyboard/noteOn': {
            if (state.player.isRecording) {
                const note = action.payload;
                const msTime = Date.now() - (state.player.recordingStartTime || 0);

                // Get tuning value from keyboard state
                const tuningValue = keyboardState.keyParameters[note]?.tuning?.value ?? 0;

                // Get waveform from keyboard state
                const currentWaveform = keyboardState?.keyParameters?.[note]?.waveform
                    || keyboardState?.globalWaveform
                    || 'sine';

                // Create note event with timing, tuning, and synthesis info
                const noteEvent: NoteEvent = {
                    id: `note-${Date.now()}-${note}`,
                    note,
                    timestamp: msTime,
                    velocity: 100,
                    duration: 0,
                    tuning: tuningValue,  // Include tuning value in the note event
                    synthesis: {
                        mode: keyboardState?.mode || 'tunable',
                        waveform: currentWaveform,
                        envelope: {
                            attack: 0.005,
                            decay: 0,
                            sustain: 1,
                            release: 0.005
                        },
                        gain: 0.3,
                        effects: {}
                    }
                };

                // Log note recording with tuning
                logNoteTiming('Note Start', {
                    note,
                    tuning: tuningValue,
                    waveform: currentWaveform,
                    mode: keyboardState?.mode,
                    timestamp: msTime
                });

                // Store both timing and synthesis info, including tuning
                activeNotes.set(note, {
                    startTime: msTime,
                    noteEvent,
                    synthesis: {
                        ...noteEvent.synthesis,
                        tuning: tuningValue,  // Store tuning in synthesis info
                        originalTimestamp: msTime
                    }
                });

                // Add to recording buffer
                store.dispatch({
                    type: 'player/addNoteEvent',
                    payload: noteEvent
                });
            }
            break;
        }

        case 'keyboard/noteOff': {
            if (state.player.isRecording) {
                const noteInfo = activeNotes.get(action.payload);
                if (noteInfo) {
                    // Calculate precise duration
                    const endTime = Date.now() - (state.player.recordingStartTime || 0);
                    const duration = endTime - noteInfo.startTime;

                    logNoteTiming('Note End', {
                        note: action.payload,
                        startTime: noteInfo.startTime,
                        endTime,
                        calculatedDuration: duration,
                        noteId: noteInfo.noteEvent.id,
                        tuning: noteInfo.noteEvent.tuning  // Log tuning value
                    });

                    // Update note duration in recording buffer, preserving tuning
                    store.dispatch({
                        type: 'player/updateNoteEvent',
                        payload: {
                            id: noteInfo.noteEvent.id,
                            duration,
                            tuning: noteInfo.noteEvent.tuning,  // Preserve tuning in update
                            synthesis: {
                                ...noteInfo.synthesis,
                                tuning: noteInfo.noteEvent.tuning  // Include tuning in synthesis
                            }
                        }
                    });

                    activeNotes.delete(action.payload);
                }
            }
            break;
        }

        case 'keyboard/setKeyParameter': {
            // Handle tuning parameter changes during recording
            if (state.player.isRecording &&
                action.payload.parameter === 'tuning' &&
                activeNotes.has(action.payload.keyNumber)) {

                const note = action.payload.keyNumber;
                const newTuning = action.payload.value;
                const noteInfo = activeNotes.get(note);

                if (noteInfo) {
                    // Update the active note's tuning
                    noteInfo.noteEvent.tuning = newTuning;
                    noteInfo.synthesis.tuning = newTuning;

                    logNoteTiming('Tuning Update', {
                        note,
                        newTuning,
                        noteId: noteInfo.noteEvent.id
                    });
                }
            }
            break;
        }

        case 'player/stopRecording': {
            if (state.player.recordingBuffer.length > 0) {
                const currentTrackId = state.player.tracks[state.player.currentTrack]?.id;
                if (currentTrackId) {
                    // Commit recording buffer to current track
                    store.dispatch(commitRecordingBuffer(currentTrackId));
                }
            }
            break;
        }

        case 'player/setTempo': {
            if (state.player.isRecording) {
                const timestamp = Date.now() - (state.player.recordingStartTime || 0);
                const oldTempo = state.player.tempo;
                const newTempo = action.payload;
                const tempoRatio = oldTempo / newTempo;

                logNoteTiming('Tempo Change', {
                    oldTempo,
                    newTempo,
                    tempoRatio,
                    timestamp,
                    activeNotes: activeNotes.size
                });

                // Adjust timing for active notes
                activeNotes.forEach((noteInfo) => {
                    noteInfo.startTime = Math.round(noteInfo.startTime * tempoRatio);
                    if (noteInfo.noteEvent.duration) {
                        noteInfo.noteEvent.duration = Math.round(
                            noteInfo.noteEvent.duration * tempoRatio
                        );
                    }
                });
            }
            break;
        }
    }

    return result;
};

export default playerMiddleware;