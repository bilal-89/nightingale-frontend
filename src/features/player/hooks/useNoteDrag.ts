// src/features/player/hooks/useNoteDrag.ts

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { moveNote, selectTimelineSettings } from '../state/slices/player.slice';
import { LAYOUT } from '../constants';
import { NoteEvent } from "../types";

interface DragState {
    initialX: number;
    initialY: number;
    initialNoteTime: number;
    initialTrack: number;
}

export function useNoteDrag() {
    const dispatch = useAppDispatch();
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const [dragState, setDragState] = useState<DragState | null>(null);

    const handleDragStart = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        note: NoteEvent,
        trackId: string,
        trackIndex: number
    ) => {
        e.stopPropagation();
        e.preventDefault();

        setDragState({
            initialX: e.clientX,
            initialY: e.clientY,
            initialNoteTime: note.timestamp,
            initialTrack: trackIndex
        });
    }, []);

    const handleDrag = useCallback((
        e: MouseEvent,
        note: NoteEvent,
        trackId: string,
        availableTracks: string[]
    ) => {
        if (!dragState) return;

        const deltaX = e.clientX - dragState.initialX;
        const deltaY = e.clientY - dragState.initialY;

        const zoom = Math.max(0.001, timelineSettings.zoom);
        const timeDelta = deltaX / zoom;
        const newTime = Math.max(0, dragState.initialNoteTime + timeDelta);

        const trackDelta = Math.round(deltaY / LAYOUT.TRACK_HEIGHT);
        const newTrackIndex = Math.max(0, Math.min(
            availableTracks.length - 1,
            dragState.initialTrack + trackDelta
        ));

        let finalTime = Math.max(0, newTime);
        if (timelineSettings.snap.enabled) {
            const { resolution, strength } = timelineSettings.snap;
            const snapPoint = Math.round(finalTime / resolution) * resolution;
            finalTime = (finalTime * (1 - strength)) + (snapPoint * strength);
        }

        dispatch(moveNote({
            trackId,
            noteId: note.id,
            newTime: finalTime,
            newTrackId: availableTracks[newTrackIndex]
        }));
    }, [dragState, timelineSettings, dispatch]);

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
        const newTime = Math.max(0, note.timestamp + delta);

        let finalTime = newTime;
        if (timelineSettings.snap.enabled) {
            const { resolution, strength } = timelineSettings.snap;
            const snapPoint = Math.round(finalTime / resolution) * resolution;
            finalTime = (finalTime * (1 - strength)) + (snapPoint * strength);
        }

        dispatch(moveNote({
            trackId,
            noteId: note.id,
            newTime: finalTime
        }));
    }, [timelineSettings, dispatch]);

    return {
        handleDragStart,
        handleDrag,
        handleDragEnd,
        handleKeyboardMove,
        isDragging: !!dragState
    };
}