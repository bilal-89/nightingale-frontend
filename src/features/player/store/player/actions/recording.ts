import { createAction } from '@reduxjs/toolkit';
import { NoteEvent } from '../../../types';

export const startRecording = createAction('player/startRecording');
export const stopRecording = createAction('player/stopRecording');
export const addNoteEvent = createAction<NoteEvent>('player/addNoteEvent');
export const updateNoteEvent = createAction<{
   id: string;
   duration: number;
}>('player/updateNoteEvent');
export const commitRecordingBuffer = createAction<string>('player/commitRecordingBuffer');
