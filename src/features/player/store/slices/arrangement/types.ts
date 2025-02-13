// src/features/player/store/types/arrangement.arrangement.types.ts
import { SynthesisParameters } from '../../../../audio/api/types';

// Add color to NoteEvent
export interface NoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis: SynthesisParameters;
    color?: NoteColor;    // Add this line
}

// Add this enum for our ROYGBIV colors
export enum NoteColor {
    Yellow = '#9e4206',  // Soft yellow
    Red = '#bd0000',     // Soft red
    Orange = '#ff6a1b',  // Soft orange
    Green = '#9fc102',   // Soft green
    Blue = '#297dff',    // Soft blue
    Indigo = '#9332f6',  // Soft indigo
    Violet = '#ff4f9e'   // Soft violet
}


// Add a tracks state to ArrangementState
export interface TrackState {
    id: number;
    color: NoteColor;
}


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

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    loopRegion?: {
        start: number;
        end: number;
    };
}


// Update ArrangementState to include tracks
export interface ArrangementState {
    isRecording: boolean;
    recordingStartTime: number | null;
    currentTrack: number;
    clips: Clip[];
    recordingBuffer: NoteEvent[];
    tempo: number;
    playback: PlaybackState;
    selectedNote: SelectedNote | null;
    tracks: TrackState[];  // Add this line
}