// src/features/player/store/slices/arrangement/reducers/clips.ts
import { PayloadAction } from '@reduxjs/toolkit';
import type { ArrangementState, Clip } from '../types.ts';

export const clipReducers = {
    setCurrentTrack: (state: ArrangementState, action: PayloadAction<number>) => {
        state.currentTrack = action.payload;
    },

    addClip: (state: ArrangementState, action: PayloadAction<Clip>) => {
        state.clips.push(action.payload);
    },

    updateClipLength: (state: ArrangementState, action: PayloadAction<{
        id: string;
        length: number;
    }>) => {
        const clip = state.clips.find(c => c.id === action.payload.id);
        if (clip) {
            clip.length = action.payload.length;
        }
    },

    toggleClipSelection: (state: ArrangementState, action: PayloadAction<string>) => {
        const clip = state.clips.find(c => c.id === action.payload);
        if (clip) {
            clip.isSelected = !clip.isSelected;
        }
    },

    moveClip: (state: ArrangementState, action: PayloadAction<{
        id: string;
        startCell: number;
        track: number;
    }>) => {
        const clip = state.clips.find(c => c.id === action.payload.id);
        if (clip) {
            clip.startCell = action.payload.startCell;
            clip.track = action.payload.track;
        }
    },

    updateClipParameters: (state: ArrangementState, action: PayloadAction<{
        id: string;
        parameters: Partial<Clip['parameters']>;
    }>) => {
        const clip = state.clips.find(c => c.id === action.payload.id);
        if (clip) {
            clip.parameters = {
                ...clip.parameters,
                ...action.payload.parameters
            };
        }
    }
};