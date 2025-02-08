// src/features/player/store/slices/arrangement.slice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { ArrangementState } from './types';
import { recordingReducers } from "./reducers/recording";
import { playbackReducers } from './reducers/playback';
import { noteReducers } from './reducers/notes';
import { clipReducers } from "./reducers/clips.ts";

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
    selectedNote: null
};

const arrangementSlice = createSlice({
    name: 'arrangement',
    initialState,
    reducers: {
        ...recordingReducers,
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
    updateSelectedNoteParameters
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