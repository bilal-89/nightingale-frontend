// src/features/player/store/types.ts

import { NoteColor } from '../../../../../shared/constants/colors.ts';
import { SynthesisParameters } from '../../../../audio/api/types.ts';

export interface NoteEvent {
    id: string;
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis: SynthesisParameters;
    color?: string;  // Add color support to notes

}

export interface Track {
    id: string;
    name: string;
    notes: NoteEvent[];
    // color: NoteColor;
    color: string;  // Using string to support both hex and NoteColor enum

    isMuted: boolean;
    isSolo: boolean;
}

export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    loopRegion?: {
        start: number;
        end: number;
    };
}

export interface PlayerState {
    isRecording: boolean;
    recordingStartTime: number | null;
    recordingBuffer: NoteEvent[];
    currentTrack: number;
    tracks: Track[];
    selectedNoteId: string | null;
    selectedTrackId: string | null;
    multiSelectedNoteIds: string[];
    tempo: number;
    timelineZoom: number;
    snapEnabled: boolean;
    snapResolution: number;
    snapStrength: number;
    playback: PlaybackState;
}

export interface TrackSettings {
    name?: string;
    color?: NoteColor;
    isMuted?: boolean;
    isSolo?: boolean;
}

export interface SelectedNote {
    trackId: string;
    noteId: string;
}

export type NoteUpdatePayload = {
    trackId: string;
    noteId: string;
    updates: Partial<NoteEvent>;
};

export type TrackUpdatePayload = {
    trackId: string;
    updates: Partial<Track>;
};