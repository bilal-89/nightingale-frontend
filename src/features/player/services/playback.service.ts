// src/features/player/services/playback.service.ts

import { TIMING } from '../utils/time.utils';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';
import type { Clip, NoteEvent } from '../types';

// Interface defining the callbacks that allow the service to communicate state changes
export interface PlaybackEvents {
    onPositionChange?: (positionInTicks: number) => void;
    onPlaybackStart?: () => void;
    onPlaybackStop?: () => void;
    onError?: (error: Error) => void;
}

// Core state needed for audio playback timing
interface PlaybackState {
    audioContext: AudioContext;      // Web Audio context for timing and playback
    startTime: number;              // When playback began (in audio context time)
    tempo: number;                  // Current tempo in BPM
    lastScheduledTime: number;      // Last time we scheduled notes
}

// Represents a note that has been scheduled for playback
interface ScheduledNote {
    id: string;                    // Unique identifier for this scheduled instance
    note: NoteEvent;               // The note to be played
    clipStartTime: number;         // When the parent clip starts
    absoluteStartTime: number;      // Exact playback time in audio context time
}

export class PlaybackService {
    // Core state management
    private state: PlaybackState | null = null;
    private isPlaying: boolean = false;
    private clips: Clip[] = [];

    // Scheduling management
    private scheduledNotes: ScheduledNote[] = [];
    private schedulerTimer: number | null = null;
    private updateTimer: number | null = null;

    // Timing constants for stable audio playback
    private readonly SCHEDULE_AHEAD_TIME = 0.1;  // Schedule 100ms ahead for stability
    private readonly SCHEDULER_INTERVAL = 25;    // Check for notes every 25ms
    private readonly UPDATE_INTERVAL = 16;       // Update UI at ~60fps

    constructor(private events: PlaybackEvents = {}) {}

    public async start(startTimeInMs: number = 0) {
        if (this.isPlaying) return;

        try {
            // Initialize and ensure audio system is ready
            await keyboardAudioManager.initialize();
            const audioContext = keyboardAudioManager.getContext();
            if (!audioContext) throw new Error('No audio context');

            if (audioContext.state !== 'running') {
                await audioContext.resume();
            }

            // Convert our start time to seconds for the audio context
            const startTimeInSeconds = startTimeInMs / 1000;

            // Initialize our playback state
            this.state = {
                audioContext,
                startTime: audioContext.currentTime - startTimeInSeconds,
                tempo: TIMING.DEFAULT_TEMPO,
                lastScheduledTime: audioContext.currentTime
            };

            // Start playback systems
            this.isPlaying = true;
            this.scheduledNotes = [];
            this.scheduler();
            this.startPositionUpdates();
            this.events.onPlaybackStart?.();

        } catch (error) {
            console.error('Playback start error:', error);
            this.events.onError?.(error instanceof Error ? error : new Error('Failed to start playback'));
        }
    }

