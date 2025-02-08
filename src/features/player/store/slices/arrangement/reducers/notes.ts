// src/features/player/store/slices/arrangement/reducers/notes.ts
import { PayloadAction } from '@reduxjs/toolkit';
import type { ArrangementState, NoteEvent, SelectedNote } from '../types.ts';

export const noteReducers = {
    selectNote: (state: ArrangementState, action: PayloadAction<SelectedNote | null>) => {
        state.selectedNote = action.payload;
    },

    updateSelectedNoteParameters: (state: ArrangementState, action: PayloadAction<Partial<NoteEvent>>) => {
        if (!state.selectedNote) return;

        const clip = state.clips.find(c => c.id === state.selectedNote!.clipId);
        if (!clip) return;

        const note = clip.notes[state.selectedNote.noteIndex];
        if (!note) return;

        clip.notes[state.selectedNote.noteIndex] = {
            ...note,
            ...action.payload
        };
    }
};