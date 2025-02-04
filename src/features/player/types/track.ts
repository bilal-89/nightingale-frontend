// src/features/player/types/track.ts
import { NoteEvent } from './note';

export interface Track {
    id: string;
    name: string;
    notes: NoteEvent[];
    color: string;
    isMuted: boolean;
    isSolo: boolean;
}
