import { createSlice } from '@reduxjs/toolkit';
import { PlaybackSliceState } from '../player';

const initialState: PlaybackSliceState = {
   isPlaying: false,
   currentTime: 0,
   tempo: 120,
   totalDuration: 4 * 60 * 1000,
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
           state.currentTime = newTime;
       },
       setPlaybackPosition: (state, action) => {
           state.currentTime = Math.max(0, action.payload);
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
