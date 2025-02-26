// src/features/player/services/playback.service.ts

import { TIMING } from '../utils/time.utils';
import keyboardAudioManager from '../../../features/audio/engine/synthesis/keyboardEngine';
import type { NoteEvent } from '../types';
import {Track} from "../store/player/types/track";

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
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    loopIteration: number;   // Track how many times we've looped
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
                lastScheduledTime: audioContext.currentTime,
                loopEnabled: false,
                loopStart: 0,
                loopEnd: 60 * 1000, // Default 60 seconds
                loopIteration: 0
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
            let adjustedTime = rawTime * tempoScaleFactor;

            // Handle looping
            if (this.state.loopEnabled && adjustedTime >= this.state.loopEnd) {
                // Reset timing when loop point is reached
                const loopDuration = this.state.loopEnd - this.state.loopStart;
                const timeIntoLoop = (adjustedTime - this.state.loopStart) % loopDuration;
                adjustedTime = this.state.loopStart + timeIntoLoop;
                
                // Update playback start time to maintain loop position
                const newRawTime = adjustedTime / tempoScaleFactor;
                this.playbackStartTime = performance.now() - newRawTime;
            }

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

        // Get current playback position in milliseconds
        const currentPositionMs = this.getCurrentTimeInMs();

        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                if (!this.state) return;

                const noteTimestampMs = note.timestamp;
                
                // Handle looping logic
                if (this.state.loopEnabled) {
                    // Skip notes outside the loop region
                    if (noteTimestampMs < this.state.loopStart || noteTimestampMs >= this.state.loopEnd) {
                        return;
                    }

                    const loopDuration = this.state.loopEnd - this.state.loopStart;
                    const currentLoopIteration = Math.floor((currentPositionMs - this.state.loopStart) / loopDuration);
                    
                    // Schedule this note for the current iteration and the next TWO iterations
                    // This ensures continuous playback across loop boundaries
                    for (let iteration = currentLoopIteration; iteration <= currentLoopIteration + 2; iteration++) {
                        // Calculate the effective timestamp for this iteration
                        const effectiveTimestamp = noteTimestampMs - this.state.loopStart + (loopDuration * iteration);
                        
                        // Calculate absolute start time for the note
                        const absoluteStartTime = this.state.startTime + (effectiveTimestamp / 1000);
                        const scheduleId = `${track.id}-${note.id}-${iteration}-${absoluteStartTime.toFixed(3)}`;

                        // Only schedule if within our look-ahead window and not already scheduled
                        if (absoluteStartTime >= this.state.lastScheduledTime &&
                            absoluteStartTime < scheduleUntil &&
                            !this.isNoteScheduled(scheduleId)) {
                            
                            this.scheduleNote(note, track.id, absoluteStartTime, scheduleId);
                        }
                    }
                } else {
                    // Non-loop mode: schedule notes normally
                    const absoluteStartTime = this.state.startTime + (noteTimestampMs / 1000);
                    const scheduleId = `${track.id}-${note.id}-${absoluteStartTime.toFixed(3)}`;

                    if (absoluteStartTime >= this.state.lastScheduledTime &&
                        absoluteStartTime < scheduleUntil &&
                        !this.isNoteScheduled(scheduleId)) {
                        
                        this.scheduleNote(note, track.id, absoluteStartTime, scheduleId);
                    }
                }
            });
        });

        // Clean up notes that have already played, but keep more history for loop mode
        const historyWindow = this.state.loopEnabled ? 2 : 1;
        this.scheduledNotes = this.scheduledNotes.filter(
            scheduled => scheduled.absoluteStartTime >= currentTime - historyWindow
        );

        // Update scheduling window and continue
        this.state.lastScheduledTime = scheduleUntil;
        this.schedulerTimer = window.setTimeout(
            () => this.startScheduler(),
            this.SCHEDULER_INTERVAL
        );
    }

    private scheduleNote(note: NoteEvent, trackId: string, absoluteStartTime: number, scheduleId: string) {
        if (!this.state) return;
        
        try {
            const previousMode = keyboardAudioManager.getCurrentMode();

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

            // Calculate tempo-adjusted timing
            const tempoScaleFactor = TIMING.DEFAULT_TEMPO / this.state.tempo;
            const adjustedDuration = (note.duration / 1000) * tempoScaleFactor;

            console.log('Scheduling note:', {
                note: note.note,
                time: absoluteStartTime,
                audioContextTime: this.state.audioContext.currentTime,
                scheduleId
            });

            // Schedule the note to play
            keyboardAudioManager.playExactNote({
                ...note,
                timestamp: absoluteStartTime,
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
            }, absoluteStartTime);

            // Remember that we scheduled this note
            this.scheduledNotes.push({
                id: scheduleId,
                note,
                trackId,
                absoluteStartTime
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

    public getCurrentTimeInMs(): number {
        // Use wall clock time for smooth visual timing
        if (!this.isPlaying || !this.state) return 0;
        
        const rawTime = performance.now() - this.playbackStartTime;
        const tempoScaleFactor = TIMING.DEFAULT_TEMPO / this.state.tempo;
        let adjustedTime = rawTime * tempoScaleFactor;
        
        // Handle looping for accurate time reporting
        if (this.state.loopEnabled && adjustedTime >= this.state.loopEnd) {
            const loopDuration = this.state.loopEnd - this.state.loopStart;
            const timeIntoLoop = (adjustedTime - this.state.loopStart) % loopDuration;
            adjustedTime = this.state.loopStart + timeIntoLoop;
        }
        
        return adjustedTime;
    }

    public stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.cleanupTimers();
        this.scheduledNotes = [];
        this.events.onPlaybackStop?.();
    }

    public setTracks(tracks: Track[]) {
        this.tracks = tracks;
    }

    private isNoteScheduled(scheduleId: string): boolean {
        return this.scheduledNotes.some(scheduled => scheduled.id === scheduleId);
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

    public setLoopState(enabled: boolean, start?: number, end?: number) {
        if (!this.state) return;

        const wasEnabled = this.state.loopEnabled;
        this.state.loopEnabled = enabled;
        
        // Ensure we have valid loop points
        if (start !== undefined) this.state.loopStart = Math.max(0, start);
        if (end !== undefined) this.state.loopEnd = Math.max(this.state.loopStart + 100, end);
        
        // If we're enabling looping and current time is outside the loop region,
        // move playback position to the loop start
        if (enabled && !wasEnabled) {
            const currentTime = this.getCurrentTimeInMs();
            if (currentTime < this.state.loopStart || currentTime >= this.state.loopEnd) {
                this.seek(this.state.loopStart);
            }
        }

        // Reset scheduling when loop state changes
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = [];

        console.log('Loop state updated:', {
            enabled,
            wasEnabled,
            start: this.state.loopStart,
            end: this.state.loopEnd,
            currentTime: this.getCurrentTimeInMs()
        });
    }
}