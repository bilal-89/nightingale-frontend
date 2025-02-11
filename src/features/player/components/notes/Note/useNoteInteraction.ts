// src/features/player/components/notes/Note/useNoteInteraction.ts

import { useCallback, useState } from 'react';
import { useAppDispatch } from '../../../hooks';
import { selectNote } from '../../../store/player';
import { useNoteDrag } from '../../../hooks/useNoteDrag';
import { NoteEvent } from '../../../types';

export function useNoteInteraction(note: NoteEvent, trackId: string) {
    const dispatch = useAppDispatch();
    const { handleDragStart, handleDrag, handleDragEnd, handleKeyboardMove } = useNoteDrag();
    const [isLocalDragging, setIsLocalDragging] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        setIsLocalDragging(true);
        handleDragStart(e, note, trackId);
    }, [note, trackId, handleDragStart]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            handleKeyboardMove(note, trackId, e.key === 'ArrowLeft' ? 'left' : 'right', e.shiftKey);
        }
    }, [note, trackId, handleKeyboardMove]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        dispatch(selectNote({ trackId, noteId: note.id }));
    }, [dispatch, trackId, note.id]);

    return {
        isLocalDragging,
        setIsLocalDragging,
        handleMouseDown,
        handleKeyDown,
        handleClick,
        handleDrag,
        handleDragEnd
    };
}