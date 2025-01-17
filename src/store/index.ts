// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import keyboardReducer from './slices/keyboard/keyboard.slice';
import birdsongReducer from './slices/birdsong/birdsong.slice';
import { keyboardAudioMiddleware } from './middleware/keyboardAudio.middleware';
import { birdsongAudioMiddleware } from './middleware/birdsongAudio.middleware';

export const store = configureStore({
    reducer: {
        keyboard: keyboardReducer,
        birdsong: birdsongReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore keyboard and birdsong actions that might contain non-serializable data
                ignoredActions: [
                    'keyboard/initializeAudio',
                    'keyboard/noteOn',
                    'keyboard/noteOff',
                    'keyboard/cleanup',
                    'birdsong/initialize',
                    'birdsong/noteOn',
                    'birdsong/noteOff',
                    'birdsong/updateParameters'
                ]
            }
        }).concat(keyboardAudioMiddleware)
            .concat(birdsongAudioMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;