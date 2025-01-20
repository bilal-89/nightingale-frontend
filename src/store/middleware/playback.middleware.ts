// src/store/middleware/playback.middleware.ts

import { Middleware } from '@reduxjs/toolkit';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import {
    selectClips,
    selectTempo,
    selectIsPlaying,
    updatePlaybackPosition,
    stopPlayback
} from '../slices/arrangement/arrangement.slice';

const SCHEDULE_AHEAD_TIME = 0.1;
const SCHEDULER_INTERVAL = 25;

interface PlaybackState {
    schedulerInterval: number | null;
    animationFrame: number | null;
    lastScheduleTime: number;
    playbackStartTime: number;
}

const playbackState: PlaybackState = {
    schedulerInterval: null,
    animationFrame: null,
    lastScheduleTime: 0,
    playbackStartTime: 0
};

const debug = (message: string, data?: any) => {
    console.log(`[Playback Middleware] ${message}`, data || '');
};

export const playbackMiddleware: Middleware = store => next => async action => {
    const result = next(action);

    switch (action.type) {
        case 'arrangement/startPlayback': {
            debug('Starting playback');
            const state = store.getState();
            const tempo = selectTempo(state);

            try {
                // Initialize audio if needed
                await keyboardAudioManager.initialize();
                const audioContext = keyboardAudioManager.getContext();
                if (!audioContext) throw new Error('No audio context');

                // Setup playback timing
                playbackState.playbackStartTime = audioContext.currentTime;
                playbackState.lastScheduleTime = audioContext.currentTime;

                // Setup scheduling loop
                const scheduleNotes = () => {
                    try {
                        const now = audioContext.currentTime;
                        const scheduleEnd = now + SCHEDULE_AHEAD_TIME;
                        const clips = selectClips(state);
                        const beatsPerSecond = tempo / 60;

                        clips.forEach(clip => {
                            const clipStartTime = clip.startCell / beatsPerSecond;

                            clip.notes.forEach(noteEvent => {
                                const absoluteNoteTime = playbackState.playbackStartTime +
                                    clipStartTime + (noteEvent.timestamp / 1000);

                                if (absoluteNoteTime >= playbackState.lastScheduleTime &&
                                    absoluteNoteTime < scheduleEnd) {
                                    try {
                                        keyboardAudioManager.playExactNote(
                                            {
                                                ...noteEvent,
                                                timestamp: absoluteNoteTime,
                                                duration: noteEvent.duration || 0.1
                                            },
                                            absoluteNoteTime
                                        );
                                        debug('Scheduled note', {
                                            note: noteEvent.note,
                                            time: absoluteNoteTime
                                        });
                                    } catch (error) {
                                        debug('Failed to schedule note', { error, noteEvent });
                                    }
                                }
                            });
                        });

                        playbackState.lastScheduleTime = scheduleEnd;
                    } catch (error) {
                        debug('Error in scheduler', error);
                    }
                };

                // Start scheduling loop
                playbackState.schedulerInterval = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL);

                // Start animation frame for UI updates
                const updateUI = () => {
                    const currentTime = audioContext.currentTime - playbackState.playbackStartTime;
                    store.dispatch(updatePlaybackPosition(currentTime));
                    playbackState.animationFrame = requestAnimationFrame(updateUI);
                };
                updateUI();

            } catch (error) {
                debug('Error starting playback', error);
                store.dispatch(stopPlayback());
            }
            break;
        }

        case 'arrangement/stopPlayback': {
            debug('Stopping playback');

            // Clear scheduling interval
            if (playbackState.schedulerInterval) {
                clearInterval(playbackState.schedulerInterval);
                playbackState.schedulerInterval = null;
            }

            // Clear animation frame
            if (playbackState.animationFrame) {
                cancelAnimationFrame(playbackState.animationFrame);
                playbackState.animationFrame = null;
            }

            // Reset timing
            playbackState.lastScheduleTime = 0;
            playbackState.playbackStartTime = 0;
            break;
        }

        case 'arrangement/setPlaybackPosition': {
            debug('Setting playback position', action.payload);
            const state = store.getState();
            const isPlaying = selectIsPlaying(state);

            // Stop current playback
            if (playbackState.schedulerInterval) {
                clearInterval(playbackState.schedulerInterval);
                playbackState.schedulerInterval = null;
            }
            if (playbackState.animationFrame) {
                cancelAnimationFrame(playbackState.animationFrame);
                playbackState.animationFrame = null;
            }

            // If playing, restart from new position
            if (isPlaying) {
                store.dispatch({ type: 'arrangement/startPlayback' });
            }
            break;
        }
    }

    return result;
};

export default playbackMiddleware;