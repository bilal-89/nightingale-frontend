import { useAppDispatch, useAppSelector } from './useStore';
import { Clip } from '../types';
import {
    addClip,
    updateClip,
    moveClip,
    deleteClip
} from '../state/slices/player.slice';

export const useClips = () => {
    const dispatch = useAppDispatch();
    const clips = useAppSelector(state => state.player.clips);
    
    return {
        // State
        clips,
        
        // Actions
        addClip: (clip: Clip) => dispatch(addClip(clip)),
        updateClip: (id: string, updates: Partial<Clip>) => 
            dispatch(updateClip({ id, updates })),
        moveClip: (id: string, position: { track: number; cell: number }) =>
            dispatch(moveClip({ id, position })),
        deleteClip: (id: string) => dispatch(deleteClip(id))
    };
};
