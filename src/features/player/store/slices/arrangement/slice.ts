// src/features/player/store/slices/arrangement.slice.ts
import { createSlice } from '@reduxjs/toolkit';
import {ArrangementState} from './types';
import {NoteColor} from '../../../../../shared/constants/colors.ts'
import { recordingReducers, noteReducers, playbackReducers, clipReducers } from '../../reducers';

const initialState: ArrangementState = {
    isRecording: false,
    recordingStartTime: null,
    currentTrack: 0,
    clips: [],
    recordingBuffer: [],
    tempo: 120,
    playback: {
        isPlaying: false,
        currentTime: 0
    },
    selectedNote: null,
    tracks: [  // Add this initialization
        { id: 0, color: NoteColor.Red },
        { id: 1, color: NoteColor.Orange },
        { id: 2, color: NoteColor.Brown },
        { id: 3, color: NoteColor.Green },
        { id: 4, color: NoteColor.Blue },
        { id: 5, color: NoteColor.Purple },
        { id: 6, color: NoteColor.Magenta }
    ]
};

const arrangementSlice = createSlice({
    name: 'arrangement',
    initialState,
    reducers: {
        ...recordingReducers,  // Now using our new recording reducers
        ...clipReducers,
        ...playbackReducers,
        ...noteReducers
    }
});

// Export actions
export const {
    // Recording actions
    startRecording,
    stopRecording,
    addNoteEvent,
    updateNoteEvent,
    // Clip actions
    setCurrentTrack,
    addClip,
    updateClipLength,
    toggleClipSelection,
    moveClip,
    updateClipParameters,
    // Playback actions
    startPlayback,
    stopPlayback,
    updatePlaybackPosition,
    setPlaybackPosition,
    setLoopRegion,
    clearLoopRegion,
    // Note actions
    selectNote,
    updateSelectedNoteParameters,
    setTrackColor,
} = arrangementSlice.actions;

export {
    selectIsRecording,
    selectCurrentTrack,
    selectClips,
    selectSelectedClips,
    selectTempo,
    selectIsPlaying,
    selectCurrentTime,
    selectLoopRegion,
    selectSelectedNote
} from '../../slices/arrangement/selectors.ts';

export default arrangementSlice.reducer;