// src/features/player/utils/time.utils.ts

/**
 * Core timing constants and utilities for musical time representation.
 * This system manages conversions between milliseconds, ticks, and grid cells,
 * ensuring consistent timing across recording and playback.
 */
export const TIMING = {
    // Musical resolution settings
    TICKS_PER_BEAT: 480,    // Standard MIDI resolution for precise timing
    CELLS_PER_BEAT: 4,      // Each beat divides into 4 grid cells (16th notes)
    DEFAULT_TEMPO: 120,     // Standard tempo in beats per minute

    /**
     * Converts real time (milliseconds) to musical time (ticks).
     * This is used when recording notes to store their timing in a tempo-independent format.
     */
    msToTicks: (ms: number, tempo: number): number => {
        // First convert to beats: (ms / 1000) * (tempo / 60) gives us beats
        // Then multiply by TICKS_PER_BEAT to get ticks
        const beatsPerMs = tempo / (60 * 1000);
        return Math.round(ms * beatsPerMs * TIMING.TICKS_PER_BEAT);
    },

    /**
     * Converts musical time (ticks) back to real time (milliseconds).
     * This is used during playback to schedule notes at the correct times.
     */
    ticksToMs: (ticks: number, tempo: number): number => {
        // First convert ticks to beats by dividing by TICKS_PER_BEAT
        // Then convert beats to milliseconds using tempo
        const msPerBeat = (60 * 1000) / tempo;
        return (ticks / TIMING.TICKS_PER_BEAT) * msPerBeat;
    },

    /**
     * Converts grid cells to ticks for placing notes on the musical grid.
     * This helps maintain consistent spacing regardless of tempo.
     */
    cellsToTicks: (cells: number): number => {
        return Math.round((cells * TIMING.TICKS_PER_BEAT) / TIMING.CELLS_PER_BEAT);
    },

    /**
     * Converts ticks to grid cells for visual display.
     * This helps position notes correctly in the interface.
     */
    ticksToCells: (ticks: number): number => {
        return Math.round((ticks * TIMING.CELLS_PER_BEAT) / TIMING.TICKS_PER_BEAT);
    },

    /**
     * Formats a musical time in ticks to a format showing bars, beats, and ticks.
     * This is useful for displaying position in musical terms.
     * @param ticks - Musical time in ticks
     * @returns Formatted musical time string (e.g. "1:2:240" for bar 1, beat 2, tick 240)
     */
    formatMusicalTime: (ticks: number): string => {
        // Calculate bars and beats (assuming 4/4 time)
        const totalBeats = Math.floor(ticks / TIMING.TICKS_PER_BEAT);
        const bar = Math.floor(totalBeats / 4) + 1;
        const beat = (totalBeats % 4) + 1;
        const remainingTicks = ticks % TIMING.TICKS_PER_BEAT;

        return `${bar}:${beat}:${String(remainingTicks).padStart(3, '0')}`;
    },

    /**
     * Formats time in seconds as a readable string.
     * @param timeInSeconds - Time to format
     * @returns Formatted time string (e.g. "01:23.456")
     */
    formatTime: (timeInSeconds: number): string => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

        return `${String(minutes).padStart(2, '0')}:${
            String(seconds).padStart(2, '0')}.${
            String(milliseconds).padStart(3, '0')}`;
    }
};

// We still export these standalone functions for backward compatibility,
// but new code should prefer the methods on the TIMING object
export const formatTime = TIMING.formatTime;
export const formatMusicalTime = TIMING.formatMusicalTime;