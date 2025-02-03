// src/store/middleware/playback.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import { TimingService } from '../../features/player/services/timing.service';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import {
    selectClips,
    selectTempo,
    selectIsPlaying,
    selectCurrentTime,
    updatePlaybackPosition,
    stopPlayback
} from '../slices/arrangement/arrangement.slice';

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

            try {
                // Create new timing service if needed
                if (!timingService) {
                    timingService = new TimingService(
                        {
                            scheduleAheadTime: 0.1,
                            schedulerInterval: 25,
                            visualRefreshRate: 16.67
                        },
                        {
                            onTick: (timeMs) => {
                                store.dispatch(updatePlaybackPosition(timeMs));
                            },
                            onScheduleNotes: (startTime, endTime) => {
                                const clips = selectClips(store.getState());
                                const tempo = selectTempo(store.getState());

                                clips.forEach(clip => {
                                    clip.notes.forEach(note => {
                                        const noteTimeMs = clip.startCell / 4 * (60000 / tempo) + note.timestamp;
                                        const scheduleTimeMs = startTime * 1000;
                                        const endTimeMs = endTime * 1000;

                                        if (noteTimeMs >= scheduleTimeMs && noteTimeMs < endTimeMs) {
                                            keyboardAudioManager.playExactNote(
                                                {
                                                    ...note,
                                                    timestamp: startTime + (noteTimeMs - scheduleTimeMs) / 1000,
                                                    duration: (note.duration || 100) / 1000
                                                },
                                                startTime + (noteTimeMs - scheduleTimeMs) / 1000
                                            );
                                        }
                                    });
                                });
                            }
                        }
                    );
                }

                // Initialize audio systems
                await timingService.initialize();

                // Start playback from current position
                timingService.start(currentTime);

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

export default playbackMiddleware;