import { NoteEvent, Track } from '../../types';
import { SchedulingConfig } from './scheduling';

export interface PlayerState {
    // Recording state
    isRecording: boolean;
    recordingStartTime: number | null;
    recordingBuffer: NoteEvent[];
    
    // Track management
    currentTrack: number;
    tracks: Track[];
    
    // Selection state
    selectedNoteId: string | null;
    selectedTrackId: string | null;
    
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
