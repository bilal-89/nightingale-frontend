// src/features/arrangement/components/ArrangementView.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { Card } from '../../../components/ui/card';
import {
    startRecording,
    stopRecording,
    setCurrentTrack,
    moveClip,
    selectIsRecording,
    selectCurrentTrack,
    selectClips,
    // Add these new imports right here
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    selectIsPlaying,
    selectCurrentTime,
    type Clip,
    type NoteEvent
} from '../../../store/slices/arrangement/arrangement.slice';

// Add these new imports right after the slice import
import { Play, Square, SkipBack } from 'lucide-react';
import PlaybackCoordinator from '../../../components/PlaybackCoordinator';

// Constants for layout and visualization
const TRACKS = 4;
const CELLS = 32;
const CELL_WIDTH = 96;
const TRACK_HEIGHT = 96;
const HEADER_HEIGHT = 32;
const NOTE_HEIGHT = 3;

// Design system colors
const COLORS = {
    background: {
        light: '#f5f2ed',
        medium: '#e8e4dc',
        dark: '#d1cdc4'
    },
    accent: {
        primary: '#4a90e2',
        recording: '#e53e3e',
        selected: '#63b3ed'
    }
} as const;


// Types for drag state management
interface DragState {
    type: 'CREATE' | 'MOVE';
    startPoint: { track: number; cell: number };
    currentPoint: { track: number; cell: number };
    clipId?: string;
    originalPosition?: {
        startCell: number;
        track: number;
    };
}

