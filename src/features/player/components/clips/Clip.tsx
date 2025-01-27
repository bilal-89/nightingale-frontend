import React, { useCallback, useEffect, useMemo } from 'react';
import { useClips } from '../../hooks';
import { Clip as ClipType, NoteEvent } from '../../types';
import { TIMING } from '../../utils/time.utils';


const CONSTANTS = {
    TRACK_HEIGHT: 96,    // Keep this the same
    CELL_WIDTH: 48,     // Match the new CELL_WIDTH from TimelineGrid
    NOTE_HEIGHT: 12,    // Keep this the same
    MIN_CLIP_LENGTH: 1, // Keep this the same
    VERTICAL_MARGIN: 8, // Keep this the same
    MS_PER_BEAT: (tempo: number) => 60000 / tempo,
    BEATS_PER_CELL: 1/4  // This means each cell represents a 16th note
};

interface ClipProps {
    clip: ClipType;
    isDragging?: boolean;
    onMouseDown?: (e: React.MouseEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    tempo: number;
}

const Clip: React.FC<ClipProps> = ({
                                       clip,
                                       isDragging = false,
                                       onMouseDown,
                                       onClick,
                                       tempo = 120
                                   }) => {
    const { updateClip } = useClips();

    const clipMetrics = useMemo(() => {
        // Even with no notes, we should establish a valid time range
        if (clip.notes.length === 0) {
            return {
                startTicks: 0,
                endTicks: 0,
                durationTicks: 0,
                requiredLength: CONSTANTS.MIN_CLIP_LENGTH,
                durationMs: 0
            };
        }

        // As each note is added, these values will update
        const startTicks = Math.min(...clip.notes.map(n => n.timestamp));
        const endTicks = Math.max(...clip.notes.map(n => n.timestamp + n.duration));
        const durationTicks = endTicks - startTicks;

        // Calculate the grid length needed for our musical duration
        const durationInBeats = durationTicks / TIMING.TICKS_PER_BEAT;
        // Adjust cellsNeeded calculation to match new grid scale
        const cellsNeeded = Math.ceil(durationInBeats * (TIMING.CELLS_PER_BEAT * 2)); // Multiply by 2 since cells are half size

        return {
            startTicks,
            endTicks,
            durationTicks,
            // Increase max length to match new grid scale
            requiredLength: Math.max(CONSTANTS.MIN_CLIP_LENGTH, Math.min(cellsNeeded, 8)), // Increased from 16 to 32
            durationMs: TIMING.ticksToMs(durationTicks, tempo)
        };
    }, [clip.notes, tempo]);

    // Track our notes in real-time
    const layout = useMemo(() => {
        // Create a data structure that can be efficiently updated
        const pitchMap = new Map<number, NoteEvent[]>();
        const pitchSet = new Set<number>();

        // Process each note as it comes in
        clip.notes.forEach(note => {
            pitchSet.add(note.note);
            if (!pitchMap.has(note.note)) {
                pitchMap.set(note.note, []);
            }
            pitchMap.get(note.note)!.push(note);
        });

        // Sort pitches once for our layout
        const pitches = Array.from(pitchSet).sort((a, b) => b - a);

        return {
            position: {
                top: `${clip.track * CONSTANTS.TRACK_HEIGHT}px`,
                left: `${clip.startCell * CONSTANTS.CELL_WIDTH}px`,
                width: `${clip.length * CONSTANTS.CELL_WIDTH - 2}px`,
                height: `${CONSTANTS.TRACK_HEIGHT - 2}px`
            },
            noteLayout: {
                pitchMap,
                pitches,
                highestPitch: pitches[0] || 0,
                lowestPitch: pitches[pitches.length - 1] || 0
            }
        };
    }, [clip.notes, clip.track, clip.startCell, clip.length]);

    // Update our clip size incrementally
    useEffect(() => {
        if (clipMetrics.requiredLength !== clip.length) {
            updateClip(clip.id, { length: clipMetrics.requiredLength });
        }
    }, [clipMetrics.requiredLength, clip.length, clip.id, updateClip]);

    const renderNote = useCallback((note: NoteEvent) => {
        // Calculate positions relative to the current state of the clip
        const relativeStartTicks = note.timestamp - clipMetrics.startTicks;
        const startPosition = (relativeStartTicks / clipMetrics.durationTicks) * 100;
        const width = (note.duration / clipMetrics.durationTicks) * 100;

        // Calculate vertical position immediately when the note is added
        const PADDING = CONSTANTS.NOTE_HEIGHT;
        const USABLE_HEIGHT = CONSTANTS.TRACK_HEIGHT - (PADDING * 2);

        const pitchRange = layout.noteLayout.highestPitch - layout.noteLayout.lowestPitch || 1;
        const normalizedPitch = (note.note - layout.noteLayout.lowestPitch) / pitchRange;
        const verticalPosition = PADDING + (USABLE_HEIGHT * (1 - normalizedPitch));

        return (
            <div
                key={`note-${note.timestamp}-${note.note}`}
                className="absolute rounded-md cursor-pointer transition-all
                         hover:brightness-110 bg-blue-400 select-none"
                style={{
                    left: `${startPosition}%`,
                    width: `${Math.max(2, width)}%`,
                    height: `${CONSTANTS.NOTE_HEIGHT}px`,
                    top: `${Math.min(CONSTANTS.TRACK_HEIGHT - PADDING - CONSTANTS.NOTE_HEIGHT,
                        Math.max(PADDING, verticalPosition))}px`,
                    opacity: 0.9,
                    transform: 'translate3d(0, 0, 0)'
                }}
                title={`Note ${note.note} (${TIMING.ticksToMs(note.duration, tempo).toFixed(0)}ms)`}
                onMouseDown={(e) => {
                    if (e.shiftKey || e.ctrlKey || e.metaKey) e.stopPropagation();
                }}
            />
        );
    }, [clipMetrics, layout.noteLayout, tempo]);

    return (
        <div
            className={`absolute rounded-lg transition-all duration-300 
                     ${clip.isSelected ? 'ring-2 ring-blue-400' : ''}
                     ${isDragging ? 'opacity-75 scale-[1.02]' : ''}
                     bg-[#e5e9ec] cursor-move hover:brightness-95
                     backdrop-blur-sm backdrop-filter`}
            style={{
                ...layout.position,
                boxShadow: isDragging
                    ? '4px 4px 8px #c8ccd0, -4px -4px 8px #ffffff'
                    : '2px 2px 4px #c8ccd0, -2px -2px 4px #ffffff',
                zIndex: isDragging ? 10 : 1
            }}
            onMouseDown={onMouseDown}
            onClick={(e) => {
                if (!isDragging && e.target === e.currentTarget) {
                    e.stopPropagation();
                    onClick?.(e);
                }
            }}
        >
            <div className="absolute inset-2 overflow-visible">
                {clip.notes.map(note => renderNote(note))}
            </div>

            <div className="absolute top-1 left-2 text-xs text-gray-600 font-medium pointer-events-none">
                {clip.notes.length} notes • {clipMetrics.durationMs.toFixed(0)}ms
            </div>
        </div>
    );
};

export default Clip;