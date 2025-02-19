// src/features/player/hooks/useNoteDrag.ts

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { moveNote, selectTimelineSettings } from '../store/player';
import { LAYOUT } from '../constants';
import { NoteEvent } from "../types";

interface DragState {
    initialX: number;
    initialY: number;
    initialNoteTime: number;
    initialTrack: number;
    // Add reference to the initially dragged note for multi-select
    draggedNoteId: string;
    // Store initial positions of all selected notes
    selectedNotesInitialStates: {
        [noteId: string]: {
            timestamp: number;
            trackIndex: number;
        };
    };
}

export function useNoteDrag() {
    const dispatch = useAppDispatch();
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const multiSelectedNoteIds = useAppSelector(state => state.player.multiSelectedNoteIds);
    const tracks = useAppSelector(state => state.player.tracks);
    const [dragState, setDragState] = useState<DragState | null>(null);

    const handleDragStart = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        note: NoteEvent,
        trackIndex: number
    ) => {
        e.stopPropagation();
        e.preventDefault();

        // Collect initial states of all selected notes
        const selectedNotesInitialStates: DragState['selectedNotesInitialStates'] = {};

        if (multiSelectedNoteIds.includes(note.id)) {
            multiSelectedNoteIds.forEach(noteId => {
                for (let i = 0; i < tracks.length; i++) {
                    const foundNote = tracks[i].notes.find(n => n.id === noteId);
                    if (foundNote) {
                        selectedNotesInitialStates[noteId] = {
                            timestamp: foundNote.timestamp,
                            trackIndex: i
                        };
                        break;
                    }
                }
            });
        }

        setDragState({
            initialX: e.clientX,
            initialY: e.clientY,
            initialNoteTime: note.timestamp,
            initialTrack: trackIndex,
            draggedNoteId: note.id,
            selectedNotesInitialStates
        });
    }, [multiSelectedNoteIds, tracks]);

    const handleDrag = useCallback((
        e: MouseEvent,
        note: NoteEvent,
        trackId: string,
        availableTracks: string[]
    ) => {
        if (!dragState) return;

        // Calculate horizontal movement (time)
        const deltaX = e.clientX - dragState.initialX;
        const zoom = Math.max(0.001, timelineSettings.zoom);
        const timeDelta = deltaX / zoom;

        // Calculate vertical movement (track)
        const deltaY = e.clientY - dragState.initialY;
        const trackDelta = Math.round(deltaY / LAYOUT.TRACK_HEIGHT);

        // Handle snapping
        const getSnappedTime = (time: number): number => {
            if (timelineSettings.snap.enabled && e.shiftKey) {
                const { resolution, strength } = timelineSettings.snap;
                const snapPoint = Math.round(time / resolution) * resolution;
                return (time * (1 - strength)) + (snapPoint * strength);
            }
            return time;
        };

        if (Object.keys(dragState.selectedNotesInitialStates).length > 0) {
            // Multi-select drag
            Object.entries(dragState.selectedNotesInitialStates).forEach(([noteId, initialState]) => {
                const newTrackIndex = Math.max(0, Math.min(
                    availableTracks.length - 1,
                    initialState.trackIndex + trackDelta
                ));

                const newTime = Math.max(0, initialState.timestamp + timeDelta);
                const finalTime = getSnappedTime(newTime);

                // Find current track for this note
                for (const track of tracks) {
                    if (track.notes.find(n => n.id === noteId)) {
                        dispatch(moveNote({
                            trackId: track.id,
                            noteId,
                            newTime: finalTime,
                            newTrackId: availableTracks[newTrackIndex]
                        }));
                        break;
                    }
                }
            });
        } else {
            // Single note drag - preserve existing behavior
            const newTrackIndex = Math.max(0, Math.min(
                availableTracks.length - 1,
                dragState.initialTrack + trackDelta
            ));

            const newTime = Math.max(0, dragState.initialNoteTime + timeDelta);
            const finalTime = getSnappedTime(newTime);

            dispatch(moveNote({
                trackId,
                noteId: note.id,
                newTime: finalTime,
                newTrackId: availableTracks[newTrackIndex]
            }));
        }
    }, [dragState, timelineSettings, dispatch, tracks]);

    const handleDragEnd = useCallback(() => {
        setDragState(null);
    }, []);

    const handleKeyboardMove = useCallback((
        note: NoteEvent,
        trackId: string,
        direction: 'left' | 'right',
        isCoarse: boolean
    ) => {
        const FINE_MOVEMENT = 1 / timelineSettings.zoom;
        const COARSE_MOVEMENT = FINE_MOVEMENT * 10;
        const delta = (direction === 'left' ? -1 : 1) * (isCoarse ? COARSE_MOVEMENT : FINE_MOVEMENT);

        if (multiSelectedNoteIds.includes(note.id)) {
            // Move all selected notes
            multiSelectedNoteIds.forEach(noteId => {
                for (const track of tracks) {
                    const selectedNote = track.notes.find(n => n.id === noteId);
                    if (selectedNote) {
                        const newTime = Math.max(0, selectedNote.timestamp + delta);
                        dispatch(moveNote({
                            trackId: track.id,
                            noteId,
                            newTime
                        }));
                        break;
                    }
                }
            });
        } else {
            // Single note move - preserve existing behavior
            const newTime = Math.max(0, note.timestamp + delta);
            dispatch(moveNote({
                trackId,
                noteId: note.id,
                newTime
            }));
        }
    }, [timelineSettings, dispatch, multiSelectedNoteIds, tracks]);

    return {
        handleDragStart,
        handleDrag,
        handleDragEnd,
        handleKeyboardMove,
        isDragging: !!dragState
    };
}