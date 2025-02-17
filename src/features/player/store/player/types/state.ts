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


//src/features/player/store/playback/types/state.ts
import { SchedulingConfig } from './scheduling';

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
