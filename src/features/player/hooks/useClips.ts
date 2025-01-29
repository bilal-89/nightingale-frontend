// src/features/player/hooks/useClips.ts

import { useAppDispatch, useAppSelector } from './useStore';
import { Clip, TimePosition, TimingUpdate, QuantizeSettings } from '../types';
import {
    addClip,
    updateClip,
    moveClip,
    deleteClip,
    quantizeClip,
    setClipTiming
} from '../state/slices/player.slice';

export const useClips = () => {
    const dispatch = useAppDispatch();
    const clips = useAppSelector(state => state.player.clips);

    return {
        // State
        clips,

        // Actions
        addClip: (clip: Clip) =>
            dispatch(addClip(clip)),

        updateClip: (id: string, updates: Partial<Clip>) =>
            dispatch(updateClip({ id, updates })),

        moveClip: (id: string, position: TimePosition) =>
            dispatch(moveClip({ id, position })),

        deleteClip: (id: string) =>
            dispatch(deleteClip(id)),

        quantizeClip: (id: string, settings: QuantizeSettings) =>
            dispatch(quantizeClip({ id, settings })),

        setClipTiming: (id: string, timing: TimingUpdate) =>
            dispatch(setClipTiming({ id, timing }))
    };
};