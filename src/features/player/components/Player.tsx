import React from 'react';
import { usePlayback } from '../hooks';
import { useAppDispatch, useAppSelector } from '../hooks';
import { Card } from '../../../components/ui/card';
import { Play, Square, SkipBack, Circle } from 'lucide-react';
import TimelineGrid from './timeline/components/TimelineGrid';
import { TimeDisplay } from './transport/TimeDisplay';

import { NoteInspector } from './inspector/NoteInspector';

import { startRecording, stopRecording } from '../state/slices/player.slice';

export const Player: React.FC = () => {
    const dispatch = useAppDispatch();
    const {
        isPlaying,
        currentTime,
        tempo,
        play,
        stop,
        seek,
        setTempo
    } = usePlayback();

    // Add isRecording state from our Redux store
    const isRecording = useAppSelector(state => state.player.isRecording);

    // Handle record button click
    const handleRecordToggle = () => {
        if (isRecording) {
            dispatch(stopRecording());
        } else {
            dispatch(startRecording());
        }
    };

    return (
        <Card className="p-4 bg-gradient-to-br from-[#f5f2ed] to-[#e8e4df] overflow-hidden">
            {/* Transport Controls */}
            <div className="flex gap-2 mb-4 items-center">
                {/* Record Button - Add this before the other transport controls */}
                <button
                    className={`p-2 rounded-lg transition-all duration-300
                        ${isRecording ? 'bg-red-500' : 'bg-[#e8e4dc]'}`}
                    onClick={handleRecordToggle}
                    style={{
                        boxShadow: isRecording
                            ? 'inset 2px 2px 4px #c41e3a, inset -2px -2px 4px #ff1a1a'
                            : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                    }}
                >
                    <Circle
                        className={`w-5 h-5 ${isRecording ? 'text-white animate-pulse' : 'text-red-500'}`}
                        fill={isRecording ? 'currentColor' : 'none'}
                    />
                </button>

                {/* Existing transport controls */}
                <button
                    className="p-2 rounded-lg transition-all duration-300 bg-[#e8e4dc]"
                    onClick={() => seek(0)}
                    style={{
                        boxShadow: '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                    }}
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button
                    className={`p-2 rounded-lg transition-all duration-300
                        ${isPlaying ? 'bg-green-500' : 'bg-[#e8e4dc]'}`}
                    onClick={() => isPlaying ? stop() : play()}
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

                <TimeDisplay currentTime={currentTime} />

                <div className="ml-4 flex items-center gap-2">
                    <label className="text-sm text-gray-600">Tempo:</label>
                    <input
                        type="number"
                        min="20"
                        max="300"
                        value={tempo}
                        onChange={(e) => setTempo(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded bg-[#e8e4dc] text-sm"
                    />
                    <span className="text-sm text-gray-600">BPM</span>
                </div>
            </div>

            {/* Timeline Grid */}
            <TimelineGrid />
            {/*<TransportControls />*/}
            <NoteInspector />
        </Card>
    );
};

export default Player;