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

    // For debugging
    useEffect(() => {
        if (isSelected || isMultiSelected) {
            console.log('Note selected:', note.id, { isSelected, isMultiSelected });
        }
    }, [isSelected, isMultiSelected, note.id]);

    return (
        <NoteVisuals
            note={{
                id: note.id,
                velocity: note.velocity ?? velocity ?? 100,
                synthesis: {
                    envelope: { attack: (attackTime ?? 50) / 1000 },
                    tuning: tuning
                }
            }}
            trackId={trackId}  // Pass trackId
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
            onDragStart={handleDragStart}  // Add these drag handlers
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
        />
    );
};

export default Note;