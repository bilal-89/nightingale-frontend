// src/store/middleware/player.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import {
    addNoteToTrack,
    updateNoteParameters,
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

export const playerMiddleware: Middleware = store => next => action => {
    const result = next(action);
    const state = store.getState();
    const keyboardState = state.keyboard;

    switch (action.type) {
        case 'keyboard/noteOn': {
            if (state.player.isRecording) {
                const note = action.payload;
                const msTime = Date.now() - (state.player.recordingStartTime || 0);

                // Get waveform from keyboard state
                const currentWaveform = keyboardState?.keyParameters?.[note]?.waveform
                    || keyboardState?.globalWaveform
                    || 'sine';

                // Create note event with timing and synthesis info
                const noteEvent: NoteEvent = {
                    id: `note-${Date.now()}-${note}`,
                    note,
                    timestamp: msTime, // Store in milliseconds for direct track positioning
                    velocity: 100,
                    duration: 0,  // Will be updated when note ends
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

                // Store both timing and synthesis info
                activeNotes.set(note, {
                    startTime: msTime,
                    noteEvent,
                    synthesis: {
                        ...noteEvent.synthesis,
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
                        noteId: noteInfo.noteEvent.id
                    });

                    // Update note duration in recording buffer
                    store.dispatch({
                        type: 'player/updateNoteEvent',
                        payload: {
                            id: noteInfo.noteEvent.id,
                            duration,
                            synthesis: noteInfo.synthesis
                        }
                    });

                    activeNotes.delete(action.payload);
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
                activeNotes.forEach((noteInfo, note) => {
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