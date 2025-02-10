import { RootState } from '../../../../../store';
import { msToPercent } from '../utils/time';

export const selectLoopRegion = (state: RootState) => state.playback.loopRegion;
export const selectIsLoopEnabled = (state: RootState) => state.playback.loopEnabled;
export const selectIsSettingLoopPoints = (state: RootState) => state.playback.isSettingLoopPoints;
export const selectTemporaryLoopStart = (state: RootState) => state.playback.temporaryLoopStart;

export const selectLoopRegionAsPercentages = (state: RootState) => {
   if (!state.playback.loopRegion) return undefined;
   const { start, end } = state.playback.loopRegion;
   return {
       start: msToPercent(start, state.playback.totalDuration),
       end: msToPercent(end, state.playback.totalDuration)
   };
};
