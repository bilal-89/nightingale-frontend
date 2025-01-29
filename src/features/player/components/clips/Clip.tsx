// src/features/player/components/clips/Clip.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useClips } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectNote, selectTimelineSettings } from '../../state/slices/player.slice';
import { Clip as ClipType, NoteEvent } from '../../types';
import { LAYOUT } from '../../constants';
import { useClipDrag } from '../../hooks/useClipDrag';

interface ClipProps {
    clip: ClipType;
    isDragging?: boolean;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Clip: React.FC<ClipProps> = ({ clip, onClick }) => {
    // Core hooks and state management
    const dispatch = useAppDispatch();
    const { updateClip } = useClips();
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const { handleDragStart, handleDrag, handleDragEnd, handleKeyboardMove } = useClipDrag();

    // Local state to manage drag operation
    const [isLocalDragging, setIsLocalDragging] = useState(false);

    // Set up drag handling with event listeners
    useEffect(() => {
        // Only set up listeners when actively dragging
        if (!isLocalDragging) return;

        // Handle continuous mouse movement during drag
        const handleMouseMove = (e: MouseEvent) => {
            console.log('Mouse move during drag');
            handleDrag(e, clip);
        };

        // Handle drag completion
        const handleMouseUp = () => {
            console.log('Ending drag operation');
            setIsLocalDragging(false);
            handleDragEnd();
        };

        // Add event listeners to document for drag tracking
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Clean up listeners when drag ends or component unmounts
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isLocalDragging, clip, handleDrag, handleDragEnd]);

    // Calculate clip metrics based on its notes
    const clipMetrics = useMemo(() => {
        if (clip.notes.length === 0) {
            return {
                startTime: 0,
                endTime: 0,
                duration: 0,
                durationMs: 0,
                requiredDuration: LAYOUT.MIN_CLIP_LENGTH
            };
        }

        // Find the earliest and latest points in time for the clip's notes
        const startTime = Math.min(...clip.notes.map(n => n.timestamp));
        const endTime = Math.max(...clip.notes.map(n => n.timestamp + n.duration));
        const duration = endTime - startTime;

        return {
            startTime,
            endTime,
            duration,
            durationMs: duration,
            requiredDuration: Math.max(LAYOUT.MIN_CLIP_LENGTH, duration)
        };
    }, [clip.notes]);

    // Calculate visual layout based on notes and timeline settings
    const layout = useMemo(() => {
        // Create maps for note organization
        const pitchMap = new Map<number, NoteEvent[]>();
        const pitchSet = new Set<number>();

        // Organize notes by pitch
        clip.notes.forEach(note => {
            pitchSet.add(note.note);
            if (!pitchMap.has(note.note)) {
                pitchMap.set(note.note, []);
            }
            pitchMap.get(note.note)!.push(note);
        });

        const pitches = Array.from(pitchSet).sort((a, b) => b - a);

        // Convert time values to pixel positions
        const left = clip.startTime * timelineSettings.zoom;
        const width = clip.duration * timelineSettings.zoom;

        return {
            position: {
                top: `${clip.track * LAYOUT.TRACK_HEIGHT}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${LAYOUT.TRACK_HEIGHT - 2}px`
            },
            noteLayout: {
                pitchMap,
                pitches,
                highestPitch: pitches[0] || 0,
                lowestPitch: pitches[pitches.length - 1] || 0
            }
        };
    }, [clip.notes, clip.track, clip.startTime, clip.duration, timelineSettings.zoom]);

    // Ensure clip duration stays in sync with note content
    useEffect(() => {
        if (clipMetrics.requiredDuration !== clip.duration) {
            updateClip(clip.id, { duration: clipMetrics.requiredDuration });
        }
    }, [clipMetrics.requiredDuration, clip.duration, clip.id, updateClip]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!clip.isSelected) return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const direction = e.key === 'ArrowLeft' ? 'left' : 'right';
            handleKeyboardMove(clip, direction, e.shiftKey);
        }
    }, [clip, handleKeyboardMove]);

    // Initialize drag operation
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        console.log('Starting drag operation');
        setIsLocalDragging(true);
        handleDragStart(e, clip);
    }, [clip, handleDragStart]);

    // Handle note selection
    const handleNoteClick = useCallback((
        note: NoteEvent,
        index: number,
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        e.stopPropagation();
        dispatch(selectNote({
            clipId: clip.id,
            noteIndex: index
        }));
    }, [clip.id, dispatch]);

    // Render individual notes within the clip
    const renderNote = useCallback((note: NoteEvent, index: number) => {
        const relativeStartTime = note.timestamp - clipMetrics.startTime;
        const startPosition = (relativeStartTime / clipMetrics.duration) * 100;
        const width = (note.duration / clipMetrics.duration) * 100;

        const PADDING = LAYOUT.NOTE_HEIGHT;
        const USABLE_HEIGHT = LAYOUT.TRACK_HEIGHT - (PADDING * 2);

        const pitchRange = layout.noteLayout.highestPitch - layout.noteLayout.lowestPitch || 1;
        const normalizedPitch = (note.note - layout.noteLayout.lowestPitch) / pitchRange;
        const verticalPosition = PADDING + (USABLE_HEIGHT * (1 - normalizedPitch));

        const isSelected = clip.selectedNoteIndex === index;

        return (
            <div
                key={`note-${note.timestamp}-${note.note}`}
                className={`absolute rounded-md cursor-pointer transition-all
                         hover:brightness-110 select-none
                         ${isSelected ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-blue-400'}`}
                style={{
                    left: `${startPosition}%`,
                    width: `${Math.max(2, width)}%`,
                    height: `${LAYOUT.NOTE_HEIGHT}px`,
                    top: `${Math.min(LAYOUT.TRACK_HEIGHT - PADDING - LAYOUT.NOTE_HEIGHT,
                        Math.max(PADDING, verticalPosition))}px`,
                    opacity: isSelected ? 1 : 0.9,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    zIndex: isSelected ? 2 : 1
                }}
                title={`Note ${note.note} (${note.duration.toFixed(0)}ms)`}
                onClick={(e) => handleNoteClick(note, index, e)}
                onMouseDown={(e) => {
                    if (e.shiftKey || e.ctrlKey || e.metaKey) e.stopPropagation();
                }}
            />
        );
    }, [clipMetrics, layout.noteLayout, clip.selectedNoteIndex, handleNoteClick]);

    // Render the clip container
    return (
        <div
            className={`absolute rounded-lg transition-all duration-300 
                     ${clip.isSelected ? 'ring-2 ring-blue-400' : ''}
                     ${isLocalDragging ? 'opacity-75 scale-[1.02]' : ''}
                     bg-[#e5e9ec] cursor-move hover:brightness-95
                     backdrop-blur-sm backdrop-filter`}
            style={{
                ...layout.position,
                boxShadow: isLocalDragging
                    ? '4px 4px 8px #c8ccd0, -4px -4px 8px #ffffff'
                    : '2px 2px 4px #c8ccd0, -2px -2px 4px #ffffff',
                zIndex: isLocalDragging ? 10 : 1
            }}
            tabIndex={clip.isSelected ? 0 : -1}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                if (!isLocalDragging && e.target === e.currentTarget) {
                    e.stopPropagation();
                    if (onClick) onClick(e);
                }
            }}
        >
            <div className="absolute inset-2 overflow-visible">
                {clip.notes.map((note, index) => renderNote(note, index))}
            </div>

            <div className="absolute top-1 left-2 text-xs text-gray-600 font-medium pointer-events-none">
                {clip.notes.length} notes • {clipMetrics.durationMs.toFixed(0)}ms
            </div>
        </div>
    );
};

export default Clip;