import React from 'react';
import { useAppSelector } from '../../../../../../store/hooks';
import { usePlayback } from '../../../../hooks';

// New props to check if we're setting loop points
interface LoopModeOverlayProps {
    isSettingLoopPoints?: boolean;
    loopPointBeingSet?: 'start' | 'end' | null;
}

const LoopModeOverlay: React.FC<LoopModeOverlayProps> = ({ 
    isSettingLoopPoints = false, 
    loopPointBeingSet = null 
}) => {
    const { loopEnabled, loopStart, loopEnd } = usePlayback();
    
    if (!loopEnabled) return null;
    
    // Determine if loop points have been set
    const loopPointsAreSet = loopStart !== 0 && loopEnd !== 60 * 1000;
    const bothPointsSet = loopPointsAreSet && loopStart !== loopEnd;
    
    return (
        <div className="absolute top-0 left-0 right-0 bg-blue-100 bg-opacity-50 p-2 text-sm text-center z-30">
            {isSettingLoopPoints ? (
                loopPointBeingSet === 'start' ? (
                    <p>
                        <strong>Setting Loop Points</strong> - 
                        Click to set the <span className="text-blue-600 font-bold">start</span> point of your loop region
                    </p>
                ) : loopPointBeingSet === 'end' ? (
                    <p>
                        <strong>Setting Loop Points</strong> - 
                        Now click to set the <span className="text-blue-600 font-bold">end</span> point of your loop region
                    </p>
                ) : (
                    <p><strong>Loop Mode Active</strong></p>
                )
            ) : bothPointsSet ? (
                <p><strong>Loop Mode Active</strong></p>
            ) : (
                <p>
                    <strong>Loop Mode Active</strong> - 
                    Click to place loop points
                </p>
            )}
        </div>
    );
};

export default LoopModeOverlay; 