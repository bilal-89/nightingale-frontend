import {Track} from "./track.ts";
import {NoteEvent} from "../../../types";

export interface PlayerState {
   isRecording: boolean;
   recordingStartTime: number | null;
   recordingBuffer: NoteEvent[];
   currentTrack: number;
   tracks: Track[];
   selectedNoteId: string | null;
   selectedTrackId: string | null;
   tempo: number;
   timelineZoom: number;
   snapEnabled: boolean;
   snapResolution: number;
   snapStrength: number;
}
