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

// Add new interface for note parameter updates
interface NoteParameterUpdate {
    clipId: string;
    noteIndex: number;
    parameters: {
        synthesis?: {
            envelope?: {
                attack?: number;
                decay?: number;
                sustain?: number;
                release?: number;
            };
        };
        velocity?: number;
        tuning?: number;
    };
}

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
            console.log('selectNote action:', action.payload);
            state.selectedNote = action.payload;
            // Clear clip selection when selecting a note
            if (action.payload) {
                state.selectedClips = [action.payload.clipId];
            }
            console.log('New state:', {
                selectedNote: state.selectedNote,
                selectedClips: state.selectedClips
            });
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

        // New parameter update reducer
        // src/features/player/state/slices/player.slice.ts

// ... rest of your imports and interfaces ...

// Inside your playerSlice.reducers object, update the updateNoteParameters reducer:
        updateNoteParameters: (state, action: PayloadAction<{
            clipId: string;
            noteIndex: number;
            parameters: {
                synthesis?: {
                    envelope?: {
                        attack?: number;
                        decay?: number;
                        sustain?: number;
                        release?: number;
                    };
                };
                tuning?: number;
                velocity?: number;
            };
        }>) => {
            const { clipId, noteIndex, parameters } = action.payload;
            console.log('Update note parameters:', { clipId, noteIndex, parameters }); // Debug log

            const clip = state.clips.find(c => c.id === clipId);
            if (!clip) {
                console.warn('Clip not found:', clipId);
                return;
            }

            const note = clip.notes[noteIndex];
            if (!note) {
                console.warn('Note not found:', noteIndex);
                return;
            }

            // Update synthesis parameters if provided
            if (parameters.synthesis?.envelope) {
                note.synthesis = {
                    ...note.synthesis,
                    envelope: {
                        ...note.synthesis.envelope,
                        ...parameters.synthesis.envelope
                    }
                };
            }

            // Handle tuning updates
            if (parameters.tuning !== undefined) {
                console.log('Setting tuning from', note.tuning, 'to', parameters.tuning);
                note.tuning = parameters.tuning;
            }

            // Handle velocity updates
            if (parameters.velocity !== undefined) {
                note.velocity = parameters.velocity;
            }

            console.log('Updated note:', note); // Debug log
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
            state.tempo = Math.max(20, Math.min(300, action.payload));
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
    updateNoteEvent,
    selectNote,
    updateSelectedNote,
    updateNoteParameters,
    setDragState,
    updateDragPosition,
    setTempo,
    setGridResolution
} = playerSlice.actions;

// Export selectors
export const selectIsRecording = (state: RootState) => state.player.isRecording;
export const selectCurrentTrack = (state: RootState) => state.player.currentTrack;
export const selectClips = (state: RootState) => state.player.clips;
// Add this to your player.slice.ts

// In your player.slice.ts

export const selectSelectedNote = (state: RootState) => {
    const selection = state.player.selectedNote;
    if (!selection) return null;

    const clip = state.player.clips.find(c => c.id === selection.clipId);
    if (!clip) return null;

    const note = clip.notes[selection.noteIndex];
    if (!note) return null;

    console.log('Selected note in selector:', note); // Debug log

    // Ensure all required properties exist
    const normalizedNote = {
        ...note,
        tuning: note.tuning ?? 0, // Make sure tuning exists
        synthesis: note.synthesis ?? {
            envelope: {
                attack: 0.05,
                decay: 0.1,
                sustain: 0.7,
                release: 0.15
            }
        }
    };

    return {
        note: normalizedNote,
        clipId: selection.clipId,
        noteIndex: selection.noteIndex
    };
};
export const selectDragState = (state: RootState) => state.player.dragState;
export const selectTempo = (state: RootState) => state.player.tempo;

// Export reducer
export default playerSlice.reducer;