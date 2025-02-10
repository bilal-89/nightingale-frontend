import React, { useCallback, useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks';
import { selectNote } from '../../store/player';

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
    trackColor: string;  // Add this prop

}

const Note: React.FC<NoteProps> = ({
                                       note,
                                       trackId,
                                       trackIndex,
                                       isSelected,
                                       timelineZoom,
                                       availableTracks,
                                       lowestNote,
                                       highestNote,
                                       trackColor  // Add this here

                                   }) => {
    const dispatch = useAppDispatch();
    const { handleDragStart, handleDrag, handleDragEnd, handleKeyboardMove } = useNoteDrag();
    const [isLocalDragging, setIsLocalDragging] = useState(false);

    // Define PADDING at component level
    const PADDING = 4;
    const USABLE_HEIGHT = LAYOUT.TRACK_HEIGHT - (PADDING * 2);

    // Restore the drag functionality with useEffect
    useEffect(() => {
        if (!isLocalDragging) return;

        // Set up mouse move handler for dragging
        const handleMouseMove = (e: MouseEvent) => {
            handleDrag(e, note, trackId, availableTracks);
        };

        // Set up mouse up handler to end drag
        const handleMouseUp = () => {
            setIsLocalDragging(false);
            handleDragEnd();
        };

        // Add the event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Clean up event listeners when done
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isLocalDragging, note, trackId, availableTracks, handleDrag, handleDragEnd]);

    // Calculate vertical position with tuning adjustment
    const calculateVerticalPosition = () => {
        const pitchRange = highestNote - lowestNote || 1;
        const tuning = note.synthesis?.tuning ?? 0;
        const tuningOffset = tuning / 100;
        const adjustedNote = note.note + tuningOffset;
        const normalizedPitch = (adjustedNote - lowestNote) / pitchRange;
        return PADDING + (USABLE_HEIGHT * (1 - normalizedPitch));
    };

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

    // Calculate note dimensions and create gradients
    const left = note.timestamp * timelineZoom;
    const width = note.duration * timelineZoom;
    const baseOpacity = note.velocity / 127;
    const verticalPosition = calculateVerticalPosition();

    const getAttackGradient = () => {
        const attackTime = note.synthesis?.envelope?.attack ?? 0.05;
        const maxAttackPercent = 25;
        const attackPercent = Math.min(attackTime * 100 * 2, maxAttackPercent);
        const opacityHex = Math.round(baseOpacity * 255).toString(16).padStart(2, '0');

        return `linear-gradient(90deg, 
            ${trackColor}00 0%,
            ${trackColor}${opacityHex} ${attackPercent}%,
            ${trackColor}${opacityHex} 100%)
        `;
    };

    return (
        <div
            className={`absolute rounded-lg transition-all duration-75 cursor-move select-none
                ${isSelected ? 'ring-2 ring-blue-400 z-10' : ''}
                ${isLocalDragging ? 'scale-[1.02] z-20' : ''}
                hover:brightness-105`}
            style={{
                left: `${left}px`,
                top: `${Math.min(LAYOUT.TRACK_HEIGHT - PADDING - LAYOUT.NOTE_HEIGHT,
                    Math.max(PADDING, verticalPosition))}px`,
                width: `${Math.max(4, width)}px`,
                height: `${LAYOUT.NOTE_HEIGHT}px`,
                background: getAttackGradient(),
                transform: 'translateZ(0)',
                transition: isLocalDragging ? 'none' : 'top 0.1s ease-out', // Disable transition during drag
                boxShadow: isSelected || isLocalDragging
                    ? 'inset 2px 2px 3px rgba(0, 0, 0, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 0.3)'
                    : '2px 2px 3px rgba(0, 0, 0, 0.2), -1px -1px 2px rgba(255, 255, 255, 0.3), inset 1px 1px 1px rgba(255, 255, 255, 0.1)',
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onKeyDown={isSelected ? handleKeyDown : undefined}
            tabIndex={isSelected ? 0 : -1}
            title={`Note ${note.note} (${note.duration.toFixed(0)}ms), Tuning: ${note.synthesis?.tuning ?? 0}¢`}
        />
    );
};

export default Note;