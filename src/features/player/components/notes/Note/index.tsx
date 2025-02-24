import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { LAYOUT } from '../../../constants';
import { useNoteInteraction } from './useNoteInteraction';
import { NoteVisuals } from './NoteVisuals';
import { NoteProps } from './types';
import { selectIsRecording } from '../../../store/player/selectors/recording';
import { getAttackGradient } from './NoteGradients';
import { selectParameter } from '../../../../keyboard/store/slices/keyboard.slice';

const PADDING = 4;
const USABLE_HEIGHT = LAYOUT.TRACK_HEIGHT - (PADDING * 2);

const Note: React.FC<NoteProps> = ({
    note,
    trackId,
    trackIndex,
    isSelected,
    isMultiSelected,
    isFocused,
    timelineZoom,
    availableTracks,
    lowestNote,
    highestNote,
    trackColor,
    verticalPosition
}) => {
    const {
        isLocalDragging,
        setIsLocalDragging,
        handleMouseDown,
        handleKeyDown,
        handleClick,
        handleDrag,
        handleDragEnd,
        handleDragStart
    } = useNoteInteraction(note, trackId);

    const isRecording = useSelector(selectIsRecording);
    const recordingStartTime = useSelector(state => state.player.recordingStartTime);

    const velocity = useSelector(state => selectParameter(state, note.note, 'velocity'));
    const attackTime = useSelector(state => selectParameter(state, note.note, 'attack'));
    const tuning = note.tuning ?? useSelector(state => selectParameter(state, note.note, 'tuning'));

    const [currentDuration, setCurrentDuration] = useState(note.duration);

    // Only update duration for active recording notes
    useEffect(() => {
        if (!isRecording || !note.isActive || !recordingStartTime) {
            setCurrentDuration(note.duration);
            return;
        }

        const updateDuration = () => {
            const newDuration = Date.now() - recordingStartTime - note.timestamp;
            setCurrentDuration(newDuration);
        };

        updateDuration();
        const intervalId = setInterval(updateDuration, 16);
        return () => clearInterval(intervalId);
    }, [isRecording, note.isActive, note.timestamp, note.duration, recordingStartTime]);

    // Calculate vertical position with tuning adjustment
    const calculateVerticalPosition = useCallback(() => {
        const pitchRange = highestNote - lowestNote || 1;
        const tuningOffset = tuning / 100;
        const adjustedNote = note.note + tuningOffset;
        const normalizedPitch = (adjustedNote - lowestNote) / pitchRange;
        return PADDING + (USABLE_HEIGHT * (1 - normalizedPitch));
    }, [note.note, tuning, highestNote, lowestNote]);

    // Calculate position whenever tuning changes
    useEffect(() => {
        calculateVerticalPosition();
    }, [tuning, calculateVerticalPosition]);

    const style = {
        left: note.timestamp * timelineZoom,
        top: Math.min(LAYOUT.TRACK_HEIGHT - PADDING - LAYOUT.NOTE_HEIGHT,
            Math.max(PADDING, calculateVerticalPosition())),
        width: Math.max(4, currentDuration * timelineZoom),
        height: LAYOUT.NOTE_HEIGHT,
        background: getAttackGradient({
            trackColor,
            baseOpacity: (velocity ?? 100) / 127,
            attackTime: (attackTime ?? 50) / 1000
        }),
        isSelected,
        isMultiSelected,
        isFocused,
        isDragging: isLocalDragging
    };

    console.log('Note render:', { id: note.id, isSelected, isMultiSelected, isFocused });

    return (
        <NoteVisuals
            note={{...note, duration: currentDuration}}
            trackColor={trackColor}
            isSelected={isSelected}
            isMultiSelected={isMultiSelected}
            isFocused={isFocused}
            isLocalDragging={isLocalDragging}
            style={style}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onKeyDown={isSelected || isFocused ? handleKeyDown : undefined}
            draggable={false}
        />
    );
};

export default Note;