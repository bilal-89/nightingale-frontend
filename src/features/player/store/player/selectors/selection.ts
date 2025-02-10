import { RootState } from '../../../../../store';

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
