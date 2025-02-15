// src/features/player/services/playback.service.ts

import { TIMING } from '../utils/time.utils';
import keyboardAudioManager from '../../../features/audio/engine/synthesis/keyboardEngine';
import type { NoteEvent } from '../types';
import {Track} from "../store/player";

export interface PlaybackEvents {
    onPositionChange?: (positionInMs: number) => void;
    onPlaybackStart?: () => void;
    onPlaybackStop?: () => void;
    onError?: (error: Error) => void;
}

// Core state needed for playback timing
interface PlaybackState {
    audioContext: AudioContext;
    startTime: number;        // Reference point for audio timing
    tempo: number;           // Current tempo in BPM
    lastScheduledTime: number; // Last time we scheduled notes
}

interface ScheduledNote {
    id: string;
    note: NoteEvent;
    trackId: string;
    absoluteStartTime: number;
}

export class PlaybackService {
    private state: PlaybackState | null = null;
    private isPlaying: boolean = false;
    private tracks: Track[] = [];
    private scheduledNotes: ScheduledNote[] = [];
    private schedulerTimer: number | null = null;
    private animationFrameId: number | null = null;

    // The wall clock time when playback started - used for timeline marker
    private playbackStartTime: number = 0;

    // Constants for timing system
    private readonly SCHEDULE_AHEAD_TIME = 0.1;  // Schedule audio 100ms ahead
    private readonly SCHEDULER_INTERVAL = 25;    // Check for notes every 25ms

    constructor(private events: PlaybackEvents = {}) {}

    public async start(startTimeInMs: number = 0) {
        if (this.isPlaying) return;

        try {
            // Initialize audio system
            await keyboardAudioManager.initialize();
            const audioContext = keyboardAudioManager.getContext();
            if (!audioContext) throw new Error('No audio context');

            if (audioContext.state !== 'running') {
                await audioContext.resume();
            }

            // Set up timing system - we use two different time bases:
            // 1. Wall clock time (performance.now) for visual updates
            // 2. Audio context time for precise audio scheduling
            this.playbackStartTime = performance.now() - startTimeInMs;
            const startTimeInSeconds = startTimeInMs / 1000;

            this.state = {
                audioContext,
                startTime: audioContext.currentTime - startTimeInSeconds,
                tempo: TIMING.DEFAULT_TEMPO,
                lastScheduledTime: audioContext.currentTime
            };

            this.isPlaying = true;
            this.scheduledNotes = [];

            // Start our two main systems
            this.startScheduler();       // For audio playback
            this.startTimelineUpdate();  // For visual timeline

            this.events.onPlaybackStart?.();

        } catch (error) {
            console.error('Playback start error:', error);
            this.events.onError?.(error instanceof Error ? error : new Error('Failed to start playback'));
        }
    }

    // Visual timeline update system using requestAnimationFrame for smooth animation
    private startTimelineUpdate() {
        const updateTimeline = () => {
            if (!this.isPlaying || !this.state) return;

            // Calculate tempo-adjusted position
            const rawTime = performance.now() - this.playbackStartTime;
            const tempoScaleFactor = TIMING.DEFAULT_TEMPO / this.state.tempo;
            const adjustedTime = rawTime * tempoScaleFactor;

            this.events.onPositionChange?.(adjustedTime);
            this.animationFrameId = requestAnimationFrame(updateTimeline);
        };

        this.animationFrameId = requestAnimationFrame(updateTimeline);
    }

