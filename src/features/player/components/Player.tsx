import { useCallback, memo } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { Card } from '../../../shared/components/ui/card';
import { Circle } from 'lucide-react';
import TimelineGrid from './timeline/TimelineGrid/index';
import TransportControls from './transport/TransportControls';
import { startRecording, stopRecording } from '../store/player';

import { ColorPickerPanel } from './ColorPickerPanel';

// Memoized Record Button Component
const RecordButton = memo(({ isRecording, onRecordToggle }) => (
    <button
        className={`p-2 rounded-lg transition-all duration-300 ${
            isRecording ? 'bg-red-500' : 'bg-[#e8e4dc]'
        }`}
        onClick={onRecordToggle}
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
));

export const Player = () => {
    const dispatch = useAppDispatch();
    const isRecording = useAppSelector(state => state.player.isRecording);

    // Memoized record toggle handler
    const handleRecordToggle = useCallback(() => {
        dispatch(isRecording ? stopRecording() : startRecording());
    }, [isRecording, dispatch]);

    return (
        <Card className="p-4 bg-gradient-to-br from-[#f5f2ed] to-[#e8e4df] overflow-hidden">
            <div className="flex gap-2 mb-4 items-center">
                <RecordButton
                    isRecording={isRecording}
                    onRecordToggle={handleRecordToggle}
                />
                <TransportControls />
            </div>

            <TimelineGrid />
            <ColorPickerPanel/>

        </Card>
    );
};

export default Player;