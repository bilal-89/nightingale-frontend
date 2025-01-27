// src/features/player/state/slices/player.slice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import {
    Clip,
    NoteEvent,
    NoteSelection,
    NoteUpdatePayload,
    DragState,
    GridPosition
} from '../../types';

// We define our state interface first, keeping all of our player-related state organized
interface PlayerState {
    // Recording state
    isRecording: boolean;
    recordingStartTime: number | null;
    recordingBuffer: NoteEvent[];

    // Track and clip management
    currentTrack: number;
    clips: Clip[];

    // Selection and editing
    selectedNote: NoteSelection | null;
    selectedClips: string[];  // Array of clip IDs

    // Grid interaction state
    dragState: DragState | null;

    // Configuration
    tempo: number;
    gridResolution: number;  // Number of cells per beat
    numberOfTracks: number;
}

// Set up initial state with sensible defaults
const initialState: PlayerState = {
    isRecording: false,
    recordingStartTime: null,
    recordingBuffer: [],
    currentTrack: 0,
    clips: [],
    selectedNote: null,
    selectedClips: [],
    dragState: null,
    tempo: 120,
    gridResolution: 4,
    numberOfTracks: 4
};

// Create the slice with our reducers
const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        // Recording actions
        startRecording: (state) => {
            state.isRecording = true;
            state.recordingStartTime = Date.now();
            state.recordingBuffer = [];
        },

        stopRecording: (state) => {
            state.isRecording = false;
            state.recordingStartTime = null;
            // Note: We don't clear the buffer here as we might want to create a clip from it
        },

        addNoteEvent: (state, action: PayloadAction<NoteEvent>) => {
            if (state.isRecording) {
                state.recordingBuffer.push(action.payload);
            }
        },

        // Track management
        setCurrentTrack: (state, action: PayloadAction<number>) => {
            if (action.payload >= 0 && action.payload < state.numberOfTracks) {
                state.currentTrack = action.payload;
            }
        },

        // Clip management
        addClip: (state, action: PayloadAction<Clip>) => {
            state.clips.push(action.payload);
        },

        updateClip: (state, action: PayloadAction<{
            id: string;
            updates: Partial<Clip>;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                Object.assign(clip, action.payload.updates);
            }
        },

        // Add to the reducers in playerSlice
        updateNoteEvent: (state, action: PayloadAction<{
            id: string;
            duration: number;
        }>) => {
            // Find the note in the recording buffer
            const noteIndex = state.recordingBuffer.findIndex(
                note => note.id === action.payload.id
            );

            if (noteIndex !== -1) {
                // Update the note's duration
                state.recordingBuffer[noteIndex] = {
                    ...state.recordingBuffer[noteIndex],
                    duration: action.payload.duration
                };

                // Log the update to verify it's working
                console.log('Note duration updated:', {
                    noteId: action.payload.id,
                    newDuration: action.payload.duration,
                    note: state.recordingBuffer[noteIndex]
                });
            }
        },

        moveClip: (state, action: PayloadAction<{
            id: string;
            position: GridPosition;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.track = action.payload.position.track;
                clip.startCell = action.payload.position.cell;
            }
        },

        deleteClip: (state, action: PayloadAction<string>) => {
            state.clips = state.clips.filter(clip => clip.id !== action.payload);
        },

        // Note editing
        selectNote: (state, action: PayloadAction<NoteSelection | null>) => {
            state.selectedNote = action.payload;
            // Clear clip selection when selecting a note
            if (action.payload) {
                state.selectedClips = [action.payload.clipId];
            }
        },

        updateSelectedNote: (state, action: PayloadAction<Partial<NoteEvent>>) => {
            if (!state.selectedNote) return;

            const clip = state.clips.find(c => c.id === state.selectedNote!.clipId);
            if (!clip) return;

            const note = clip.notes[state.selectedNote.noteIndex];
            if (!note) return;

            clip.notes[state.selectedNote.noteIndex] = {
                ...note,
                ...action.payload
            };
        },

        // Drag state management
        setDragState: (state, action: PayloadAction<DragState | null>) => {
            state.dragState = action.payload;
        },

        updateDragPosition: (state, action: PayloadAction<GridPosition>) => {
            if (state.dragState) {
                state.dragState.currentPoint = action.payload;
            }
        },

        // Configuration
        setTempo: (state, action: PayloadAction<number>) => {
            state.tempo = Math.max(20, Math.min(300, action.payload)); // Clamp between 20-300 BPM
        },

        setGridResolution: (state, action: PayloadAction<number>) => {
            state.gridResolution = action.payload;
        },


    }
});

// Export actions
export const {
    startRecording,
    stopRecording,
    addNoteEvent,
    setCurrentTrack,
    addClip,
    updateClip,
    moveClip,
    deleteClip,
    updateNoteEvent,  // Add this line

    selectNote,
    updateSelectedNote,
    setDragState,
    updateDragPosition,
    setTempo,
    setGridResolution
} = playerSlice.actions;

// Export selectors
export const selectIsRecording = (state: RootState) => state.player.isRecording;
export const selectCurrentTrack = (state: RootState) => state.player.currentTrack;
export const selectClips = (state: RootState) => state.player.clips;
export const selectSelectedNote = (state: RootState) => {
    if (!state.player.selectedNote) return null;

    const clip = state.player.clips.find(
        c => c.id === state.player.selectedNote!.clipId
    );
    if (!clip) return null;

    return {
        note: clip.notes[state.player.selectedNote.noteIndex],
        clipId: state.player.selectedNote.clipId,
        noteIndex: state.player.selectedNote.noteIndex
    };
};
export const selectDragState = (state: RootState) => state.player.dragState;
export const selectTempo = (state: RootState) => state.player.tempo;

// Export reducer
export default playerSlice.reducer;