// src/features/player/components/timeline/components/TimelineGrid.tsx

import React, { useCallback, useMemo } from 'react';
import { usePlayback } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import {
    selectCurrentTrack,
    selectTracks,
    selectTimelineSettings,
    setCurrentTrack, addTrack
} from '../../../state/slices/player.slice';
import Note from '../../notes/Note';
import { TIMING } from '../../../utils/time.utils';

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
                    <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm">
                        Time
                    </div>

                    {tracks.map((track, index) => (
                        <div
                            key={track.id}
                            className="h-24 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 flex items-center gap-2"
                        >
                            <button
                                className={`w-3 h-3 rounded-full transition-all duration-300 
                                    ${currentTrackIndex === index ? 'bg-green-500' : 'bg-gray-300'}
                                    hover:scale-110`}
                                onClick={() => handleTrackSelect(index)}
                                title={`Select ${track.name}`}
                            />
                            <span className="text-sm">{track.name}</span>
                        </div>
                    ))}

                    {/* Add Track Button */}
                    <button
                        className="w-full h-12 flex items-center justify-center text-sm text-gray-600
                            hover:bg-[#f0ece6] transition-colors"
                        onClick={() => dispatch(addTrack())}
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
                                className={`relative h-24 border-b border-[#d1cdc4] 
                                    ${trackIndex === currentTrackIndex ? 'bg-[#f5f2ed]' : 'bg-[#f0ece6]'}`}
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