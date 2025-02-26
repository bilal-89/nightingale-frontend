import { RootState } from '../../../../store';
import { PlaybackSliceState } from '../player/types/state';

// Basic playback state selectors
export const selectPlaybackState = (state: RootState): PlaybackSliceState => state.playback;
export const selectIsPlaying = (state: RootState): boolean => selectPlaybackState(state).isPlaying;
export const selectCurrentTime = (state: RootState): number => selectPlaybackState(state).currentTime;
export const selectTempo = (state: RootState): number => selectPlaybackState(state).tempo;
export const selectTotalDuration = (state: RootState): number => selectPlaybackState(state).totalDuration;
export const selectSchedulingConfig = (state: RootState) => selectPlaybackState(state).schedulingConfig;
export const selectMetronomeEnabled = (state: RootState): boolean => selectPlaybackState(state).metronomeEnabled;
export const selectCountInEnabled = (state: RootState): boolean => selectPlaybackState(state).countInEnabled;
export const selectPrerollBars = (state: RootState): number => selectPlaybackState(state).prerollBars;

// Loop-related selectors
export const selectLoopEnabled = (state: RootState): boolean => selectPlaybackState(state).loopEnabled;
export const selectLoopStart = (state: RootState): number => selectPlaybackState(state).loopStart;
export const selectLoopEnd = (state: RootState): number => selectPlaybackState(state).loopEnd; 