// src/components/PlaybackCoordinator.tsx

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectIsPlaying,
    selectClips,
    selectTempo,
    selectCurrentTime,
    updatePlaybackPosition,
    stopPlayback
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

            debugLog('Scheduling window:', {
                playbackPosition: playbackPosition.toFixed(3),
                start: lastScheduleTimeRef.current.toFixed(3),
                end: scheduleEnd.toFixed(3)
            });

            // Process each clip
            clips.forEach(clip => {
                debugLog('Processing clip:', {
                    id: clip.id,
                    startCell: clip.startCell,
                    notes: clip.notes.length
                });

                const clipStartTime = getTimeInSeconds(clip.startCell);
                clip.notes.forEach(noteEvent => {
                    const absoluteNoteTime = playbackStartTimeRef.current +
                        clipStartTime + (noteEvent.timestamp / 1000);

                    if (absoluteNoteTime >= lastScheduleTimeRef.current &&
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

                            debugLog('Scheduled note:', {
                                note: noteEvent.note,
                                time: absoluteNoteTime.toFixed(3),
                                relativeTime: (absoluteNoteTime - playbackStartTimeRef.current).toFixed(3)
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