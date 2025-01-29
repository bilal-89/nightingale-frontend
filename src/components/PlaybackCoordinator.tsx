// src/components/PlaybackCoordinator.tsx

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectIsPlaying,
    selectTempo,
    selectCurrentTime,
    updatePlaybackPosition,
} from '../features/player/state/slices/playback.slice';
import {
    // selectIsPlaying,
    selectClips,
    // selectTempo,
    // selectCurrentTime,
    // updatePlaybackPosition,
    // stopPlayback
} from '../store/slices/arrangement/arrangement.slice';
import keyboardAudioManager from '../audio/context/keyboard/keyboardAudioManager';

const DEBUG = true;

const PlaybackCoordinator: React.FC = () => {
    const dispatch = useDispatch();
    const isPlaying = useSelector(selectIsPlaying);
    const clips = useSelector(selectClips);
    const tempo = useSelector(selectTempo);
    const currentTime = useSelector(selectCurrentTime);

    const schedulerIntervalRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastScheduleTimeRef = useRef<number>(0);
    const playbackStartTimeRef = useRef<number>(0);

    const SCHEDULE_AHEAD_TIME = 0.1;
    const SCHEDULER_INTERVAL = 25;

    const debugLog = (message: string, data?: any) => {
        if (DEBUG) {
            let timestamp = 0;
            try {
                const audioContext = keyboardAudioManager.getContext();
                if (audioContext) {
                    timestamp = audioContext.currentTime;
                }
            } catch (e) {
                // Handle safely
            }
            console.log(`[Playback ${timestamp.toFixed(3)}s] ${message}`, data || '');
        }
    };

    // Only initialize when user interacts
    const initializeAudio = async () => {
        if (isPlaying) {
            try {
                await keyboardAudioManager.initialize();
                debugLog('Audio system initialized successfully');
                return true;
            } catch (error) {
                console.error('Failed to initialize audio system:', error);
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        const getTimeInSeconds = (cell: number) => {
            const beatsPerSecond = tempo / 60;
            return cell / beatsPerSecond;
        };

        const scheduleNotes = () => {
            if (!keyboardAudioManager.getContext()) {
                debugLog('Audio context not yet available');
                return;
            }

            const audioContext = keyboardAudioManager.getContext();
            const now = audioContext.currentTime;
            const scheduleEnd = now + SCHEDULE_AHEAD_TIME;
            const playbackPosition = now - playbackStartTimeRef.current;

            // Process each clip
            clips.forEach(clip => {
                // Calculate clip start time in seconds
                const clipStartTime = (clip.startCell * 60) / (tempo * 4); // Convert grid cells to seconds

                clip.notes.forEach(noteEvent => {
                    // Calculate absolute start time including the note's timestamp within the clip
                    const absoluteStartTime = playbackStartTimeRef.current +
                        clipStartTime + (noteEvent.timestamp / 1000);

                    // Only schedule notes in our looking-ahead window
                    if (absoluteStartTime >= lastScheduleTimeRef.current &&
                        absoluteStartTime < scheduleEnd) {
                        try {
                            // Use the actual recorded duration
                            keyboardAudioManager.playExactNote({
                                ...noteEvent,
                                timestamp: absoluteStartTime,
                                duration: noteEvent.duration / 1000  // Convert ms to seconds
                            }, absoluteStartTime);

                            debugLog('Scheduling note:', {
                                note: noteEvent.note,
                                start: absoluteStartTime.toFixed(3),
                                duration: (noteEvent.duration / 1000).toFixed(3)
                            });
                        } catch (error) {
                            debugLog('Failed to schedule note:', { error, noteEvent });
                        }
                    }
                });
            });

            lastScheduleTimeRef.current = scheduleEnd;
        };

        const updatePlaybackTime = () => {
            const audioContext = keyboardAudioManager.getContext();
            if (audioContext) {
                const position = audioContext.currentTime - playbackStartTimeRef.current;
                dispatch(updatePlaybackPosition(position));
                animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
            }
        };

        if (isPlaying) {
            debugLog('Starting playback');
            initializeAudio().then(initialized => {
                if (initialized) {
                    const audioContext = keyboardAudioManager.getContext();
                    playbackStartTimeRef.current = audioContext.currentTime;
                    lastScheduleTimeRef.current = audioContext.currentTime;
                    schedulerIntervalRef.current = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL);
                    updatePlaybackTime();
                }
            });
        } else {
            debugLog('Stopping playback');
            if (schedulerIntervalRef.current) {
                clearInterval(schedulerIntervalRef.current);
                schedulerIntervalRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            lastScheduleTimeRef.current = 0;
            playbackStartTimeRef.current = 0;
        }

        return () => {
            if (schedulerIntervalRef.current) {
                clearInterval(schedulerIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, clips, tempo, dispatch]);

    return null;
};

export default PlaybackCoordinator;