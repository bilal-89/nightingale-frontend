import { PayloadAction } from '@reduxjs/toolkit';
import { PlayerState } from '../types';
import { NoteEvent, SelectedNote } from '../../types';

export const noteReducers = {
    selectNote: (state: PlayerState, action: PayloadAction<SelectedNote | null>) => {
        state.selectedNote = action.payload;
    },

    updateSelectedNoteParameters: (state: PlayerState, action: PayloadAction<Partial<NoteEvent>>) => {
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

    addNoteWithCurrentTrackColor: (state: PlayerState, action: PayloadAction<Omit<NoteEvent, 'color'>>) => {
        const currentTrack = state.tracks.find(t => t.id === state.currentTrack.toString());
        if (currentTrack) {
            const noteWithColor = {
                ...action.payload,
                color: currentTrack.color
            };
            // Add note to current clip or recording buffer as needed
            if (state.isRecording) {
                state.recordingBuffer.push(noteWithColor);
            }
        }
    }
};
