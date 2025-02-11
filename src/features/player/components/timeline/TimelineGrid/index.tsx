// src/features/player/components/timeline/TimelineGrid/index.tsx

import React, { useMemo } from 'react';
import { useAppSelector } from '../../../hooks';
import { useTiming } from '../../../hooks/useTiming';
import {
    selectCurrentTrack,
    selectTracks,
    selectTimelineSettings,
} from '../../../store/player';
import { selectIsPlaying } from '../../../store/playback';

import { TrackHeaders } from './components/TrackHeaders';
import { GridArea } from './components/GridArea';
import { useTrackInteraction } from './hooks/useTrackInteraction';
import { useGridPlayback } from './hooks/useGridPlayback';

export const TimelineGrid: React.FC = () => {
    // Hooks
    const { getCurrentTime } = useTiming();
    const {
        pressedTrackId,
        handleTrackMouseDown,
        handleTrackMouseUp,
        handleTrackMouseLeave
    } = useTrackInteraction();

    // Selectors
    const isPlaying = useAppSelector(selectIsPlaying);
    const tracks = useAppSelector(selectTracks);
    const currentTrackIndex = useAppSelector(selectCurrentTrack);
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const selectedNoteId = useAppSelector(state => state.player.selectedNoteId);

    // Playback position management
    const playbackPositionRef = useGridPlayback(
        isPlaying,
        getCurrentTime,
        timelineSettings
    );

    // Calculate note ranges for each track for vertical positioning
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

    return (
        <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex">
                <TrackHeaders
                    tracks={tracks}
                    currentTrackIndex={currentTrackIndex}
                    pressedTrackId={pressedTrackId}
                    onTrackMouseDown={handleTrackMouseDown}
                    onTrackMouseUp={handleTrackMouseUp}
                    onTrackMouseLeave={handleTrackMouseLeave}
                />

                <GridArea
                    tracks={tracks}
                    timelineSettings={timelineSettings}
                    trackRanges={trackRanges}
                    selectedNoteId={selectedNoteId}
                    playbackPosition={playbackPositionRef.current}
                    isPlaying={isPlaying}
                />
            </div>
        </div>
    );
};

export default TimelineGrid;