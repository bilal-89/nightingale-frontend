// src/features/player/types/timeline.ts

// Basic position in musical time
export interface TimePosition {
    time: number;    // Absolute time in milliseconds
    track: number;   // Track number
}

// Position with visual representation for UI
export interface TimelinePosition extends TimePosition {
    pixels: number;  // Visual position in the timeline
}

// Settings for time quantization
export interface QuantizeSettings {
    enabled: boolean;
    resolution: number;  // Time resolution in milliseconds
    strength: number;    // 0-1, allows partial quantization
}

// Updates for clip timing
export interface TimingUpdate {
    startTime: number;
    duration: number;
}

// Timeline view configuration
export interface TimelineViewConfig {
    zoomLevel: number;      // Pixels per millisecond
    viewportWidth: number;  // Visible width in pixels
    trackHeight: number;    // Height of each track in pixels
}