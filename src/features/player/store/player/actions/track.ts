import { createAction } from '@reduxjs/toolkit';
import { Track } from '../types';

export const setTrackSettings = createAction<{
    trackId: string;
    updates: Partial<Track>;
}>('player/setTrackSettings');

export const addTrack = createAction('player/addTrack');
export const deleteTrack = createAction<string>('player/deleteTrack');
export const setCurrentTrack = createAction<number>('player/setCurrentTrack');
