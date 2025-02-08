import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { setCurrentTrack } from '../../../state/slices/player.slice';
import { Track as TrackType } from '../../../types/track';
import Note from '../../notes/Note';
import { cn } from '../../../../../core/utils/styles.utils';

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
    const dispatch = useAppDispatch();
    const isRecording = useAppSelector(state => state.player.isRecording);

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

    const handleTrackSelect = () => {
        dispatch(setCurrentTrack(index));
    };

    return (
        <div className="relative">
            {/* Track Header - Clickable neumorphic button */}
            <button
                onClick={handleTrackSelect}
                className={cn(
                    "w-full px-4 py-2 rounded-t-lg transition-all duration-200",
                    "flex items-center justify-between",
                    "text-left font-medium border-b border-[#d1cdc4]",

                    // Neumorphic effects
                    isSelected
                        ? "bg-[#e8e4dc] shadow-inner"
                        : "bg-[#f5f2ed] shadow-[2px_2px_4px_#d1cdc4,_-2px_-2px_4px_#ffffff]",

                    // Text color based on selection
                    isSelected ? "text-gray-900" : "text-gray-600",

                    // Hover effects
                    // "hover:bg-[#eae6df]",

                    // Focus styles
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                )}
                style={{
                    boxShadow: isSelected
                        ? 'inset 2px 2px 4px #d1cdc4, inset -2px -2px 4px #ffffff'
                        : undefined
                }}
            >
                <div className="flex items-center space-x-3">
                    <span>{track.name}</span>
                </div>

                {/* Recording indicator */}
                {isRecording && isSelected && (
                    <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                )}
            </button>

            {/* Track Content - Note display area */}
            <div
                className={cn(
                    "relative flex h-24",
                    isSelected ? 'bg-[#f5f2ed]' : 'bg-[#f0ece6]'
                )}
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
                        availableTracks={['FFFF']}
                    />
                ))}
            </div>
        </div>
    );
};

export default Track;