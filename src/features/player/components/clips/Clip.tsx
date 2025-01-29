// src/features/player/components/clips/Clip.tsx
import React from 'react';
import { Clip as ClipType } from '../../types';

interface ClipProps {
    clip: ClipType;
    isDragging?: boolean;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Clip: React.FC<ClipProps> = () => {
    return <div>Transitioning to track-based system</div>;
};

export default Clip;