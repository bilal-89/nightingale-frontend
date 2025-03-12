import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../../../../features/player/hooks';
import { useTiming } from '../../../../../../../features/player/hooks/useTiming';
import {
    selectCurrentTrack,
    selectTracks,
    selectTimelineSettings,
    selectIsPlaying,
    deleteNotes
} from '../../../../../../../features/player/store/player';
import { selectSelectedNote, selectMultiSelectedNotes } from '../../../../../../../features/player/store/player';
import { TrackHeaders } from './components/TrackHeaders';
import { GridArea } from './components/GridArea';
import { useTrackInteraction } from './hooks/useTrackInteraction';
import { useGridPlayback } from './hooks/useGridPlayback';
import { useSelectionBox } from '../../../../../../../features/player/hooks/useSelectionBox';
import SelectionBox from './components/SelectionBox';
import { LoopMarkers } from './components/LoopMarkers';
import { usePlayback } from '../../../../../../../features/player/hooks';

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

    // Loop state and handlers
    const {
        loopEnabled,
        toggleLooping,
        loopStart,
        loopEnd,
        updateLoopStart,
        updateLoopEnd
    } = usePlayback();

    // State for managing loop point setting
    const [isSettingLoopPoints, setIsSettingLoopPoints] = useState(false);
    const [loopPointBeingSet, setLoopPointBeingSet] = useState<'start' | 'end' | null>(null);

    // Selection box hook - now with isSelecting state
    const { selectionBox, handleSelectionStart, gridRef, isSelecting } = useSelectionBox();

    // Selectors
    const isPlaying = useAppSelector(selectIsPlaying);
    const tracks = useAppSelector(selectTracks);
    const currentTrackIndex = useAppSelector(selectCurrentTrack);
    const timelineSettings = useAppSelector(selectTimelineSettings);
    const selectedNote = useAppSelector(selectSelectedNote);
    const multiSelectedNotes = useAppSelector(selectMultiSelectedNotes);

    // Get note IDs from selected notes for highlighting
    const selectedNoteId = selectedNote ? selectedNote.note.id : null;
    const multiSelectedNoteIds = multiSelectedNotes
        .filter(note => note !== null) // Filter out any null values
        .map(note => note.note.id);

    // Playback position management
    const playbackPositionRef = useGridPlayback(
        isPlaying,
        getCurrentTime as () => number,
        timelineSettings
    );

    // Effect to initialize loop point setting state when loop is enabled
    useEffect(() => {
        if (loopEnabled) {
            // Always start in loop point setting mode when loop is enabled
            setIsSettingLoopPoints(true);
            // Always start by setting the start point first
            setLoopPointBeingSet('start');
            // Reset loop points to defaults
            updateLoopStart(0);
            updateLoopEnd(60000);
        } else {
            // Loop disabled, reset states
            setIsSettingLoopPoints(false);
            setLoopPointBeingSet(null);
        }
    }, [loopEnabled, updateLoopStart, updateLoopEnd]);

    // Handle grid click for setting loop points
    const handleGridClick = useCallback((e: React.MouseEvent) => {
        if (!loopEnabled || !isSettingLoopPoints) return;

        // Prevent default selection behavior when setting loop points
        e.stopPropagation();
        e.preventDefault();

        // Find the grid area element (the actual timeline part, not including headers)
        const gridArea = gridRef.current?.querySelector('.relative.flex-grow');
        if (!gridArea) return;

        // Get accurate grid area position
        const rect = gridArea.getBoundingClientRect();

        // Calculate exact click position relative to grid area
        const exactX = e.clientX - rect.left;

        // Convert exact pixel position to time
        const timePosition = Math.round(exactX / timelineSettings.zoom);

        console.log('Setting loop point:', {
            point: loopPointBeingSet,
            exactX,
            timePosition,
            zoom: timelineSettings.zoom
        });

        if (loopPointBeingSet === 'start') {
            // Set start point and reset end point to default
            updateLoopStart(timePosition);
            updateLoopEnd(60000); // Reset end point to default
            // Switch to setting end point
            setLoopPointBeingSet('end');
        } else if (loopPointBeingSet === 'end') {
            // Ensure end is after start
            const startMs = typeof loopStart === 'number' ? loopStart : 0;
            const newEnd = Math.max(timePosition, startMs + 100); // minimum 100ms between points
            updateLoopEnd(newEnd);
            // Done setting points
            setLoopPointBeingSet(null);
            setIsSettingLoopPoints(false);
        }
    }, [loopPointBeingSet, loopEnabled, isSettingLoopPoints, timelineSettings.zoom, updateLoopStart, updateLoopEnd, loopStart, gridRef]);

    // Handle escape key to exit loop point setting mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSettingLoopPoints) {
                // Cancel loop setting and disable loop mode
                setIsSettingLoopPoints(false);
                setLoopPointBeingSet(null);
                if (loopEnabled) {
                    toggleLooping();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSettingLoopPoints, loopEnabled, toggleLooping]);

    // Delete handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') &&
                (selectedNote || multiSelectedNotes.length > 0)) {
                e.preventDefault();

                const notesToDelete = multiSelectedNotes.length > 0
                    ? multiSelectedNotes.filter(n => n !== null).map(n => ({
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
        return tracks.map((track: any) => {
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
        <div className="timeline-grid-container">
            <div
                ref={gridRef}
                className="w-full bg-[#f5f2ed] rounded-lg shadow-sm overflow-hidden relative"
                onMouseDown={(e) => {
                    // If we're setting loop points, handle that; otherwise do selection
                    if (loopEnabled && isSettingLoopPoints) {
                        handleGridClick(e);
                    } else {
                        handleSelectionStart(e);
                    }
                }}
                style={{
                    position: 'relative',
                    userSelect: 'none',
                    cursor: isSettingLoopPoints ? 'crosshair' : isSelecting ? 'crosshair' : 'default'
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

                    <div className="relative flex-grow">
                        <GridArea
                            tracks={tracks}
                            timelineSettings={timelineSettings}
                            trackRanges={trackRanges}
                            selectedNoteId={selectedNoteId}
                            multiSelectedNoteIds={multiSelectedNoteIds}
                            playbackPosition={playbackPositionRef.current}
                            isPlaying={isPlaying}
                        />

                        <LoopMarkers timelineZoom={timelineSettings.zoom} />

                        {/* Render selection box whenever it exists */}
                        {selectionBox && (
                            <SelectionBox
                                startPoint={selectionBox.startPoint}
                                currentPoint={selectionBox.currentPoint}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineGrid;