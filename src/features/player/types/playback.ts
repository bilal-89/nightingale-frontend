// src/features/player/types/playback.ts

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    tempo: number;
    loopRegion?: LoopRegion;
}

export interface LoopRegion {
    start: number;
    end: number;
}

export interface SchedulingConfig {
    scheduleAheadTime: number;
    schedulerInterval: number;
}

export interface PlaybackMetrics {
    lastScheduleTime: number;
    playbackStartTime: number;
    currentBufferTime: number;
}