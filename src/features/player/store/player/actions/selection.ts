import { createAction } from '@reduxjs/toolkit';

export const setSelectedNoteId = createAction<string | null>('player/setSelectedNoteId');
export const selectNote = createAction<{
   trackId: string;
   noteId: string;
} | null>('player/selectNote');
