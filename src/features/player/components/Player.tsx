import { useCallback, memo } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { Card } from '../../../shared/components/ui/card';
import TimelineGrid from './timeline/TimelineGrid/index';
import TransportControls from './transport/TransportControls';
import { startRecording, stopRecording } from '../store/player';
import { useLoopWatcher } from '../hooks/useLoopWatcher';

export const Player = () => {
    const dispatch = useAppDispatch();
    const isRecording = useAppSelector(state => state.player.isRecording);

    // Add the loop watcher hook
    useLoopWatcher();

    // Memoized record toggle handler
    const handleRecordToggle = useCallback(() => {
        dispatch(isRecording ? stopRecording() : startRecording());
    }, [isRecording, dispatch]);

    return (
        <Card className="p-4 bg-gradient-to-br from-[#f5f2ed] to-[#e8e4df] overflow-hidden">
            <div className="flex gap-2 mb-4 items-center">
                {/* Remove the old RecordButton from here */}
                <TransportControls
                    isRecording={isRecording}
                    onRecordToggle={handleRecordToggle}
                />
            </div>

            <TimelineGrid />
        </Card>
    );
};

export default Player;