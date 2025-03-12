import { NoteEvent } from './noteEvent';

export interface NoteUpdatePayload extends Partial<NoteEvent> {
    // This interface now extends Partial<NoteEvent> to better match
    // how it's used in the updateNoteParameters action
} 