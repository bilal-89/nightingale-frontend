// src/features/player/utils/time.utils.ts

/**
 * Core timing constants and utilities for musical time representation.
 * This system manages conversions between milliseconds, musical time, and visual representation,
 * supporting both continuous and quantized timing.
 */
export const TIMING = {
    // Musical resolution settings
    TICKS_PER_BEAT: 480,    // Standard MIDI resolution for precise timing
    CELLS_PER_BEAT: 4,      // Used for quantization
    DEFAULT_TEMPO: 120,     // Standard tempo in beats per minute

    /**
     * Converts real time (milliseconds) to musical time (ticks).
     * Used for quantization and musical time display.
     */
    msToTicks: (ms: number, tempo: number): number => {
        const beatsPerMs = tempo / (60 * 1000);
        return Math.round(ms * beatsPerMs * TIMING.TICKS_PER_BEAT);
    },

    /**
     * Converts musical time (ticks) to real time (milliseconds).
     * Used for playback scheduling and musical grid alignment.
     */
    ticksToMs: (ticks: number, tempo: number): number => {
        const msPerBeat = (60 * 1000) / tempo;
        return (ticks / TIMING.TICKS_PER_BEAT) * msPerBeat;
    },

    /**
     * Converts a time position to the nearest quantized position based on settings
     */
    quantizeTime: (time: number, settings: {
        resolution: number;
        strength: number;
    }): number => {
        const { resolution, strength } = settings;

        // Find nearest grid point
        const gridPoint = Math.round(time / resolution) * resolution;

        // If strength is 1, snap completely
        if (strength >= 1) return gridPoint;

        // Otherwise, interpolate between original and quantized position
        const difference = gridPoint - time;
        return time + (difference * strength);
    },

    /**
     * Converts time in milliseconds to musical bars/beats/subdivisions
     */
    msToMusicalTime: (ms: number, tempo: number): {
        bars: number;
        beats: number;
        subdivisions: number;
    } => {
        const ticks = TIMING.msToTicks(ms, tempo);
        const totalBeats = ticks / TIMING.TICKS_PER_BEAT;

        return {
            bars: Math.floor(totalBeats / 4) + 1,
            beats: Math.floor(totalBeats % 4) + 1,
            subdivisions: Math.floor((totalBeats % 1) * TIMING.CELLS_PER_BEAT)
        };
    },

    /**
     * Calculates the nearest musical division point for a given time
     */
    findNearestDivision: (time: number, tempo: number, division: number): number => {
        const msPerBeat = (60 * 1000) / tempo;
        const msPerDivision = msPerBeat / division;
        return Math.round(time / msPerDivision) * msPerDivision;
    },

    /**
     * Formats a time position in milliseconds as bars:beats:subdivisions
     */
    formatMusicalTime: (ms: number, tempo: number): string => {
        const { bars, beats, subdivisions } = TIMING.msToMusicalTime(ms, tempo);
        return `${bars}:${beats}:${String(subdivisions).padStart(2, '0')}`;
    },

    /**
     * Formats time in milliseconds as a readable string (MM:SS.mmm)
     */
    formatTime: (ms: number): string => {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.floor(ms % 1000);

        return `${String(minutes).padStart(2, '0')}:${
            String(seconds).padStart(2, '0')}.${
            String(milliseconds).padStart(3, '0')}`;
    },

    /**
     * Converts between screen pixels and time based on zoom level
     */
    pixelsToTime: (pixels: number, zoomLevel: number): number => {
        return pixels / zoomLevel;
    },

    timeToPixels: (time: number, zoomLevel: number): number => {
        return time * zoomLevel;
    },

    /**
     * Calculates snap points for a given time range
     */
    getSnapPoints: (startTime: number, endTime: number, snapInterval: number): number[] => {
        const points: number[] = [];
        let currentTime = Math.ceil(startTime / snapInterval) * snapInterval;

        while (currentTime <= endTime) {
            points.push(currentTime);
            currentTime += snapInterval;
        }

        return points;
    },
    cellsToTicks: (cells: number): number => {
        return Math.round((cells * TIMING.TICKS_PER_BEAT) / TIMING.CELLS_PER_BEAT);
    },

    ticksToCells: (ticks: number): number => {
        return Math.round((ticks * TIMING.CELLS_PER_BEAT) / TIMING.TICKS_PER_BEAT);
    },
};

// Standalone exports for backward compatibility
export const {
    formatTime,
    formatMusicalTime,
    quantizeTime,
    msToTicks,
    ticksToMs,
    pixelsToTime,
    timeToPixels,
    getSnapPoints
} = TIMING;