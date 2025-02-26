import React from 'react';

interface SelectionBoxProps {
    startPoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ startPoint, currentPoint }) => {
    // Calculate precise box dimensions
    const left = Math.min(startPoint.x, currentPoint.x);
    const top = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                border: '1px solid rgba(59, 130, 246, 0.8)',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                zIndex: 1000,
                transform: 'translate3d(0, 0, 0)', // Force GPU acceleration
                willChange: 'left, top, width, height' // Optimize for animation
            }}
        />
    );
};

export default SelectionBox;