// src/features/player/services/timing.service.ts

import keyboardAudioManager from '../../../pages/studio/features/oscillators/engine/synthesis/keyboardEngine.ts';

/**
 * TimingService coordinates audio playback timing and visual updates.
 * It manages both the scheduling of audio events and the smooth updating
 * of visual elements like the time marker.
 */
export class TimingService {
    // Audio system references
    private audioContext: AudioContext | null = null;

    // Timing system references
    private schedulerTimer: number | null = null;
    private visualTimer: number | null = null;
    private isPlaying: boolean = false;
    private startTimeRef: number = 0;
    private lastTickTime: number = 0;
    private tempo: number = 120;

    // Track which notes we've already scheduled
    private scheduledNotes = new Set<string>();
    
    // Add property to track last loop transition
    private lastLoopTransitionTime: number = 0;
    
    // Add property to store loop state
    private state = {
        loopStart: 0
    };

    // Add these properties to the class
    private loopEnabled = false;
    private loopStart = 0;
    private loopEnd = 60000;
    private lastScheduledTime = 0;

    constructor(
        private config = {
            scheduleAheadTime: 0.1,       // Look ahead time for audio scheduling (seconds)
            schedulerInterval: 25,         // How often to check for notes to schedule (milliseconds)
            visualRefreshRate: 16.67       // Target 60fps for visual updates (milliseconds)
        },
        private callbacks: {
            onScheduleNotes?: (startTime: number, endTime: number) => void;
            onTick?: (currentTimeMs: number) => void;
        } = {},
        initialTempo: number = 120
    ) {
        this.tempo = initialTempo;
        
        // Listen for loop transitions from PlaybackService to prevent conflicts
        window.addEventListener('playback-loop-transition', (event: CustomEvent) => {
            // Extract time information from the event
            const { time, newStartTime } = event.detail;
            
            console.log('TimingService received loop transition event:', {
                time: time.toFixed(4),
                newStartTime: newStartTime.toFixed(4),
                currentIsPlaying: this.isPlaying
            });
            
            // CRITICAL: Update our timing references but DON'T stop playback
            if (this.isPlaying && this.audioContext) {
                const currentMusicalTime = this.getCurrentMusicalTime();
                this.startTimeRef = performance.now() - this.convertToRealTime(this.state.loopStart);
                this.lastTickTime = performance.now();
                this.scheduledNotes.clear();
                this.lastLoopTransitionTime = performance.now();
                
                console.log('TimingService adjusted for loop:', {
                    previousMusicalTime: currentMusicalTime,
                    newStartTimeRef: this.startTimeRef,
                    loopStart: this.state.loopStart
                });
            }
        });
    }

