import { RootState } from '../../../../../store';

export const selectIsRecording = (state: RootState) => state.player.isRecording;
export const selectRecordingBuffer = (state: RootState) => state.player.recordingBuffer;
