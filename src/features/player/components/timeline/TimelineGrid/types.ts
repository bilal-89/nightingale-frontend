// src/features/player/components/timeline/TimelineGrid/types.ts

import {Track} from "../../../store/player";

export interface GridDimensions {
    TRACKS: number;
    CELLS: number;
    CELL_WIDTH: number;
    TRACK_HEIGHT: number;
    HEADER_HEIGHT: number;
    NOTE_HEIGHT: number;
}

export interface TrackRange {
    lowestNote: number;
    highestNote: number;
}

export interface TimelineSettings {
    zoom: number;
    snap: {
        enabled: boolean;
        resolution: number;
    };
}

export interface TrackHeaderProps {
    track: Track;
    index: number;
    isSelected: boolean;
    isPressedTrack: boolean;
    onMouseDown: (trackId: string) => void;
    onMouseUp: (trackId: string, index: number) => void;
    onMouseLeave: () => void;
}

export interface GridAreaProps {
    tracks: Track[];
    timelineSettings: TimelineSettings;
    trackRanges: TrackRange[];
    selectedNoteId: string | null;
    playbackPosition: number;
    isPlaying: boolean;
}

export interface TimeRulerProps {
    cellCount: number;
    cellWidth: number;
    formatGridTime: (cellIndex: number) => string;
}