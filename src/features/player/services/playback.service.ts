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
    onLoopEnd?: () => void;  // New event for loop end
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
    private loopWatcher: number | null = null;
    public onLoopEnd: (() => void) | undefined;

    // New loop handling properties
    private loopSounds: { trackId: string, note: NoteEvent }[] = [];

    // The wall clock time when playback started - used for timeline marker
    private playbackStartTime: number = 0;

    // Constants for timing system
    private readonly SCHEDULE_AHEAD_TIME = 0.1;  // Schedule audio 100ms ahead
    private readonly SCHEDULER_INTERVAL = 25;    // Check for notes every 25ms

    constructor(private events: PlaybackEvents = {}) {}

    public async start(startTimeInMs: number = 0) {
        console.log(`Starting playback at ${startTimeInMs}ms`);

        if (this.isPlaying) {
            return;
        }

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
            };

            this.isPlaying = true;
            this.scheduledNotes = [];

            // Start our two main systems
            this.startScheduler();       // For audio playback
            this.startTimelineUpdate();  // For visual timeline

            // Start loop watcher
            if (this.state.loopEnabled) {
                this.startLoopWatcher();
            }

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

            // Visual looping happens here for smooth UI
            if (this.state.loopEnabled && adjustedTime >= this.state.loopEnd) {
                // Reset timeline position visual representation only
                const loopDuration = this.state.loopEnd - this.state.loopStart;
                const timeIntoLoop = (adjustedTime - this.state.loopStart) % loopDuration;
                adjustedTime = this.state.loopStart + timeIntoLoop;
            }

            this.events.onPositionChange?.(adjustedTime);
            this.animationFrameId = requestAnimationFrame(updateTimeline);
        };

        this.animationFrameId = requestAnimationFrame(updateTimeline);
    }

    // Separate system just for watching loop points
    private startLoopWatcher() {
        if (!this.state || !this.state.loopEnabled) return;
        
        // Clear any existing watcher
        if (this.loopWatcher !== null) {
            clearInterval(this.loopWatcher);
            this.loopWatcher = null;
        }
        
        console.log('Starting loop watcher:', {
            loopStart: this.state.loopStart,
            loopEnd: this.state.loopEnd,
            loopDuration: this.state.loopEnd - this.state.loopStart
        });
        
        // Keep track of the last position to detect when we cross the loop boundary
        let lastPosition = this.getCurrentTimeInMs();
        
        // Check more frequently (5ms intervals) to ensure we don't miss the boundary
        this.loopWatcher = window.setInterval(() => {
            if (!this.state || !this.isPlaying || !this.state.loopEnabled) {
                this.stopLoopWatcher();
                return;
            }
            
            // Get current musical position
            const currentPosition = this.getCurrentTimeInMs();
            
            // Check if we've crossed the loop boundary
            const crossedLoopBoundary = 
                (lastPosition < this.state.loopEnd && currentPosition >= this.state.loopEnd) ||
                // Also detect large jumps that might have skipped over the boundary
                (currentPosition - lastPosition > 100 && currentPosition >= this.state.loopEnd);
            
            if (crossedLoopBoundary) {
                console.log('Loop boundary crossed:', {
                    previousPosition: lastPosition,
                    currentPosition,
                    loopEnd: this.state.loopEnd,
                    timeSinceBoundary: currentPosition - this.state.loopEnd
                });
                
                // Reset visual position
                this.adjustTimelineForLoop();
                
                // Call handleLoopTransition to properly reset audio scheduling
                this.handleLoopTransition();
                
                // Call the external loop handler if provided
                if (this.onLoopEnd) {
                    try {
                        this.onLoopEnd();
                    } catch (error) {
                        console.error("Error in onLoopEnd handler:", error);
                    }
                }
                
                // Update last position to prevent repeated triggering
                lastPosition = this.state.loopStart;
            } else {
                // Update last position
                lastPosition = currentPosition;
            }
        }, 5); // Check every 5ms for greater precision
    }

    private stopLoopWatcher() {
        if (this.loopWatcher !== null) {
            clearInterval(this.loopWatcher);
            this.loopWatcher = null;
        }
    }

    // Audio scheduling system that looks ahead to schedule upcoming notes
    private startScheduler() {
        if (!this.state || !this.isPlaying) return;

        const currentTime = this.state.audioContext.currentTime;
        // Look a bit further ahead to ensure better timing coverage
        const scheduleUntil = currentTime + this.SCHEDULE_AHEAD_TIME + 0.05;

        let totalNotesScheduled = 0;

        // Process each track's notes for scheduling
        this.tracks.forEach(track => {
            if (!track.notes || track.notes.length === 0) return;

            track.notes.forEach(note => {
                if (!this.state) return;

                let noteTimestamp = note.timestamp;
                let absoluteStartTime;

                // Handle loop timing adjustments
                if (this.state.loopEnabled) {
                    // Skip notes outside loop region
                    if (noteTimestamp < this.state.loopStart || noteTimestamp >= this.state.loopEnd) {
                        return;
                    }

                    // Calculate which loop iteration we're on
                    const loopDuration = (this.state.loopEnd - this.state.loopStart) / 1000;
                    const timeSinceStart = currentTime - this.state.startTime;
                    const currentLoopCount = Math.floor(timeSinceStart / loopDuration);
                    
                    // Calculate note timing relative to loop start
                    const noteOffsetInLoop = (noteTimestamp - this.state.loopStart) / 1000;
                    
                    // Schedule for current and next loop iterations
                    for (let i = 0; i <= 1; i++) {
                        const loopIteration = currentLoopCount + i;
                        // Calculate absolute time for this note in this loop iteration
                        const loopStartTime = this.state.startTime + (loopIteration * loopDuration);
                        absoluteStartTime = loopStartTime + noteOffsetInLoop;

                        // Use a larger lookahead at loop boundaries to ensure no notes are missed
                        const nearLoopBoundary = Math.abs(noteTimestamp - this.state.loopEnd) < 500;
                        const lookAhead = nearLoopBoundary ? 0.1 : 0.05;
                        
                        // Add a small buffer to make sure we don't miss notes
                        if (absoluteStartTime >= currentTime - lookAhead && absoluteStartTime < scheduleUntil) {
                            const scheduleId = `${track.id}-${note.id}-${absoluteStartTime.toFixed(3)}-loop${loopIteration}`;
                            
                            if (!this.isNoteScheduled(scheduleId)) {
                                if (i === 0) {
                                    console.log('Scheduling current loop note:', {
                                        note: note.note,
                                        loopIteration,
                                        timestamp: noteTimestamp,
                                        absoluteTime: absoluteStartTime.toFixed(4),
                                        currentTime: currentTime.toFixed(4),
                                        timeDiff: (absoluteStartTime - currentTime).toFixed(4)
                                    });
                                } else {
                                    console.log('Scheduling next loop note:', {
                                        note: note.note,
                                        loopIteration,
                                        timestamp: noteTimestamp,
                                        absoluteTime: absoluteStartTime.toFixed(4),
                                        currentTime: currentTime.toFixed(4),
                                        timeDiff: (absoluteStartTime - currentTime).toFixed(4)
                                    });
                                }
                                
                                this.scheduleNote(note, track.id, absoluteStartTime, scheduleId);
                                totalNotesScheduled++;
                            }
                        }
                    }
                } else {
                    // Non-loop scheduling
                    absoluteStartTime = this.state.startTime + (noteTimestamp / 1000);
                    const scheduleId = `${track.id}-${note.id}-${absoluteStartTime.toFixed(3)}`;

                    if (absoluteStartTime >= currentTime &&
                        absoluteStartTime < scheduleUntil &&
                        !this.isNoteScheduled(scheduleId)) {
                        this.scheduleNote(note, track.id, absoluteStartTime, scheduleId);
                        totalNotesScheduled++;
                    }
                }
            });
        });

        // Log scheduling stats if any notes were scheduled
        if (totalNotesScheduled > 0) {
            console.log(`Scheduled ${totalNotesScheduled} notes, looking ahead ${this.SCHEDULE_AHEAD_TIME}s`);
        }

        // Clean up notes that have already played
        const originalNoteCount = this.scheduledNotes.length;
        this.scheduledNotes = this.scheduledNotes.filter(
            scheduled => scheduled.absoluteStartTime >= currentTime - 0.1
        );
        
        const removedNotes = originalNoteCount - this.scheduledNotes.length;
        if (removedNotes > 0) {
            console.log(`Cleaned up ${removedNotes} completed notes`);
        }

        // Update last scheduled time
        this.state.lastScheduledTime = scheduleUntil;
        
        // Schedule next check
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
                audioContextTime: this.state.audioContext.currentTime
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

    public getCurrentTimeInMs(): number {
        // Use wall clock time for smooth visual timing
        if (!this.isPlaying || !this.state) return 0;

        const rawTime = performance.now() - this.playbackStartTime;
        const tempoScaleFactor = TIMING.DEFAULT_TEMPO / this.state.tempo;
        let adjustedTime = rawTime * tempoScaleFactor;

        return adjustedTime;
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
        if (this.loopWatcher !== null) {
            clearInterval(this.loopWatcher);
            this.loopWatcher = null;
        }
    }

    public dispose() {
        this.stop();
        this.state = null;
    }

    // Diagnostic method to force replay of all notes in the loop region
    public forcePlayLoopRegionNotes() {
        console.log(`[DIAG] forcePlayLoopRegionNotes called`, {
            stateExists: !!this.state,
            audioContextTime: this.state?.audioContext.currentTime.toFixed(4),
            isPlaying: this.isPlaying,
            loopEnabled: this.state?.loopEnabled,
            loopStart: this.state?.loopStart,
            loopEnd: this.state?.loopEnd,
            scheduledNotes: this.scheduledNotes.length,
            stackTrace: new Error().stack?.split('\n').slice(0, 3).join('\n')
        });
        
        if (!this.state) return;
        
        const now = this.state.audioContext.currentTime;
        console.log("[DIAG] Force playing loop region notes at", now.toFixed(4));
        this.scheduleLoopStartNotes(now);
    }

    public setLoopState(enabled: boolean, start?: number, end?: number) {
        if (!this.state) return;

        console.log('Loop state updating:', { enabled, start, end });
        
        const wasEnabled = this.state.loopEnabled;
        this.state.loopEnabled = enabled;
        
        // Ensure we have valid loop points
        if (start !== undefined) {
            this.state.loopStart = Math.max(0, start);
        }
        
        if (end !== undefined) {
            this.state.loopEnd = Math.max(this.state.loopStart + 100, end);
        }
        
        // Cache loop region notes
        if (enabled) {
            this.cacheLoopRegionSounds();
        } else {
            this.loopSounds = [];
        }
        
        // If we're enabling looping, start/update the watcher
        if (enabled) {
            if (this.isPlaying) {
                this.startLoopWatcher();
            }
            
            // If current time is outside the loop region, jump to start
            const currentTime = this.getCurrentTimeInMs();
            if (currentTime < this.state.loopStart || currentTime >= this.state.loopEnd) {
                this.seek(this.state.loopStart);
            }
        } else if (!enabled && wasEnabled) {
            this.stopLoopWatcher();
        }
        
        console.log('Loop state updated:', {
            enabled,
            start: this.state.loopStart,
            end: this.state.loopEnd,
            soundsCached: this.loopSounds.length
        });
    }
    
    // Cache all notes in the loop region
    private cacheLoopRegionSounds() {
        if (!this.state || !this.state.loopEnabled) return;
        
        // Clear existing cache
        this.loopSounds = [];
        
        // Find all notes in the loop region
        this.tracks.forEach(track => {
            const loopNotes = track.notes.filter(note => 
                note.timestamp >= this.state!.loopStart && 
                note.timestamp < this.state!.loopEnd
            );
            
            // Add to cache
            loopNotes.forEach(note => {
                this.loopSounds.push({ trackId: track.id, note });
            });
        });
        
        console.log('Cached loop region sounds:', {
            count: this.loopSounds.length,
            loopStart: this.state.loopStart,
            loopEnd: this.state.loopEnd
        });
    }
    
    // Adjust timeline for loop without stopping playback
    private adjustTimelineForLoop() {
        if (!this.state || !this.isPlaying) return;
        
        // Calculate new position at loop start
        const currentTime = performance.now();
        const loopOffset = this.state.loopStart;
        
        // Reset timeline position by adjusting the playback start time
        this.playbackStartTime = currentTime - (loopOffset / (TIMING.DEFAULT_TEMPO / this.state.tempo));
        
        console.log('Adjusted timeline for loop:', {
            newPlaybackStartTime: this.playbackStartTime,
            loopStart: this.state.loopStart
        });
    }

    // Create a new method that will be called when reaching the loop end
    private handleLoopTransition() {
        if (!this.state || !this.isPlaying || !this.state.loopEnabled) {
            console.log(`[DIAG] handleLoopTransition called but conditions not met:`, {
                stateExists: !!this.state,
                isPlaying: this.isPlaying,
                loopEnabled: this.state?.loopEnabled
            });
            return;
        }
        
        // Get detailed state before transition
        const now = this.state.audioContext.currentTime;
        const audioState = {
            contextTime: now.toFixed(4),
            contextState: this.state.audioContext.state,
            startTime: this.state.startTime.toFixed(4),
            timeSinceStart: (now - this.state.startTime).toFixed(4),
            schedulerLastTime: this.state.lastScheduledTime.toFixed(4),
            loopStart: this.state.loopStart,
            loopEnd: this.state.loopEnd,
            scheduledNotes: this.scheduledNotes.length
        };
        
        console.log(`[DIAG] LOOP TRANSITION - BEFORE:`, audioState);
        
        // 1. Calculate precise time values
        const loopDurationInSeconds = (this.state.loopEnd - this.state.loopStart) / 1000;
        const timeSinceStart = now - this.state.startTime;
        const currentLoopCount = Math.floor(timeSinceStart / loopDurationInSeconds);
        const newStartTime = this.state.startTime + (currentLoopCount * loopDurationInSeconds);
        
        // 2. Update timing references
        this.state.startTime = newStartTime;
        this.state.lastScheduledTime = now - 0.01;
        
        // 3. Clear scheduled notes that would overlap
        this.scheduledNotes = this.scheduledNotes.filter(note => 
            note.absoluteStartTime >= now
        );
        
        // 4. Force scheduler to run immediately 
        if (this.schedulerTimer !== null) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        
        // 5. Schedule immediate notes at loop start
        this.scheduleLoopStartNotes(now);
        this.startScheduler();
        
        // 6. Call onLoopEnd callback if provided
        if (this.onLoopEnd) {
            try {
                this.onLoopEnd();
            } catch (error) {
                console.error("Error in onLoopEnd callback:", error);
                // Continue playback even if callback fails
            }
        }
        
        // After transition:
        console.log(`[DIAG] LOOP TRANSITION - AFTER:`, {
            ...audioState,
            newStartTime: this.state.startTime.toFixed(4),
            scheduledNotesAfter: this.scheduledNotes.length
        });
    }

    // Add new method to schedule loop start notes:
    private scheduleLoopStartNotes(now: number) {
        if (!this.state) return;
        
        // Find and immediately schedule notes at the beginning of the loop (first 500ms)
        const immediateWindow = 0.5; // 500ms
        const loopStartTimeMs = this.state.loopStart;
        let scheduledCount = 0;
        
        this.tracks.forEach(track => {
            const notesToSchedule = track.notes.filter(note => {
                const offsetFromLoopStart = note.timestamp - loopStartTimeMs;
                return note.timestamp >= loopStartTimeMs && 
                       offsetFromLoopStart < immediateWindow * 1000;
            });
            
            notesToSchedule.forEach(note => {
                // Calculate precise scheduling time
                const offsetInSeconds = (note.timestamp - loopStartTimeMs) / 1000;
                const scheduleTime = now + offsetInSeconds;
                const scheduleId = `loop-start-${track.id}-${note.id}-${Date.now()}`;
                
                // Increase gain slightly for clearer playback at loop start
                const boostedNote = {...note};
                if (boostedNote.synthesis && boostedNote.synthesis.gain) {
                    boostedNote.synthesis.gain *= 1.05; // 5% volume boost
                }
                
                this.scheduleNote(boostedNote, track.id, scheduleTime, scheduleId);
                scheduledCount++;
            });
        });
        
        console.log(`Directly scheduled ${scheduledCount} notes at loop start`);
    }
}