    /**
     * Initialize the audio system. We use keyboardAudioManager's context
     * to ensure consistent audio handling across the application.
     */
    public async initialize(): Promise<void> {
        await keyboardAudioManager.initialize();
        this.audioContext = keyboardAudioManager.getContext();

        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Update the current tempo and adjust timing to maintain musical position
     */
    public setTempo(newTempo: number) {
        const currentPosition = this.getCurrentMusicalTime();
        this.tempo = newTempo;
        this.updateTimeReferences(this.convertToRealTime(currentPosition));
    }

    /**
     * Convert real time to musical time (adjusted for tempo)
     */
    private convertToMusicalTime(realTimeMs: number): number {
        return realTimeMs * (this.tempo / 120);
    }

    /**
     * Convert musical time to real time
     */
    private convertToRealTime(musicalTimeMs: number): number {
        return musicalTimeMs * (120 / this.tempo);
    }

    /**
     * Start playback from a specific time position.
     * If already playing, updates the time position without interrupting playback.
     */
    public start(startTimeMs: number = 0): void {
        if (!this.audioContext) throw new Error('Timing service not initialized');

        // If already playing, just update our position
        if (this.isPlaying) {
            this.updateTimeReferences(startTimeMs);
            return;
        }

        // Starting fresh playback
        console.log('Starting fresh playback from', startTimeMs);
        this.isPlaying = true;
        this.updateTimeReferences(startTimeMs);
        this.scheduledNotes.clear();

        // Start both timing systems
        this.startVisualUpdates();
        this.startAudioScheduling();
    }

    /**
     * Update our time reference points to maintain synchronization
     * between visual and audio systems.
     */
    private updateTimeReferences(timeMs: number): void {
        this.startTimeRef = performance.now() - this.convertToRealTime(timeMs);
        this.lastTickTime = performance.now();
    }

    /**
     * Start the visual update loop that keeps the time marker
     * moving smoothly on screen.
     */
    private startVisualUpdates(): void {
        // Clean up any existing visual timer
        if (this.visualTimer !== null) {
            cancelAnimationFrame(this.visualTimer);
            this.visualTimer = null;
        }

        const updateVisuals = () => {
            if (!this.isPlaying) return;

            const now = performance.now();

            // Update display at our target frame rate
            if (now - this.lastTickTime >= this.config.visualRefreshRate) {
                const currentTime = this.getCurrentTime();
                if (this.callbacks.onTick) {
                    this.callbacks.onTick(currentTime);
                }
                this.lastTickTime = now;
            }

            this.visualTimer = requestAnimationFrame(updateVisuals);
        };

        updateVisuals();
    }

    /**
     * Start the audio scheduling loop that ensures notes are
     * scheduled ahead of their play time for smooth playback.
     */
    private startAudioScheduling(): void {
        // Clean up any existing scheduler
        if (this.schedulerTimer !== null) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        const scheduleNotes = () => {
            if (!this.isPlaying || !this.audioContext) {
                console.log(`[DIAG] scheduleNotes: Not scheduling - isPlaying:${this.isPlaying}`);
                return;
            }

            // Current time calculation
            const now = this.audioContext.currentTime;
            const elapsedRealSeconds = (performance.now() - this.startTimeRef) / 1000;
            const elapsedMusicalSeconds = this.convertToMusicalTime(elapsedRealSeconds * 1000) / 1000;
            const endTimeSeconds = elapsedMusicalSeconds + this.config.scheduleAheadTime;
            this.lastScheduledTime = endTimeSeconds;

            console.log(`[DIAG] TimingService scheduling window:`, {
                windowStart: (elapsedMusicalSeconds * 1000).toFixed(1) + 'ms',
                windowEnd: (endTimeSeconds * 1000).toFixed(1) + 'ms',
                windowSize: ((endTimeSeconds - elapsedMusicalSeconds) * 1000).toFixed(1) + 'ms',
                audioContextTime: now.toFixed(4),
                audioContextState: this.audioContext.state,
                scheduledNotes: this.scheduledNotes.size
            });

            // Check if we're going to cross a loop boundary during this scheduling window
            const isApproachingLoopBoundary = this.loopEnabled && 
                                              elapsedMusicalSeconds * 1000 < this.loopEnd &&
                                              endTimeSeconds * 1000 >= this.loopEnd;

            // Log when we detect a potential loop boundary crossing
            if (isApproachingLoopBoundary) {
                console.log('[DIAG] TimingService: Approaching loop boundary', {
                    currentTime: elapsedMusicalSeconds * 1000,
                    lookAheadEnd: endTimeSeconds * 1000,
                    loopEnd: this.loopEnd,
                    timeToLoopEnd: (this.loopEnd - elapsedMusicalSeconds * 1000).toFixed(1) + 'ms'
                });
            }

            // If we're crossing a loop boundary, adjust the scheduling window
            if (isApproachingLoopBoundary) {
                // First, schedule notes up to the loop boundary
                if (this.callbacks.onScheduleNotes) {
                    // Schedule notes up to loop end
                    this.callbacks.onScheduleNotes(
                        elapsedMusicalSeconds, 
                        this.loopEnd / 1000
                    );
                }

                // Then schedule notes from the loop start 
                // We use a small offset to avoid scheduling the same note twice
                const loopStartSeconds = this.loopStart / 1000 + 0.001;
                const loopWrappedEndTime = loopStartSeconds + (endTimeSeconds - (this.loopEnd / 1000));
                
                console.log('TimingService: Loop scheduling window', {
                    loopStartTime: loopStartSeconds,
                    wrappedEndTime: loopWrappedEndTime
                });

                // Clear previous scheduled notes at loop boundary
                this.scheduledNotes.clear();

                // Schedule notes from the beginning of the loop with high priority
                if (this.callbacks.onScheduleNotes) {
                    this.callbacks.onScheduleNotes(
                        loopStartSeconds, 
                        loopWrappedEndTime
                    );
                }

                // Force immediate scheduling again after a short delay
                // This ensures continuous playback across the loop boundary
                setTimeout(() => {
                    if (this.isPlaying) scheduleNotes();
                }, 10);
            } else {
                // Normal scheduling (not crossing loop boundary)
                if (this.callbacks.onScheduleNotes) {
                    this.callbacks.onScheduleNotes(elapsedMusicalSeconds, endTimeSeconds);
                }
            }

            // Schedule next check
            this.schedulerTimer = window.setTimeout(
                scheduleNotes,
                this.config.schedulerInterval
            );

            console.log(`[DIAG] Scheduling complete. Notes in set: ${this.scheduledNotes.size}`);
        };

        scheduleNotes();
    }

    /**
     * Stop playback and clean up all timing systems.
     */
    public stop(): void {
        console.log('TimingService stop called', {
            isPlaying: this.isPlaying,
            stackTrace: new Error().stack
        });
        
        this.isPlaying = false;
        
        if (this.schedulerTimer !== null) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        if (this.visualTimer !== null) {
            cancelAnimationFrame(this.visualTimer);
            this.visualTimer = null;
        }

        this.scheduledNotes.clear();
    }

    /**
     * Get the current musical time in milliseconds (tempo-adjusted)
     */
    private getCurrentMusicalTime(): number {
        if (!this.isPlaying) return 0;
        const realTime = performance.now() - this.startTimeRef;
        return this.convertToMusicalTime(realTime);
    }

    /**
     * Get the current playback position in milliseconds
     */
    public getCurrentTime(): number {
        if (!this.isPlaying) return 0;
        const realTime = performance.now() - this.startTimeRef;
        return this.convertToMusicalTime(realTime);
    }

    /**
     * Clean up resources when the timing service is no longer needed.
     */
    public dispose(): void {
        this.stop();
        this.audioContext = null;
    }

    // Update or add this method to properly handle loop settings
    public setLoopState(enabled: boolean, start?: number, end?: number) {
        const previousState = {
            enabled: this.loopEnabled,
            start: this.loopStart,
            end: this.loopEnd
        };
        
        this.loopEnabled = enabled;
        if (start !== undefined) this.loopStart = start;
        if (end !== undefined) this.loopEnd = end;
        
        console.log('[LOOP] TimingService loop state updated', {
            previous: previousState,
            current: {
                enabled: this.loopEnabled,
                start: this.loopStart,
                end: this.loopEnd
            }
        });
    }

    // Add this method to reset the time reference at loop points
    public resetTimeReference(timeMs: number) {
        if (!this.isPlaying || !this.audioContext) return;
        
        console.log(`[LOOP] TimingService time reference reset from ${this.getCurrentTime()}ms to ${timeMs}ms`);
        
        // Reset time reference to the new position
        this.startTimeRef = performance.now() - this.convertToRealTime(timeMs);
        this.scheduledNotes.clear(); // Clear scheduled notes to prevent duplicates
        
        // Force immediate scheduling to ensure notes play at the loop start
        if (this.schedulerTimer !== null) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
            this.startAudioScheduling();
        }
    }

    // Add this method to handle direct loop transitions
    public handleLoopTransition(loopStartTime: number): void {
        if (!this.isPlaying || !this.audioContext) {
            console.log('[LOOP] Cannot handle loop transition - not playing or no audio context');
            return;
        }
        
        console.log(`[LOOP] TimingService handling loop transition to ${loopStartTime}ms`);
        
        // Reset our time reference to the loop start position
        this.startTimeRef = performance.now() - this.convertToRealTime(loopStartTime);
        
        // Clear all scheduled notes to prevent duplicates
        this.scheduledNotes.clear();
        
        // Force immediate scheduling to ensure notes play at the loop start
        if (this.schedulerTimer !== null) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
            this.startAudioScheduling();
        }
        
        // Update last tick time to ensure visual updates are in sync
        this.lastTickTime = performance.now();
        
        console.log(`[LOOP] TimingService loop transition complete, new reference time: ${this.startTimeRef}`);
    }
}