// src/features/player/components/RecordingDebugPanel.tsx

import React from 'react';
import { useAppSelector } from '../hooks/useStore';
import { formatTime } from '../utils/time.utils';

const RecordingDebugPanel: React.FC = () => {
    // Get all the state we want to monitor
    const isRecording = useAppSelector(state => state.player.isRecording);
    const recordingBuffer = useAppSelector(state => state.player.recordingBuffer);
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const clips = useAppSelector(state => state.player.clips);

    return (
        <div className="p-3 bg-white/50 backdrop-blur-sm rounded-lg text-sm">
            <h3 className="font-medium mb-2">Recording Monitor</h3>
            <div className="space-y-2 font-mono text-xs">
                {/* Recording state */}
                <div>
                    Recording: {isRecording ? '🔴 Active' : '⚪ Stopped'}
                </div>

                {/* Current track */}
                <div>
                    Current Track: {currentTrack + 1}
                </div>

                {/* Recording buffer */}
                <div>
                    Buffer Size: {recordingBuffer.length} notes
                    {recordingBuffer.length > 0 && (
                        <div className="pl-4 mt-1">
                            Last Note: {
                            recordingBuffer[recordingBuffer.length - 1].note
                        } @ {
                            formatTime(recordingBuffer[recordingBuffer.length - 1].timestamp / 1000)
                        }
                        </div>
                    )}
                </div>

                {/* Clips information */}
                <div>
                    Total Clips: {clips.length}
                    {clips.length > 0 && (
                        <div className="pl-4 mt-1">
                            Latest Clip: {clips[clips.length - 1].notes.length} notes on track {
                            clips[clips.length - 1].track + 1
                        }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecordingDebugPanel;