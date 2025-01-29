// src/features/player/components/notes/Note.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from '../../hooks';
import { selectNote } from '../../state/slices/player.slice';
import { NoteEvent } from '../../types';
import { LAYOUT } from '../../constants';
import { useNoteDrag } from '../../hooks/useNoteDrag';

interface NoteProps {
    note: NoteEvent;
    trackId: string;
    trackIndex: number;
    isSelected: boolean;
    timelineZoom: number;
    availableTracks: string[];
    lowestNote: number;
    highestNote: number;
}

const Note: React.FC<NoteProps> = ({
                                       note,
                                       trackId,
                                       trackIndex,
                                       isSelected,
                                       timelineZoom,
                                       availableTracks,
                                       lowestNote,
                                       highestNote
                                   }) => {
    const dispatch = useAppDispatch();
    const { handleDragStart, handleDrag, handleDragEnd, handleKeyboardMove } = useNoteDrag();
    const [isLocalDragging, setIsLocalDragging] = useState(false);

    // Calculate vertical position based on note pitch
    const pitchRange = highestNote - lowestNote || 1;
    const normalizedPitch = (note.note - lowestNote) / pitchRange;
    const PADDING = 4;
    const USABLE_HEIGHT = LAYOUT.TRACK_HEIGHT - (PADDING * 2);
    const verticalPosition = PADDING + (USABLE_HEIGHT * (1 - normalizedPitch));

    useEffect(() => {
        if (!isLocalDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleDrag(e, note, trackId, availableTracks);
        };

        const handleMouseUp = () => {
            setIsLocalDragging(false);
            handleDragEnd();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isLocalDragging, note, trackId, availableTracks, handleDrag, handleDragEnd]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        setIsLocalDragging(true);
        handleDragStart(e, note, trackId, trackIndex);
    }, [note, trackId, trackIndex, handleDragStart]);

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

    // Calculate horizontal position and width
    const left = note.timestamp * timelineZoom;
    const width = note.duration * timelineZoom;

    return (
        <div
            className={`absolute rounded-lg transition-all duration-75 cursor-move select-none
                ${isSelected ? 'ring-2 ring-blue-400 z-10' : ''}
                ${isLocalDragging ? 'opacity-75 scale-[1.02] z-20' : ''}
                hover:brightness-105`}
            style={{
                left: `${left}px`,
                top: `${Math.min(LAYOUT.TRACK_HEIGHT - PADDING - LAYOUT.NOTE_HEIGHT,
                    Math.max(PADDING, verticalPosition))}px`,
                width: `${Math.max(4, width)}px`,
                height: `${LAYOUT.NOTE_HEIGHT}px`,
                backgroundColor: '#e8e4dc',
                opacity: note.velocity / 127,
                boxShadow: isSelected || isLocalDragging
                    ? 'inset 2px 2px 4px #d1cdc4, inset -2px -2px 4px #ffffff'
                    : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff',
                background: isSelected || isLocalDragging
                    ? '#e8e4dc'
                    : 'linear-gradient(145deg, #f0ece6, #e8e4dc)'
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onKeyDown={isSelected ? handleKeyDown : undefined}
            tabIndex={isSelected ? 0 : -1}
            title={`Note ${note.note} (${note.duration.toFixed(0)}ms)`}
        />
    );
};

export default Note;