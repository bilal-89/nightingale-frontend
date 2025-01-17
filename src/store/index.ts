import { configureStore } from '@reduxjs/toolkit';
import keyboardReducer from './slices/keyboard/keyboard.slice';
import { keyboardAudioMiddleware } from './middleware/keyboardAudio.middleware';
import { drumAudioMiddleware } from './middleware/drumAudio.middleware';

export const store = configureStore({
    reducer: {
        keyboard: keyboardReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'keyboard/initializeAudio',
                    'keyboard/noteOn',
                    'keyboard/noteOff',
                    'keyboard/cleanup',
                    'keyboard/setMode'
                ]
            }
        }).concat(keyboardAudioMiddleware)
            .concat(drumAudioMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;