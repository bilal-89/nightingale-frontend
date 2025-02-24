import React from 'react';

interface SelectionBoxProps {
    startPoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
}

const SelectionBox: React.FC<SelectionBoxProps> = ({ startPoint, currentPoint }) => {
    // Calculate box dimensions
    const left = Math.min(startPoint.x, currentPoint.x);
    const top = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    return (
        <div
            className="absolute pointer-events-none border border-blue-500 bg-blue-100 bg-opacity-20"
            style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                zIndex: 1000
            }}
        />
    );
};

export default SelectionBox;