import {Track} from "./track.ts";
import {NoteEvent} from "../../../types";
import { SchedulingConfig } from './scheduling';


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

export interface PlaybackSliceState {
   isPlaying: boolean;
   currentTime: number;
   tempo: number;
   totalDuration: number;
   schedulingConfig: SchedulingConfig;
   metronomeEnabled: boolean;
   countInEnabled: boolean;
   prerollBars: number;
}
