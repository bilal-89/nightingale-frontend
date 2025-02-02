import React, { useCallback, useMemo } from 'react';
import { usePlayback } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import {
    selectCurrentTrack,
    selectTracks,
    selectTimelineSettings,
    setCurrentTrack,
    addTrack
} from '../../../state/slices/player.slice';
import Note from '../../notes/Note';
import { TIMING } from '../../../utils/time.utils';
import { cn } from '../../../../../lib/utils';

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
    const { isPlaying, currentTime } = usePlayback();
    const tracks = useAppSelector(selectTracks);
    const currentTrackIndex = useAppSelector(selectCurrentTrack);
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const selectedNoteId = useAppSelector(state => state.player.selectedNoteId);

    // Calculate note ranges for each track
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

    // Calculate playback position
    const playbackPosition = useMemo(() => {
        const pixelsPerMs = timelineSettings.zoom;
        return currentTime * pixelsPerMs;
    }, [currentTime, timelineSettings.zoom]);

    const handleTrackSelect = useCallback((trackIndex: number) => {
        dispatch(setCurrentTrack(trackIndex));
    }, [dispatch]);

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
                    {/* Time header */}
                    <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm font-medium">
                        Time
                    </div>

                    {/* Track buttons */}
                    {tracks.map((track, index) => (
                        <button
                            key={track.id}
                            onClick={() => handleTrackSelect(index)}
                            className={cn(
                                "w-full h-24 px-3 border-b border-[#d1cdc4] transition-all duration-200",
                                "flex items-center text-left",
                                currentTrackIndex === index
                                    ? "bg-[#e8e4dc] shadow-inner"
                                    : "bg-[#f5f2ed] hover:bg-[#eae6df]"
                            )}
                            style={{
                                boxShadow: currentTrackIndex === index
                                    ? 'inset 2px 2px 4px #d1cdc4, inset -2px -2px 4px #ffffff'
                                    : undefined
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
                            "bg-[#f5f2ed] hover:bg-[#eae6df] transition-all duration-200",
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
                                className={cn(
                                    "relative h-24 border-b border-[#d1cdc4]",
                                    trackIndex === currentTrackIndex ? 'bg-[#f5f2ed]' : 'bg-[#f0ece6]'
                                )}
                            >
                                {/* Grid background */}
                                {Array(GRID_CONSTANTS.CELLS).fill(null).map((_, cellIndex) => (
                                    <div
                                        key={`cell-${trackIndex}-${cellIndex}`}
                                        className="absolute border-r border-[#d1cdc4]"
                                        style={{
                                            left: cellIndex * GRID_CONSTANTS.CELL_WIDTH,
                                            top: 0,
                                            width: GRID_CONSTANTS.CELL_WIDTH,
                                            height: '100%'
                                        }}
                                    />
                                ))}

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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineGrid;