// src/features/player/components/timeline/TimelineGrid/components/TrackLane.tsx

import React from 'react';
import Note from '../../../notes/Note';
import { TrackRange } from '../types';
import {Track} from "../../../../store/player";

interface TrackLaneProps {
    track: Track;
    trackIndex: number;
    timelineZoom: number;
    selectedNoteId: string | null;
    trackRange: TrackRange;
    availableTracks: string[];
}

export const TrackLane: React.FC<TrackLaneProps> = ({
                                                        track,
                                                        trackIndex,
                                                        timelineZoom,
                                                        selectedNoteId,
                                                        trackRange,
                                                        availableTracks
                                                    }) => {
    return (
        <div
            className="relative h-24 border-b border-[#d1cdc4] bg-[#f5f2ed]"
        >
            {track.notes.map(note => (
                <Note
                    key={note.id}
                    note={note}
                    trackId={track.id}
                    trackIndex={trackIndex}
                    timelineZoom={timelineZoom}
                    availableTracks={availableTracks}
                    isSelected={selectedNoteId === note.id}
                    lowestNote={trackRange.lowestNote}
                    highestNote={trackRange.highestNote}
                    trackColor={track.color}
                />
            ))}
        </div>
    );
};