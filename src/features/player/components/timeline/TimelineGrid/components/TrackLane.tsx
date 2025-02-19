// src/features/player/components/timeline/TimelineGrid/components/TrackLane.tsx

import React from 'react';
import Note from '../../../notes/Note';
import {Track} from "../../../../store/types";
import {TrackRange} from "../types.ts";
// import { TrackLaneProps } from '../types';
// import { Track } from "../../../../store/player";

interface TrackLaneProps {
    track: Track;
    trackIndex: number;
    timelineZoom: number;
    selectedNoteId: string | null;
    multiSelectedNoteIds?: string[];  // Make optional
    trackRange: TrackRange;
    availableTracks: string[];
}

export const TrackLane: React.FC<TrackLaneProps> = ({
                                                        track,
                                                        trackIndex,
                                                        timelineZoom,
                                                        selectedNoteId,
                                                        multiSelectedNoteIds = [],
                                                        trackRange,
                                                        availableTracks
                                                    }) => {
    return (
        <div className="relative h-24 border-b border-[#d1cdc4] bg-[#f5f2ed]">
            {track.notes.map(note => {
                const isSelected = selectedNoteId === note.id;
                const isMultiSelected = multiSelectedNoteIds.includes(note.id);
                const isFocused = selectedNoteId === note.id && !multiSelectedNoteIds.length;

                return (
                    <Note
                        key={note.id}
                        note={note}
                        trackId={track.id}
                        trackIndex={trackIndex}
                        timelineZoom={timelineZoom}
                        availableTracks={availableTracks}
                        isSelected={isSelected || isMultiSelected}
                        isMultiSelected={isMultiSelected}
                        isFocused={isFocused}
                        lowestNote={trackRange.lowestNote}
                        highestNote={trackRange.highestNote}
                        trackColor={track.color}
                    />
                );
            })}
        </div>
    );
};