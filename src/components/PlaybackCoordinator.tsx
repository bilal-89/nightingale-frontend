import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
    selectIsPlaying,
    selectTempo,
    selectCurrentTime,
} from '../features/player/state/slices/playback.slice';
import { selectClips } from '../store/slices/arrangement/arrangement.slice';
import keyboardAudioManager from '../audio/context/keyboard/keyboardAudioManager';

interface DebugLogData {
    note?: number;
    start?: string;
    duration?: string;
    startTime?: number;
    currentTime?: number;
    error?: Error;
    noteEvent?: unknown;
}

const PlaybackCoordinator: React.FC = () => {
    const isPlaying = useSelector(selectIsPlaying);
    const clips = useSelector(selectClips);
    const tempo = useSelector(selectTempo);
    const currentTime = useSelector(selectCurrentTime);

    // Refs for note scheduling
    const schedulerIntervalRef = useRef<number | null>(null);
    const lastScheduleTimeRef = useRef<number>(0);

    const SCHEDULE_AHEAD_TIME = 0.1;
    const SCHEDULER_INTERVAL = 25;

    // Debug logging
    const debugLog = (message: string, data?: DebugLogData) => {
        if (process.env.NODE_ENV === 'development') {
            const audioContext = keyboardAudioManager.getContext();
            const timestamp = audioContext?.currentTime ?? 0;
            console.log(`[Playback ${timestamp.toFixed(3)}s] ${message}`, data || '');
        }
    };

    // Initialize audio system
    const initializeAudio = async () => {
        if (isPlaying) {
            try {
                await keyboardAudioManager.initialize();
                debugLog('Audio system initialized');
                return true;
            } catch (error) {
                console.error('Failed to initialize audio system:', error);
                return false;
            }
        }
        return false;
    };

    // Clean up scheduling system
    const cleanup = () => {
        if (schedulerIntervalRef.current !== null) {
            clearInterval(schedulerIntervalRef.current);
            schedulerIntervalRef.current = null;
        }
        lastScheduleTimeRef.current = 0;
    };

    // Main playback effect
    useEffect(() => {
        const scheduleNotes = () => {
            const audioContext = keyboardAudioManager.getContext();
            if (!audioContext) return;

            const now = audioContext.currentTime;
            const scheduleEnd = now + SCHEDULE_AHEAD_TIME;

            clips.forEach(clip => {
                const clipStartTime = (clip.startCell * 60) / (tempo * 4);

                clip.notes.forEach(noteEvent => {
                    const duration = noteEvent.duration ?? 0.1;
                    const noteStartTime = clipStartTime + (noteEvent.timestamp / 1000);

                    // Only schedule notes within our look-ahead window
                    if (noteStartTime >= lastScheduleTimeRef.current &&
                        noteStartTime < scheduleEnd) {
                        try {
                            keyboardAudioManager.playExactNote({
                                ...noteEvent,
                                timestamp: noteStartTime,
                                duration: duration / 1000
                            }, noteStartTime);

                            debugLog('Note scheduled', {
                                note: noteEvent.note,
                                start: noteStartTime.toFixed(3),
                                duration: (duration / 1000).toFixed(3)
                            });
                        } catch (error) {
                            if (error instanceof Error) {
                                debugLog('Note scheduling failed', { error });
                            }
                        }
                    }
                });
            });

            lastScheduleTimeRef.current = scheduleEnd;
        };

        // Handle playback state changes
        if (isPlaying) {
            debugLog('Starting playback system');
            initializeAudio().then(initialized => {
                if (initialized) {
                    // Start note scheduling
                    schedulerIntervalRef.current = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL);
                    lastScheduleTimeRef.current = keyboardAudioManager.getContext()?.currentTime ?? 0;
                }
            });
        } else {
            debugLog('Stopping playback system');
            cleanup();
        }

        return cleanup;
    }, [isPlaying, clips, tempo, currentTime]);

    return null;
};

export default PlaybackCoordinator;