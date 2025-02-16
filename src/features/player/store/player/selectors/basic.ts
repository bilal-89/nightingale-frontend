import { RootState } from '../../../../../store';

export const selectIsPlaying = (state: RootState) => state.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.playback.currentTime;
export const selectTempo = (state: RootState) => state.playback.tempo;
