import React from 'react';
import { Play, Square, SkipBack } from 'lucide-react';
import { usePlayback } from '../../hooks';
import { formatTime } from '../../utils/time.utils';


const TransportControls: React.FC = () => {
    // Get our playback controls and state
    const {
        isPlaying,
        currentTime,
        tempo,
        play,
        stop,
        seek,
        setTempo
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
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 mb-4 px-2 items-center">
                {/* Recording button */}
                {/*<button*/}
                {/*    className={`px-4 py-2 rounded-lg transition-all duration-300*/}
                {/*        ${isRecording*/}
                {/*        ? 'bg-red-500 text-white'*/}
                {/*        : 'bg-[#e8e4dc] text-gray-700 hover:bg-[#dcd8d0]'}`}*/}
                {/*    onClick={handleRecordToggle}*/}
                {/*    style={{*/}
                {/*        boxShadow: isRecording*/}
                {/*            ? 'inset 2px 2px 4px #c41e3a, inset -2px -2px 4px #ff1a1a'*/}
                {/*            : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'*/}
                {/*    }}*/}
                {/*>*/}
                {/*    <div className="flex items-center gap-2">*/}
                {/*        <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`}/>*/}
                {/*        <span>{isRecording ? 'Stop Recording' : 'Record'}</span>*/}
                {/*    </div>*/}
                {/*</button>*/}

                {/* Playback control group */}
                <div className="flex gap-2">
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
                        className={`p-2 rounded-lg transition-all duration-300
                            ${isPlaying ? 'bg-green-500' : 'bg-[#e8e4dc]'}
                            ${isPlaying ? 'hover:bg-green-600' : 'hover:bg-[#dcd8d0]'}`}
                        onClick={handlePlayPause}
                        style={{
                            boxShadow: isPlaying
                                ? 'inset 2px 2px 4px #2f855a, inset -2px -2px 4px #48bb78'
                                : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                        }}
                    >
                        {isPlaying ? (
                            <Square className="w-5 h-5 text-white" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Time display */}
                <div className="px-4 py-2 rounded-lg bg-[#e8e4dc] font-mono">
                    {formatTime(currentTime)}
                </div>

                {/* Tempo control */}
                <div className="flex items-center gap-2 ml-4">
                    <label className="text-sm font-medium">BPM</label>
                    <input
                        type="number"
                        value={tempo}
                        onChange={(e) => setTempo(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded bg-[#e8e4dc] text-center
                                border border-transparent focus:border-blue-500 outline-none"
                        min="20"
                        max="300"
                    />
                </div>
            </div>
        </div>
    );
};

export default TransportControls;