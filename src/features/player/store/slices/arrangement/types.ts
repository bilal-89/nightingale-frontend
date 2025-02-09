// src/features/player/store/types/arrangement.arrangement.types.ts
import { SynthesisParameters } from '../../../../audio/types/audioTypes.ts';

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
    Red = '#ffb3b3',     // Soft red
    Orange = '#ffd4a3',  // Soft orange
    Yellow = '#fff0b3',  // Soft yellow
    Green = '#b8e6c1',   // Soft green
    Blue = '#b3d1ff',    // Soft blue
    Indigo = '#c6b3e6',  // Soft indigo
    Violet = '#e6b3d4'   // Soft violet
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