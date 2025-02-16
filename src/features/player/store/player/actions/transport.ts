import { createAction } from '@reduxjs/toolkit';

export const startPlayback = createAction('playback/startPlayback');
export const stopPlayback = createAction('playback/stopPlayback');
export const updatePlaybackPosition = createAction<number>('playback/updatePlaybackPosition');
export const setPlaybackPosition = createAction<number>('playback/setPlaybackPosition');
