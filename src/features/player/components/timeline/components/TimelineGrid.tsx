import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { useTiming } from '../../../hooks/useTiming';  // Our new timing hook
import {
    selectCurrentTrack,
    selectTracks,
    selectTimelineSettings,
    setCurrentTrack,
    addTrack
} from '../../../state/slices/player.slice';
import { selectIsPlaying } from '../../../state/slices/playback.slice';
import Note from '../../notes/Note';
import { TIMING } from '../../../utils/time.utils';
import { cn } from '../../../../../lib/utils';

// These constants define our grid layout and dimensions
const GRID_CONSTANTS = {
    TRACKS: 4,
    CELLS: 64,
    CELL_WIDTH: 48,
    TRACK_HEIGHT: 96,
    HEADER_HEIGHT: 32,
    NOTE_HEIGHT: 3
} as const;

export const TimelineGrid: React.FC = () => {
    const dispatch = useAppDispatch();

    // Get timing information from our new hook instead of usePlayback
    const { getCurrentTime } = useTiming();
    const isPlaying = useAppSelector(selectIsPlaying);

    // Other state selectors
    const tracks = useAppSelector(selectTracks);
    const currentTrackIndex = useAppSelector(selectCurrentTrack);
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const selectedNoteId = useAppSelector(state => state.player.selectedNoteId);

    // Track interaction state
    const [pressedTrackId, setPressedTrackId] = useState<string | null>(null);

    // Ref for animation frame management
    const animationFrameRef = useRef<number | null>(null);
    // Ref to store current playback position
    const playbackPositionRef = useRef<number>(0);

    // Calculate note ranges for each track for vertical positioning
    const trackRanges = useMemo(() => {
        return tracks.map(track => {
            if (track.notes.length === 0) {
                return { lowestNote: 60, highestNote: 72 }; // Default octave range
            }
            const notes = track.notes.map(n => n.note);
            return {
                lowestNote: Math.min(...notes),
                highestNote: Math.max(...notes)
            };
        });
    }, [tracks]);

    // Set up smooth playback position animation using requestAnimationFrame
    useEffect(() => {
        let lastTimestamp: number | null = null;

        const updatePlaybackPosition = (timestamp: number) => {
            if (!isPlaying) {
                lastTimestamp = null;
                return;
            }

            if (lastTimestamp === null) {
                lastTimestamp = timestamp;
            }

            // Get current time from timing service
            const currentTimeMs = getCurrentTime();

            // Convert time to pixels based on zoom level
            const pixelsPerMs = timelineSettings.zoom;
            const newPosition = currentTimeMs * pixelsPerMs;

            // Update position with smooth animation
            playbackPositionRef.current = newPosition;

            // Request next frame
            animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
        };

        if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
        }

        // Cleanup animation frame on unmount or when playback stops
        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, getCurrentTime, timelineSettings.zoom]);

    // Track selection handler
    const handleTrackSelect = useCallback((trackIndex: number) => {
        dispatch(setCurrentTrack(trackIndex));
    }, [dispatch]);

    // Time formatter for grid labels
    const formatGridTime = useCallback((cellIndex: number) => {
        const beats = Math.floor(cellIndex / TIMING.CELLS_PER_BEAT) + 1;
        const subdivision = (cellIndex % TIMING.CELLS_PER_BEAT) + 1;
        return `${beats}.${subdivision}`;
    }, []);

    // Track button interaction handlers
    const handleTrackMouseDown = (trackId: string) => setPressedTrackId(trackId);
    const handleTrackMouseUp = (trackId: string, index: number) => {
        if (pressedTrackId === trackId) {
            handleTrackSelect(index);
        }
        setPressedTrackId(null);
    };
    const handleTrackMouseLeave = () => setPressedTrackId(null);

    return (
        <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex">
                {/* Track headers section */}
                <div className="w-32 flex-shrink-0 border-r border-[#d1cdc4]">
                    {/* Time header */}
                    <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm font-medium">
                        Time
                    </div>

                    {/* Track buttons with enhanced tactile feedback */}
                    {tracks.map((track, index) => (
                        <button
                            key={track.id}
                            onMouseDown={() => handleTrackMouseDown(track.id)}
                            onMouseUp={() => handleTrackMouseUp(track.id, index)}
                            onMouseLeave={handleTrackMouseLeave}
                            className={cn(
                                "w-full h-24 px-3 border-b border-[#d1cdc4] transition-all duration-100",
                                "flex items-center text-left",
                                currentTrackIndex === index
                                    ? "bg-[#e8e4dc]"
                                    : "bg-[#f5f2ed]"
                            )}
                            style={{
                                boxShadow: currentTrackIndex === index || pressedTrackId === track.id
                                    ? 'inset 2px 2px 5px #c8ccd0, inset -2px -2px 5px #ffffff'
                                    : '4px 4px 10px #c8ccd0, -4px -4px 10px #ffffff',
                                transform: (currentTrackIndex === index || pressedTrackId === track.id)
                                    ? 'translateY(1px)'
                                    : 'translateY(0)',
                                border: (currentTrackIndex === index || pressedTrackId === track.id)
                                    ? '1px solid rgba(255, 255, 255, 0.9)'
                                    : '1px solid rgba(255, 255, 255, 0.7)'
                            }}
                        >
                            <span className={cn(
                                "text-sm font-medium",
                                currentTrackIndex === index ? "text-gray-900" : "text-gray-600"
                            )}>
                                {track.name}
                            </span>
                        </button>
                    ))}

                    {/* Add Track Button */}
                    <button
                        onClick={() => dispatch(addTrack())}
                        className={cn(
                            "w-full h-12 px-3",
                            "flex items-center justify-center",
                            "text-sm font-medium text-gray-600",
                            // "bg-[#f5f2ed] hover:bg-[#eae6df] transition-all duration-200",
                            "shadow-[2px_2px_4px_#d1cdc4,_-2px_-2px_4px_#ffffff]"
                        )}
                    >
                        + Add Track
                    </button>
                </div>

                {/* Main grid area */}
                <div className="flex-grow overflow-x-auto relative">
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

                        {/* Track lanes */}
                        {tracks.map((track, trackIndex) => (
                            <div
                                key={track.id}
                                className="relative h-24 border-b border-[#d1cdc4] bg-[#f5f2ed]"
                            >
                                {/* Notes */}
                                {track.notes.map(note => (
                                    <Note
                                        key={note.id}
                                        note={note}
                                        trackId={track.id}
                                        trackIndex={trackIndex}
                                        timelineZoom={timelineSettings.zoom}
                                        availableTracks={tracks.map(t => t.id)}
                                        isSelected={selectedNoteId === note.id}
                                        lowestNote={trackRanges[trackIndex].lowestNote}
                                        highestNote={trackRanges[trackIndex].highestNote}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Updated playback position indicator with hardware acceleration */}
                        {isPlaying && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-green-500 z-20 pointer-events-none transform-gpu"
                                style={{
                                    transform: `translateX(${playbackPositionRef.current}px)`,
                                    willChange: 'transform'
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineGrid;