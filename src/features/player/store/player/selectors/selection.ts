// features/player/store/player/selectors/selection.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../../../store';

// Keep existing selectSelectedNote selector
export const selectSelectedNote = (state: RootState) => {
    if (!state.player.selectedNoteId) return null;

    for (const track of state.player.tracks) {
        const note = track.notes.find(n => n.id === state.player.selectedNoteId);
        if (note) {
            return {
                note,
                trackId: track.id
            };
        }
    }
    return null;
};

// Memoize multi-select selectors
export const selectMultiSelectedNoteIds = (state: RootState) =>
    state.player.multiSelectedNoteIds || [];

export const selectMultiSelectedNotes = createSelector(
    [
        state => state.player.tracks,
        selectMultiSelectedNoteIds
    ],
    (tracks, multiSelectedNoteIds) => {
        return multiSelectedNoteIds.map(noteId => {
            for (const track of tracks) {
                const note = track.notes.find(n => n.id === noteId);
                if (note) {
                    return {
                        note,
                        trackId: track.id
                    };
                }
            }
            return null;
        }).filter(Boolean);
    }
);

export const isNoteSelected = createSelector(
    [
        state => state.player.selectedNoteId,
        selectMultiSelectedNoteIds,
        (state, noteId: string) => noteId
    ],
    (selectedNoteId, multiSelectedNoteIds, noteId) =>
        selectedNoteId === noteId || multiSelectedNoteIds.includes(noteId)
);

export const getSelectedNotesCount = createSelector(
    [
        state => state.player.selectedNoteId,
        selectMultiSelectedNoteIds
    ],
    (selectedNoteId, multiSelectedNoteIds) =>
        multiSelectedNoteIds.length + (selectedNoteId ? 1 : 0)
);

export const isNoteFocused = createSelector(
    [
        state => state.player.selectedNoteId,
        selectMultiSelectedNoteIds,
        (state, noteId: string) => noteId
    ],
    (selectedNoteId, multiSelectedNoteIds, noteId) =>
        selectedNoteId === noteId && !multiSelectedNoteIds.length
);

export const getSelectionInfo = createSelector(
    [
        state => state.player.selectedNoteId,
        selectMultiSelectedNoteIds,
        (state, noteId: string) => noteId
    ],
    (selectedNoteId, multiSelectedNoteIds, noteId) => ({
        isSelected: selectedNoteId === noteId || multiSelectedNoteIds.includes(noteId),
        isMultiSelected: multiSelectedNoteIds.includes(noteId),
        isFocused: selectedNoteId === noteId && !multiSelectedNoteIds.length
    })
);