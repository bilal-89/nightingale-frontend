// src/features/player/store/types/state.ts
import { NoteEvent } from '../../types';
import { SchedulingConfig } from './scheduling';
import { Track } from './track';

export interface PlayerState {
    // Recording state
    isRecording: boolean;
    recordingStartTime: number | null;
    recordingBuffer: NoteEvent[];

    // Track management
    currentTrack: number;
    tracks: Track[];
    clips: Clip[];  // Add from ArrangementState

    // Selection state
    selectedNote: SelectedNote | null;  // Use from ArrangementState instead of selectedNoteId

    // Timeline/Grid settings
    timelineZoom: number;
    snapEnabled: boolean;
    snapResolution: number;
    snapStrength: number;

    // Playback state
    isPlaying: boolean;
    currentTime: number;
    tempo: number;
    totalDuration: number;
    schedulingConfig: SchedulingConfig;

    // Additional playback settings
    metronomeEnabled: boolean;
    countInEnabled: boolean;
    prerollBars: number;
}

// Add these from ArrangementState
export interface Clip {
    id: string;
    startCell: number;
    length: number;
    track: number;
    isSelected: boolean;
    notes: NoteEvent[];
    parameters: {
        velocity: number;
        pitch: number;
        tuning: number;
    };
}

export interface SelectedNote {
    clipId: string;
    noteIndex: number;
}