// src/features/player/components/timeline/components/TimelineGrid.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { usePlayback } from '../../../hooks/usePlayback';
import { useClips } from '../../../hooks/useClips';
import { useAppDispatch, useAppSelector } from '../../../hooks/useStore';
import { selectCurrentTrack, setCurrentTrack } from '../../../state/slices/player.slice';
import Clip from '../../clips/Clip';
import { TIMING } from '../../../utils/time.utils';
import { DragState, GridPosition } from '../../../types';

// Grid constants define our musical grid's visual structure
const GRID_CONSTANTS = {
    TRACKS: 4,           // Number of simultaneous tracks
    CELLS: 64,          // Total number of 16th note divisions
    CELL_WIDTH: 48,     // Visual width of each cell in pixels
    TRACK_HEIGHT: 96,   // Height of each track
    HEADER_HEIGHT: 32,  // Height of the timeline header
    NOTE_HEIGHT: 3      // Height of note visualizations
} as const;

export const TimelineGrid: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isPlaying, currentTime, tempo } = usePlayback();
    const { clips, moveClip } = useClips();
    const currentTrack = useAppSelector(selectCurrentTrack);
    const [dragState, setDragState] = useState<DragState | null>(null);

    // Calculate playback position using musical timing
    const playbackPosition = useMemo(() => {
        if (!clips.length) return 0;
        const currentTicks = TIMING.msToTicks(currentTime * 1000, tempo);
        const pixelsPerTick = GRID_CONSTANTS.CELL_WIDTH / TIMING.cellsToTicks(1);
        return currentTicks * pixelsPerTick;
    }, [clips, currentTime, tempo]);

    // Convert mouse position to musical grid coordinates
    const getGridPosition = useCallback((e: React.MouseEvent): GridPosition => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top - GRID_CONSTANTS.HEADER_HEIGHT;

        const ticksPerPixel = TIMING.cellsToTicks(1) / GRID_CONSTANTS.CELL_WIDTH;
        const ticks = Math.round(x * ticksPerPixel);
        const cell = TIMING.ticksToCells(ticks);

        return {
            cell: Math.max(0, cell),
            track: Math.max(0, Math.min(
                GRID_CONSTANTS.TRACKS - 1,
                Math.floor(y / GRID_CONSTANTS.TRACK_HEIGHT)
            ))
        };
    }, []);

    // Handle drag operations with musical timing
    const handleMouseDown = useCallback((e: React.MouseEvent, clipId?: string) => {
        e.preventDefault();
        const position = getGridPosition(e);

        setDragState({
            type: clipId ? 'MOVE' : 'CREATE',
            startPoint: position,
            currentPoint: position,
            clipId,
            startTicks: TIMING.cellsToTicks(position.cell)
        });
    }, [getGridPosition]);

    // Handle clip movement with musical timing
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragState) return;

        const position = getGridPosition(e);

        if (dragState.currentPoint.cell !== position.cell ||
            dragState.currentPoint.track !== position.track) {

            setDragState(prev => prev ? {
                ...prev,
                currentPoint: position
            } : null);

            if (dragState.type === 'MOVE' && dragState.clipId) {
                moveClip(dragState.clipId, {
                    cell: position.cell,
                    track: position.track,
                    startTicks: TIMING.cellsToTicks(position.cell)
                });
            }
        }
    }, [dragState, moveClip, getGridPosition]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);

    const handleTrackSelect = useCallback((trackIndex: number) => {
        dispatch(setCurrentTrack(trackIndex));
    }, [dispatch]);

    // Format time display using musical time
    const formatGridTime = useCallback((cellIndex: number) => {
        const beats = Math.floor(cellIndex / TIMING.CELLS_PER_BEAT) + 1;
        const subdivision = (cellIndex % TIMING.CELLS_PER_BEAT) + 1;
        return `${beats}.${subdivision}`;
    }, []);

    return (
        <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex">
                {/* Track headers section */}
                <div className="w-32 flex-shrink-0 border-r border-[#d1cdc4]">
                    <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm">
                        Time
                    </div>

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
                                    {formatGridTime(i)}
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
                                                : 'bg-[#f0ece6]'
                                        }`}
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
                                    transition: 'left 0.016s linear'
                                }}
                            />
                        )}

                        {/* Clips layer */}
                        <div className="absolute top-8 left-0 right-0 bottom-0">
                            {clips.map(clip => (
                                <Clip
                                    key={clip.id}
                                    clip={{
                                        ...clip,
                                        startTicks: TIMING.cellsToTicks(clip.startCell)
                                    }}
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