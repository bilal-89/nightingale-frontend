// Temporary type definitions to support the transition
// These match the original player state structure while we migrate

import { NoteEvent } from './noteEvent';
import { NoteColor } from '../../../../../shared/constants/colors';

// Track structure used in various player components
export interface Track {
    id: string;
    name: string;
    color: NoteColor;
    notes: NoteEvent[];
    isMuted?: boolean;
    isSolo?: boolean;
}

// Extend the existing player state
declare module '../../../../../store/hooks' {
    interface ExtendedPlayerState {
        isRecording: boolean;
        currentTrack: number;
        tracks: Track[];
    }
}

// Export the Track type for use in components
export type { Track };
