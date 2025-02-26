import { createSlice } from '@reduxjs/toolkit';
import { PlaybackSliceState } from '../player/types/state';

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
   prerollBars: 1,
   loopEnabled: false,
   loopStart: 0,
   loopEnd: 60 * 1000
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
           
           // Handle looping in the Redux state
           if (state.loopEnabled && newTime >= state.loopEnd) {
               // Calculate position within the loop
               const loopDuration = state.loopEnd - state.loopStart;
               const timeIntoLoop = (newTime - state.loopStart) % loopDuration;
               state.currentTime = state.loopStart + timeIntoLoop;
               
               console.log('Redux loop reset:', {
                   originalTime: newTime,
                   newTime: state.currentTime,
                   loopStart: state.loopStart,
                   loopEnd: state.loopEnd
               });
           } else {
               state.currentTime = newTime;
           }
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
       },
       toggleLoop: (state) => {
           state.loopEnabled = !state.loopEnabled;
       },
       setLoopPoints: (state, action) => {
           const { start, end } = action.payload;
           // Ensure we have valid numbers and round to avoid floating point issues
           const validStart = Math.round(Number(start) || 0);
           const validEnd = Math.round(Number(end) || 60000);
           
           if (validEnd > validStart) {
               state.loopStart = validStart;
               state.loopEnd = validEnd;
           } else {
               state.loopStart = validStart;
               state.loopEnd = validStart + 1000;
           }
           
           console.log('Redux: setLoopPoints', {
               start: state.loopStart,
               end: state.loopEnd
           });
       },
       setLoopStart: (state, action) => {
           // Ensure we have a valid number and round to avoid floating point issues
           const newStart = Math.round(Number(action.payload) || 0);
           
           if (newStart < state.loopEnd) {
               state.loopStart = newStart;
           } else {
               state.loopStart = newStart;
               state.loopEnd = newStart + 1000;
           }
           
           console.log('Redux: setLoopStart', {
               start: state.loopStart,
               end: state.loopEnd
           });
       },
       setLoopEnd: (state, action) => {
           // Ensure we have a valid number and round to avoid floating point issues
           const newEnd = Math.round(Number(action.payload) || 60000);
           
           if (newEnd > state.loopStart) {
               state.loopEnd = newEnd;
           } else if (state.loopStart > 0) {
               // If somehow the end is before start, set end to start + 1000ms
               state.loopEnd = state.loopStart + 1000;
           }
           
           console.log('Redux: setLoopEnd', {
               start: state.loopStart,
               end: state.loopEnd
           });
       }
   }
});

// Export all actions
export const {
    startPlayback,
    stopPlayback,
    updatePlaybackPosition,
    setPlaybackPosition,
    setTempo,
    setTotalDuration,
    updateSchedulingConfig,
    toggleMetronome,
    toggleCountIn,
    setPrerollBars,
    // Loop actions
    toggleLoop,
    setLoopPoints,
    setLoopStart,
    setLoopEnd
} = playbackSlice.actions;

// Export the reducer
export default playbackSlice.reducer;
