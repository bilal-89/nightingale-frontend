// src/features/player/services/playback.service.ts

import { TIMING } from '../utils/time.utils';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';
import type { NoteEvent } from '../types';

export interface PlaybackEvents {
    onPositionChange?: (positionInMs: number) => void;
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
    private updateTimer: number | null = null;

    private readonly SCHEDULE_AHEAD_TIME = 0.1;
    private readonly SCHEDULER_INTERVAL = 25;
    private readonly UPDATE_INTERVAL = 16;

    constructor(private events: PlaybackEvents = {}) {}

    public async start(startTimeInMs: number = 0) {
        if (this.isPlaying) return;

        try {
            await keyboardAudioManager.initialize();
            const audioContext = keyboardAudioManager.getContext();
            if (!audioContext) throw new Error('No audio context');

            if (audioContext.state !== 'running') {
                await audioContext.resume();
            }

            const startTimeInSeconds = startTimeInMs / 1000;

            this.state = {
                audioContext,
                startTime: audioContext.currentTime - startTimeInSeconds,
                tempo: TIMING.DEFAULT_TEMPO,
                lastScheduledTime: audioContext.currentTime
            };

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

    public setTracks(tracks: Track[]) {
        console.log('Setting tracks:', tracks.map(track => ({
            id: track.id,
            noteCount: track.notes.length
        })));
        this.tracks = tracks;
    }

    private scheduler() {
        if (!this.state || !this.isPlaying) return;

        const currentTime = this.state.audioContext.currentTime;
        const scheduleUntil = currentTime + this.SCHEDULE_AHEAD_TIME;

        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                const absoluteStartTime = this.state!.startTime + (note.timestamp / 1000);
                const scheduleId = `${track.id}-${note.id}-${absoluteStartTime.toFixed(3)}`;

                if (absoluteStartTime >= this.state!.lastScheduledTime &&
                    absoluteStartTime < scheduleUntil &&
                    !this.isNoteScheduled(scheduleId)) {

                    try {
                        const previousMode = keyboardAudioManager.getCurrentMode();

                        if (note.synthesis.mode === 'tunable') {
                            keyboardAudioManager.setMode('tunable');

                            if (note.tuning !== undefined) {
                                keyboardAudioManager.setNoteTuning(note.note, note.tuning);
                            }

                            if (note.synthesis.waveform) {
                                keyboardAudioManager.setNoteWaveform(
                                    note.note,
                                    note.synthesis.waveform
                                );
                            }
                        } else {
                            keyboardAudioManager.setMode('drums');
                        }

                        keyboardAudioManager.playExactNote({
                            ...note,
                            timestamp: absoluteStartTime,
                            duration: note.duration / 1000,
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

                        this.scheduledNotes.push({
                            id: scheduleId,
                            note,
                            trackId: track.id,
                            absoluteStartTime
                        });

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

        this.scheduledNotes = this.scheduledNotes.filter(
            scheduled => scheduled.absoluteStartTime >= currentTime
        );

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

            const currentTimeMs = this.getCurrentTimeInMs();
            this.events.onPositionChange?.(currentTimeMs);
        }, this.UPDATE_INTERVAL);
    }

    public getCurrentTimeInMs(): number {
        if (!this.state || !this.isPlaying) return 0;
        const currentTime = this.state.audioContext.currentTime;
        const elapsedSeconds = currentTime - this.state.startTime;
        return elapsedSeconds * 1000;
    }

    public setTempo(newTempo: number) {
        if (!this.state) return;

        const currentTime = this.getCurrentTimeInMs();
        this.state.tempo = newTempo;
        const newStartTimeSeconds = this.state.audioContext.currentTime - (currentTime / 1000);

        this.state.startTime = newStartTimeSeconds;
        this.state.lastScheduledTime = this.state.audioContext.currentTime;
        this.scheduledNotes = [];
    }

    public seek(timeInMs: number) {
        if (!this.state) return;

        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            this.stop();
        }

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