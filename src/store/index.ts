// src/store/index.ts

import { configureStore, Middleware } from '@reduxjs/toolkit';
import keyboardReducer from '../features/keyboard/store/slices/keyboard.slice';
import playerReducer from '../features/player/store/player';
import playbackReducer from '../features/player/store/playback';
import arrangementReducer from '../features/player/store/slices/arrangement/slice';
import audioReducer from '../features/audio/store/slice';
import audioMiddleware from '../features/audio/store/middleware';

import { playerMiddleware } from '../features/player/store/middleware/player.middleware';
import { playbackMiddleware } from '../features/player/store/middleware/playback.middleware';
import { arrangementMiddleware } from '../features/player/store/middleware/arrangement.middleware';

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
    ],
    AUDIO: [
        'audio/initializeAudio',
        'audio/cleanup',
        'audio/setContext'
    ]
} as const;

const IGNORED_PATHS = [
    'keyboard.audioContext',
    'arrangement.playback.scheduler',
    'player.recordingBuffer',
    'playback.schedulingConfig',
    'audio.context'
] as const;

// Modified existing customMiddleware array
const customMiddleware: Middleware[] = [
    audioMiddleware,  // Replace the old keyboard and drum middleware
    arrangementMiddleware,
    playbackMiddleware,
    playerMiddleware
];

export const store = configureStore({
    reducer: {
        keyboard: keyboardReducer,
        arrangement: arrangementReducer,
        player: playerReducer,
        playback: playbackReducer,
        audio: audioReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    ...IGNORED_ACTIONS.KEYBOARD,
                    ...IGNORED_ACTIONS.ARRANGEMENT,
                    ...IGNORED_ACTIONS.PLAYBACK,
                    ...IGNORED_ACTIONS.PLAYER,
                    ...IGNORED_ACTIONS.AUDIO
                ],
                ignoredPaths: IGNORED_PATHS
            }
        }).concat(customMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { IGNORED_ACTIONS, IGNORED_PATHS };