import React from 'react';
import { Play, Square, SkipBack, Repeat } from 'lucide-react';
import { usePlayback } from '../../hooks';
import { formatTime } from '../../utils/time.utils';
import { QuantizeButton } from './QuantizeButton';
import { AutoTuneButton } from './AutoTuneButton';

const TransportControls: React.FC = () => {
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
                {/* Rewind button */}
                <button
                    className="p-2 rounded-lg transition-all duration-300 bg-[#e8e4dc]
                            hover:bg-[#dcd8d0]"
                    onClick={handleRewind}
                    style={{
                        boxShadow: '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                    }}
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                {/* Play/Stop button */}
                <button
                    className={`p-2 rounded-lg transition-all duration-300 bg-[#e8e4dc]
                        ${isPlaying ? 'hover:bg-[#e8e4dc]' : 'hover:bg-[#dcd8d0]'}`}
                    onClick={handlePlayPause}
                    style={{
                        boxShadow: isPlaying
                            ? 'inset 2px 2px 4px #d1cdc4, inset -2px -2px 4px #ffffff'
                            : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                    }}
                >
                    {isPlaying ? (
                        <Square className="w-5 h-5" />
                    ) : (
                        <Play className="w-5 h-5" />
                    )}
                </button>
                
                {/* Loop button */}
                <button
                    className={`p-2 rounded-lg transition-all duration-300 
                        ${loopEnabled ? 'bg-blue-100 text-blue-600' : 'bg-[#e8e4dc] hover:bg-[#dcd8d0]'}`}
                    onClick={toggleLooping}
                    title={loopEnabled ? `Loop: ${formatTime(loopStart)} - ${formatTime(loopEnd)}` : 'Enable Loop'}
                    style={{
                        boxShadow: loopEnabled
                            ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.5)'
                            : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                    }}
                >
                    <Repeat className="w-5 h-5" />
                </button>

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
                <label className="text-sm">BPM:</label>
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