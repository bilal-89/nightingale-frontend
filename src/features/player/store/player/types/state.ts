// features/player/store/player/types/state.ts

import {Track} from "./track";
import {NoteEvent} from "../../../types";
import {SchedulingConfig} from "../../types";

export interface PlayerState {
   isRecording: boolean;
   recordingStartTime: number | null;
   recordingBuffer: NoteEvent[];
   currentTrack: number;
   tracks: Track[];
   selectedNoteId: string | null;
   selectedTrackId: string | null;
   multiSelectedNoteIds: string[];
   tempo: number;
   timelineZoom: number;
   snapEnabled: boolean;
   snapResolution: number;
   snapStrength: number;
   playback: {
      isPlaying: boolean;
      currentTime: number;
      schedulingConfig: {
         scheduleAheadTime: number;
         schedulerInterval: number;
      };
      metronomeEnabled: boolean;
      countInEnabled: boolean;
      prerollBars: number;
   };
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
   // Loop state
   loopEnabled: boolean;
   loopStart: number;
   loopEnd: number;
}