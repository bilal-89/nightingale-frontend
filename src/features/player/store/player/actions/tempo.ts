import { createAction } from '@reduxjs/toolkit';
import { SchedulingConfig } from '../../playback/types';

export const setTempo = createAction<number>('playback/setTempo');
export const setTotalDuration = createAction<number>('playback/setTotalDuration');
export const updateSchedulingConfig = createAction<Partial<SchedulingConfig>>('playback/updateSchedulingConfig');
export const toggleMetronome = createAction('playback/toggleMetronome');
export const toggleCountIn = createAction('playback/toggleCountIn');
export const setPrerollBars = createAction<number>('playback/setPrerollBars');
