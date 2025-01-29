// src/features/player/hooks/useClips.ts

import { useAppDispatch, useAppSelector } from './useStore';
import { Clip, TimePosition } from '../types';

// Temporary implementation to prevent errors during transition
export const useClips = () => {
    const dispatch = useAppDispatch();
    const clips: Clip[] = []; // Empty array for now

    return {
        clips,
        addClip: () => {},
        updateClip: () => {},
        moveClip: () => {},
        deleteClip: () => {},
        quantizeClip: () => {},
        setClipTiming: () => {}
    };
};