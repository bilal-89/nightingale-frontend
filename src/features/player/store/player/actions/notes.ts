import { createAction } from '@reduxjs/toolkit';
import { NoteEvent } from '../../../types';

export const addNoteToTrack = createAction<{
   trackId: string;
   note: NoteEvent;
}>('player/addNoteToTrack');

export const moveNote = createAction<{
   trackId: string;
   noteId: string;
   newTime: number;
   newTrackId?: string;
}>('player/moveNote');

export const updateNoteParameters = createAction<{
   trackId: string;
   noteId: string;
   updates: Partial<NoteEvent>;
}>('player/updateNoteParameters');

export const deleteNote = createAction<{
   trackId: string;
   noteId: string;
}>('player/deleteNote');
