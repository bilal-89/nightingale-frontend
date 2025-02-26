import reducer, { 
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo,
    setTotalDuration,
    updateSchedulingConfig,
    toggleMetronome,
    toggleCountIn,
    setPrerollBars,
    toggleLoop,
    setLoopPoints,
    setLoopStart,
    setLoopEnd
} from './slice';

export {
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo,
    setTotalDuration,
    updateSchedulingConfig,
    toggleMetronome,
    toggleCountIn,
    setPrerollBars,
    toggleLoop,
    setLoopPoints,
    setLoopStart,
    setLoopEnd
};

export {
    selectPlaybackState,
    selectIsPlaying,
    selectCurrentTime,
    selectTempo,
    selectTotalDuration,
    selectSchedulingConfig,
    selectMetronomeEnabled,
    selectCountInEnabled,
    selectPrerollBars,
    selectLoopEnabled,
    selectLoopStart,
    selectLoopEnd
} from './selectors';

export type { PlaybackSliceState } from '../player/types/state';
export { reducer as default };
