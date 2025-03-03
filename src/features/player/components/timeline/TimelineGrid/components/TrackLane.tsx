import React from 'react';
import { useSelector } from 'react-redux';
import Note from '../../../notes/Note';
import { Track } from "../../../../store/types";
import { TrackRange } from "../types";
import { selectIsRecording, selectRecordingBuffer } from '../../../../store/player/selectors/recording';
import { LAYOUT } from '../../../../constants';
import { NoteEvent } from '../../../../types';

interface TrackLaneProps {
    track: Track;
    trackIndex: number;
    timelineZoom: number;
    selectedNoteId: string | null;
    multiSelectedNoteIds?: string[];
    trackRange: TrackRange;
    availableTracks: string[];
}

const calculateVerticalPosition = (note: NoteEvent, trackRange: TrackRange) => {
    const pitchRange = trackRange.highestNote - trackRange.lowestNote || 1;
    const normalizedPitch = (note.note - trackRange.lowestNote) / pitchRange;
    return LAYOUT.TRACK_HEIGHT * (1 - normalizedPitch);
};

export const TrackLane: React.FC<TrackLaneProps> = ({
                                                        track,
                                                        trackIndex,
                                                        timelineZoom,
                                                        selectedNoteId,
                                                        multiSelectedNoteIds = [],
                                                        trackRange,
                                                        availableTracks
                                                    }) => {
    const isRecording = useSelector(selectIsRecording);
    const recordingBuffer = useSelector(selectRecordingBuffer);
    const recordingStartTime = useSelector(state => state.player.recordingStartTime);
    const currentTrackIndex = useSelector(state => state.player.currentTrack);

    // Render regular track notes
    const renderTrackNotes = () => track.notes.map(note => {
        // A note is selected if it's either the single selected note
        // OR it's in the multiselect array
        const isSelected = selectedNoteId === note.id;
        const isMultiSelected = multiSelectedNoteIds.includes(note.id);
        const isFocused = selectedNoteId === note.id && multiSelectedNoteIds.length === 0;

        // Only log if there's an actual selection
        if (isSelected || isMultiSelected || isFocused) {
            console.log('Note selection state:', {
                noteId: note.id,
                selectedNoteId,
                isSelected,
                isMultiSelected,
                isFocused
            });
        }

        return (
            <Note
                key={note.id}
                note={note}
                trackId={track.id}
                trackIndex={trackIndex}
                timelineZoom={timelineZoom}
                availableTracks={availableTracks}
                isSelected={isSelected}
                isMultiSelected={isMultiSelected}
                isFocused={isFocused}
                lowestNote={trackRange.lowestNote}
                highestNote={trackRange.highestNote}
                trackColor={track.color}
                verticalPosition={calculateVerticalPosition(note, trackRange)}
            />
        );
    });

    // Render recording buffer notes
    const renderRecordingNotes = () => {
        if (!isRecording || trackIndex !== currentTrackIndex || !recordingStartTime) {
            return null;
        }

        return recordingBuffer.map(note => {
            const duration = note.isActive
                ? Date.now() - recordingStartTime - note.timestamp
                : note.duration || 0;

            return (
                <Note
                    key={`recording-${note.id}`}
                    note={{
                        ...note,
                        duration,
                        color: track.color
                    }}
                    trackId={track.id}
                    trackIndex={trackIndex}
                    timelineZoom={timelineZoom}
                    availableTracks={availableTracks}
                    isSelected={false}
                    isMultiSelected={false}
                    isFocused={false}
                    lowestNote={trackRange.lowestNote}
                    highestNote={trackRange.highestNote}
                    trackColor={track.color}
                    verticalPosition={calculateVerticalPosition(note, trackRange)}
                />
            );
        });
    };

    return (
        <svg
            width="100%"
            height={LAYOUT.TRACK_HEIGHT}
            className="relative"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={`trackLaneGradient-${track.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5F2ED" />
                    <stop offset="100%" stopColor="#E8E4DF" />
                </linearGradient>
            </defs>

            {/* Background rectangle with gradient */}
            <rect
                width="100%"
                height={LAYOUT.TRACK_HEIGHT}
                fill={`url(#trackLaneGradient-${track.id})`}
            />

            {/* Bottom border line */}
            <line
                x1="0"
                y1={LAYOUT.TRACK_HEIGHT - 1}
                x2="100%"
                y2={LAYOUT.TRACK_HEIGHT - 1}
                stroke="#d1cdc4"
                strokeWidth="1"
            />

            {/* Foreign object to contain notes */}
            <foreignObject
                width="100%"
                height={LAYOUT.TRACK_HEIGHT}
                style={{ overflow: 'visible' }}
            >
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="relative w-full h-full"
                >
                    {renderTrackNotes()}
                    {renderRecordingNotes()}
                </div>
            </foreignObject>
        </svg>
    );
};

export default TrackLane;