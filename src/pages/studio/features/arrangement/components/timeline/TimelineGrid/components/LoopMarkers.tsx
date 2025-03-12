import React, { useRef, useCallback, useState, useEffect } from 'react';
import { usePlayback } from '../../../../hooks';

interface LoopMarkersProps {
    timelineZoom: number;  // Pixels per millisecond
}

export const LoopMarkers: React.FC<LoopMarkersProps> = ({ timelineZoom }) => {
    const { loopEnabled, loopStart, loopEnd, updateLoopStart, updateLoopEnd } = usePlayback();

    // State for visual position (for smoother dragging)
    const [visualStartPosition, setVisualStartPosition] = useState(0);
    const [visualEndPosition, setVisualEndPosition] = useState(0);
    
    // Track actual time values during drag operations
    const actualStartTimeRef = useRef(0);
    const actualEndTimeRef = useRef(60000);

    // Update visual positions when Redux values change
    useEffect(() => {
        if (loopEnabled) {
            // Ensure we have valid numeric values
            const validStart = typeof loopStart === 'number' ? loopStart : 0;
            const validEnd = typeof loopEnd === 'number' ? loopEnd : 60000;

            // Store actual time values
            actualStartTimeRef.current = validStart;
            actualEndTimeRef.current = validEnd;

            // Calculate pixel positions precisely
            const startPos = Math.round(validStart * timelineZoom);
            const endPos = Math.round(validEnd * timelineZoom);

            // Only update visual positions if not currently dragging
            if (!isDraggingStartRef.current && !isDraggingEndRef.current) {
                setVisualStartPosition(startPos);
                setVisualEndPosition(endPos);
            }
        }
    }, [loopStart, loopEnd, timelineZoom, loopEnabled]);

    // Refs for drag handling
    const isDraggingStartRef = useRef(false);
    const isDraggingEndRef = useRef(false);
    const initialClientXRef = useRef(0);
    const initialPositionRef = useRef(0);

    // Start drag operations
    const handleStartMarkerMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        isDraggingStartRef.current = true;
        initialClientXRef.current = e.clientX;
        initialPositionRef.current = visualStartPosition;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [visualStartPosition]);

    const handleEndMarkerMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        isDraggingEndRef.current = true;
        initialClientXRef.current = e.clientX;
        initialPositionRef.current = visualEndPosition;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [visualEndPosition]);

    // Handle mouse movement during drag
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const deltaX = e.clientX - initialClientXRef.current;
        
        if (isDraggingStartRef.current) {
            // Calculate new visual position
            const newVisualPos = Math.max(0, initialPositionRef.current + deltaX);
            
            // Ensure start doesn't go beyond end minus minimum gap
            const minGapInPixels = 100 * timelineZoom;
            const maxStartPos = visualEndPosition - minGapInPixels;
            
            const clampedVisualPos = Math.min(newVisualPos, maxStartPos);
            setVisualStartPosition(clampedVisualPos);
            
            // Update actual time value (but don't dispatch to Redux yet)
            actualStartTimeRef.current = clampedVisualPos / timelineZoom;
            
        } else if (isDraggingEndRef.current) {
            // Calculate new visual position
            const newVisualPos = Math.max(0, initialPositionRef.current + deltaX);
            
            // Ensure end doesn't go before start plus minimum gap
            const minGapInPixels = 100 * timelineZoom;
            const minEndPos = visualStartPosition + minGapInPixels;
            
            const clampedVisualPos = Math.max(newVisualPos, minEndPos);
            setVisualEndPosition(clampedVisualPos);
            
            // Update actual time value (but don't dispatch to Redux yet)
            actualEndTimeRef.current = clampedVisualPos / timelineZoom;
        }
    }, [timelineZoom, visualStartPosition, visualEndPosition]);

    // End drag operations
    const handleMouseUp = useCallback(() => {
        // Only update Redux state when drag is complete
        if (isDraggingStartRef.current) {
            updateLoopStart(Math.round(actualStartTimeRef.current));
        } else if (isDraggingEndRef.current) {
            updateLoopEnd(Math.round(actualEndTimeRef.current));
        }
        
        // Reset drag state
        isDraggingStartRef.current = false;
        isDraggingEndRef.current = false;

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [updateLoopStart, updateLoopEnd, handleMouseMove]);

    // Ensure no loop points are shown if they haven't been explicitly set
    const shouldShowMarkers = useCallback(() => {
        // If loop isn't enabled, don't show markers
        if (!loopEnabled) return false;
        
        // If start and end points are both at explicit values, show markers
        return !(loopStart === 0 && loopEnd === 60 * 1000);
    }, [loopEnabled, loopStart, loopEnd]);
    
    if (!shouldShowMarkers()) return null;

    // Check if both loop points have been set (and they're different)
    const bothLoopPointsSet = loopStart !== loopEnd && 
                              loopStart !== 0 && 
                              loopEnd !== 60000;

    return (
        <>
            {/* Loop region - subtle background between markers */}
            {bothLoopPointsSet && (
                <div
                    className="absolute top-[31px] bottom-[48px] z-5 pointer-events-none"
                    style={{
                        left: `${visualStartPosition}px`,
                        width: `${visualEndPosition - visualStartPosition}px`,
                        backgroundColor: 'rgba(59, 130, 246, 0.03)'
                    }}
                />
            )}

            {/* Loop start marker - thin line like playback indicator */}
            <div
                className="absolute top-[31px] bottom-[48px] w-px pointer-events-none z-20"
                style={{
                    left: `${visualStartPosition}px`,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    transform: 'translateZ(0)', // Force GPU acceleration
                    willChange: 'left' // Optimize for animation
                }}
            >
                {/* Invisible wider area for click/drag target */}
                <div 
                    className="absolute inset-0 w-[11px] cursor-ew-resize pointer-events-auto" 
                    style={{ left: '-5px' }}
                    onMouseDown={handleStartMarkerMouseDown}
                />
            </div>

            {/* Loop end marker - thin line like playback indicator */}
            {bothLoopPointsSet && (
                <div
                    className="absolute top-[31px] bottom-[48px] w-px pointer-events-none z-20"
                    style={{
                        left: `${visualEndPosition}px`,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        transform: 'translateZ(0)', // Force GPU acceleration
                        willChange: 'left' // Optimize for animation
                    }}
                >
                    {/* Invisible wider area for click/drag target */}
                    <div 
                        className="absolute inset-0 w-[11px] cursor-ew-resize pointer-events-auto" 
                        style={{ left: '-5px' }}
                        onMouseDown={handleEndMarkerMouseDown}
                    />
                </div>
            )}
        </>
    );
};