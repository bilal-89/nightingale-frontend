import { createSlice } from '@reduxjs/toolkit';
import { PlaybackSliceState } from './types';
import { percentToMs } from './utils/time';

const initialState: PlaybackSliceState = {
   isPlaying: false,
   currentTime: 0,
   tempo: 120,
   totalDuration: 4 * 60 * 1000,
   loopEnabled: false,
   isSettingLoopPoints: false,
   schedulingConfig: {
       scheduleAheadTime: 0.1,
       schedulerInterval: 25
   },
   metronomeEnabled: false,
   countInEnabled: false,
   prerollBars: 1
};

const playbackSlice = createSlice({
   name: 'playback',
   initialState,
   reducers: {
       startPlayback: (state) => {
           state.isPlaying = true;
       },
       stopPlayback: (state) => {
           state.isPlaying = false;
       },
       updatePlaybackPosition: (state, action) => {
           const newTime = action.payload;
           if (state.loopEnabled && state.loopRegion) {
               state.currentTime = newTime >= state.loopRegion.end ? 
                   state.loopRegion.start : newTime;
           } else {
               state.currentTime = newTime;
           }
       },
       setPlaybackPosition: (state, action) => {
           state.currentTime = Math.max(0, action.payload);
       },
       startSettingLoopPoints: (state) => {
           state.isSettingLoopPoints = true;
           state.temporaryLoopStart = undefined;
           state.loopRegion = undefined;
           state.loopEnabled = false;
       },
       setTemporaryLoopStart: (state, action) => {
           state.temporaryLoopStart = percentToMs(action.payload, state.totalDuration);
       },
       finalizeLoopPoints: (state, action) => {
           if (state.temporaryLoopStart !== undefined) {
               const endPosition = percentToMs(action.payload, state.totalDuration);
               const startPosition = state.temporaryLoopStart;
               const start = Math.min(startPosition, endPosition);
               const end = Math.max(startPosition, endPosition);
               state.loopRegion = { start, end };
               state.loopEnabled = true;
               state.isSettingLoopPoints = false;
               state.temporaryLoopStart = undefined;
           }
       },
       updateLoopPoints: (state, action) => {
           if (!state.loopRegion) return;
           const { start, end } = action.payload;
           if (start !== undefined) {
               const startMs = percentToMs(start, state.totalDuration);
               if (startMs < state.loopRegion.end) {
                   state.loopRegion.start = startMs;
               }
           }
           if (end !== undefined) {
               const endMs = percentToMs(end, state.totalDuration);
               if (endMs > state.loopRegion.start) {
                   state.loopRegion.end = endMs;
               }
           }
       },
       clearLoopPoints: (state) => {
           state.loopRegion = undefined;
           state.loopEnabled = false;
           state.isSettingLoopPoints = false;
           state.temporaryLoopStart = undefined;
       },
       toggleLoopEnabled: (state) => {
           if (state.loopRegion) {
               state.loopEnabled = !state.loopEnabled;
           }
       },
       setTempo: (state, action) => {
           state.tempo = Math.max(20, Math.min(300, action.payload));
           state.totalDuration = (4 * 60 * 1000 * 120) / state.tempo;
       },
       setTotalDuration: (state, action) => {
           state.totalDuration = action.payload;
       },
       updateSchedulingConfig: (state, action) => {
           state.schedulingConfig = {
               ...state.schedulingConfig,
               ...action.payload
           };
       },
       toggleMetronome: (state) => {
           state.metronomeEnabled = !state.metronomeEnabled;
       },
       toggleCountIn: (state) => {
           state.countInEnabled = !state.countInEnabled;
       },
       setPrerollBars: (state, action) => {
           state.prerollBars = Math.max(0, Math.min(4, action.payload));
       }
   }
});

export default playbackSlice.reducer;
