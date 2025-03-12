import { NoteEvent } from '../../../../pages/studio/features/arrangement/types/types.ts';
import { NoteColor } from './note-color';

export interface Track {
    id: string;
    name: string;
    notes: NoteEvent[];
    color: NoteColor;
    isMuted: boolean;
    isSolo: boolean;
}
