// src/features/player/components/timeline/components/TimelineGrid.tsx

// Keep your current imports and add any missing ones
import React, { useState, useCallback } from 'react';
import { usePlayback, useClips } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectCurrentTrack, setCurrentTrack } from '../../../state/slices/player.slice';
import Clip from '../../clips/Clip';
import { TIMING } from '../../../utils/time.utils';  // Add this import

import { DragState, GridPosition } from '../../../types';

// These constants define our grid's visual structure, just like the spacing in sheet music
const GRID_CONSTANTS = {
    TRACKS: 4,           // Number of available tracks
    CELLS: 64,          // Increased from 32 to show more bars
    CELL_WIDTH: 48,     // Decreased from 96 to make cells smaller
    TRACK_HEIGHT: 96,   // Keep this the same
    HEADER_HEIGHT: 32,  // Keep this the same
    NOTE_HEIGHT: 3      // Keep this the same
} as const;

const TimelineGrid: React.FC = () => {
    // Get all the state and functionality we need
    const dispatch = useAppDispatch();
    const { isPlaying, currentTime, tempo } = usePlayback();
    const { clips, moveClip } = useClips();
    const currentTrack = useAppSelector(selectCurrentTrack);

    // State for handling drag and drop operations
    const [dragState, setDragState] = useState<DragState | null>(null);


    // In TimelineGrid.tsx
    const playbackPosition = React.useMemo(() => {
        if (!clips.length) return 0;

        // Find the actual duration of all clips in beats
        const totalBeatsInClips = Math.max(...clips.map(clip =>
            clip.startCell + clip.length
        )) / TIMING.CELLS_PER_BEAT;

        // Convert total beats to seconds
        const totalSeconds = (totalBeatsInClips * 60) / tempo;

        // Calculate pixels based on clip duration
        const totalPixels = totalBeatsInClips * GRID_CONSTANTS.CELL_WIDTH * TIMING.CELLS_PER_BEAT;

        // Scale current time to this range
        return (currentTime / totalSeconds) * totalPixels;
    }, [clips, currentTime, tempo]);

    // Convert a mouse position to grid coordinates
    const getGridPosition = useCallback((e: React.MouseEvent): GridPosition => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top - GRID_CONSTANTS.HEADER_HEIGHT;

        // Snap to grid by rounding to nearest cell
        return {
            cell: Math.max(0, Math.round(x / GRID_CONSTANTS.CELL_WIDTH)),
            track: Math.max(0, Math.min(
                GRID_CONSTANTS.TRACKS - 1,
                Math.floor(y / GRID_CONSTANTS.TRACK_HEIGHT)
            ))
        };
    }, []);

    // Handle starting a drag operation
    const handleMouseDown = useCallback((e: React.MouseEvent, clipId?: string) => {
        e.preventDefault(); // Prevent text selection while dragging
        const position = getGridPosition(e);

        setDragState({
            type: clipId ? 'MOVE' : 'CREATE',
            startPoint: position,
            currentPoint: position,
            clipId
        });
    }, [getGridPosition]);

    // Handle mouse movement during drag
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragState) return;

        const position = getGridPosition(e);

        // Only update if position has actually changed to a new cell
        if (dragState.currentPoint.cell !== position.cell ||
            dragState.currentPoint.track !== position.track) {

            setDragState(prev => prev ? {
                ...prev,
                currentPoint: position
            } : null);

            // If we're moving a clip, update its position
            if (dragState.type === 'MOVE' && dragState.clipId) {
                const clip = clips.find(c => c.id === dragState.clipId);
                if (clip) {
                    moveClip(clip.id, {
                        cell: position.cell,
                        track: position.track
                    });
                }
            }
        }
    }, [dragState, clips, moveClip, getGridPosition]);

    // Handle finishing a drag operation
    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);

    // Handle track selection
    const handleTrackSelect = useCallback((trackIndex: number) => {
        dispatch(setCurrentTrack(trackIndex));
    }, [dispatch]);

    return (
        <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex">
                {/* Track headers section - like the clefs in sheet music */}
                <div className="w-32 flex-shrink-0 border-r border-[#d1cdc4]">
                    {/* Time header */}
                    <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm">
                        Time
                    </div>

                    {/* Track headers with selection buttons */}
                    {Array(GRID_CONSTANTS.TRACKS).fill(null).map((_, index) => (
                        <div
                            key={`track-header-${index}`}
                            className="h-24 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 flex items-center gap-2"
                        >
                            <button
                                className={`w-3 h-3 rounded-full transition-all duration-300 
                                    ${currentTrack === index ? 'bg-green-500' : 'bg-gray-300'}
                                    hover:scale-110`}
                                onClick={() => handleTrackSelect(index)}
                                title={`Select Track ${index + 1}`}
                            />
                            <span className="text-sm">Track {index + 1}</span>
                            {currentTrack === index}
                        </div>
                    ))}
                </div>

                {/* Main grid area */}
                <div
                    className="flex-grow overflow-x-auto relative"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div style={{ width: GRID_CONSTANTS.CELLS * GRID_CONSTANTS.CELL_WIDTH }}>
                        {/* Time ruler */}
                        <div className="flex h-8 border-b border-[#d1cdc4]">
                            {Array(GRID_CONSTANTS.CELLS).fill(null).map((_, i) => (
                                <div
                                    key={`time-${i}`}
                                    className="flex-shrink-0 border-r border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm"
                                    style={{ width: GRID_CONSTANTS.CELL_WIDTH }}
                                >
                                    {Math.floor(i/4) + 1}.{(i % 4) + 1}
                                </div>
                            ))}
                        </div>

                        {/* Grid cells */}
                        {Array(GRID_CONSTANTS.TRACKS).fill(null).map((_, trackIndex) => (
                            <div
                                key={`track-${trackIndex}`}
                                className="flex h-24 border-b border-[#d1cdc4]"
                            >
                                {Array(GRID_CONSTANTS.CELLS).fill(null).map((_, cellIndex) => (
                                    <div
                                        key={`cell-${trackIndex}-${cellIndex}`}
                                        className={`flex-shrink-0 border-r border-[#d1cdc4] 
                                            transition-colors duration-150
                                            ${dragState?.currentPoint.track === trackIndex &&
                                        dragState.currentPoint.cell === cellIndex
                                            ? 'bg-blue-50'
                                            : trackIndex === currentTrack
                                                ? 'bg-[#f5f2ed]'
                                                : 'bg-[#f0ece6]'}`}
                                        style={{ width: GRID_CONSTANTS.CELL_WIDTH }}
                                        onMouseDown={(e) => handleMouseDown(e)}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Playback position indicator */}
                        {isPlaying && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-green-500 z-20 pointer-events-none"
                                style={{
                                    left: `${playbackPosition}px`,
                                    transition: 'left 0.1s linear'
                                }}
                            />
                        )}

                        {/* Clips layer */}
                        <div className="absolute top-8 left-0 right-0 bottom-0">
                            {clips.map(clip => (
                                <Clip
                                    key={clip.id}
                                    clip={clip}
                                    isDragging={dragState?.clipId === clip.id}
                                    onMouseDown={(e) => handleMouseDown(e, clip.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineGrid;