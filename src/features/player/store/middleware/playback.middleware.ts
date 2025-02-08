// src/store/middleware/playback.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import { TimingService } from '../../services/timing.service';
import keyboardAudioManager from '../../../audio/engine/synthesis/keyboardEngine';
import {
    selectClips,
    selectTempo,
    selectIsPlaying,
    selectCurrentTime,
    updatePlaybackPosition,
    stopPlayback
} from '../../store/slices/arrangement/slice';

import {
    selectLoopRegion,
    selectIsLoopEnabled,
} from '../../state/slices/playback.slice';

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
            const currentTime = selectCurrentTime(state);
            const loopRegion = selectLoopRegion(state);
            const isLoopEnabled = selectIsLoopEnabled(state);
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
                                const loopRegion = selectLoopRegion(state);
                                const isLoopEnabled = selectIsLoopEnabled(state);

                                // Handle loop points during playback
                                if (isLoopEnabled && loopRegion && timeMs >= loopRegion.end) {
                                    // Jump back to loop start
                                    timingService?.seekTo(loopRegion.start);
                                    store.dispatch(updatePlaybackPosition(loopRegion.start));
                                } else {
                                    store.dispatch(updatePlaybackPosition(timeMs));
                                }
                            },
                            onScheduleNotes: (startTime, endTime) => {
                                const state = store.getState();
                                const clips = selectClips(state);
                                const tempo = selectTempo(state);
                                const loopRegion = selectLoopRegion(state);
                                const isLoopEnabled = selectIsLoopEnabled(state);

                                // Calculate actual scheduling window considering loop points
                                let scheduleStart = startTime * 1000;
                                let scheduleEnd = endTime * 1000;

                                if (isLoopEnabled && loopRegion) {
                                    // If we're approaching the loop end, also schedule notes from the start
                                    if (scheduleEnd > loopRegion.end) {
                                        // Schedule notes up to loop end
                                        scheduleNotesInRange(
                                            clips,
                                            tempo,
                                            scheduleStart,
                                            loopRegion.end,
                                            startTime
                                        );

                                        // Schedule notes from loop start
                                        const loopOverflowTime = scheduleEnd - loopRegion.end;
                                        scheduleNotesInRange(
                                            clips,
                                            tempo,
                                            loopRegion.start,
                                            loopRegion.start + loopOverflowTime,
                                            startTime + (loopRegion.start - scheduleStart) / 1000
                                        );
                                        return;
                                    }
                                }

                                // Normal note scheduling
                                scheduleNotesInRange(clips, tempo, scheduleStart, scheduleEnd, startTime);
                            }
                        }
                    );
                }

                // Initialize audio systems
                await timingService.initialize();

                // Handle starting playback with loop points
                if (isLoopEnabled && loopRegion) {
                    // If we're outside the loop region, start from loop start
                    if (currentTime < loopRegion.start || currentTime >= loopRegion.end) {
                        timingService.start(loopRegion.start);
                    } else {
                        timingService.start(currentTime);
                    }
                } else {
                    timingService.start(currentTime);
                }

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
            const loopRegion = selectLoopRegion(state);
            const isLoopEnabled = selectIsLoopEnabled(state);

            // Handle manual seeking with loop points
            if (isLoopEnabled && loopRegion) {
                const newPosition = action.payload;
                // If seeking outside loop region, clamp to loop region
                if (newPosition < loopRegion.start || newPosition >= loopRegion.end) {
                    action.payload = loopRegion.start;
                }
            }

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