// src/store/index.ts

import { configureStore, Middleware } from '@reduxjs/toolkit';
import keyboardReducer from './slices/keyboard/keyboard.slice';
import arrangementReducer from './slices/arrangement/arrangement.slice';
import { keyboardAudioMiddleware } from './middleware/keyboardAudio.middleware';
import { drumAudioMiddleware } from './middleware/drumAudio.middleware';
import { arrangementMiddleware } from './middleware/arrangement.middleware';
import { playbackMiddleware } from './middleware/playback.middleware';

// Action types that should be ignored in serializable checks
const IGNORED_ACTIONS = {
    KEYBOARD: [
        'keyboard/initializeAudio',
        'keyboard/noteOn',
        'keyboard/noteOff',
        'keyboard/cleanup',
        'keyboard/setMode'
    ],
    ARRANGEMENT: [
        'arrangement/startRecording',
        'arrangement/stopRecording'
    ],
    PLAYBACK: [
        'arrangement/startPlayback',
        'arrangement/stopPlayback',
        'arrangement/updatePlaybackPosition',
        'arrangement/setPlaybackPosition'
    ]
} as const;

// Paths that might contain non-serializable values
const IGNORED_PATHS = [
    'keyboard.audioContext',
    'arrangement.playback.scheduler'
] as const;

// Custom middleware array with proper typing
const customMiddleware: Middleware[] = [
    keyboardAudioMiddleware,
    drumAudioMiddleware,
    arrangementMiddleware,
    playbackMiddleware
];

export const store = configureStore({
    reducer: {
        keyboard: keyboardReducer,
        arrangement: arrangementReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    ...IGNORED_ACTIONS.KEYBOARD,
                    ...IGNORED_ACTIONS.ARRANGEMENT,
                    ...IGNORED_ACTIONS.PLAYBACK
                ],
                // ignoredPaths: IGNORED_PATHS
            }
        }).concat(customMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export ignored actions and paths for reuse
export { IGNORED_ACTIONS, IGNORED_PATHS };