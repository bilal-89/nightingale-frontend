// src/features/player/hooks/usePlayback.ts

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { PlaybackService } from '../services/playback.service';
import { TIMING } from '../utils/time.utils';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';
import {
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo
} from '../state/slices/playback.slice';

export const usePlayback = () => {
    // Redux state
    const dispatch = useAppDispatch();
    const isPlaying = useAppSelector(state => state.playback.isPlaying);
    const currentTime = useAppSelector(state => state.playback.currentTime);
    const tempo = useAppSelector(state => state.playback.tempo);
    const clips = useAppSelector(state => state.player.clips);

    // Service refs
    const playbackServiceRef = useRef<PlaybackService | null>(null);
    const lastPositionUpdateRef = useRef<number>(0);

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
                onPositionChange: (positionInTicks) => {
                    const timeSinceLastUpdate = positionInTicks - lastPositionUpdateRef.current;
                    // Update position roughly every 30fps
                    if (timeSinceLastUpdate > TIMING.msToTicks(32, tempo)) {
                        lastPositionUpdateRef.current = positionInTicks;
                        dispatch(updatePlaybackPosition(positionInTicks));
                    }
                },
                onPlaybackStart: async () => {
                    await keyboardAudioManager.initialize();
                    console.log('Playback started', {
                        clips: clips.length,
                        currentTimeInTicks: currentTime
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
    }, [dispatch, cleanupIntervals, tempo]);

    // Update clips when they change
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (service && clips.length > 0) {
            console.log('Updating clips:', {
                count: clips.length,
                totalNotes: clips.reduce((sum, c) => sum + c.notes.length, 0)
            });
            service.setClips(clips);
        }
    }, [clips]);

    // Handle playback state changes
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (!service) return;

        if (isPlaying) {
            const timeoutId = window.setTimeout(() => {
                service.start(currentTime).catch(error => {
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
            service.setTempo(tempo);
        }
    }, [tempo]);

    // Public actions
    const play = useCallback(() => {
        dispatch(startPlayback());
    }, [dispatch]);

    const stop = useCallback(() => {
        dispatch(stopPlayback());
    }, [dispatch]);

    const seek = useCallback((timeInTicks: number) => {
        const service = playbackServiceRef.current;
        if (service) {
            dispatch(setPlaybackPosition(timeInTicks));
            service.seek(timeInTicks);
        }
    }, [dispatch]);

    const updateTempo = useCallback((newTempo: number) => {
        const boundedTempo = Math.max(20, Math.min(300, newTempo));
        dispatch(setTempo(boundedTempo));
    }, [dispatch]);

    return {
        isPlaying,
        currentTime,
        tempo,
        play,
        stop,
        seek,
        updatePosition: (timeInTicks: number) => dispatch(updatePlaybackPosition(timeInTicks)),
        setTempo: updateTempo
    };
};