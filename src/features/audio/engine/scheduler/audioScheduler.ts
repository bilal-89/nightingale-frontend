import { KeyboardEngine } from '../synthesis/keyboardEngine';
import { DrumEngine } from '../synthesis/drumEngine';
import { CompleteNoteEvent } from '../../types';

export class AudioScheduler {
    private static readonly LOOKAHEAD = 0.1;  // Seconds
    private static readonly SCHEDULE_INTERVAL = 50;  // Milliseconds

    private context: AudioContext;
    private keyboardEngine: KeyboardEngine;
    private drumEngine: DrumEngine;
    
    private scheduledEvents: Map<string, {
        event: CompleteNoteEvent;
        cleanup?: () => void;
    }>;
    
    private schedulerInterval: number | null;
    private nextEventId = 0;

    constructor(context: AudioContext) {
        this.context = context;
        this.keyboardEngine = new KeyboardEngine(context);
        this.drumEngine = new DrumEngine(context);
        this.scheduledEvents = new Map();
        this.schedulerInterval = null;
    }

    /**
     * Start the scheduling loop
     */
    start(): void {
        if (this.schedulerInterval !== null) return;

        this.schedulerInterval = window.setInterval(
            () => this.scheduleEvents(),
            AudioScheduler.SCHEDULE_INTERVAL
        );
    }

    /**
     * Stop the scheduling loop
     */
    stop(): void {
        if (this.schedulerInterval === null) return;
        
        window.clearInterval(this.schedulerInterval);
        this.schedulerInterval = null;
    }

    /**
     * Schedule a note event for future playback
     */
    scheduleNote(event: CompleteNoteEvent): string {
        const id = (this.nextEventId++).toString();
        this.scheduledEvents.set(id, { event });
        return id;
    }

    /**
     * Cancel a scheduled note event
     */
    cancelNote(id: string): void {
        const scheduled = this.scheduledEvents.get(id);
        if (scheduled?.cleanup) {
            scheduled.cleanup();
        }
        this.scheduledEvents.delete(id);
    }

    /**
     * Main scheduling loop
     */
    private scheduleEvents(): void {
        const now = this.context.currentTime;
        const lookAheadTime = now + AudioScheduler.LOOKAHEAD;

        for (const [id, { event }] of this.scheduledEvents) {
            // Skip events that are too far in the future
            if (event.timestamp > lookAheadTime) continue;
            
            // Skip events that have already been processed
            if (event.timestamp < now) {
                this.scheduledEvents.delete(id);
                continue;
            }

            try {
                this.playEvent(event);
            } catch (error) {
                console.error('Error playing event:', error);
            }

            // Remove the event after scheduling
            this.scheduledEvents.delete(id);
        }
    }

    /**
     * Play a single note event
     */
    private playEvent(event: CompleteNoteEvent): void {
        if (event.synthesis.mode === 'drums') {
            this.playDrumEvent(event);
        } else {
            this.playKeyboardEvent(event);
        }
    }

    /**
     * Handle keyboard note events
     */
    private playKeyboardEvent(event: CompleteNoteEvent): void {
        const voice = this.keyboardEngine.createVoice({
            note: event.note,
            velocity: event.velocity,
            envelope: event.synthesis.envelope,
            waveform: event.synthesis.waveform,
            filter: event.synthesis.effects.filter || {
                cutoff: 20000,
                resonance: 0.707
            }
        });

        // Schedule parameter changes
        if (event.parameterChanges) {
            event.parameterChanges.forEach(change => {
                this.keyboardEngine.updateVoice(voice.id, {
                    [change.parameter]: change.value
                });
            });
        }

        // Schedule note release
        if (event.duration > 0) {
            const releaseTime = event.timestamp + event.duration;
            setTimeout(
                () => this.keyboardEngine.releaseVoice(voice.id),
                (releaseTime - this.context.currentTime) * 1000
            );
        }
    }

    /**
     * Handle drum note events
     */
    private playDrumEvent(event: CompleteNoteEvent): void {
        this.drumEngine.createVoice(
            event.note,
            event.timestamp,
            event.synthesis.frequencyModulation?.initialFrequency ?? 0
        );
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.stop();
        this.scheduledEvents.clear();
        this.keyboardEngine.cleanup();
        this.drumEngine.cleanup();
    }
}
