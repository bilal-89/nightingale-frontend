// src/components/grid/GridCell.tsx
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addClip, selectCurrentTrack, selectClips } from '../../store/slices/arrangement/arrangement.slice';

interface GridCellProps {
    track: number;
    cell: number;
    height?: number;
}

export const GridCell: React.FC<GridCellProps> = ({
                                                      track,
                                                      cell,
                                                      height = 96
                                                  }) => {
    const dispatch = useDispatch();
    const currentTrack = useSelector(selectCurrentTrack);
    const clips = useSelector(selectClips);

    const hasNote = clips.some(clip =>
        clip.track === track &&
        clip.startCell <= cell &&
        clip.startCell + clip.length > cell
    );

    const handleStartNote = useCallback(() => {
        // Only allow note creation on current track
        if (track !== currentTrack) return;

        dispatch(addClip({
            id: `${Date.now()}`,
            startCell: cell,
            length: 1,  // Start with one cell length
            track,
            isSelected: false,
            notes: [{
                note: 60,  // Middle C
                timestamp: 0,
                velocity: 100,
                duration: 0.1,
                synthesis: {
                    mode: 'tunable',
                    waveform: 'sine',
                    envelope: {
                        attack: 0.005,
                        decay: 0,
                        sustain: 1,
                        release: 0.005
                    },
                    gain: 0.3,
                    effects: {}
                }
            }],
            parameters: {
                velocity: 100,
                pitch: 60,
                tuning: 0
            }
        }));
    }, [dispatch, track, currentTrack, cell]);

    return (
        <div
            className={`
                w-24 h-${height} flex-shrink-0 border-r border-[#d1cdc4] 
                transition-colors duration-150 cursor-pointer
                ${hasNote ? 'bg-blue-100' : 'bg-[#f0ece6]'}
                ${track === currentTrack ? 'hover:bg-blue-50' : ''}
            `}
            onClick={handleStartNote}
        />
    );
};

// src/components/grid/GridTrack.tsx
import React from 'react';
import { GridCell } from './GridCell';

interface GridTrackProps {
    trackIndex: number;
    cellCount: number;
}

export const GridTrack: React.FC<GridTrackProps> = ({
                                                        trackIndex,
                                                        cellCount
                                                    }) => {
    return (
        <div className="flex h-24 border-b border-[#d1cdc4]">
            {Array(cellCount).fill(null).map((_, cellIndex) => (
                <GridCell
                    key={cellIndex}
                    track={trackIndex}
                    cell={cellIndex}
                />
            ))}
        </div>
    );
};

// src/components/grid/GridLayout.tsx
import React from 'react';
import { GridTrack } from './GridTrack';

interface GridLayoutProps {
    trackCount: number;
    cellCount: number;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
                                                          trackCount,
                                                          cellCount
                                                      }) => {
    return (
        <div className="flex-grow overflow-x-auto">
            <div className="relative">
                {/* Time markers */}
                <div className="flex h-8 border-b border-[#d1cdc4]">
                    {Array(cellCount).fill(null).map((_, i) => (
                        <div
                            key={i}
                            className="w-24 flex-shrink-0 border-r border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm"
                        >
                            {Math.floor(i/4) + 1}.{(i % 4) + 1}
                        </div>
                    ))}
                </div>

                {/* Tracks */}
                {Array(trackCount).fill(null).map((_, trackIndex) => (
                    <GridTrack
                        key={trackIndex}
                        trackIndex={trackIndex}
                        cellCount={cellCount}
                    />
                ))}
            </div>
        </div>
    );
};