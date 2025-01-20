import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Square, SkipBack, SkipForward } from 'lucide-react';

const TransportControls = () => {
    const dispatch = useDispatch();
    const isPlaying = useSelector((state) => state.arrangement.playback?.isPlaying || false);
    const currentTime = useSelector((state) => state.arrangement.playback?.currentTime || 0);

    const handlePlay = useCallback(() => {
        dispatch({ type: 'arrangement/startPlayback' });
    }, [dispatch]);

    const handleStop = useCallback(() => {
        dispatch({ type: 'arrangement/stopPlayback' });
    }, [dispatch]);

    const handleRewind = useCallback(() => {
        dispatch({ type: 'arrangement/setPlaybackPosition', payload: 0 });
    }, [dispatch]);

    return (
        <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
            <button
                onClick={handleRewind}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="Rewind"
            >
                <SkipBack className="w-6 h-6" />
            </button>

            <button
                onClick={isPlaying ? handleStop : handlePlay}
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label={isPlaying ? 'Stop' : 'Play'}
            >
                {isPlaying ? (
                    <Square className="w-6 h-6" />
                ) : (
                    <Play className="w-6 h-6" />
                )}
            </button>

            <div className="ml-4 font-mono">
                {formatTime(currentTime)}
            </div>
        </div>
    );
};

// Helper function to format time in MM:SS.ms format
const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
};

export default TransportControls;