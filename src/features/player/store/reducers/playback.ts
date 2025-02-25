import { PayloadAction } from '@reduxjs/toolkit';
import { PlayerState } from '../types';

// Helper function for playback
const getArrangementEndTime = (state: PlayerState): number => {
   if (state.clips.length === 0) return 0;
   return Math.max(...state.clips.map(clip => clip.startCell + clip.length)) * (60 / state.tempo);
};

export const playbackReducers = {
   startPlayback: (state: PlayerState) => {
       state.isPlaying = true;
       if (state.currentTime >= getArrangementEndTime(state)) {
           state.currentTime = 0;
       }
   },

   stopPlayback: (state: PlayerState) => {
       state.isPlaying = false;
   },

   updatePlaybackPosition: (state: PlayerState, action: PayloadAction<number>) => {
       state.currentTime = action.payload;
   },

   setPlaybackPosition: (state: PlayerState, action: PayloadAction<number>) => {
       state.currentTime = Math.max(0, action.payload);
   },

   setTempo: (state: PlayerState, action: PayloadAction<number>) => {
       state.tempo = Math.max(20, Math.min(300, action.payload));
   }
};
