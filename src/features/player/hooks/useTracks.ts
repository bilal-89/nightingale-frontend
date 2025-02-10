// src/features/player/hooks/useTracks.ts

import { useAppDispatch, useAppSelector } from './useStore';
import { NoteEvent } from '../types';
import {
    addTrack,
    deleteTrack,
    addNoteToTrack,
    moveNote,
    deleteNote,
    updateNoteParameters,
    setTrackSettings,
    selectTracks,
    selectCurrentTrack
} from '../store/player';
import {Track} from "../types/track.ts";

export const useTracks = () => {
    const dispatch = useAppDispatch();
    const tracks = useAppSelector(selectTracks);
    const currentTrackIndex = useAppSelector(selectCurrentTrack);
    const currentTrack = tracks[currentTrackIndex];

    return {
        // State
        tracks,
        currentTrack,
        currentTrackIndex,

        // Track Actions
        addTrack: () =>
            dispatch(addTrack()),

        deleteTrack: (trackId: string) =>
            dispatch(deleteTrack(trackId)),

        updateTrack: (trackId: string, updates: Partial<Track>) =>
            dispatch(setTrackSettings({ trackId, updates })),

        // Note Actions
        addNote: (trackId: string, note: NoteEvent) =>
            dispatch(addNoteToTrack({ trackId, note })),

        moveNote: (trackId: string, noteId: string, newTime: number, newTrackId?: string) =>
            dispatch(moveNote({ trackId, noteId, newTime, newTrackId })),

        deleteNote: (trackId: string, noteId: string) =>
            dispatch(deleteNote({ trackId, noteId })),

        updateNoteParameters: (trackId: string, noteId: string, updates: Partial<NoteEvent>) =>
            dispatch(updateNoteParameters({ trackId, noteId, updates }))
    };
};
//
// // Optional: If you need quantization functionality
// export const useNoteQuantization = () => {
//     const { updateNoteParameters } = useTracks();
//
//     return {
//         quantizeNote: (
//             trackId: string,
//             noteId: string,
//             settings: { resolution: number; strength: number }
//         ) => {
//             // Implement quantization logic here
//             // This would snap the note to the nearest grid position based on resolution
//             // and apply the strength factor for partial quantization
//         }
//     };
// };