//actions/loop.ts
import { createAction } from '@reduxjs/toolkit';

export const startSettingLoopPoints = createAction('playback/startSettingLoopPoints');
export const setTemporaryLoopStart = createAction<number>('playback/setTemporaryLoopStart');
export const finalizeLoopPoints = createAction<number>('playback/finalizeLoopPoints');
export const updateLoopPoints = createAction<{ start?: number; end?: number }>('playback/updateLoopPoints');
export const clearLoopPoints = createAction('playback/clearLoopPoints');
export const toggleLoopEnabled = createAction('playback/toggleLoopEnabled');
