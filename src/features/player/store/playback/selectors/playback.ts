import { RootState } from '../../../../../store';
import { PlaybackState } from '../types';

export const selectPlaybackState = (state: RootState): PlaybackState => ({
   isPlaying: state.playback.isPlaying,
   currentTime: state.playback.currentTime,
   tempo: state.playback.tempo,
   loopRegion: state.playback.loopEnabled ? state.playback.loopRegion : undefined
});
