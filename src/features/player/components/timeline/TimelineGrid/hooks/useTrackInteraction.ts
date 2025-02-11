// src/features/player/components/timeline/TimelineGrid/hooks/useTrackInteraction.ts

import { useCallback, useState } from 'react';
import { useAppDispatch } from '../../../../hooks';
import { setCurrentTrack } from '../../../../store/player';

export function useTrackInteraction() {
    const dispatch = useAppDispatch();
    const [pressedTrackId, setPressedTrackId] = useState<string | null>(null);

    const handleTrackSelect = useCallback((trackIndex: number) => {
        dispatch(setCurrentTrack(trackIndex));
    }, [dispatch]);

    const handleTrackMouseDown = useCallback((trackId: string) => {
        setPressedTrackId(trackId);
    }, []);

    const handleTrackMouseUp = useCallback((trackId: string, index: number) => {
        if (pressedTrackId === trackId) {
            handleTrackSelect(index);
        }
        setPressedTrackId(null);
    }, [pressedTrackId, handleTrackSelect]);

    const handleTrackMouseLeave = useCallback(() => {
        setPressedTrackId(null);
    }, []);

    return {
        pressedTrackId,
        handleTrackMouseDown,
        handleTrackMouseUp,
        handleTrackMouseLeave
    };
}