// Main component
const ArrangementView: React.FC = () => {
    // Redux state
    const dispatch = useAppDispatch();
    const isRecording = useAppSelector(selectIsRecording);
    const currentTrack = useAppSelector(selectCurrentTrack);
    const clips = useAppSelector(selectClips);

// Add these new selectors right here
    const isPlaying = useAppSelector(selectIsPlaying);
    const currentTime = useAppSelector(selectCurrentTime);

    // Local state
    const [dragState, setDragState] = useState<DragState | null>(null);

    // Memoize note calculations for all clips
    const notesMemoByClip = useMemo(() => {
        return clips.map(clip => {
            const grouped = new Map<number, NoteEvent[]>();
            clip.notes.forEach(note => {
                if (!grouped.has(note.note)) {
                    grouped.set(note.note, []);
                }
                grouped.get(note.note)!.push(note);
            });

            const pitches = Array.from(grouped.keys()).sort();
            return {
                clipId: clip.id,
                notesByPitch: grouped,
                pitches,
                pitchRange: pitches.length > 0
                    ? Math.max(...pitches) - Math.min(...pitches)
                    : 1
            };
        });
    }, [clips]);

    // Event handlers
    {/* Update the handleMouseDown function */}
    const handleMouseDown = useCallback((track: number, cell: number, clipId?: string) => {
        if (clipId) {
            // Existing clip dragging logic
            const clip = clips.find(c => c.id === clipId);
            if (clip) {
                setDragState({
                    type: 'MOVE',
                    startPoint: { track, cell },
                    currentPoint: { track, cell },
                    clipId,
                    originalPosition: {
                        startCell: clip.startCell,
                        track: clip.track
                    }
                });
            }
        } else {
            // New note creation logic
            if (track === currentTrack) {
                // Start dragging for note creation
                setDragState({
                    type: 'CREATE',
                    startPoint: { track, cell },
                    currentPoint: { track, cell }
                });

                // Create initial one-cell clip with a note
                dispatch(addClip({
                    id: `${Date.now()}`,
                    startCell: cell,
                    length: 1,
                    track,
                    isSelected: false,
                    notes: [{
                        note: 60, // Middle C
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
            }
        }
    }, [clips, currentTrack, dispatch]);

    const handleMouseMove = useCallback((track: number, cell: number) => {
        if (dragState) {
            if (dragState.type === 'CREATE') {
                // Handle resizing of newly created note
                const startCell = dragState.startPoint.cell;
                const length = Math.abs(cell - startCell) + 1;
                const clip = clips.find(c =>
                    c.track === track &&
                    c.startCell === Math.min(startCell, cell)
                );
                if (clip) {
                    dispatch(moveClip({
                        id: clip.id,
                        startCell: Math.min(startCell, cell),
                        track,
                    }));
                    // Update clip length
                    dispatch(updateClipLength({
                        id: clip.id,
                        length
                    }));
                }
            }
            setDragState(prev => prev ? {
                ...prev,
                currentPoint: { track, cell }
            } : null);
        }
    }, [dragState, clips, dispatch]);

    const handleMouseUp = useCallback(() => {
        if (dragState) {
            if (dragState.type === 'MOVE' && dragState.clipId) {
                // Existing move logic
                const clip = clips.find(c => c.id === dragState.clipId);
                if (clip) {
                    const cellDelta = dragState.currentPoint.cell - dragState.startPoint.cell;
                    const newStartCell = Math.max(0, clip.startCell + cellDelta);
                    dispatch(moveClip({
                        id: clip.id,
                        startCell: newStartCell,
                        track: dragState.currentPoint.track
                    }));
                }
            } else if (dragState.type === 'CREATE') {
                // Finalize note creation
                const startCell = Math.min(dragState.startPoint.cell, dragState.currentPoint.cell);
                const endCell = Math.max(dragState.startPoint.cell, dragState.currentPoint.cell);
                const length = endCell - startCell + 1;

                // Find the clip we just created
                const clip = clips.find(c =>
                    c.track === dragState.startPoint.track &&
                    c.startCell === startCell
                );

                if (clip) {
                    // Update final length and any other parameters
                    dispatch(updateClipLength({
                        id: clip.id,
                        length
                    }));
                }
            }
            setDragState(null);
        }
    }, [dragState, clips, dispatch]);

    // Add these new handlers right here
    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            dispatch(stopPlayback());
        } else {
            dispatch(startPlayback());
        }
    }, [isPlaying, dispatch]);

    const handleRewind = useCallback(() => {
        dispatch(setPlaybackPosition(0));
    }, [dispatch]);

    // Rendering functions
    const renderNoteContent = useCallback((clip: Clip) => {
        const clipNotes = notesMemoByClip.find(n => n.clipId === clip.id);
        if (!clipNotes || clipNotes.pitches.length === 0) return null;

        const visualizationHeight = TRACK_HEIGHT - 16;

        return (
            <div className="absolute inset-2 overflow-hidden">
                {Array.from(clipNotes.notesByPitch.entries()).map(([pitch, events]) => (
                    <React.Fragment key={pitch}>
                        {events.map((event, index) => {
                            const startPosition = (event.timestamp / (clip.length * 1000)) * 100;
                            const duration = event.duration || 100;
                            const width = (duration / (clip.length * 1000)) * 100;
                            const verticalPosition =
                                ((pitch - Math.min(...clipNotes.pitches)) /
                                    (clipNotes.pitchRange)) *
                                (visualizationHeight - NOTE_HEIGHT);

                            return (
                                <div
                                    key={`${pitch}-${index}`}
                                    className="absolute bg-blue-400 rounded-sm opacity-75"
                                    style={{
                                        left: `${startPosition}%`,
                                        width: `${width}%`,
                                        height: `${NOTE_HEIGHT}px`,
                                        top: verticalPosition,
                                        transition: 'all 0.15s ease-out'
                                    }}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        );
    }, [notesMemoByClip]);

    const renderClip = useCallback((clip: Clip) => {
        const isDragging = dragState?.type === 'MOVE' && dragState.clipId === clip.id;

        let position = {
            top: `${clip.track * TRACK_HEIGHT + HEADER_HEIGHT}px`,
            left: `${clip.startCell * CELL_WIDTH}px`
        };

        if (isDragging) {
            const cellDelta = dragState.currentPoint.cell - dragState.startPoint.cell;
            const newStartCell = Math.max(0, clip.startCell + cellDelta);
            position = {
                top: `${dragState.currentPoint.track * TRACK_HEIGHT + HEADER_HEIGHT}px`,
                left: `${newStartCell * CELL_WIDTH}px`
            };
        }

        return (
            <div
                key={clip.id}
                className={`absolute rounded-lg transition-all duration-300 
                    ${clip.isSelected ? 'ring-2 ring-blue-400' : ''}
                    ${isDragging ? 'opacity-75 scale-[1.02]' : ''}
                    bg-[#e5e9ec] cursor-move hover:brightness-95
                    backdrop-blur-sm backdrop-filter`}
                style={{
                    ...position,
                    width: `${clip.length * CELL_WIDTH - 2}px`,
                    height: `${TRACK_HEIGHT - 2}px`,
                    boxShadow: isDragging
                        ? '4px 4px 8px #c8ccd0, -4px -4px 8px #ffffff'
                        : '2px 2px 4px #c8ccd0, -2px -2px 4px #ffffff',
                    zIndex: isDragging ? 10 : 1,
                    transition: 'all 0.15s ease-out'
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(clip.track, clip.startCell, clip.id);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isDragging) {
                        dispatch({
                            type: 'arrangement/toggleClipSelection',
                            payload: clip.id
                        });
                    }
                }}
            >
                {renderNoteContent(clip)}
                <div className="absolute top-1 left-2 text-xs text-gray-600 font-medium">
                    {clip.notes.length} notes
                </div>
            </div>
        );
    }, [dragState, handleMouseDown, dispatch, renderNoteContent]);

    // Add this helper function right here
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    };


    const renderTransportControls = () => (
        <div className="flex gap-2 mb-4 px-2">
            {/* Your existing recording button */}
            <button
                className={`px-4 py-2 rounded-lg transition-all duration-300
                    ${isRecording ? 'bg-red-500 text-white' : 'bg-[#e8e4dc] text-gray-700'}`}
                onClick={() => {
                    if (isRecording) {
                        dispatch(stopRecording());
                    } else {
                        dispatch(startRecording());
                    }
                }}
                style={{
                    boxShadow: isRecording
                        ? 'inset 2px 2px 4px #c41e3a, inset -2px -2px 4px #ff1a1a'
                        : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                }}
            >
                {isRecording ? 'Stop Recording' : 'Record'}
            </button>

            {/* Add these new playback controls right after the recording button */}
            <button
                className="p-2 rounded-lg transition-all duration-300 bg-[#e8e4dc]"
                onClick={handleRewind}
                style={{
                    boxShadow: '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                }}
            >
                <SkipBack className="w-5 h-5" />
            </button>

            <button
                className={`p-2 rounded-lg transition-all duration-300
                    ${isPlaying ? 'bg-green-500' : 'bg-[#e8e4dc]'}`}
                onClick={handlePlayPause}
                style={{
                    boxShadow: isPlaying
                        ? 'inset 2px 2px 4px #2f855a, inset -2px -2px 4px #48bb78'
                        : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                }}
            >
                {isPlaying ? (
                    <Square className="w-5 h-5 text-white" />
                ) : (
                    <Play className="w-5 h-5" />
                )}
            </button>

            {/* Add time display */}
            <div className="px-4 py-2 rounded-lg bg-[#e8e4dc] font-mono">
                {formatTime(currentTime)}
            </div>
        </div>
    );

    const renderTrackHeaders = () => (
        <div className="w-32 flex-shrink-0 border-r border-[#d1cdc4]">
            <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm">
                Time
            </div>
            {Array(TRACKS).fill(null).map((_, i) => (
                <div
                    key={i}
                    className="h-24 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 flex items-center gap-2"
                >
                    <button
                        className={`w-3 h-3 rounded-full transition-all duration-300
                            ${currentTrack === i ? 'bg-red-500' : 'bg-gray-300'}`}
                        onClick={() => dispatch(setCurrentTrack(i))}
                    />
                    <span className="text-sm">Track {i + 1}</span>
                </div>
            ))}
        </div>
    );

    const renderTimeGrid = () => (
        <div className="flex">
            {renderTrackHeaders()}
            <div className="flex-grow overflow-x-auto">
                <div className="relative">
                    {/* Time markers */}
                    <div className="flex h-8 border-b border-[#d1cdc4]">
                        {Array(CELLS).fill(null).map((_, i) => (
                            <div
                                key={i}
                                className="w-24 flex-shrink-0 border-r border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm"
                            >
                                {Math.floor(i/4) + 1}.{(i % 4) + 1}
                            </div>
                        ))}
                    </div>

                    {/* Track rows */}
                    {Array(TRACKS).fill(null).map((_, trackIndex) => (
                        <div
                            key={trackIndex}
                            className="flex h-24 border-b border-[#d1cdc4]"
                            onMouseLeave={handleMouseUp}
                        >
                            {Array(CELLS).fill(null).map((_, cellIndex) => (
                                <div
                                    key={cellIndex}
                                    className={`w-24 flex-shrink-0 border-r border-[#d1cdc4] 
                                        transition-colors duration-150
                                        ${dragState?.type === 'MOVE' &&
                                    dragState.currentPoint.track === trackIndex &&
                                    dragState.currentPoint.cell === cellIndex
                                        ? 'bg-blue-50'
                                        : 'bg-[#f0ece6]'}`}
                                    onMouseDown={() => handleMouseDown(trackIndex, cellIndex)}
                                    onMouseMove={() => handleMouseMove(trackIndex, cellIndex)}
                                    onMouseUp={handleMouseUp}
                                />
                            ))}
                        </div>
                    ))}
                    {/* Add playback position indicator right here */}
                    {isPlaying && (
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-green-500 z-20 pointer-events-none"
                            style={{
                                left: `${(currentTime / (CELLS * 0.5)) * (CELLS * CELL_WIDTH)}px`,
                                transition: 'left 0.1s linear'
                            }}
                        />
                    )}

                    {/* Clips */}
                    {clips.map(renderClip)}
                </div>
            </div>
        </div>
    );

    return (
        <Card className="p-4 bg-gradient-to-br from-[#f5f2ed] to-[#e8e4df] overflow-hidden">
            <PlaybackCoordinator />  {/* Add this line right here */}

            {renderTransportControls()}
            {renderTimeGrid()}
        </Card>
    );
};

export default ArrangementView;