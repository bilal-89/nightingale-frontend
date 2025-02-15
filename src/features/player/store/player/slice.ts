//src/features/player/store/player/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayerState, Track } from './types';
import { NoteEvent } from '../../types';

const initialState: PlayerState = {
   isRecording: false,  
   recordingStartTime: null,
   recordingBuffer: [],
   currentTrack: 0,
   tracks: [
       {
           id: 'track-1',
           name: 'Track 1', 
           notes: [],
           color: '#9fc102',
           isMuted: false,
           isSolo: false
       },
       {
           id: 'track-2',
           name: 'Track 2',
           notes: [],
           color: '#ff6a1b',
           isMuted: false,
           isSolo: false
       },
       {
           id: 'track-3',
           name: 'Track 3',
           notes: [],
           color: '#9e4206',
           isMuted: false,
           isSolo: false
       }
   ],
   selectedNoteId: null,
   selectedTrackId: null,
   tempo: 120,
   timelineZoom: 0.05,
   snapEnabled: true,
   snapResolution: 250,
   snapStrength: 1.0
};

export const playerSlice = createSlice({
   name: 'player',
   initialState,
   reducers: {
       startRecording: (state) => {
           state.isRecording = true;
           state.recordingStartTime = Date.now();
       },

       stopRecording: (state) => {
           state.isRecording = false;
           state.recordingStartTime = null;
       },

       addNoteEvent: (state, action: PayloadAction<NoteEvent>) => {
           if (state.isRecording) {
               state.recordingBuffer.push(action.payload);
           }
       },

       addNoteToTrack: (state, action: PayloadAction<{
           trackId: string;
           note: NoteEvent;
       }>) => {
           const track = state.tracks.find(t => t.id === action.payload.trackId);
           if (track) {
               track.notes.push(action.payload.note);
               track.notes.sort((a, b) => a.timestamp - b.timestamp);
           }
       },

       moveNote: (state, action: PayloadAction<{
           trackId: string;
           noteId: string;
           newTime: number;
           newTrackId?: string;
       }>) => {
           const { trackId, noteId, newTime, newTrackId } = action.payload;
           const sourceTrack = state.tracks.find(t => t.id === trackId);
           if (!sourceTrack) return;

           const noteIndex = sourceTrack.notes.findIndex(n => n.id === noteId);
           if (noteIndex === -1) return;

           const note = sourceTrack.notes[noteIndex];

           if (newTrackId && newTrackId !== trackId) {
               const targetTrack = state.tracks.find(t => t.id === newTrackId);
               if (targetTrack) {
                   sourceTrack.notes.splice(noteIndex, 1);
                   targetTrack.notes.push({
                       ...note,
                       timestamp: newTime
                   });
                   targetTrack.notes.sort((a, b) => a.timestamp - b.timestamp);
               }
           } else {
               sourceTrack.notes[noteIndex] = {
                   ...note,
                   timestamp: newTime
               };
               sourceTrack.notes.sort((a, b) => a.timestamp - b.timestamp);
           }
       },

       updateNoteEvent: (state, action: PayloadAction<{
           id: string;
           duration: number;
       }>) => {
           const noteIndex = state.recordingBuffer.findIndex(
               note => note.id === action.payload.id
           );
           if (noteIndex !== -1) {
               state.recordingBuffer[noteIndex] = {
                   ...state.recordingBuffer[noteIndex],
                   duration: action.payload.duration
               };
           }
       },

       updateNoteParameters: (state, action: PayloadAction<{
           trackId: string;
           noteId: string;
           updates: Partial<NoteEvent>;
       }>) => {
           const track = state.tracks.find(t => t.id === action.payload.trackId);
           if (!track) return;

           const noteIndex = track.notes.findIndex(n => n.id === action.payload.noteId);
           if (noteIndex === -1) return;

           track.notes[noteIndex] = {
               ...track.notes[noteIndex],
               ...action.payload.updates
           };
       },

       deleteNote: (state, action: PayloadAction<{
           trackId: string;
           noteId: string;
       }>) => {
           const track = state.tracks.find(t => t.id === action.payload.trackId);
           if (track) {
               track.notes = track.notes.filter(n => n.id !== action.payload.noteId);
           }
       },

       setSelectedNoteId: (state, action: PayloadAction<string | null>) => {
           state.selectedNoteId = action.payload;
       },

       selectNote: (state, action: PayloadAction<{
           trackId: string;
           noteId: string;
       } | null>) => {
           if (action.payload) {
               state.selectedNoteId = action.payload.noteId;
               state.selectedTrackId = action.payload.trackId;
           } else {
               state.selectedNoteId = null;
               state.selectedTrackId = null;
           }
       },

       commitRecordingBuffer: (state, action: PayloadAction<string>) => {
           const track = state.tracks.find(t => t.id === action.payload);
           if (track && state.recordingBuffer.length > 0) {
               track.notes.push(...state.recordingBuffer);
               track.notes.sort((a, b) => a.timestamp - b.timestamp);
               state.recordingBuffer = [];
           }
       },

       setTimelineZoom: (state, action: PayloadAction<number>) => {
           state.timelineZoom = action.payload;
       },

       setSnapSettings: (state, action: PayloadAction<{
           enabled: boolean;
           resolution?: number;
           strength?: number;
       }>) => {
           const { enabled, resolution, strength } = action.payload;
           state.snapEnabled = enabled;
           if (resolution !== undefined) state.snapResolution = resolution;
           if (strength !== undefined) state.snapStrength = strength;
       },

       setTempo: (state, action: PayloadAction<number>) => {
           state.tempo = Math.max(20, Math.min(300, action.payload));
       },

       addTrack: (state) => {
           const newTrackNumber = state.tracks.length + 1;
           state.tracks.push({
               id: `track-${newTrackNumber}`,
               name: `Track ${newTrackNumber}`,
               notes: [],
               color: '#4a9eff',
               isMuted: false,
               isSolo: false
           });
       },

       deleteTrack: (state, action: PayloadAction<string>) => {
           state.tracks = state.tracks.filter(track => track.id !== action.payload);
       },

       setTrackSettings: (state, action: PayloadAction<{
           trackId: string;
           updates: Partial<Track>;
       }>) => {
           const track = state.tracks.find(t => t.id === action.payload.trackId);
           if (track) {
               Object.assign(track, action.payload.updates);
           }
       },

       setCurrentTrack: (state, action: PayloadAction<number>) => {
           if (action.payload >= 0 && action.payload < state.tracks.length) {
               state.currentTrack = action.payload;
           }
       }
   }
});

export const {
   startRecording,
   stopRecording,
   addNoteEvent,
   addNoteToTrack,
   moveNote,
   updateNoteEvent,
   updateNoteParameters,
   deleteNote,
   setSelectedNoteId,
   selectNote,
   commitRecordingBuffer,
   setTimelineZoom,
   setSnapSettings,
   setTempo,
   addTrack,
   deleteTrack,
   setTrackSettings,
   setCurrentTrack
} = playerSlice.actions;

export default playerSlice.reducer;
