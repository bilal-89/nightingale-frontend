// src/features/player/services/playback.service.ts

import { NoteEvent, Clip } from '../types';
import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';

// These timing constants help ensure smooth, glitch-free audio playback
const SCHEDULE_AHEAD_TIME = 0.1;   // Look ahead 100ms to schedule upcoming notes
const SCHEDULER_INTERVAL = 25;     // Run our scheduler every 25ms
const UPDATE_INTERVAL = 16;        // Update UI at ~60fps for smooth visualization

// Events interface lets components respond to playback state changes
export interface PlaybackEvents {
    onPositionChange?: (position: number) => void;
    onPlaybackStart?: () => void;
    onPlaybackStop?: () => void;
    onError?: (error: Error) => void;
}

export class PlaybackService {
    // Scheduling system manages precise timing of audio events
    private schedulerTimer: number | null;
    private updateTimer: number | null;
    private lastScheduleTime: number;
    private playbackStartTime: number;

    // Playback state tracks musical information
    private currentBPM: number;
    private isPlaying: boolean;
    private clips: Clip[];
    private currentPosition: number;
    private events: PlaybackEvents;

    constructor(events: PlaybackEvents = {}) {
        // Initialize timing system
        this.schedulerTimer = null;
        this.updateTimer = null;
        this.lastScheduleTime = 0;
        this.playbackStartTime = 0;

        // Initialize musical state
        this.currentBPM = 120;
        this.isPlaying = false;
        this.clips = [];
        this.currentPosition = 0;
        this.events = events;
    }

    public async start(startPosition: number = 0) {
        if (this.isPlaying) return;

        try {
            // Initialize audio system and ensure we have a context
            await keyboardAudioManager.initialize();
            const audioContext = keyboardAudioManager.getContext();
            if (!audioContext) throw new Error('No audio context');

            // Set up timing and playback state
            this.isPlaying = true;
            this.currentPosition = startPosition;
            this.playbackStartTime = audioContext.currentTime - startPosition;
            this.lastScheduleTime = audioContext.currentTime;

            // Start our scheduling systems
            this.scheduler();
            this.startPositionUpdates();
            this.events.onPlaybackStart?.();
        } catch (error) {
            this.events.onError?.(error instanceof Error ? error : new Error('Failed to start playback'));
        }
    }

