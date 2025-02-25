// features/player/store/player/actions/selection.ts

import { createAction } from '@reduxjs/toolkit';

// Keep existing actions
export const setSelectedNoteId = createAction<string | null>('player/setSelectedNoteId');
export const selectNote = createAction<{
   trackId: string;
   noteId: string;
   isMultiSelect?: boolean;  // Add to the type
} | null>('player/selectNote');

// New actions for multi-select
export const addToSelection = createAction<{
   trackId: string;
   noteId: string;
}>('player/addToSelection');

export const clearSelection = createAction('player/clearSelection');

export const focusNote = createAction<{
   trackId: string;
   noteId: string;
}>('player/focusNote');