// src/features/player/store/middleware/index.ts
import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { TimingService } from '../../services/timing.service';
import keyboardAudioManager from '../../../audio/engine/synthesis/keyboardEngine';
import { NoteEvent } from '../../types';
import { commitRecordingBuffer } from '../player';
import {
    selectClips,
    selectTempo,
    selectIsPlaying,
    stopPlayback,
    // selectSchedulingConfig
} from '../slices/arrangement/slice';

// Maintain state for active notes and timing service
let timingService: TimingService | null = null;
const activeNotes = new Map();

// Debug utilities
const debug = {
    playback: (message: string, data?: any) => {
        console.log(`[Playback] ${message}`, data || '');
    },
    noteTiming: (stage: string, data: any) => {
        console.log(`[Note Timing] ${stage}:`, {
            ...data,
            timestamp: Date.now(),
        });
    }
};

// Type guard for actions
const isPlayerAction = (action: unknown): action is AnyAction & { payload?: any } => {
    return typeof action === 'object' && action !== null && 'type' in action;
};

export const playerMiddleware: Middleware = store => next => async action => {
    if (!isPlayerAction(action)) return next(action);

    const result = next(action);
    const state = store.getState();
    const keyboardState = state.keyboard;

    try {
        switch (action.type) {
            // Playback actions
            case 'arrangement/startPlayback': {
                debug.playback('Starting playback');
                const schedulingConfig = selectSchedulingConfig(state);

                try {
                    if (!timingService) {
                        timingService = new TimingService(
                            {
                                ...schedulingConfig,
                                visualRefreshRate: 16.67
                            },
                            {
                                onTick: (timeMs) => {
                                    const state = store.getState();
                                },
                                onScheduleNotes: (startTime, endTime) => {
                                    const state = store.getState();
                                    const clips = selectClips(state);
                                    const tempo = selectTempo(state);
                                    scheduleNotesInRange(clips, tempo, startTime, endTime, startTime);
                                }
                            }
                        );
                    }
                    await timingService.initialize();
                } catch (error) {
                    debug.playback('Failed to start playback', error);
                    store.dispatch(stopPlayback());
                }
                break;
            }

            case 'arrangement/stopPlayback': {
                debug.playback('Stopping playback');
                if (timingService) {
                    timingService.stop();
                    timingService.reset();
                }
                break;
            }

            // Recording actions
            case 'keyboard/noteOn': {
                if (state.player.isRecording) {
                    const note = action.payload;
                    const msTime = Date.now() - (state.player.recordingStartTime || 0);

                    const tuningValue = keyboardState.keyParameters[note]?.tuning?.value ?? 0;
                    const currentWaveform = keyboardState?.keyParameters?.[note]?.waveform
                        || keyboardState?.globalWaveform
                        || 'sine';

                    const noteEvent: NoteEvent = {
                        id: `note-${Date.now()}-${note}`,
                        note,
                        timestamp: msTime,
                        velocity: 100,
                        duration: 0,
                        tuning: tuningValue,
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

                    debug.noteTiming('Note Start', {
                        note,
                        tuning: tuningValue,
                        waveform: currentWaveform,
                        mode: keyboardState?.mode,
                        timestamp: msTime
                    });

                    activeNotes.set(note, {
                        startTime: msTime,
                        noteEvent,
                        synthesis: {
                            ...noteEvent.synthesis,
                            tuning: tuningValue,
                            originalTimestamp: msTime
                        }
                    });

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
                        const endTime = Date.now() - (state.player.recordingStartTime || 0);
                        const duration = endTime - noteInfo.startTime;

                        debug.noteTiming('Note End', {
                            note: action.payload,
                            startTime: noteInfo.startTime,
                            endTime,
                            calculatedDuration: duration,
                            noteId: noteInfo.noteEvent.id,
                            tuning: noteInfo.noteEvent.tuning
                        });

                        store.dispatch({
                            type: 'player/updateNoteEvent',
                            payload: {
                                id: noteInfo.noteEvent.id,
                                duration,
                                tuning: noteInfo.noteEvent.tuning,
                                synthesis: {
                                    ...noteInfo.synthesis,
                                    tuning: noteInfo.noteEvent.tuning
                                }
                            }
                        });

                        activeNotes.delete(action.payload);
                    }
                }
                break;
            }

            case 'keyboard/setKeyParameter': {
                if (state.player.isRecording &&
                    action.payload.parameter === 'tuning' &&
                    activeNotes.has(action.payload.keyNumber)) {

                    const note = action.payload.keyNumber;
                    const newTuning = action.payload.value;
                    const noteInfo = activeNotes.get(note);

                    if (noteInfo) {
                        noteInfo.noteEvent.tuning = newTuning;
                        noteInfo.synthesis.tuning = newTuning;

                        debug.noteTiming('Tuning Update', {
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
                        store.dispatch(commitRecordingBuffer(currentTrackId));
                    }
                }
                break;
            }

            case 'player/setTempo': {
                debug.playback('Setting tempo', action.payload);
                if (timingService) {
                    timingService.setTempo(action.payload);
                }

                if (state.player.isRecording) {
                    const timestamp = Date.now() - (state.player.recordingStartTime || 0);
                    const oldTempo = state.player.tempo;
                    const newTempo = action.payload;
                    const tempoRatio = oldTempo / newTempo;

                    debug.noteTiming('Tempo Change', {
                        oldTempo,
                        newTempo,
                        tempoRatio,
                        timestamp,
                        activeNotes: activeNotes.size
                    });

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

            case 'arrangement/setPlaybackPosition': {
                debug.playback('Setting position', action.payload);
                const isPlaying = selectIsPlaying(state);

                if (isPlaying && timingService) {
                    timingService.stop();
                    timingService.start(action.payload);
                }
                break;
            }

            case '@@init': {
                return () => {
                    if (timingService) {
                        timingService.dispose();
                        timingService = null;
                    }
                };
            }
        }
    } catch (error) {
        console.error('Error in middleware:', error);
    }

    return result;
};

// Helper function for scheduling notes
const scheduleNotesInRange = (
    clips: any[],
    tempo: number,
    startTimeMs: number,
    endTimeMs: number,
    scheduleStartTime: number
) => {
    clips.forEach(clip => {
        clip.notes.forEach(note => {
            const noteTimeMs = clip.startCell / 4 * (60000 / tempo) + note.timestamp;

            if (noteTimeMs >= startTimeMs && noteTimeMs < endTimeMs) {
                keyboardAudioManager.playExactNote(
                    {
                        ...note,
                        timestamp: scheduleStartTime + (noteTimeMs - startTimeMs) / 1000,
                        duration: (note.duration || 100) / 1000
                    },
                    scheduleStartTime + (noteTimeMs - startTimeMs) / 1000
                );
            }
        });
    });
};

export default playerMiddleware;