
import React from 'react';
import { usePlayback } from '../../hooks';
import { formatTime } from '../../utils/time.utils';
import { QuantizeButton } from './QuantizeButton';
import { AutoTuneButton } from './AutoTuneButton';
import { PlayPauseButton } from './PlayPauseButton';
import { LoopButton } from './LoopButton';
import { SkipBackButton } from './SkipBackButton';
import { RecordButton } from './RecordButton';

interface TransportControlsProps {
    // Add these props to accept recording state and handler from parent
    isRecording?: boolean;
    onRecordToggle?: () => void;
}

const TransportControls: React.FC<TransportControlsProps> = ({
                                                                 isRecording = false,
                                                                 onRecordToggle
                                                             }) => {
    // Get our playback controls and state
    const {
        isPlaying,
        currentTime,
        tempo,
        play,
        stop,
        seek,
        setTempo,
        loopEnabled,
        toggleLooping,
        loopStart,
        loopEnd
    } = usePlayback();

    // Handle play/pause
    const handlePlayPause = () => {
        if (isPlaying) {
            stop();
        } else {
            play();
        }
    };

    // Handle rewind
    const handleRewind = () => {
        seek(0);
    };

    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                {/* Record button - using props from parent */}
                {onRecordToggle && (
                    <RecordButton
                        isRecording={isRecording}
                        onClick={onRecordToggle}
                    />
                )}
                {/* Rewind button */}
                <SkipBackButton onClick={handleRewind} />

                {/* Play/Stop button */}
                <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={handlePlayPause}
                />

                {/* Loop button */}
                <LoopButton
                    loopEnabled={loopEnabled}
                    onClick={toggleLooping}
                    loopStart={loopStart}
                    loopEnd={loopEnd}
                />

                {/* Quantize and AutoTune buttons */}
                <QuantizeButton />
                <AutoTuneButton />
            </div>

            {/* Time display */}
            <div className="px-4 py-2 rounded-lg bg-[#e8e4dc] font-mono">
                {formatTime(currentTime)}
            </div>

            {/* Tempo control */}
            <div className="flex items-center space-x-2">
                {/*<label className="text-sm">BPM:</label>*/}
                <input
                    type="number"
                    value={tempo}
                    onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                    className="w-16 px-2 py-1 rounded bg-[#e8e4dc] border border-[#d1cdc4]"
                    min="20"
                    max="300"
                />
            </div>
        </div>
    );
};

export default TransportControls;