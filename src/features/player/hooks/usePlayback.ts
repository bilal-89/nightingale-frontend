// src/features/player/hooks/usePlayback.ts

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { PlaybackService } from '../services/playback.service';
import keyboardAudioManager from '../../../../src/features/audio/engine/synthesis/keyboardEngine';

import {
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo
} from '../store/playback';
import { selectTracks } from '../store/player';


export const usePlayback = () => {
    // Redux state
    const dispatch = useAppDispatch();
    const isPlaying = useAppSelector(state => state.playback.isPlaying);
    const currentTime = useAppSelector(state => state.playback.currentTime);
    const tempo = useAppSelector(state => state.playback.tempo);
    const tracks = useAppSelector(selectTracks);

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
                    const totalNotes = tracks.reduce((sum, track) => sum + track.notes.length, 0);
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
    }, [dispatch, cleanupIntervals, tempo, tracks]);

    // Update tracks when they change
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (service) {
            const totalNotes = tracks.reduce((sum, track) => sum + track.notes.length, 0);
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

    return {
        isPlaying,
        currentTime,
        tempo,
        play,
        stop,
        seek,
        updatePosition: (timeInMs: number) => dispatch(updatePlaybackPosition(timeInMs)),
        setTempo: updateTempo
    };
};