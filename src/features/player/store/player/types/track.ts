export interface Track {
   id: string;
   name: string;
   notes: NoteEvent[];
   color: string;
   isMuted: boolean;
   isSolo: boolean;
}
