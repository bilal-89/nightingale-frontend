export interface TimelinePosition {
    bar: number;
    beat: number;
    sixteenth: number;
    ticks: number;
}

export interface MusicalTime {
    bars: number;
    beats: number;
    ticks: number;
}

export interface TransportState {
    isPlaying: boolean;
    currentTime: TimelinePosition;
    bpm: number;
}
