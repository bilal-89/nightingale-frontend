import { PayloadAction } from '@reduxjs/toolkit';
import { PlayerState } from '../types';
import { Clip, NoteColor } from '../../types';

export const clipReducers = {
    setCurrentTrack: (state: PlayerState, action: PayloadAction<number>) => {
        state.currentTrack = action.payload;
    },

    addClip: (state: PlayerState, action: PayloadAction<Clip>) => {
        state.clips.push(action.payload);
    },

    updateClipLength: (state: PlayerState, action: PayloadAction<{
        id: string;
        length: number;
    }>) => {
        const clip = state.clips.find(c => c.id === action.payload.id);
        if (clip) {
            clip.length = action.payload.length;
        }
    },

    toggleClipSelection: (state: PlayerState, action: PayloadAction<string>) => {
        const clip = state.clips.find(c => c.id === action.payload);
        if (clip) {
            clip.isSelected = !clip.isSelected;
        }
    },

    moveClip: (state: PlayerState, action: PayloadAction<{
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

    updateClipParameters: (state: PlayerState, action: PayloadAction<{
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

    setTrackColor: (state: PlayerState, action: PayloadAction<{
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
