// src/features/player/components/notes/Note/index.tsx

import React, { useEffect } from 'react';
import { LAYOUT } from '../../../constants';
import { useNoteInteraction } from './useNoteInteraction';
import { NoteVisuals } from './NoteVisuals';
import { NoteProps } from './types';

const PADDING = 4;
const USABLE_HEIGHT = LAYOUT.TRACK_HEIGHT - (PADDING * 2);

const Note: React.FC<NoteProps> = ({
                                       note,
                                       trackId,
                                       // trackIndex,
                                       isSelected,
                                       timelineZoom,
                                       availableTracks,
                                       lowestNote,
                                       highestNote,
                                       trackColor
                                   }) => {
    const {
        isLocalDragging,
        setIsLocalDragging,
        handleMouseDown,
        handleKeyDown,
        handleClick,
        handleDrag,
        handleDragEnd
    } = useNoteInteraction(note, trackId);

    // Handle drag movement
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
    }, [isLocalDragging, note, trackId, availableTracks, handleDrag, handleDragEnd, setIsLocalDragging]);

    // Calculate vertical position with tuning adjustment
    const calculateVerticalPosition = () => {
        const pitchRange = highestNote - lowestNote || 1;
        const tuning = note.synthesis?.tuning ?? 0;
        const tuningOffset = tuning / 100;
        const adjustedNote = note.note + tuningOffset;
        const normalizedPitch = (adjustedNote - lowestNote) / pitchRange;
        return PADDING + (USABLE_HEIGHT * (1 - normalizedPitch));
    };

    const style = {
        left: note.timestamp * timelineZoom,
        top: Math.min(LAYOUT.TRACK_HEIGHT - PADDING - LAYOUT.NOTE_HEIGHT,
            Math.max(PADDING, calculateVerticalPosition())),
        width: note.duration * timelineZoom,
    };

    return (
        <NoteVisuals
            note={note}
            trackColor={trackColor}
            isSelected={isSelected}
            isLocalDragging={isLocalDragging}
            style={style}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onKeyDown={isSelected ? handleKeyDown : undefined}
        />
    );
};

export default Note;