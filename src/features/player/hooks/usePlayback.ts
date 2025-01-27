// src/features/player/hooks/usePlayback.ts

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { PlaybackService } from '../services/playback.service';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';
import {
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo
} from '../state/slices/playback.slice';

export const usePlayback = () => {
    const dispatch = useAppDispatch();

    // Get all necessary state from Redux
    const isPlaying = useAppSelector(state => state.playback.isPlaying);
    const currentTime = useAppSelector(state => state.playback.currentTime);
    const tempo = useAppSelector(state => state.playback.tempo);
    const clips = useAppSelector(state => state.player.clips);

    // Keep our PlaybackService instance in a ref so it persists between renders
    // while still being accessible to all effect hooks
    const playbackServiceRef = useRef<PlaybackService | null>(null);

    // Initialize PlaybackService with all necessary configuration
    useEffect(() => {
        if (!playbackServiceRef.current) {
            playbackServiceRef.current = new PlaybackService({
                // Configure audio playback system
                audioManager: keyboardAudioManager,

                // Handle position updates for visual feedback
                onPositionChange: (position) => {
                    dispatch(updatePlaybackPosition(position));
                },

                // Lifecycle event handlers for debugging and error recovery
                onPlaybackStart: () => {
                    console.log('Playback started');
                    // Ensure audio manager is in the correct mode when playback starts
                    keyboardAudioManager.initialize();
                },
                onPlaybackStop: () => {
                    console.log('Playback stopped');
                },
                onError: (error) => {
                    console.error('Playback error:', error);
                    // Stop playback if we encounter an error
                    dispatch(stopPlayback());
                }
            });
        }

        // Clean up audio resources when component unmounts
        return () => {
            if (playbackServiceRef.current) {
                playbackServiceRef.current.dispose();
                playbackServiceRef.current = null;
            }
        };
    }, [dispatch]);

    // Handle play/stop state changes and manage audio context
    useEffect(() => {
        const service = playbackServiceRef.current;
        if (!service) return;

        if (isPlaying) {
            // Start playback with error handling
            service.start(currentTime).catch(error => {
                console.error('Failed to start playback:', error);
                dispatch(stopPlayback());
            });
        } else {
            // Stop all playback and clean up scheduled notes
            service.stop();
        }
    }, [isPlaying, currentTime, dispatch]);

    // Keep audio service synchronized with clip data
    useEffect(() => {
        if (playbackServiceRef.current && clips.length > 0) {
            // Ensure clips have all synthesis parameters before setting
            const processedClips = clips.map(clip => ({
                ...clip,
                notes: clip.notes.map(note => ({
                    ...note,
                    // Ensure each note has complete synthesis information
                    synthesis: note.synthesis || keyboardAudioManager.getCurrentSynthesis(note.note)
                }))
            }));
            playbackServiceRef.current.setClips(processedClips);
        }
    }, [clips]);

    // Keep tempo synchronized between UI and audio engine
    useEffect(() => {
        if (playbackServiceRef.current) {
            playbackServiceRef.current.setTempo(tempo);
        }
    }, [tempo]);

    useEffect(() => {
        if (playbackServiceRef.current && clips.length > 0) {
            // Process clips to ensure complete synthesis information
            const processedClips = clips.map(clip => ({
                ...clip,
                notes: clip.notes.map(note => ({
                    ...note,
                    synthesis: {
                        ...note.synthesis,
                        // Ensure waveform is preserved from recording
                        waveform: note.synthesis.waveform || 'sine',
                        mode: note.synthesis.mode || 'tunable',
                        envelope: {
                            attack: note.synthesis.envelope?.attack || 0.005,
                            decay: note.synthesis.envelope?.decay || 0,
                            sustain: note.synthesis.envelope?.sustain || 1,
                            release: note.synthesis.envelope?.release || 0.005
                        }
                    }
                }))
            }));

            playbackServiceRef.current.setClips(processedClips);
        }
    }, [clips]);

    // Action creators with proper audio handling
    const play = useCallback(() => {
        // Initialize audio system before starting playback
        keyboardAudioManager.initialize().then(() => {
            dispatch(startPlayback());
        }).catch(error => {
            console.error('Failed to initialize audio:', error);
        });
    }, [dispatch]);

    const stop = useCallback(() => {
        dispatch(stopPlayback());
    }, [dispatch]);

    const seek = useCallback((time: number) => {
        dispatch(setPlaybackPosition(time));
        // Ensure audio playback position is updated
        playbackServiceRef.current?.seek(time);
    }, [dispatch]);

    const updateTempo = useCallback((newTempo: number) => {
        dispatch(setTempo(newTempo));
    }, [dispatch]);

    // Return state and actions with consistent interface
    return {
        // Playback state
        isPlaying,
        currentTime,
        tempo,

        // Playback controls
        play,
        stop,
        seek,
        updatePosition: (time: number) => dispatch(updatePlaybackPosition(time)),
        setTempo: updateTempo
    };
};