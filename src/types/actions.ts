// src/types/actions.ts

import { Clip } from './arrangement';

export interface NoteOnAction {
    type: 'keyboard/noteOn';
    payload: number;
}

export interface NoteOffAction {
    type: 'keyboard/noteOff';
    payload: number;
}

export interface StopRecordingAction {
    type: 'arrangement/stopRecording';
}

export interface AddClipAction {
    type: 'arrangement/addClip';
    payload: Clip;
}

export interface MoveClipAction {
    type: 'arrangement/moveClip';
    payload: {
        clipId: string;
        newStartCell: number;
        newTrack?: number;
    };
}

export interface UpdateClipLengthAction {
    type: 'arrangement/updateClipLength';
    payload: {
        clipId: string;
        newLength: number;
    };
}

export type ArrangementAction =
    | NoteOnAction
    | NoteOffAction
    | StopRecordingAction
    | AddClipAction
    | MoveClipAction
    | UpdateClipLengthAction;