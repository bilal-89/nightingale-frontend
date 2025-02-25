import type { RootState } from '../../../../store';


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