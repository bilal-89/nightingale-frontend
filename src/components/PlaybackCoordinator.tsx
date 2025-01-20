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

    // Modified debug logging to safely check audio context
    const debugLog = (message: string, data?: any) => {
        if (DEBUG) {
            let timestamp = 0;
            try {
                if (keyboardAudioManager.getContext()) {
                    timestamp = keyboardAudioManager.getContext().currentTime;
                }
            } catch (e) {
                // Safely handle case where context isn't ready
            }
            console.log(`[Playback ${timestamp.toFixed(3)}s] ${message}`, data || '');
        }
    };

    // Add initialization effect
    useEffect(() => {
        const initializeAudio = async () => {
            try {
                await keyboardAudioManager.initialize();
                debugLog('Audio system initialized successfully');
            } catch (error) {
                console.error('Failed to initialize audio system:', error);
            }
        };

        initializeAudio();
    }, []);

    useEffect(() => {
        const getTimeInSeconds = (cell: number) => {
            const beatsPerSecond = tempo / 60;
            return cell / beatsPerSecond;
        };

        const noteToFrequency = (note: number) => {
            return 440 * Math.pow(2, (note - 69) / 12);
        };

        const scheduleNotes = () => {
            try {
                // First check if we have an audio context available
                if (!keyboardAudioManager.getContext()) {
                    debugLog('Audio context not yet available');
                    return;
                }

                // Get current timing information
                const now = keyboardAudioManager.getContext().currentTime;
                const scheduleEnd = now + SCHEDULE_AHEAD_TIME;
                const playbackPosition = now - playbackStartTimeRef.current;

                // Log our scheduling window for debugging
                debugLog('Scheduling window:', {
                    playbackPosition: playbackPosition.toFixed(3),
                    start: lastScheduleTimeRef.current.toFixed(3),
                    end: scheduleEnd.toFixed(3)
                });

                // Process each clip to find notes that need scheduling
                clips.forEach(clip => {
                    const clipStartTime = getTimeInSeconds(clip.startCell);

                    clip.notes.forEach(noteEvent => {
                        // Calculate when this note should play in absolute time
                        const absoluteNoteTime = playbackStartTimeRef.current + clipStartTime + (noteEvent.timestamp / 1000);

                        // Check if this note falls within our scheduling window
                        if (absoluteNoteTime >= lastScheduleTimeRef.current && absoluteNoteTime < scheduleEnd) {
                            try {
                                // Instead of calculating frequency directly, pass the note to playNote
                                // This ensures we use the same synthesis settings as recording
                                keyboardAudioManager.playExactNote(
                                    {
                                        note: noteEvent.note,
                                        velocity: noteEvent.velocity,
                                        timestamp: absoluteNoteTime,
                                        duration: noteEvent.duration || 0.1,
                                        synthesis: noteEvent.synthesis
                                    },
                                    absoluteNoteTime
                                );

                                debugLog('Scheduling note:', {
                                    note: noteEvent.note,
                                    time: absoluteNoteTime.toFixed(3),
                                    relativeTime: (absoluteNoteTime - playbackStartTimeRef.current).toFixed(3)
                                });
                            } catch (error) {
                                console.error('Failed to schedule note:', error);
                            }
                        }
                    });
                });

                // Update our scheduling window
                lastScheduleTimeRef.current = scheduleEnd;
            } catch (error) {
                console.error('Error in scheduleNotes:', error);
            }
        };

        const updatePlaybackTime = () => {
            try {
                if (keyboardAudioManager.getContext()) {
                    const position = keyboardAudioManager.getContext().currentTime - playbackStartTimeRef.current;
                    dispatch(updatePlaybackPosition(position));
                    animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
                }
            } catch (error) {
                console.error('Error in updatePlaybackTime:', error);
            }
        };

        if (isPlaying) {
            debugLog('Starting playback');

            try {
                if (!keyboardAudioManager.getContext()) {
                    keyboardAudioManager.initialize().then(() => {
                        playbackStartTimeRef.current = keyboardAudioManager.getContext().currentTime;
                        lastScheduleTimeRef.current = playbackStartTimeRef.current;
                        schedulerIntervalRef.current = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL);
                        updatePlaybackTime();
                    });
                } else {
                    playbackStartTimeRef.current = keyboardAudioManager.getContext().currentTime;
                    lastScheduleTimeRef.current = playbackStartTimeRef.current;
                    schedulerIntervalRef.current = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL);
                    updatePlaybackTime();
                }
            } catch (error) {
                console.error('Error starting playback:', error);
                dispatch(stopPlayback());
            }
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