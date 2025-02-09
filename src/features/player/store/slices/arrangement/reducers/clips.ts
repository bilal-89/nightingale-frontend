// src/features/player/store/slices/arrangement/reducers/clips.ts
import { PayloadAction } from '@reduxjs/toolkit';
import {ArrangementState, Clip, NoteColor} from '../types.ts';

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
    },

    setTrackColor: (state: ArrangementState, action: PayloadAction<{
        trackId: number;
        color: NoteColor;
    }>) => {
        console.log('Setting track color:', {
            payload: action.payload,
            currentState: state
        });

        const track = state.tracks.find(t => t.id === action.payload.trackId);
        if (track) {
            track.color = action.payload.color;

            // Update existing notes
            state.clips.forEach(clip => {
                if (clip.track === action.payload.trackId) {
                    clip.notes.forEach(note => {
                        console.log('Updating note color:', {
                            before: note.color,
                            after: action.payload.color
                        });
                        note.color = action.payload.color;
                    });
                }
            });
        }
    }

};