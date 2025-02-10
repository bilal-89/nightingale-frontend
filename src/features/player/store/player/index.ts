export * from './types';
export * from './actions';
export * from './selectors';
export { default } from './slice';

// Re-export everything from the slice
export {
    startRecording,
    stopRecording,
    addNoteEvent,
    addNoteToTrack,
    moveNote,
    updateNoteEvent,
    updateNoteParameters,
    deleteNote,
    setSelectedNoteId,
    selectNote,
    commitRecordingBuffer,
    setTimelineZoom,
    setSnapSettings,
    setTempo,
    addTrack,
    deleteTrack,
    setTrackSettings,
    setCurrentTrack
} from './slice';
