// src/features/player/components/timeline/components/Track.tsx
import React, { useMemo } from 'react';
import Note from '../../notes/Note';
import { Track as TrackType } from '../../../types/track';

interface TrackProps {
    track: TrackType;
    index: number;
    timelineZoom: number;
    isSelected: boolean;
    selectedNoteId: string | null;
}

export const Track: React.FC<TrackProps> = ({
                                                track,
                                                index,
                                                timelineZoom,
                                                isSelected,
                                                selectedNoteId
                                            }) => {
    // Calculate note range for this track
    const { lowestNote, highestNote } = useMemo(() => {
        if (track.notes.length === 0) {
            return { lowestNote: 60, highestNote: 72 }; // Default octave range
        }
        const notes = track.notes.map(n => n.note);
        return {
            lowestNote: Math.min(...notes),
            highestNote: Math.max(...notes)
        };
    }, [track.notes]);

    return (
        <div
            className={`relative flex h-24 border-b border-[#d1cdc4]
                ${isSelected ? 'bg-[#f5f2ed]' : 'bg-[#f0ece6]'}`}
        >
            {track.notes.map(note => (
                <Note
                    key={note.id}
                    note={note}
                    trackId={track.id}
                    trackIndex={index}
                    isSelected={selectedNoteId === note.id}
                    timelineZoom={timelineZoom}
                    lowestNote={lowestNote}
                    highestNote={highestNote}
                 availableTracks={['FFFF']}/>
            ))}
        </div>
    );
};