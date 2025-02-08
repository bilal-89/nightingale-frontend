import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';
import { SynthesisParameters } from '../../../audio/types/audioTypes';

export interface NoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis: SynthesisParameters;
}

export interface Clip {
    id: string;
    startCell: number;
    length: number;
    track: number;
    isSelected: boolean;
    notes: NoteEvent[];
    parameters: {
        velocity: number;
        pitch: number;
        tuning: number;
    };
}

interface SelectedNote {
    clipId: string;
    noteIndex: number;
}

interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    loopRegion?: {
        start: number;
        end: number;
    };
}

interface ArrangementState {
    isRecording: boolean;
    recordingStartTime: number | null;
    currentTrack: number;
    clips: Clip[];
    recordingBuffer: NoteEvent[];
    tempo: number;
    playback: PlaybackState;
    selectedNote: SelectedNote | null;
}

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
        // Existing reducers
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

        setCurrentTrack: (state, action: PayloadAction<number>) => {
            state.currentTrack = action.payload;
        },

        addClip: (state, action: PayloadAction<Clip>) => {
            state.clips.push(action.payload);
        },

        updateClipLength: (state, action: PayloadAction<{
            id: string;
            length: number;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.length = action.payload.length;
            }
        },

        toggleClipSelection: (state, action: PayloadAction<string>) => {
            const clip = state.clips.find(c => c.id === action.payload);
            if (clip) {
                clip.isSelected = !clip.isSelected;
            }
        },

        moveClip: (state, action: PayloadAction<{
            id: string;
            startCell: number;
            track: number;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.startCell = action.payload.startCell;
                clip.track = action.payload.track;
            }
        },

        updateClipParameters: (state, action: PayloadAction<{
            id: string;
            parameters: Partial<Clip['parameters']>;
        }>) => {
            const clip = state.clips.find(c => c.id === action.payload.id);
            if (clip) {
                clip.parameters = {
                    ...clip.parameters,
                    ...action.payload.parameters
                };
            }
        },

        updateNoteEvent: (state, action: PayloadAction<{
            note: number;
            timestamp: number;
            duration: number;
        }>) => {
            const eventIndex = state.recordingBuffer.findIndex(event =>
                event.note === action.payload.note &&
                event.timestamp === action.payload.timestamp
            );

            if (eventIndex !== -1) {
                state.recordingBuffer[eventIndex] = {
                    ...state.recordingBuffer[eventIndex],
                    duration: action.payload.duration
                };
            }
        },

        // New note selection and editing reducers
        selectNote: (state, action: PayloadAction<SelectedNote | null>) => {
            state.selectedNote = action.payload;
        },

        updateSelectedNoteParameters: (state, action: PayloadAction<Partial<NoteEvent>>) => {
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

        // Enhanced playback control reducers
        startPlayback: (state) => {
            state.playback.isPlaying = true;
            if (state.playback.currentTime >= getArrangementEndTime(state)) {
                state.playback.currentTime = state.playback.loopRegion?.start || 0;
            }
        },

        stopPlayback: (state) => {
            state.playback.isPlaying = false;
        },

        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = action.payload;
            if (state.playback.loopRegion) {
                const { start, end } = state.playback.loopRegion;
                if (state.playback.currentTime >= end) {
                    state.playback.currentTime = start;
                }
            }
        },

        setPlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = action.payload;
        },

        // Enhanced loop region control
        setLoopRegion: (state, action: PayloadAction<{ start: number; end: number } | undefined>) => {
            state.playback.loopRegion = action.payload;

            // If we're currently playing and outside the new loop region, adjust position
            if (state.playback.isPlaying && action.payload) {
                if (state.playback.currentTime < action.payload.start ||
                    state.playback.currentTime >= action.payload.end) {
                    state.playback.currentTime = action.payload.start;
                }
            }
        },

        clearLoopRegion: (state) => {
            state.playback.loopRegion = undefined;
        }
    }
});

// Helper function to get the end time of the arrangement
const getArrangementEndTime = (state: ArrangementState): number => {
    if (state.clips.length === 0) return 0;
    return Math.max(...state.clips.map(clip => clip.startCell + clip.length)) * (60 / state.tempo);
};

// Export actions
export const {
    startRecording,
    stopRecording,
    addNoteEvent,
    setCurrentTrack,
    addClip,
    updateClipLength,
    toggleClipSelection,
    moveClip,
    updateClipParameters,
    startPlayback,
    stopPlayback,
    updateNoteEvent,
    updatePlaybackPosition,
    setPlaybackPosition,
    setLoopRegion,
    clearLoopRegion,
    selectNote,
    updateSelectedNoteParameters
} = arrangementSlice.actions;

// Export selectors
export const selectIsRecording = (state: RootState) => state.arrangement.isRecording;
export const selectCurrentTrack = (state: RootState) => state.arrangement.currentTrack;
export const selectClips = (state: RootState) => state.arrangement.clips;
export const selectSelectedClips = (state: RootState) =>
    state.arrangement.clips.filter(clip => clip.isSelected);
export const selectTempo = (state: RootState) => state.arrangement.tempo;
export const selectIsPlaying = (state: RootState) => state.arrangement.playback.isPlaying;
export const selectCurrentTime = (state: RootState) => state.arrangement.playback.currentTime;
export const selectLoopRegion = (state: RootState) => state.arrangement.playback.loopRegion;
export const selectSelectedNote = (state: RootState) => {
    if (!state.arrangement.selectedNote) return null;

    const clip = state.arrangement.clips.find(
        c => c.id === state.arrangement.selectedNote!.clipId
    );
    if (!clip) return null;

    const note = clip.notes[state.arrangement.selectedNote.noteIndex];
    if (!note) return null;

    return {
        ...note,
        clipId: state.arrangement.selectedNote.clipId,
        noteIndex: state.arrangement.selectedNote.noteIndex
    };
};

export default arrangementSlice.reducer;