    public stop() {
        if (!this.isPlaying) return;

        // Clean up all ongoing processes
        this.isPlaying = false;
        if (this.schedulerTimer !== null) {
            window.clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        if (this.updateTimer !== null) {
            window.clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        this.scheduledNotes = [];
        this.events.onPlaybackStop?.();
    }

    public setClips(clips: Clip[]) {
        console.log('Setting clips:', clips.map(clip => ({
            id: clip.id,
            startTime: clip.startTime,
            duration: clip.duration,
            noteCount: clip.notes.length
        })));

        this.clips = clips;
    }

    private scheduler() {
        if (!this.state || !this.isPlaying) return;

        const currentTime = this.state.audioContext.currentTime;
        const scheduleUntil = currentTime + this.SCHEDULE_AHEAD_TIME;

        // Schedule all notes that fall within our look-ahead window
        this.clips.forEach(clip => {
            clip.notes.forEach(note => {
                // Calculate absolute time for this note based on clip position
                const clipTimeOffset = clip.startTime / 1000; // Convert to seconds
                const noteTimeOffset = note.timestamp / 1000;
                const absoluteStartTime = this.state.startTime + clipTimeOffset + noteTimeOffset;

                // Create unique identifier for this scheduled instance
                const scheduleId = `${clip.id}-${note.id}-${absoluteStartTime.toFixed(3)}`;

                // Only schedule if the note falls within our window and hasn't been scheduled
                if (absoluteStartTime >= this.state.lastScheduledTime &&
                    absoluteStartTime < scheduleUntil &&
                    !this.isNoteScheduled(scheduleId)) {

                    try {
                        // Handle synth mode changes
                        const previousMode = keyboardAudioManager.getCurrentMode();

                        if (note.synthesis.mode === 'tunable') {
                            keyboardAudioManager.setMode('tunable');

                            // Apply note-specific tuning
                            if (note.tuning !== undefined) {
                                keyboardAudioManager.setNoteTuning(note.note, note.tuning);
                            }

                            // Apply waveform if specified
                            if (note.synthesis.waveform) {
                                keyboardAudioManager.setNoteWaveform(
                                    note.note,
                                    note.synthesis.waveform
                                );
                            }
                        } else {
                            keyboardAudioManager.setMode('drums');
                        }

                        // Schedule the note
                        keyboardAudioManager.playExactNote({
                            ...note,
                            timestamp: absoluteStartTime,
                            duration: note.duration / 1000, // Convert to seconds
                            synthesis: {
                                ...note.synthesis,
                                envelope: {
                                    attack: 0.005,
                                    decay: 0,
                                    sustain: 1,
                                    release: 0.005,
                                    ...note.synthesis.envelope
                                }
                            }
                        }, absoluteStartTime);

                        // Track this scheduled note
                        this.scheduledNotes.push({
                            id: scheduleId,
                            note,
                            clipStartTime: clip.startTime,
                            absoluteStartTime
                        });

                        // Restore previous synth settings
                        keyboardAudioManager.setMode(previousMode);
                        if (note.synthesis.mode === 'tunable' && note.tuning !== undefined) {
                            keyboardAudioManager.setNoteTuning(note.note, 0);
                        }

                    } catch (error) {
                        console.error('Note scheduling failed:', {
                            error,
                            note: note.note,
                            time: absoluteStartTime
                        });
                    }
                }
            });
        });

        // Clean up completed notes
        this.scheduledNotes = this.scheduledNotes.filter(
            scheduled => scheduled.absoluteStartTime >= currentTime
        );

        // Schedule next check
        this.state.lastScheduledTime = scheduleUntil;
        this.schedulerTimer = window.setTimeout(
            () => this.scheduler(),
            this.SCHEDULER_INTERVAL
        );
    }

    private isNoteScheduled(scheduleId: string): boolean {
        return this.scheduledNotes.some(scheduled => scheduled.id === scheduleId);
    }

    private startPositionUpdates() {
        this.updateTimer = window.setInterval(() => {
            if (!this.isPlaying) {
                if (this.updateTimer !== null) {
                    window.clearInterval(this.updateTimer);
                    this.updateTimer = null;
                }
                return;
            }

            // We need to convert our time to match what the visual timeline expects
            const currentTimeMs = this.getCurrentTimeInMs();
            // Use updatePlaybackPosition to update the Redux state
            this.events.onPositionChange?.(currentTimeMs);
        }, this.UPDATE_INTERVAL);
    }

    public getCurrentTimeInMs(): number {
        if (!this.state || !this.isPlaying) return 0;

        // Calculate elapsed time since playback started
        const currentTime = this.state.audioContext.currentTime;
        const elapsedSeconds = currentTime - this.state.startTime;
        // Convert to milliseconds for our continuous timing system
        return elapsedSeconds * 1000;
    }

    public setTempo(newTempo: number) {
        if (!this.state) return;

        // Store current position
        const currentTime = this.getCurrentTimeInMs();

        // Update tempo and maintain position
        this.state.tempo = newTempo;
        const newStartTimeSeconds = this.state.audioContext.currentTime - (currentTime / 1000);

        this.state.startTime = newStartTimeSeconds;
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = []; // Clear scheduled notes to prevent duplicates
    }

    public seek(timeInMs: number) {
        if (!this.state) return;

        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.stop();
        }

        // Calculate new start time based on seek position
        const newStartTimeSeconds = this.state.audioContext.currentTime - (timeInMs / 1000);

        this.state.startTime = newStartTimeSeconds;
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = [];

        if (wasPlaying) {
            this.start(timeInMs);
        }

        this.events.onPositionChange?.(timeInMs);
    }

    public dispose() {
        this.stop();
        this.state = null;
    }
}