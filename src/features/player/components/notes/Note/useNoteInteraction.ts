// src/features/player/components/notes/Note/useNoteInteraction.ts

import { useCallback, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectNote, moveNote } from '../../../store/player';
import { NoteEvent } from '../../../types';
import { 
    setParameterContext, 
    togglePanel,
    selectIsPanelVisible,
    selectParameterContext 
} from '../../../../keyboard/store/slices/keyboard.slice';

export const useNoteInteraction = (note: NoteEvent, trackId: string) => {
    const dispatch = useAppDispatch();
    const [isLocalDragging, setIsLocalDragging] = useState(false);
    const dragStartPos = useRef<{ x: number; timestamp: number } | null>(null);
    const timelineZoom = useAppSelector(state => state.player.timelineZoom);
    const multiSelectedNoteIds = useAppSelector(state => state.player.multiSelectedNoteIds);
    const allNotes = useAppSelector(state => state.player.tracks.find(t => t.id === trackId)?.notes || []);
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    const parameterContext = useAppSelector(selectParameterContext);

    // Handle mouse down to start dragging
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!e.shiftKey) {
            e.preventDefault();  // Prevent default behavior
            e.stopPropagation();  // Stop event bubbling
            
            // Store initial positions of all selected notes
            const selectedNotes = allNotes.filter(n => multiSelectedNoteIds.includes(n.id));
            const initialOffsets = selectedNotes.map(n => ({
                id: n.id,
                offset: n.timestamp - note.timestamp
            }));
            
            setIsLocalDragging(true);
            dragStartPos.current = {
                x: e.clientX,
                timestamp: note.timestamp
            };

            const handleMouseMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();
                if (!dragStartPos.current) return;

                const pixelDelta = moveEvent.clientX - dragStartPos.current.x;
                const timeDelta = pixelDelta / timelineZoom;
                const baseNewTime = Math.max(0, dragStartPos.current.timestamp + timeDelta);

                // If note is part of multiselection, move all selected notes maintaining relative positions
                if (multiSelectedNoteIds.includes(note.id)) {
                    initialOffsets.forEach(({ id, offset }) => {
                        dispatch(moveNote({
                            trackId,
                            noteId: id,
                            newTime: Math.round(baseNewTime + offset)
                        }));
                    });
                } else {
                    dispatch(moveNote({
                        trackId,
                        noteId: note.id,
                        newTime: Math.round(baseNewTime)
                    }));
                }
            };

            const handleMouseUp = (upEvent: MouseEvent) => {
                upEvent.preventDefault();
                setIsLocalDragging(false);
                dragStartPos.current = null;
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    }, [dispatch, note.id, note.timestamp, trackId, timelineZoom, multiSelectedNoteIds, allNotes]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        
        // Select the note in the timeline
        dispatch(selectNote({
            trackId: String(trackId),
            noteId: note.id,
            isMultiSelect: e.shiftKey
        }));
        
        // Automatically switch to note mode
        if (parameterContext !== 'note') {
            dispatch(setParameterContext('note'));
        }
        
        // Show parameter panel if not already visible
        if (!isPanelVisible) {
            dispatch(togglePanel());
        }
    }, [dispatch, trackId, note.id, parameterContext, isPanelVisible]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const delta = e.key === 'ArrowLeft' ? -10 : 10;
            dispatch(moveNote({
                trackId,
                noteId: note.id,
                newTime: note.timestamp + delta
            }));
        }
    }, [dispatch, note, trackId]);

    return {
        isLocalDragging,
        setIsLocalDragging,
        handleMouseDown,
        handleKeyDown,
        handleClick,
        handleDrag: () => {}, // Empty handlers since we're not using drag events
        handleDragStart: () => {},
        handleDragEnd: () => {}
    };
};