// src/store/index.ts

import { configureStore, Middleware } from '@reduxjs/toolkit';
import keyboardReducer from './slices/keyboard/keyboard.slice';
import playerReducer from '../features/player/state/slices/player.slice';
import playbackReducer from '../features/player/state/slices/playback.slice';

// Import our new middleware instead of the old ones
import { keyboardAudioMiddleware } from './middleware/keyboardAudio.middleware.ts';
import { playbackMiddleware } from './middleware/playback.middleware';
import { playerMiddleware } from './middleware/player.middleware';

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
    PLAYER: [
        'player/startRecording',
        'player/stopRecording',
        'player/addNoteEvent',
        'player/updatePlaybackPosition'
    ]
} as const;

const IGNORED_PATHS = [
    'keyboard.audioContext',
    'arrangement.playback.scheduler',
    'player.recordingBuffer',
    'playback.schedulingConfig'
] as const;

// Replace the old middleware with our new one
const customMiddleware: Middleware[] = [
    keyboardAudioMiddleware,  // This now handles both keyboard and drum audio
    playbackMiddleware,
    playerMiddleware
];

export const store = configureStore({
    reducer: {
        keyboard: keyboardReducer,
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
                    ...IGNORED_ACTIONS.PLAYER
                ],
                ignoredPaths: IGNORED_PATHS
            }
        }).concat(customMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { IGNORED_ACTIONS, IGNORED_PATHS };