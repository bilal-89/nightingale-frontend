// src/features/player/services/timing.service.ts

import keyboardAudioManager from '../../../audio/context/keyboard/keyboardAudioManager';

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

    // Track which notes we've already scheduled
    private scheduledNotes = new Set<string>();

    constructor(
        private config = {
            scheduleAheadTime: 0.1,       // Look ahead time for audio scheduling (seconds)
            schedulerInterval: 25,         // How often to check for notes to schedule (milliseconds)
            visualRefreshRate: 16.67       // Target 60fps for visual updates (milliseconds)
        },
        private callbacks: {
            onScheduleNotes?: (startTime: number, endTime: number) => void;
            onTick?: (currentTimeMs: number) => void;
        } = {}
    ) {}

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
        this.startTimeRef = performance.now() - timeMs;
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
            if (!this.isPlaying || !this.audioContext) return;

            // Calculate our scheduling window in seconds
            const elapsedSeconds = (performance.now() - this.startTimeRef) / 1000;
            const endTimeSeconds = elapsedSeconds + this.config.scheduleAheadTime;

            // Schedule notes within our window
            if (this.callbacks.onScheduleNotes) {
                this.callbacks.onScheduleNotes(elapsedSeconds, endTimeSeconds);
            }

            // Schedule next check
            this.schedulerTimer = window.setTimeout(
                scheduleNotes,
                this.config.schedulerInterval
            );
        };

        scheduleNotes();
    }

    /**
     * Stop playback and clean up all timing systems.
     */
    public stop(): void {
        console.log('Stopping playback');
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
     * Get the current playback position in milliseconds.
     */
    public getCurrentTime(): number {
        if (!this.isPlaying) return 0;
        return performance.now() - this.startTimeRef;
    }

    /**
     * Clean up resources when the timing service is no longer needed.
     */
    public dispose(): void {
        this.stop();
        this.audioContext = null;
    }
}