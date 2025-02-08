// src/store/index.ts

import { configureStore, Middleware } from '@reduxjs/toolkit';
import keyboardReducer from '../features/keyboard/store/slices/keyboard.slice';
import playerReducer from '../features/player/state/slices/player.slice';
import playbackReducer from '../features/player/state/slices/playback.slice';

import { keyboardAudioMiddleware } from '../features/audio/store/middleware/keyboardAudio.middleware.ts';
import { drumAudioMiddleware } from '../features/audio/store/middleware/drumAudio.middleware';
import { playerMiddleware } from '../features/player/store/middleware/player.middleware';
import { playbackMiddleware } from '../features/player/store/middleware/playback.middleware';

// We extend our ignored actions to include our new player-related actions
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
    ],
    // Add our new player actions to ignore
    PLAYER: [
        'player/startRecording',
        'player/stopRecording',
        'player/addNoteEvent',
        'player/updatePlaybackPosition'
    ]
} as const;

// Paths that might contain non-serializable values
const IGNORED_PATHS = [
    'keyboard.audioContext',
    'arrangement.playback.scheduler',
    'player.recordingBuffer',  // Add this to ignore the recording buffer
    'playback.schedulingConfig'
] as const;

// Add our new middleware to the custom middleware array
const customMiddleware: Middleware[] = [
    keyboardAudioMiddleware,
    drumAudioMiddleware,
    // arrangementMiddleware,
    playbackMiddleware,
    playerMiddleware  // Add our new player middleware
];

export const store = configureStore({
    reducer: {
        // Keep existing reducers
        keyboard: keyboardReducer,
        // arrangement: arrangementReducer,

        // Add our new reducers
        player: playerReducer,
        playback: playbackReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    ...IGNORED_ACTIONS.KEYBOARD,
                    ...IGNORED_ACTIONS.ARRANGEMENT,
                    ...IGNORED_ACTIONS.PLAYBACK,
                    ...IGNORED_ACTIONS.PLAYER  // Include our new ignored actions
                ],
                ignoredPaths: IGNORED_PATHS
            }
        }).concat(customMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export ignored actions and paths for reuse
export { IGNORED_ACTIONS, IGNORED_PATHS };