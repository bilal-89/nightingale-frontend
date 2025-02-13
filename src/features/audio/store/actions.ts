// src/features/audio/store/actions.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import {
    initializeAudio,
    setContext,
    cleanup,
    setMode,
    setKeyParameter
} from './slice';
import keyboardAudioManager from '../engine/synthesis/keyboardEngine';
import { drumSoundManager } from '../engine/synthesis/drumEngine';

// Add this action creator
export const initializeAudioContext = () => ({
    type: 'keyboard/initializeAudio' as const
});
// Initialize audio system
export const initializeAudioSystem = createAsyncThunk(
    'audio/initializeSystem',
    async (_, { dispatch }) => {
        try {
            const context = await keyboardAudioManager.initialize();
            await drumSoundManager.initialize();
            dispatch(initializeAudio());
            dispatch(setContext(context));
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            throw error;
        }
    }
);

// Clean up audio system
export const cleanupAudioSystem = createAsyncThunk(
    'audio/cleanupSystem',
    async (_, { dispatch }) => {
        try {
            keyboardAudioManager.cleanup();
            drumSoundManager.cleanup();
            dispatch(cleanup());
        } catch (error) {
            console.error('Failed to cleanup audio system:', error);
            throw error;
        }
    }
);

// Play note with current parameters
export const playNote = createAsyncThunk(
    'audio/playNote',
    async (note: number, { getState }) => {
        const state = getState() as RootState;
        const mode = state.audio.mode;

        if (mode === 'drums') {
            drumSoundManager.playDrumSound(note);
        } else {
            return await keyboardAudioManager.playNote(note);
        }
    }
);

// Stop note
export const stopNote = createAsyncThunk(
    'audio/stopNote',
    async (note: number, { getState }) => {
        const state = getState() as RootState;
        if (state.audio.mode !== 'drums') {
            keyboardAudioManager.stopNote(note);
        }
    }
);

// Switch audio mode with cleanup
export const switchAudioMode = createAsyncThunk(
    'audio/switchMode',
    async (newMode: 'tunable' | 'drums', { dispatch, getState }) => {
        const state = getState() as RootState;
        const activeNotes = state.keyboard.activeNotes;

        // Stop any playing notes before mode switch
        if (state.audio.mode !== 'drums') {
            activeNotes.forEach(note => keyboardAudioManager.stopNote(note));
        }

        keyboardAudioManager.setMode(newMode);
        dispatch(setMode(newMode));
    }
);

// Update note parameter with both state and audio engine
export const updateNoteParameter = createAsyncThunk(
    'audio/updateParameter',
    async (
        { note, parameter, value }: { note: number; parameter: string; value: number },
        { dispatch, getState }
    ) => {
        const state = getState() as RootState;
        if (state.audio.mode === 'drums') return;

        // Update audio engine
        keyboardAudioManager.setNoteParameter(note, parameter, value);

        // Update state
        dispatch(setKeyParameter({ keyNumber: note, parameter, value }));
    }
);

// Utility function for scheduling note playback at specific time
export const scheduleNote = createAsyncThunk(
    'audio/scheduleNote',
    async (
        { note, time, duration }: { note: number; time: number; duration: number },
        { getState }
    ) => {
        const state = getState() as RootState;
        const mode = state.audio.mode;

        if (mode === 'drums') {
            drumSoundManager.playDrumSoundAt(note, time);
        } else {
            // Get current parameters and schedule note with them
            const parameters = state.audio.keyParameters[note] || {};
            await keyboardAudioManager.playExactNote(
                {
                    note,
                    timestamp: time,
                    velocity: parameters.velocity ?? 100,
                    duration,
                    synthesis: keyboardAudioManager.getCurrentSynthesis(note)
                },
                time
            );
        }
    }
);