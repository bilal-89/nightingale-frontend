// src/store/middleware/playback.middleware.ts

import { Middleware } from 'redux';
import { PlaybackScheduler } from '../../audio/context/playback/playbackScheduler';

export const createPlaybackMiddleware = (audioContext: AudioContext): Middleware => {
    let scheduler: PlaybackScheduler | null = null;
    let animationFrame: number | null = null;

    return store => next => action => {
        switch (action.type) {
            case 'arrangement/startPlayback': {
                // Initialize scheduler if needed
                if (!scheduler) {
                    scheduler = new PlaybackScheduler(audioContext);
                }

                // Get all notes from the current arrangement
                const state = store.getState();
                const notes = getAllScheduledNotes(state.arrangement);

                // Start playback
                scheduler.start(notes);

                // Start updating playback position
                const updatePlaybackPosition = () => {
                    store.dispatch({
                        type: 'arrangement/updatePlaybackPosition',
                        payload: audioContext.currentTime
                    });
                    animationFrame = requestAnimationFrame(updatePlaybackPosition);
                };
                updatePlaybackPosition();

                break;
            }

            case 'arrangement/stopPlayback': {
                // Stop scheduler
                if (scheduler) {
                    scheduler.stop();
                }

                // Stop animation frame
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }

                break;
            }

            case 'arrangement/setPlaybackPosition': {
                // Stop current playback
                if (scheduler) {
                    scheduler.stop();
                }

                // Update position and restart if playing
                const state = store.getState();
                if (state.arrangement.playback?.isPlaying && scheduler) {
                    const notes = getAllScheduledNotes(state.arrangement, action.payload);
                    scheduler.start(notes);
                }

                break;
            }
        }

        return next(action);
    };
};

// Helper function to extract all scheduled notes from the arrangement
const getAllScheduledNotes = (arrangement: any, startOffset = 0) => {
    // Convert arrangement data into ScheduledNote array
    // This implementation depends on your arrangement data structure
    const notes: ScheduledNote[] = [];

    // Example conversion:
    arrangement.clips.forEach(clip => {
        clip.notes.forEach(note => {
            notes.push({
                id: `${clip.id}-${note.id}`,
                frequency: note.frequency,
                startTime: clip.startTime + note.time - startOffset,
                duration: note.duration,
                velocity: note.velocity
            });
        });
    });

    return notes;
};