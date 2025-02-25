//features/player/store/player/actions/quantize.ts
import { createAction } from '@reduxjs/toolkit';

export const setQuantizeValue = createAction<number>('player/setQuantizeValue');
export const quantizeSelectedNotes = createAction<{ division: number }>('player/quantizeSelectedNotes');