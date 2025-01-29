// src/features/player/state/slices/player.slice.ts

import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import {
    Clip,
    NoteEvent,
    NoteSelection,
    TimePosition,
    NoteParameterUpdate,
} from '../../types';

// Our state now uses time-based positioning instead of grid cells
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
    selectedClips: string[];

    // Timeline configuration
    tempo: number;
    numberOfTracks: number;

    // Timeline view settings
    timelineZoom: number;     // Pixels per millisecond
    snapEnabled: boolean;     // Whether snap-to-grid is enabled
    snapResolution: number;   // Snap resolution in milliseconds
    snapStrength: number;     // 0-1, allows partial quantization
}

const initialState: PlayerState = {
    isRecording: false,
    recordingStartTime: null,
    recordingBuffer: [],
    currentTrack: 0,
    clips: [],
    selectedNote: null,
    selectedClips: [],
    tempo: 120,
    numberOfTracks: 4,
    timelineZoom: 0.05,
    snapEnabled: true,
    snapResolution: 250,
    snapStrength: 1.0
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

        deleteClip: (state, action: PayloadAction<string>) => {
            state.clips = state.clips.filter(clip => clip.id !== action.payload);
        },

        // New time-based movement
        moveClip: (state, action: PayloadAction<{
            id: string;
            position: {
                time: number;
                track: number;
            };
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.startTime = action.payload.position.time;
                clip.track = action.payload.position.track;
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

        // Note selection and editing
        selectNote: (state, action: PayloadAction<NoteSelection | null>) => {
            state.selectedNote = action.payload;
            if (action.payload) {
                state.selectedClips = [action.payload.clipId];
            }
        },

        updateSelectedNote: (state, action: PayloadAction<Partial<NoteEvent>>) => {
            if (!state.selectedNote) return;

            const clip = state.clips.find(c => c.id === state.selectedNote.clipId);
            if (!clip) return;

            const note = clip.notes[state.selectedNote.noteIndex];
            if (!note) return;

            clip.notes[state.selectedNote.noteIndex] = {
                ...note,
                ...action.payload
            };
        },

        updateNoteParameters: (state, action: PayloadAction<NoteParameterUpdate>) => {
            const { clipId, noteIndex, parameters } = action.payload;

            const clip = state.clips.find(c => c.id === clipId);
            if (!clip) return;

            const note = clip.notes[noteIndex];
            if (!note) return;

            if (parameters.synthesis?.envelope) {
                note.synthesis = {
                    ...note.synthesis,
                    envelope: {
                        ...note.synthesis.envelope,
                        ...parameters.synthesis.envelope
                    }
                };
            }

            if (parameters.tuning !== undefined) {
                note.tuning = parameters.tuning;
            }

            if (parameters.velocity !== undefined) {
                note.velocity = parameters.velocity;
            }
        },

        // Timeline view controls
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
        }
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
    quantizeClip,
    setClipTiming,
    setTimelineZoom,
    setSnapSettings,
    updateNoteEvent,
    selectNote,
    updateSelectedNote,
    updateNoteParameters,
    setTempo
} = playerSlice.actions;

// Enhanced selectors
export const selectIsRecording = (state: RootState) => state.player.isRecording;
export const selectCurrentTrack = (state: RootState) => state.player.currentTrack;
export const selectClips = (state: RootState) => state.player.clips;
export const selectTimelineSettings = createSelector(
    (state: RootState) => state.player,
    (player) => ({
        zoom: player.timelineZoom,
        snap: {
            enabled: player.snapEnabled,
            resolution: player.snapResolution,
            strength: player.snapStrength
        }
    })
);

export const selectTempo = (state: RootState) => state.player.tempo;

// Add the selectSelectedNote selector
export const selectSelectedNote = (state: RootState) => {
    const selection = state.player.selectedNote;
    if (!selection) return null;

    const clip = state.player.clips.find(c => c.id === selection.clipId);
    if (!clip) return null;

    const note = clip.notes[selection.noteIndex];
    if (!note) return null;

    console.log('Selected note in selector:', note);

    // Normalize note data to ensure all required properties exist
    const normalizedNote = {
        ...note,
        tuning: note.tuning ?? 0,
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

export default playerSlice.reducer;