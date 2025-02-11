// src/features/player/components/timeline/TimelineGrid/components/TrackHeaders.tsx

import React from 'react';
import { useAppDispatch } from '../../../../hooks';
import { addTrack } from '../../../../store/player';
// import { TrackHeaderProps } from '../types';
import { cn } from '../../../../../../core/utils/styles.utils';
import {Track} from "../../../../store/player";

interface TrackHeadersProps {
    tracks: Track[];
    currentTrackIndex: number;
    pressedTrackId: string | null;
    onTrackMouseDown: (trackId: string) => void;
    onTrackMouseUp: (trackId: string, index: number) => void;
    onTrackMouseLeave: () => void;
}

export const TrackHeaders: React.FC<TrackHeadersProps> = ({
                                                              tracks,
                                                              currentTrackIndex,
                                                              pressedTrackId,
                                                              onTrackMouseDown,
                                                              onTrackMouseUp,
                                                              onTrackMouseLeave
                                                          }) => {
    const dispatch = useAppDispatch();

    return (
        <div className="w-32 flex-shrink-0 border-r border-[#d1cdc4]">
            {/* Time header */}
            <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm font-medium">
                Time
            </div>

            {/* Track buttons */}
            {tracks.map((track, index) => (
                <button
                    key={track.id}
                    onMouseDown={() => onTrackMouseDown(track.id)}
                    onMouseUp={() => onTrackMouseUp(track.id, index)}
                    onMouseLeave={onTrackMouseLeave}
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
                    "shadow-[2px_2px_4px_#d1cdc4,_-2px_-2px_4px_#ffffff]"
                )}
            >
                + Add Track
            </button>
        </div>
    );
};