import { RootState } from '../../../../../store';
import { createSelector } from '@reduxjs/toolkit';

export const selectTracks = (state: RootState) => state.player.tracks;
export const selectCurrentTrack = (state: RootState) => state.player.currentTrack;
export const selectTrackNotes = createSelector(
   [selectTracks, (_: RootState, trackId: string) => trackId],
   (tracks, trackId) => tracks.find(t => t.id === trackId)?.notes ?? []
);
