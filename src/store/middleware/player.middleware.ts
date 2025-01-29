// src/store/middleware/player.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import {
    addNoteEvent,
    addClip
} from '../../features/player/state/slices/player.slice';
import type { NoteEvent } from '../../features/player/types';
import { TIMING } from '../../features/player/utils/time.utils';

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
                // const timestamp = Date.now() - (state.player.recordingStartTime || 0);
                const note = action.payload;
                const msTime = Date.now() - (state.player.recordingStartTime || 0);
                const timestamp = TIMING.msToTicks(msTime, state.player.tempo);

                // Get waveform from keyboard state
                const currentWaveform = keyboardState?.keyParameters?.[note]?.waveform
                    || keyboardState?.globalWaveform
                    || 'sine';

                // Create note event with timing and synthesis info
                const noteEvent: NoteEvent = {
                    id: `note-${Date.now()}-${note}`,
                    note,
                    timestamp,
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
                    startTime: timestamp,
                    noteEvent,
                    // Store complete synthesis info for duration calculation
                    synthesis: {
                        ...noteEvent.synthesis,
                        originalTimestamp: timestamp
                    }
                });

                store.dispatch(addNoteEvent(noteEvent));
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

                    // Important: Log duration calculation
                    logNoteTiming('Note End', {
                        note: action.payload,
                        startTime: noteInfo.startTime,
                        endTime,
                        calculatedDuration: duration,
                        noteId: noteInfo.noteEvent.id,
                        synthesis: noteInfo.synthesis
                    });

                    // Update note with both duration and synthesis info
                    store.dispatch({
                        type: 'player/updateNoteEvent',
                        payload: {
                            id: noteInfo.noteEvent.id,
                            duration,
                            // Preserve synthesis parameters during update
                            synthesis: {
                                ...noteInfo.synthesis,
                                duration  // Include duration in synthesis info
                            }
                        }
                    });

                    // Verify duration update
                    const updatedNote = state.player.recordingBuffer.find(
                        note => note.id === noteInfo.noteEvent.id
                    );
                    logNoteTiming('Note Duration Update', {
                        noteId: noteInfo.noteEvent.id,
                        originalDuration: noteInfo.noteEvent.duration,
                        newDuration: duration,
                        noteInBuffer: updatedNote
                    });

                    activeNotes.delete(action.payload);
                }
            }
            break;
        }

        case 'player/stopRecording': {
            if (state.player.recordingBuffer.length > 0) {
                const endTime = Date.now() - (state.player.recordingStartTime || 0);

                // Calculate timing-aware clip length
                const beatsPerSecond = state.player.tempo / 60;
                const secondsPerBeat = 60 / state.player.tempo;
                const cellsPerBeat = 4;
                const durationInBeats = endTime / (secondsPerBeat * 1000);
                const clipLength = Math.max(1, Math.ceil(durationInBeats * cellsPerBeat));

                // Preserve both duration and synthesis info in clip creation
                store.dispatch(addClip({
                    id: `clip-${Date.now()}`,
                    startCell: Math.floor(state.playback.currentTime * beatsPerSecond * cellsPerBeat),
                    length: clipLength,
                    track: state.player.currentTrack,
                    isSelected: false,
                    notes: state.player.recordingBuffer.map(note => ({
                        ...note,
                        // Keep original duration
                        duration: note.duration,
                        synthesis: {
                            ...note.synthesis,
                            // Ensure waveform is preserved
                            waveform: note.synthesis.waveform,
                            mode: note.synthesis.mode,
                            envelope: {
                                ...note.synthesis.envelope
                            }
                        }
                    })),
                    parameters: {
                        velocity: 100,
                        pitch: 0,
                        tuning: 0
                    }
                }));
            }
            break;
        }
        case 'player/setTempo': {
            if (state.player.isRecording) {
                const timestamp = Date.now() - (state.player.recordingStartTime || 0);
                const oldTempo = state.player.tempo;
                const newTempo = action.payload;

                // Calculate how to adjust timings for the tempo change
                const tempoRatio = oldTempo / newTempo;

                logNoteTiming('Tempo Change', {
                    oldTempo,
                    newTempo,
                    tempoRatio,
                    timestamp,
                    activeNotes: activeNotes.size
                });

                // Adjust all currently recording notes
                activeNotes.forEach((noteInfo, note) => {
                    // Update the timing while preserving musical position
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