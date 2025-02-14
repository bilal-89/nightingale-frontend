// import { LoopRegion } from './loop';
import { SchedulingConfig } from './scheduling';

export interface PlaybackSliceState {
    isPlaying: boolean;
    currentTime: number;
    tempo: number;
    totalDuration: number;
    schedulingConfig: SchedulingConfig;
    metronomeEnabled: boolean;
    countInEnabled: boolean;
    prerollBars: number;
}
