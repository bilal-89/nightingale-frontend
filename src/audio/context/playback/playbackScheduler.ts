// src/audio/context/playback/PlaybackScheduler.ts

import keyboardAudioManager from '../keyboard/keyboardAudioManager';
import { CompleteNoteEvent } from '../../../types/audioTypes';

const SCHEDULE_AHEAD_TIME = 0.1;  // How far ahead to schedule audio
const SCHEDULE_INTERVAL = 25;      // How frequently to check for notes to schedule

export class PlaybackScheduler {
    private audioContext: AudioContext | null = null;
    private schedulerInterval: number | null = null;
    private animationFrame: number | null = null;
    private scheduledNotes: Map<string, CompleteNoteEvent & { absoluteTime: number }> = new Map();
    private lastScheduleTime: number = 0;
    private playbackStartTime: number = 0;
    private onTimeUpdate: ((time: number) => void) | null = null;
    private onSchedulerError: ((error: Error) => void) | null = null;

    private debug(message: string, data?: any) {
        console.log(`[Playback Scheduler] ${message}`, data || '');
    }

    async initialize() {
        try {
            await keyboardAudioManager.initialize();
            this.audioContext = keyboardAudioManager.getContext();
            this.debug('Initialized with audio context', { sampleRate: this.audioContext?.sampleRate });
        } catch (error) {
            this.debug('Failed to initialize', error);
            throw error;
        }
    }

    setCallbacks(callbacks: {
        onTimeUpdate?: (time: number) => void,
        onSchedulerError?: (error: Error) => void
    }) {
        this.onTimeUpdate = callbacks.onTimeUpdate || null;
        this.onSchedulerError = callbacks.onSchedulerError || null;
    }

    scheduleClip(clip: {
        id: string,
        startTime: number,
        notes: CompleteNoteEvent[]
    }) {
        this.debug('Scheduling clip', { id: clip.id, startTime: clip.startTime });

        clip.notes.forEach(note => {
            const absoluteTime = clip.startTime + (note.timestamp / 1000);
            const noteId = `${clip.id}-${note.timestamp}`;

            this.scheduledNotes.set(noteId, {
                ...note,
                absoluteTime
            });
        });
    }

    private scheduleUpcomingNotes() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const scheduleEnd = now + SCHEDULE_AHEAD_TIME;

        // Schedule all notes that fall within our window
        this.scheduledNotes.forEach((note, id) => {
            const playTime = this.playbackStartTime + note.absoluteTime;

            if (playTime >= this.lastScheduleTime && playTime < scheduleEnd) {
                try {
                    keyboardAudioManager.playExactNote(note, playTime);
                    this.debug('Scheduled note', {
                        note: note.note,
                        time: playTime,
                        relativeTime: note.absoluteTime
                    });
                } catch (error) {
                    this.debug('Failed to schedule note', { error, note });
                    if (this.onSchedulerError) {
                        this.onSchedulerError(error as Error);
                    }
                }
            }
        });

        this.lastScheduleTime = scheduleEnd;
    }

    private updatePlaybackTime() {
        if (!this.audioContext) return;

        const currentTime = this.audioContext.currentTime - this.playbackStartTime;

        if (this.onTimeUpdate) {
            this.onTimeUpdate(currentTime);
        }

        this.animationFrame = requestAnimationFrame(() => this.updatePlaybackTime());
    }

    start(startTime: number = 0) {
        if (!this.audioContext) {
            throw new Error('Playback scheduler not initialized');
        }

        this.debug('Starting playback', { startTime });
        this.playbackStartTime = this.audioContext.currentTime - startTime;
        this.lastScheduleTime = this.audioContext.currentTime;

        // Start scheduling loop
        this.schedulerInterval = window.setInterval(
            () => this.scheduleUpcomingNotes(),
            SCHEDULE_INTERVAL
        );

        // Start time update loop
        this.updatePlaybackTime();
    }

    stop() {
        this.debug('Stopping playback');

        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.scheduledNotes.clear();
        this.lastScheduleTime = 0;
        this.playbackStartTime = 0;
    }

    setPosition(newTime: number) {
        this.debug('Setting position', { newTime });
        const wasPlaying = this.schedulerInterval !== null;

        // Stop current playback
        this.stop();

        // Restart from new position if we were playing
        if (wasPlaying) {
            this.start(newTime);
        }
    }

    cleanup() {
        this.debug('Cleaning up');
        this.stop();
        this.scheduledNotes.clear();
        this.onTimeUpdate = null;
        this.onSchedulerError = null;
    }
}

export const playbackScheduler = new PlaybackScheduler();
export default playbackScheduler;