// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import keyboardReducer from './slices/keyboard/keyboard.slice';
import arrangementReducer from './slices/arrangement/arrangement.slice';
import { keyboardAudioMiddleware } from './middleware/keyboardAudio.middleware';
import { drumAudioMiddleware } from './middleware/drumAudio.middleware';
import { arrangementMiddleware } from './middleware/arrangement.middleware';
import { playbackMiddleware } from './middleware/playback.middleware';

export const store = configureStore({
    reducer: {
        keyboard: keyboardReducer,
        arrangement: arrangementReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    // Keyboard actions
                    'keyboard/initializeAudio',
                    'keyboard/noteOn',
                    'keyboard/noteOff',
                    'keyboard/cleanup',
                    'keyboard/setMode',
                    // Arrangement actions
                    'arrangement/startRecording',
                    'arrangement/stopRecording',
                    // Playback actions
                    'arrangement/startPlayback',
                    'arrangement/stopPlayback',
                    'arrangement/updatePlaybackPosition',
                    'arrangement/setPlaybackPosition'
                ],
                // Add paths that might contain non-serializable values
                ignoredPaths: [
                    'keyboard.audioContext',
                    'arrangement.playback.scheduler'
                ]
            }
        })
            // Keep existing middleware order
            .concat(keyboardAudioMiddleware)
            .concat(drumAudioMiddleware)
            .concat(arrangementMiddleware)
            // Add playback middleware at the end
            .concat(playbackMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;