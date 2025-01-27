// src/features/player/utils/time.utils.ts

/**
 * Core timing constants that define our musical grid and time quantization.
 * These values determine how we map between different time representations.
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
    }
};

/**
 * Formats a time in seconds to a string in the format MM:SS.mmm
 * @param timeInSeconds - Time to format in seconds
 * @returns Formatted time string
 */
export const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

    return `${String(minutes).padStart(2, '0')}:${
        String(seconds).padStart(2, '0')}.${
        String(milliseconds).padStart(3, '0')}`;
};

/**
 * Formats a musical time in ticks to a beat:tick format for debugging
 * @param ticks - Musical time in ticks
 * @returns Formatted musical time string (e.g. "2:240" for beat 2, tick 240)
 */
export const formatMusicalTime = (ticks: number): string => {
    const beat = Math.floor(ticks / TIMING.TICKS_PER_BEAT);
    const remainingTicks = ticks % TIMING.TICKS_PER_BEAT;
    return `${beat}:${String(remainingTicks).padStart(3, '0')}`;
};