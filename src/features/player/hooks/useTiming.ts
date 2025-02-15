// src/features/player/hooks/useTiming.ts

import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { TimingService } from '../services/timing.service';
import {
    updatePlaybackPosition,
    setTempo,
    selectTempo,
    selectIsPlaying,
    selectCurrentTime
} from '../store/playback';
import { selectTracks } from '../store/player';

import keyboardAudioManager from '../../../../src/features/audio/engine/synthesis/keyboardEngine';
import { NoteEvent } from '../types';

export const useTiming = () => {
    const dispatch = useAppDispatch();
    const isPlaying = useAppSelector(selectIsPlaying);
    const currentTime = useAppSelector(selectCurrentTime);
    const tempo = useAppSelector(selectTempo);
    const tracks = useAppSelector(selectTracks);

    // Core system references
    const timingServiceRef = useRef<TimingService | null>(null);
    const scheduledNotesRef = useRef<Set<string>>(new Set());

    // Tuning state management
    const keyboardTuningRef = useRef<Map<number, number>>(new Map());

    // Save current tuning state for a specific note
    const saveTuningState = useCallback((note: number, tuning: number) => {
        keyboardTuningRef.current.set(note, tuning);
    }, []);

    // Restore tuning state for a specific note
    const restoreTuningState = useCallback((note: number) => {
        const savedTuning = keyboardTuningRef.current.get(note) ?? 0;
        keyboardAudioManager.setNoteParameter(note, 'tuning', savedTuning);
        return savedTuning;
    }, []);

    // Tempo management
    const setTempoAndUpdateService = useCallback((newTempo: number) => {
        const boundedTempo = Math.max(20, Math.min(300, newTempo));
        if (timingServiceRef.current) {
            console.log('Updating timing service tempo:', boundedTempo);
            timingServiceRef.current.setTempo(boundedTempo);
        }
        dispatch(setTempo(boundedTempo));
    }, [dispatch]);

    // Effect to sync TimingService with tempo changes
    useEffect(() => {
        if (timingServiceRef.current) {
            console.log('Syncing timing service with tempo:', tempo);
            timingServiceRef.current.setTempo(tempo);
        }
    }, [tempo]);

    // Schedule upcoming notes for playback
    const scheduleUpcomingNotes = useCallback((windowStartSeconds: number, windowEndSeconds: number) => {
        const audioContext = keyboardAudioManager.getContext();
        if (!isPlaying || !audioContext) return;

        const currentAudioTime = audioContext.currentTime;

        tracks.forEach(track => {
            track.notes.forEach((note: NoteEvent) => {
                const noteId = `${note.id}-${note.timestamp}`;
                const noteTimeInSeconds = note.timestamp / 1000;

                if (!scheduledNotesRef.current.has(noteId) &&
                    noteTimeInSeconds >= windowStartSeconds &&
                    noteTimeInSeconds < windowEndSeconds) {

                    const scheduleTime = currentAudioTime + (noteTimeInSeconds - windowStartSeconds);

                    // Resolve tuning value with proper fallbacks
                    const tuningValue = note.tuning ?? keyboardTuningRef.current.get(note.note) ?? 0;

                    // Prepare complete synthesis settings
                    const synthSettings = {
                        ...note.synthesis,  // Spread existing synthesis first
                        mode: note.synthesis?.mode || 'tunable',
                        waveform: note.synthesis?.waveform || 'sine',
                        tuning: tuningValue,
                        envelope: {
                            attack: note.synthesis?.envelope?.attack || 0.005,
                            decay: note.synthesis?.envelope?.decay || 0.1,
                            sustain: note.synthesis?.envelope?.sustain || 0.7,
                            release: note.synthesis?.envelope?.release || 0.1
                        }
                    };

                    // Log for debugging
                    console.log('Scheduling note:', {
                        note: note.note,
                        tuning: tuningValue,
                        savedTuning: keyboardTuningRef.current.get(note.note),
                        recordedTuning: note.tuning,
                        tempo: tempo  // Log current tempo for debugging
                    });

                    // Set up note tuning before playback
                    keyboardAudioManager.setNoteParameter(note.note, 'tuning', tuningValue);

                    // Schedule the note with tempo-adjusted timing
                    keyboardAudioManager.playExactNote({
                        ...note,
                        timestamp: scheduleTime,
                        duration: note.duration / 1000,
                        synthesis: synthSettings
                    }, scheduleTime);

                    // Restore original keyboard tuning after scheduling
                    restoreTuningState(note.note);

                    scheduledNotesRef.current.add(noteId);
                }
            });
        });
    }, [isPlaying, tracks, restoreTuningState, tempo]);  // Added tempo to dependencies

    // Initialize timing service
    useEffect(() => {
        if (!timingServiceRef.current) {
            timingServiceRef.current = new TimingService(
                {
                    scheduleAheadTime: 0.1,
                    schedulerInterval: 25,
                    visualRefreshRate: 16.67
                },
                {
                    onScheduleNotes: scheduleUpcomingNotes,
                    onTick: (currentTimeMs) => {
                        dispatch(updatePlaybackPosition(currentTimeMs));
                    }
                },
                tempo  // Pass initial tempo to TimingService
            );
        }

        return () => {
            if (timingServiceRef.current) {
                timingServiceRef.current.dispose();
                timingServiceRef.current = null;
            }
        };
    }, [scheduleUpcomingNotes, dispatch, tempo]);  // Added tempo to dependencies

    // Handle playback state changes
    useEffect(() => {
        const setupPlayback = async () => {
            try {
                if (isPlaying) {
                    await keyboardAudioManager.initialize();

                    if (timingServiceRef.current) {
                        await timingServiceRef.current.initialize();
                        timingServiceRef.current.start(currentTime);
                    }
                } else {
                    if (timingServiceRef.current) {
                        timingServiceRef.current.stop();
                    }
                    // Restore all keyboard tuning states when stopping
                    Array.from(keyboardTuningRef.current.entries()).forEach(
                        ([note, tuning]) => keyboardAudioManager.setNoteParameter(note, 'tuning', tuning)
                    );
                    scheduledNotesRef.current.clear();
                }
            } catch (error) {
                console.error('Playback setup error:', error);
                if (timingServiceRef.current) {
                    timingServiceRef.current.stop();
                }
                scheduledNotesRef.current.clear();
            }
        };

        setupPlayback();
    }, [isPlaying, currentTime]);

    return {
        setTempo: setTempoAndUpdateService,  // Use the new combined tempo update function
        getCurrentTime: useCallback(() => {
            if (!isPlaying) return currentTime;
            return timingServiceRef.current?.getCurrentTime() ?? currentTime;
        }, [isPlaying, currentTime]),
        saveTuningState,
        restoreTuningState
    };
};