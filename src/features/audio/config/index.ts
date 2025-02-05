export const AUDIO_CONFIG = {
    USE_NEW_AUDIO_SYSTEM: true,  // Set to true to use new system
    DEBUG: true,  // Keep debug logs on to see what's happening
    AUDIO_SETTINGS: {
        sampleRate: 48000,
        latencyHint: 'interactive' as AudioContextLatencyCategory
    }
};
