// src/features/player/components/timeline/TimelineGrid/components/GridArea.tsx

import React from 'react';
import { TimeRuler } from './TimeRuler';
import { TrackLane } from './TrackLane';
import { PlaybackIndicator } from './PlaybackIndicator';
import { GridAreaProps } from '../types';
import { GRID_CONSTANTS } from '../constants';

export const GridArea: React.FC<GridAreaProps> = ({
                                                      tracks,
                                                      timelineSettings,
                                                      trackRanges,
                                                      selectedNoteId,
                                                      playbackPosition,
                                                      isPlaying
                                                  }) => {
    const formatGridTime = (cellIndex: number) => {
        const beats = Math.floor(cellIndex / 4) + 1;
        const subdivision = (cellIndex % 4) + 1;
        return `${beats}.${subdivision}`;
    };

    return (
        <div className="flex-grow overflow-x-auto relative">
            <div style={{ width: GRID_CONSTANTS.CELLS * GRID_CONSTANTS.CELL_WIDTH }}>
                <TimeRuler
                    cellCount={GRID_CONSTANTS.CELLS}
                    cellWidth={GRID_CONSTANTS.CELL_WIDTH}
                    formatGridTime={formatGridTime}
                />

                {tracks.map((track, index) => (
                    <TrackLane
                        key={track.id}
                        track={track}
                        trackIndex={index}
                        timelineZoom={timelineSettings.zoom}
                        selectedNoteId={selectedNoteId}
                        trackRange={trackRanges[index]}
                        availableTracks={tracks.map(t => t.id)}
                    />
                ))}

                <PlaybackIndicator
                    position={playbackPosition}
                    isPlaying={isPlaying}
                />
            </div>
        </div>
    );
};