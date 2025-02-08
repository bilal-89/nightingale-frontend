// src/features/player/store/types/arrangement.arrangement.types.ts
import { SynthesisParameters } from '../../../../audio/types/audioTypes.ts';

export interface NoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis: SynthesisParameters;
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

export interface ArrangementState {
    isRecording: boolean;
    recordingStartTime: number | null;
    currentTrack: number;
    clips: Clip[];
    recordingBuffer: NoteEvent[];
    tempo: number;
    playback: PlaybackState;
    selectedNote: SelectedNote | null;
}