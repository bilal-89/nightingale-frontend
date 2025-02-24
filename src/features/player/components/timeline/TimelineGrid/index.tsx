import React, { useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../hooks';
import { useTiming } from '../../../hooks/useTiming';
import {
    selectCurrentTrack,
    selectTracks,
    selectTimelineSettings,
    selectIsPlaying,
    deleteNotes
} from '../../../store/player';
import { selectSelectedNote, selectMultiSelectedNotes } from '../../../store/player/selectors/selection';
import { TrackHeaders } from './components/TrackHeaders';
import { GridArea } from './components/GridArea';
import { useTrackInteraction } from './hooks/useTrackInteraction';
import { useGridPlayback } from './hooks/useGridPlayback';
import { useSelectionBox } from '../../../hooks/useSelectionBox';
import SelectionBox from './components/SelectionBox';

export const TimelineGrid: React.FC = () => {
    // Hooks
    const dispatch = useAppDispatch();
    const { getCurrentTime } = useTiming();
    const {
        pressedTrackId,
        handleTrackMouseDown,
        handleTrackMouseUp,
        handleTrackMouseLeave
    } = useTrackInteraction();

    // Selection box hook
    const { selectionBox, handleSelectionStart, gridRef } = useSelectionBox();

    // Selectors
    const isPlaying = useAppSelector(selectIsPlaying);
    const tracks = useAppSelector(selectTracks);
    const currentTrackIndex = useAppSelector(selectCurrentTrack);
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const selectedNote = useAppSelector(selectSelectedNote);
    const multiSelectedNotes = useAppSelector(selectMultiSelectedNotes);
    const selectedNoteId = useAppSelector(state => state.player.selectedNoteId);
    const multiSelectedNoteIds = useAppSelector(state => state.player.multiSelectedNoteIds);

    // Playback position management
    const playbackPositionRef = useGridPlayback(
        isPlaying,
        getCurrentTime,
        timelineSettings
    );

    // Delete handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') &&
                (selectedNote || multiSelectedNotes.length > 0)) {
                e.preventDefault();

                const notesToDelete = multiSelectedNotes.length > 0
                    ? multiSelectedNotes.map(n => ({
                        trackId: n.trackId,
                        noteId: n.note.id
                    }))
                    : selectedNote
                        ? [{
                            trackId: selectedNote.trackId,
                            noteId: selectedNote.note.id
                        }]
                        : [];

                if (notesToDelete.length > 0) {
                    dispatch(deleteNotes({ notes: notesToDelete }));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, selectedNote, multiSelectedNotes]);

    // Calculate note ranges for each track for vertical positioning
    const trackRanges = useMemo(() => {
        return tracks.map(track => {
            if (track.notes.length === 0) {
                return { lowestNote: 60, highestNote: 72 }; // Default octave range
            }
            const notes = track.notes.map((n: { note: number }) => n.note);
            return {
                lowestNote: Math.min(...notes),
                highestNote: Math.max(...notes)
            };
        });
    }, [tracks]);

    return (
        <div
            ref={gridRef}
            className="w-full bg-white rounded-lg shadow-sm overflow-hidden relative"
            onMouseDown={handleSelectionStart}
            style={{
                position: 'relative',
                userSelect: 'none',
                cursor: 'default'
            }}
        >
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
                    multiSelectedNoteIds={multiSelectedNoteIds}
                    playbackPosition={playbackPositionRef.current}
                    isPlaying={isPlaying}
                />

                {/* Use SelectionBox component instead of inline div */}
                {selectionBox && selectionBox.width > 5 && selectionBox.height > 5 && (
                    <SelectionBox
                        startPoint={{
                            x: selectionBox.left,
                            y: selectionBox.top
                        }}
                        currentPoint={{
                            x: selectionBox.left + selectionBox.width,
                            y: selectionBox.top + selectionBox.height
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default TimelineGrid;