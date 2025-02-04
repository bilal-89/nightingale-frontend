// src/features/player/types/playback.ts

/**
 * Core playback state interface
 */
export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;         // In milliseconds
    tempo: number;              // In BPM
    totalDuration: number;      // In milliseconds
    loopRegion?: LoopRegion;
    loopEnabled: boolean;
}

/**
 * Loop region configuration
 * All time values in milliseconds
 */
export interface LoopRegion {
    start: number;
    end: number;
}

/**
 * Visual representation of loop points as percentages
 */
export interface LoopRegionPercentages {
    start: number;  // 0-1
    end: number;    // 0-1
}

/**
 * Loop point setting state
 */
export interface LoopPointsState {
    isSettingPoints: boolean;
    temporaryStart?: number;     // In milliseconds
    temporaryStartPercent?: number;  // 0-1
}

/**
 * Audio scheduling configuration
 */
export interface SchedulingConfig {
    scheduleAheadTime: number;   // How far ahead to schedule audio (seconds)
    schedulerInterval: number;   // How often to run scheduler (milliseconds)
}

/**
 * Playback performance metrics
 */
export interface PlaybackMetrics {
    lastScheduleTime: number;    // Last time audio was scheduled
    playbackStartTime: number;   // When current playback started
    currentBufferTime: number;   // Amount of audio currently buffered
}

/**
 * Transport control options
 */
export interface TransportOptions {
    metronomeEnabled: boolean;
    countInEnabled: boolean;
    prerollBars: number;
}

/**
 * Timing conversion utilities
 */
export interface TimingUtils {
    msToPercent: (ms: number, totalDuration: number) => number;
    percentToMs: (percent: number, totalDuration: number) => number;
    barsToMs: (bars: number, tempo: number) => number;
    msToBeats: (ms: number, tempo: number) => number;
}

/**
 * Playback events for middleware
 */
export enum PlaybackEventType {
    LOOP_START = 'loopStart',
    LOOP_END = 'loopEnd',
    BAR_START = 'barStart',
    BEAT = 'beat',
    PLAYBACK_START = 'playbackStart',
    PLAYBACK_STOP = 'playbackStop'
}

export interface PlaybackEvent {
    type: PlaybackEventType;
    time: number;          // When event occurred
    position: number;      // Playback position when event occurred
    data?: any;           // Additional event-specific data
}