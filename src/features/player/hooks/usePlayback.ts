// src/features/player/hooks/usePlayback.ts

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { PlaybackService } from '../services/playback.service';
import keyboardAudioManager from '../../../features/audio/engine/synthesis/keyboardEngine';
import {
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo,
    toggleLoop,
    setLoopPoints,
    setLoopStart,
    setLoopEnd,
    // Import selectors
    selectIsPlaying,
    selectCurrentTime,
    selectTempo,
    selectLoopEnabled,
    selectLoopStart,
    selectLoopEnd
} from '../store/playback';
import { selectTracks } from '../store/player/selectors';
import { Track } from '../store/player/types/track';

export const usePlayback = () => {
    // Redux state
    const dispatch = useAppDispatch();
    const isPlaying = useAppSelector(selectIsPlaying);
    const currentTime = useAppSelector(selectCurrentTime);
    const tempo = useAppSelector(selectTempo);
    const tracks = useAppSelector(selectTracks);
    // Loop state
    const loopEnabled = useAppSelector(selectLoopEnabled);
    const loopStart = useAppSelector(selectLoopStart);
    const loopEnd = useAppSelector(selectLoopEnd);

    // Service refs
    const playbackServiceRef = useRef<PlaybackService | null>(null);
    const lastPositionUpdateRef = useRef<number>(0);
    const loopTimeoutRef = useRef<number | null>(null);

    // Cleanup utility
    const cleanupIntervals = useCallback(() => {
        if (playbackServiceRef.current) {
            playbackServiceRef.current.stop();
        }
    }, []);

    // Initialize PlaybackService
    useEffect(() => {
        if (!playbackServiceRef.current) {
            const service = new PlaybackService({
                onPositionChange: (positionInMs) => {
                    const timeSinceLastUpdate = positionInMs - lastPositionUpdateRef.current;
                    // Update position roughly every 30fps
                    if (timeSinceLastUpdate > 32) { // 1000ms / 30fps ≈ 32ms
                        lastPositionUpdateRef.current = positionInMs;
                        dispatch(updatePlaybackPosition(positionInMs));
                    }
                },
                onPlaybackStart: async () => {
                    await keyboardAudioManager.initialize();
                    const totalNotes = tracks.reduce((sum: number, track: Track) => sum + track.notes.length, 0);
                    console.log('Playback started', {
                        tracks: tracks.length,
                        totalNotes,
                        currentTimeInMs: currentTime
                    });
                },
                onPlaybackStop: () => {
                    console.log('Playback stopped');
                    cleanupIntervals();
                },
                onError: (error) => {
                    console.error('Playback error:', error);
                    cleanupIntervals();
                    dispatch(stopPlayback());
                }
            });

            playbackServiceRef.current = service;
        }

        return () => {
            cleanupIntervals();
            if (playbackServiceRef.current) {
                playbackServiceRef.current.dispose();
                playbackServiceRef.current = null;
            }
        };
    }, [dispatch, cleanupIntervals, tempo, tracks, currentTime]);

    // Update tracks when they change
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (service) {
            const totalNotes = tracks.reduce((sum: number, track: Track) => sum + track.notes.length, 0);
            console.log('Updating tracks:', {
                count: tracks.length,
                totalNotes
            });
            service.setTracks(tracks);
        }
    }, [tracks]);

    // Handle playback state changes
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (!service) return;

        if (isPlaying) {
            const timeoutId = window.setTimeout(() => {
                service.start(currentTime as number).catch(error => {
                    console.error('Failed to start playback:', error);
                    dispatch(stopPlayback());
                });
            }, 50);
            return () => window.clearTimeout(timeoutId);
        } else {
            service.stop();
            cleanupIntervals();
        }
    }, [isPlaying, currentTime, dispatch, cleanupIntervals]);

    // Handle tempo changes
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (service) {
            console.log('Setting tempo:', tempo);
            service.setTempo(tempo as number);
        }
    }, [tempo]);

    // Handle loop state changes
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (service) {
            console.log('Setting loop state:', {
                enabled: loopEnabled,
                start: loopStart,
                end: loopEnd
            });
            
            // Ensure we have valid loop points before setting them
            const validStart = typeof loopStart === 'number' ? Math.round(loopStart) : 0;
            const validEnd = typeof loopEnd === 'number' ? Math.round(loopEnd) : 60000;
            
            service.setLoopState(
                Boolean(loopEnabled),
                validStart,
                validEnd
            );
        }
    }, [loopEnabled, loopStart, loopEnd]);

    // Add handler for loop end events
    useEffect(() => {
        const service = playbackServiceRef.current;
        const debugInfo = {
            serviceExists: !!service,
            isPlaying,
            loopEnabled,
            loopStart,
            loopEnd,
            loopDuration: loopEnd - loopStart,
            hasExistingTimeout: !!loopTimeoutRef.current,
            currentTime: service?.getCurrentTimeInMs() ?? 0
        };
        
        if (!service) {
            console.warn("Loop end handler not initialized - no service:", debugInfo);
            return;
        }
        
        // Create a event handler for loop end
        const handleLoopEnd = () => {
            const startTime = performance.now();
            console.log("Loop end reached in hook", debugInfo);
            
            // Track state changes during timeout
            const initialState = {
                isPlaying,
                loopEnabled,
                loopStart,
                loopEnd
            };
            
            // Clear any existing timeout
            if (loopTimeoutRef.current) {
                console.debug("Clearing existing loop timeout");
                window.clearTimeout(loopTimeoutRef.current);
                loopTimeoutRef.current = null;
            }
            
            // Small delay to let the UI update
            loopTimeoutRef.current = window.setTimeout(() => {
                const currentState = {
                    isPlaying,
                    loopEnabled,
                    loopStart,
                    loopEnd
                };
                
                // Make sure we're still playing and looping
                if (!isPlaying || !loopEnabled) {
                    console.log("Not calling forcePlayLoopRegionNotes - no longer playing or looping:", {
                        initialState,
                        currentState,
                        timeSinceLoopEnd: performance.now() - startTime
                    });
                    return;
                }
                
                // Check if loop points changed during timeout
                const loopPointsChanged = 
                    initialState.loopStart !== currentState.loopStart ||
                    initialState.loopEnd !== currentState.loopEnd;
                
                console.log("Forcing note replay in loop:", {
                    initialState,
                    currentState,
                    loopPointsChanged,
                    timeSinceLoopEnd: performance.now() - startTime
                });
                
                try {
                    service.forcePlayLoopRegionNotes();
                } catch (error) {
                    console.error("Error forcing note replay:", {
                        error,
                        state: currentState,
                        timeSinceLoopEnd: performance.now() - startTime
                    });
                    
                    // Notify error handler if available
                    service.onError?.(
                        error instanceof Error ? error : new Error('Failed to force play loop region notes')
                    );
                }
            }, 50);
        };
        
        // Add the event handler to the service
        service.onLoopEnd = handleLoopEnd;
        
        // Debug log when effect is setup
        console.debug("Loop end handler initialized:", debugInfo);
        
        return () => {
            const cleanupInfo = {
                ...debugInfo,
                timeoutExists: !!loopTimeoutRef.current,
                handlerExists: !!service.onLoopEnd
            };
            
            if (service) {
                service.onLoopEnd = undefined;
            }
            
            if (loopTimeoutRef.current) {
                window.clearTimeout(loopTimeoutRef.current);
                loopTimeoutRef.current = null;
            }
            
            console.debug("Loop end handler cleanup complete:", cleanupInfo);
        };
    }, [isPlaying, loopEnabled, loopStart, loopEnd]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (loopTimeoutRef.current) {
                window.clearTimeout(loopTimeoutRef.current);
                loopTimeoutRef.current = null;
            }
        };
    }, []);

    // Public actions
    const play = useCallback(() => {
        dispatch(startPlayback());
    }, [dispatch]);

    const stop = useCallback(() => {
        dispatch(stopPlayback());
    }, [dispatch]);

    const seek = useCallback((timeInMs: number) => {
        const service = playbackServiceRef.current;
        if (service) {
            dispatch(setPlaybackPosition(timeInMs));
            service.seek(timeInMs);
        }
    }, [dispatch]);

    const updateTempo = useCallback((newTempo: number) => {
        const boundedTempo = Math.max(20, Math.min(300, newTempo));
        dispatch(setTempo(boundedTempo));
    }, [dispatch]);

    // Loop control actions
    const toggleLooping = useCallback(() => {
        dispatch(toggleLoop());
        
        // Update the playback service
        if (playbackServiceRef.current) {
            playbackServiceRef.current.setLoopState(!loopEnabled);
        }
    }, [dispatch, loopEnabled]);

    const updateLoopStart = useCallback((time: number) => {
        dispatch(setLoopStart(time));
        if (playbackServiceRef.current) {
            playbackServiceRef.current.setLoopState(true, time, undefined);
        }
    }, [dispatch]);

    const updateLoopEnd = useCallback((time: number) => {
        dispatch(setLoopEnd(time));
        if (playbackServiceRef.current) {
            playbackServiceRef.current.setLoopState(true, undefined, time);
        }
    }, [dispatch]);

    const updateLoopPoints = useCallback((start: number, end: number) => {
        if (end > start) {
            dispatch(setLoopPoints({ start, end }));
            if (playbackServiceRef.current) {
                playbackServiceRef.current.setLoopState(true, start, end);
            }
        }
    }, [dispatch]);

    return {
        isPlaying,
        currentTime,
        tempo,
        // Loop state
        loopEnabled,
        loopStart,
        loopEnd,
        // Actions
        play,
        stop,
        seek,
        updatePosition: (timeInMs: number) => dispatch(updatePlaybackPosition(timeInMs)),
        setTempo: updateTempo,
        // Loop actions
        toggleLooping,
        updateLoopPoints,
        updateLoopStart,
        updateLoopEnd
    };
};