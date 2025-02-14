// src/store/middleware/playback.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import { TimingService } from '../../services/timing.service';
import keyboardAudioManager from '../../../audio/engine/synthesis/keyboardEngine';
import {
    selectClips,
    selectTempo,
    selectIsPlaying,
    selectCurrentTime,
    stopPlayback
} from '../../store/slices/arrangement/slice';

let timingService: TimingService | null = null;

const debug = (message: string, data?: any) => {
    console.log(`[Playback] ${message}`, data || '');
};

export const playbackMiddleware: Middleware = store => next => async action => {
    const result = next(action);

    switch (action.type) {
        case 'arrangement/startPlayback': {
            debug('Starting playback');
            const state = store.getState();
            const schedulingConfig = selectSchedulingConfig(state);

            try {
                // Create new timing service if needed
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



                                // Normal note scheduling
                                scheduleNotesInRange(clips, tempo, startTime);
                            }
                        }
                    );
                }

                // Initialize audio systems
                await timingService.initialize();

            } catch (error) {
                debug('Failed to start playback', error);
                store.dispatch(stopPlayback());
            }
            break;
        }

        case 'arrangement/stopPlayback': {
            debug('Stopping playback');
            if (timingService) {
                timingService.stop();
                timingService.reset();
            }
            break;
        }

        case 'player/setTempo': {
            debug('Setting tempo', action.payload);
            if (timingService) {
                timingService.setTempo(action.payload);
            }
            break;
        }

        case 'arrangement/setPlaybackPosition': {
            debug('Setting position', action.payload);
            const state = store.getState();
            const isPlaying = selectIsPlaying(state);



            if (isPlaying && timingService) {
                timingService.stop();
                timingService.start(action.payload);
            }
            break;
        }

        case 'playback/setLoopRegion': {
            debug('Setting loop region', action.payload);
            // When loop points change, update scheduling if needed
            const state = store.getState();
            const isPlaying = selectIsPlaying(state);
            const currentTime = selectCurrentTime(state);

            if (isPlaying && timingService) {
                const { start, end } = action.payload;
                if (currentTime < start || currentTime >= end) {
                    timingService.stop();
                    timingService.start(start);
                }
            }
            break;
        }

        // Add cleanup on unmount
        case '@@init': {
            return () => {
                if (timingService) {
                    timingService.dispose();
                    timingService = null;
                }
            };
        }
    }

    return result;
};

// Helper function to schedule notes within a specific time range
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

export default playbackMiddleware;