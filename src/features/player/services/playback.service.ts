// src/features/player/services/playback.service.ts

import { TIMING } from '../utils/time.utils';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';
import type { Clip, NoteEvent } from '../types';

export interface PlaybackEvents {
    onPositionChange?: (positionInTicks: number) => void;
    onPlaybackStart?: () => void;
    onPlaybackStop?: () => void;
    onError?: (error: Error) => void;
}

interface PlaybackState {
    audioContext: AudioContext;
    startTime: number;
    tempo: number;
    lastScheduledTime: number;
}

interface ScheduledNote {
    id: string;         // Unique ID for this scheduling instance
    note: NoteEvent;
    clipStartTicks: number;
    absoluteStartTime: number;
}

export class PlaybackService {
    // Core state
    private state: PlaybackState | null = null;
    private isPlaying: boolean = false;
    private clips: (Clip & { startTicks: number })[] = [];

    // Scheduling state
    private scheduledNotes: ScheduledNote[] = [];
    private schedulerTimer: number | null = null;
    private updateTimer: number | null = null;

    // Constants
    private readonly SCHEDULE_AHEAD_TIME = 0.1;  // Look ahead window in seconds
    private readonly SCHEDULER_INTERVAL = 25;    // How often to check for notes to schedule (ms)
    private readonly UPDATE_INTERVAL = 16;       // Visual update rate (60fps)

    constructor(private events: PlaybackEvents = {}) {}

    public async start(startTimeInTicks: number = 0) {
        if (this.isPlaying) return;

        try {
            // Initialize audio system
            await keyboardAudioManager.initialize();
            const audioContext = keyboardAudioManager.getContext();
            if (!audioContext) throw new Error('No audio context');

            // Ensure audio context is running
            if (audioContext.state !== 'running') {
                await audioContext.resume();
            }

            // Calculate starting time in seconds
            const startTimeInSeconds = TIMING.ticksToMs(startTimeInTicks, TIMING.DEFAULT_TEMPO) / 1000;

            // Initialize playback state
            this.state = {
                audioContext,
                startTime: audioContext.currentTime - startTimeInSeconds,
                tempo: TIMING.DEFAULT_TEMPO,
                lastScheduledTime: audioContext.currentTime
            };

            // Start playback
            this.isPlaying = true;
            this.scheduledNotes = [];

            // Start scheduling and UI updates
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

        // Clear all timers and state
        this.isPlaying = false;
        if (this.schedulerTimer !== null) {
            window.clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        if (this.updateTimer !== null) {
            window.clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        // Clean up scheduled notes
        this.scheduledNotes = [];
        this.events.onPlaybackStop?.();
    }

    public setClips(clips: Clip[]) {
        // Convert grid cells to ticks for precise timing
        this.clips = clips.map(clip => ({
            ...clip,
            startTicks: TIMING.cellsToTicks(clip.startCell)
        }));
    }

    private scheduler() {
        if (!this.state || !this.isPlaying) return;

        const currentTime = this.state.audioContext.currentTime;
        const scheduleUntil = currentTime + this.SCHEDULE_AHEAD_TIME;

        // Schedule notes within our look-ahead window
        this.clips.forEach(clip => {
            clip.notes.forEach(note => {
                const noteStartTicks = clip.startTicks + TIMING.msToTicks(note.timestamp, this.state.tempo);
                const noteStartSeconds = TIMING.ticksToMs(noteStartTicks, this.state.tempo) / 1000;
                const absoluteStartTime = this.state.startTime + noteStartSeconds;

                // Generate unique ID for this scheduled instance
                const scheduleId = `${clip.id}-${note.id}-${absoluteStartTime.toFixed(3)}`;

                // Only schedule notes within our window that haven't been scheduled yet
                if (absoluteStartTime >= this.state.lastScheduledTime &&
                    absoluteStartTime < scheduleUntil &&
                    !this.isNoteScheduled(scheduleId)) {

                    try {
                        // Store current synth mode
                        const previousMode = keyboardAudioManager.getCurrentMode();

                        // Configure synthesis
                        if (note.synthesis.mode === 'tunable') {
                            keyboardAudioManager.setMode('tunable');

                            // Set the tuning before playing the note
                            if (note.tuning !== undefined) {
                                keyboardAudioManager.setNoteTuning(note.note, note.tuning);
                                console.log('Setting tuning for playback:', {
                                    note: note.note,
                                    tuning: note.tuning,
                                    time: absoluteStartTime
                                });
                            }

                            // Set waveform if specified
                            if (note.synthesis.waveform) {
                                keyboardAudioManager.setNoteWaveform(
                                    note.note,
                                    note.synthesis.waveform
                                );
                            }
                        } else {
                            keyboardAudioManager.setMode('drums');
                        }

                        // Schedule the note with precise timing
                        keyboardAudioManager.playExactNote({
                            ...note,
                            timestamp: absoluteStartTime,
                            duration: TIMING.ticksToMs(note.duration || 0, this.state.tempo) / 1000,
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

                        // Track scheduled note
                        this.scheduledNotes.push({
                            id: scheduleId,
                            note,
                            clipStartTicks: clip.startTicks,
                            absoluteStartTime
                        });

                        // Restore previous synth mode
                        keyboardAudioManager.setMode(previousMode);

                        // Reset tuning after playing if we set it
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

            const position = this.getCurrentTimeInTicks();
            this.events.onPositionChange?.(position);
        }, this.UPDATE_INTERVAL);
    }

    public getCurrentTimeInTicks(): number {
        if (!this.state || !this.isPlaying) return 0;

        const currentTime = this.state.audioContext.currentTime;
        const elapsedSeconds = currentTime - this.state.startTime;
        return TIMING.msToTicks(elapsedSeconds * 1000, this.state.tempo);
    }

    public setTempo(newTempo: number) {
        if (!this.state) return;

        // Calculate current position before tempo change
        const currentTicks = this.getCurrentTimeInTicks();

        // Update tempo and recalculate start time to maintain position
        this.state.tempo = newTempo;
        const newStartTimeSeconds = this.state.audioContext.currentTime -
            (TIMING.ticksToMs(currentTicks, newTempo) / 1000);

        this.state.startTime = newStartTimeSeconds;
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = []; // Clear scheduled notes to prevent duplicates
    }

    public seek(positionInTicks: number) {
        if (!this.state) return;

        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.stop();
        }

        // Calculate new start time
        const newStartTimeSeconds = this.state.audioContext.currentTime -
            (TIMING.ticksToMs(positionInTicks, this.state.tempo) / 1000);

        this.state.startTime = newStartTimeSeconds;
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = [];

        if (wasPlaying) {
            this.start(positionInTicks);
        }

        this.events.onPositionChange?.(positionInTicks);
    }

    public dispose() {
        this.stop();
        this.state = null;
    }
}