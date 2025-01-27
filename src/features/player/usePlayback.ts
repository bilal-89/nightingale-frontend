import { useAppDispatch, useAppSelector } from './useStore';
import {
    startPlayback,
    stopPlayback,
    setPlaybackPosition,
    updatePlaybackPosition,
    setTempo
} from './state/slices/playback.slice.ts';

export const usePlayback = () => {
    const dispatch = useAppDispatch();
    
    const isPlaying = useAppSelector(state => state.playback.isPlaying);
    const currentTime = useAppSelector(state => state.playback.currentTime);
    const tempo = useAppSelector(state => state.playback.tempo);
    
    return {
        // State
        isPlaying,
        currentTime,
        tempo,
        
        // Actions
        play: () => dispatch(startPlayback()),
        stop: () => dispatch(stopPlayback()),
        seek: (time: number) => dispatch(setPlaybackPosition(time)),
        updatePosition: (time: number) => dispatch(updatePlaybackPosition(time)),
        setTempo: (newTempo: number) => dispatch(setTempo(newTempo))
    };
};