    // Audio scheduling system that looks ahead to schedule upcoming notes
    private startScheduler() {
        if (!this.state || !this.isPlaying) return;

        const currentTime = this.state.audioContext.currentTime;
        const scheduleUntil = currentTime + this.SCHEDULE_AHEAD_TIME;

        // Process each track's notes for scheduling
        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                const absoluteStartTime = this.state!.startTime + (note.timestamp / 1000);
                const scheduleId = `${track.id}-${note.id}-${absoluteStartTime.toFixed(3)}`;

                // Schedule notes within our look-ahead window
                if (absoluteStartTime >= this.state!.lastScheduledTime &&
                    absoluteStartTime < scheduleUntil &&
                    !this.isNoteScheduled(scheduleId)) {
                    this.scheduleNote(note, track.id, absoluteStartTime, scheduleId);
                }
            });
        });

        // Clean up notes that have already played
        this.scheduledNotes = this.scheduledNotes.filter(
            scheduled => scheduled.absoluteStartTime >= currentTime
        );

        // Update scheduling window and continue
        this.state.lastScheduledTime = scheduleUntil;
        this.schedulerTimer = window.setTimeout(
            () => this.startScheduler(),
            this.SCHEDULER_INTERVAL
        );
    }

    private scheduleNote(note: NoteEvent, trackId: string, absoluteStartTime: number, scheduleId: string) {
        try {
            const previousMode = keyboardAudioManager.getCurrentMode();

            // Calculate tempo-adjusted timing
            const tempoScaleFactor = TIMING.DEFAULT_TEMPO / this.state!.tempo;
            const adjustedStartTime = absoluteStartTime * tempoScaleFactor;
            const adjustedDuration = (note.duration / 1000) * tempoScaleFactor;

            // Configure synthesis for this note
            if (note.synthesis.mode === 'tunable') {
                keyboardAudioManager.setMode('tunable');

                if (note.tuning !== undefined) {
                    keyboardAudioManager.setNoteTuning(note.note, note.tuning);
                }

                if (note.synthesis.waveform) {
                    keyboardAudioManager.setNoteWaveform(note.note, note.synthesis.waveform);
                }
            } else {
                keyboardAudioManager.setMode('drums');
            }

            // Schedule the note to play with adjusted timing
            keyboardAudioManager.playExactNote({
                ...note,
                timestamp: adjustedStartTime,
                duration: adjustedDuration,
                synthesis: {
                    ...note.synthesis,
                    envelope: {
                        ...note.synthesis.envelope,
                        attack: 0.005,
                        decay: 0,
                        sustain: 1,
                        release: 0.005
                    }
                }
            }, adjustedStartTime);

            // Remember that we scheduled this note with adjusted timing
            this.scheduledNotes.push({
                id: scheduleId,
                note,
                trackId,
                absoluteStartTime: adjustedStartTime
            });

            // Restore previous synthesis state
            keyboardAudioManager.setMode(previousMode);
            if (note.synthesis.mode === 'tunable' && note.tuning !== undefined) {
                keyboardAudioManager.setNoteTuning(note.note, 0);
            }

        } catch (error) {
            console.error('Note scheduling failed:', {
                note: note.note,
                time: absoluteStartTime,
                error
            });
        }
    }

    public stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.cleanupTimers();
        this.scheduledNotes = [];
        this.events.onPlaybackStop?.();
    }

    public setTracks(tracks: Track[]) {
        console.log('Setting tracks:', tracks.map(track => ({
            id: track.id,
            noteCount: track.notes.length
        })));
        this.tracks = tracks;
    }

    private isNoteScheduled(scheduleId: string): boolean {
        return this.scheduledNotes.some(scheduled => scheduled.id === scheduleId);
    }

    public getCurrentTimeInMs(): number {
        // Use wall clock time for smooth visual timing
        if (!this.isPlaying) return 0;
        return performance.now() - this.playbackStartTime;
    }

    public setTempo(newTempo: number) {
        if (!this.state) return;

        const currentTime = this.getCurrentTimeInMs();
        const oldTempo = this.state.tempo;
        this.state.tempo = newTempo;

        // Adjust timing system for new tempo while maintaining position
        const tempoRatio = oldTempo / newTempo;
        this.playbackStartTime = performance.now() - (currentTime * tempoRatio);
        this.state.startTime = this.state.audioContext.currentTime - ((currentTime * tempoRatio) / 1000);
        this.state.lastScheduledTime = this.state.audioContext.currentTime;

        // Clear scheduled notes to prevent timing conflicts
        this.scheduledNotes = [];

        console.log('Tempo changed:', {
            from: oldTempo,
            to: newTempo,
            adjustmentRatio: tempoRatio
        });
    }

    public seek(timeInMs: number) {
        if (!this.state) return;

        // Update wall clock timing
        this.playbackStartTime = performance.now() - timeInMs;

        // Update audio scheduling system
        this.state.startTime = this.state.audioContext.currentTime - (timeInMs / 1000);
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = [];

        // Notify of position change
        this.events.onPositionChange?.(timeInMs);
    }

    private cleanupTimers() {
        if (this.schedulerTimer !== null) {
            window.clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    public dispose() {
        this.stop();
        this.state = null;
    }
}