    public stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        // Clean up all scheduling timers
        if (this.schedulerTimer !== null) {
            window.clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        if (this.updateTimer !== null) {
            window.clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        // Store final position before stopping
        const audioContext = keyboardAudioManager.getContext();
        if (audioContext) {
            this.currentPosition = audioContext.currentTime - this.playbackStartTime;
        }
        this.events.onPlaybackStop?.();
    }

    public getCurrentPosition(): number {
        if (!this.isPlaying) return this.currentPosition;

        const audioContext = keyboardAudioManager.getContext();
        if (!audioContext) return this.currentPosition;

        return audioContext.currentTime - this.playbackStartTime;
    }

    public seek(position: number) {
        this.currentPosition = position;
        if (this.isPlaying) {
            const audioContext = keyboardAudioManager.getContext();
            if (audioContext) {
                this.playbackStartTime = audioContext.currentTime - position;
                this.lastScheduleTime = audioContext.currentTime;
            }
        }
        this.events.onPositionChange?.(position);
    }

    public setTempo(bpm: number) {
        // Store position before tempo change to maintain musical position
        const currentPosition = this.getCurrentPosition();
        this.currentBPM = bpm;

        if (this.isPlaying) {
            const audioContext = keyboardAudioManager.getContext();
            if (audioContext) {
                this.playbackStartTime = audioContext.currentTime - currentPosition;
                this.lastScheduleTime = audioContext.currentTime;
            }
        }
    }

    public setClips(clips: Clip[]) {
        // Store clips with their complete synthesis information
        this.clips = clips.map(clip => ({
            ...clip,
            notes: clip.notes.map(note => ({
                ...note,
                // Ensure each note maintains its complete synthesis parameters
                synthesis: {
                    ...note.synthesis,
                    mode: note.synthesis.mode,
                    waveform: note.synthesis.waveform,
                    envelope: {
                        ...note.synthesis.envelope,
                        attack: note.synthesis.envelope.attack,
                        decay: note.synthesis.envelope.decay,
                        sustain: note.synthesis.envelope.sustain,
                        release: note.synthesis.envelope.release
                    },
                    effects: { ...note.synthesis.effects }
                }
            }))
        }));
    }

    private scheduler() {
        const audioContext = keyboardAudioManager.getContext();
        if (!audioContext || !this.isPlaying) return;

        const now = audioContext.currentTime;
        const scheduleEnd = now + SCHEDULE_AHEAD_TIME;

        // Process each clip's notes
        this.clips.forEach(clip => {
            const clipStartTime = (clip.startCell * 60) / (this.currentBPM * 4);

            clip.notes.forEach(noteEvent => {
                const absoluteStartTime = this.playbackStartTime +
                    clipStartTime + (noteEvent.timestamp / 1000);

                // Only schedule notes within our look-ahead window
                if (absoluteStartTime >= this.lastScheduleTime &&
                    absoluteStartTime < scheduleEnd) {
                    try {
                        // Log the note's intended waveform
                        console.log('Note event synthesis:', {
                            note: noteEvent.note,
                            waveform: noteEvent.synthesis.waveform,
                            mode: noteEvent.synthesis.mode,
                            timestamp: absoluteStartTime
                        });

                        // Store and log previous state
                        const previousMode = keyboardAudioManager.getCurrentMode();
                        console.log('Previous audio manager mode:', previousMode);

                        // Set up the exact synthesis state
                        if (noteEvent.synthesis.mode === 'tunable') {
                            keyboardAudioManager.setMode('tunable');
                            if (noteEvent.synthesis.waveform) {
                                console.log('Setting note waveform:', {
                                    note: noteEvent.note,
                                    waveform: noteEvent.synthesis.waveform
                                });
                                keyboardAudioManager.setNoteWaveform(noteEvent.note, noteEvent.synthesis.waveform);
                            }
                        } else {
                            keyboardAudioManager.setMode('drums');
                        }

                        // Play the note and log what we're sending
                        console.log('Playing note with settings:', {
                            note: noteEvent.note,
                            synthesis: noteEvent.synthesis,
                            time: absoluteStartTime
                        });

                        keyboardAudioManager.playExactNote({
                            ...noteEvent,
                            timestamp: absoluteStartTime,
                            duration: noteEvent.duration ? noteEvent.duration / 1000 : 0.1,
                            synthesis: {
                                ...noteEvent.synthesis,
                                mode: noteEvent.synthesis.mode,
                                waveform: noteEvent.synthesis.waveform,
                                envelope: {
                                    ...noteEvent.synthesis.envelope,
                                    attack: noteEvent.synthesis.envelope.attack,
                                    decay: noteEvent.synthesis.envelope.decay,
                                    sustain: noteEvent.synthesis.envelope.sustain,
                                    release: noteEvent.synthesis.envelope.release
                                },
                                effects: { ...noteEvent.synthesis.effects }
                            }
                        }, absoluteStartTime);

                        // Log state restoration
                        console.log('Restoring mode to:', previousMode);
                        keyboardAudioManager.setMode(previousMode);
                    } catch (error) {
                        console.error('Failed to schedule note:', error);
                    }
                }
            });
        });

        this.lastScheduleTime = scheduleEnd;
        this.schedulerTimer = window.setTimeout(
            () => this.scheduler(),
            SCHEDULER_INTERVAL
        );
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

            const position = this.getCurrentPosition();
            this.events.onPositionChange?.(position);
        }, UPDATE_INTERVAL);
    }

    public dispose() {
        this.stop();
    }
}