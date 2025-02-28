import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsRecording } from '../../../../store/player/selectors/recording';

interface PlaybackIndicatorProps {
    position: number;
    isPlaying: boolean;
}

export const PlaybackIndicator: React.FC<PlaybackIndicatorProps> = ({
                                                                        position,
                                                                        isPlaying
                                                                    }) => {
    const isRecording = useSelector(selectIsRecording);
    const recordingStartTime = useSelector(state => state.player.recordingStartTime);
    const timelineZoom = useSelector(state => state.player.timelineZoom);
    const [recordingPosition, setRecordingPosition] = useState(0);

    useEffect(() => {
        if (!isRecording || !recordingStartTime) return;

        let lastTimestamp = performance.now();
        let animationFrame: number;

        const updatePosition = (timestamp: number) => {
            if (timestamp - lastTimestamp > 4) {
                const elapsed = Date.now() - recordingStartTime - 15;
                setRecordingPosition(prev => {
                    const target = elapsed * timelineZoom;
                    return prev + (target - prev) * 0.8;
                });
                lastTimestamp = timestamp;
            }
            animationFrame = requestAnimationFrame(updatePosition);
        };

        const initialElapsed = Date.now() - recordingStartTime - 15;
        setRecordingPosition(initialElapsed * timelineZoom);

        animationFrame = requestAnimationFrame(updatePosition);
        return () => cancelAnimationFrame(animationFrame);
    }, [isRecording, recordingStartTime, timelineZoom]);

    const currentPosition = isRecording ? recordingPosition : position;

    if (!isPlaying && !isRecording) return null;

    return (
        <div
            className={`absolute top-[31px] bottom-0 w-px pointer-events-none transform-gpu ${
                isRecording ? 'bg-red-300' : 'bg-stone-300'
            } z-20`}
            style={{
                transform: `translateX(${currentPosition}px)`,
                willChange: 'transform'
            }}
        />
    );
};