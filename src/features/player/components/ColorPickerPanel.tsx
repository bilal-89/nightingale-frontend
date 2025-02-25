// src/features/player/components/ColorPickerPanel.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NoteColor } from '../store/slices/arrangement/types';
import { ColorStrip } from '../../../shared/components/ui/ColorStrip';
import { RootState } from '../../../store';
import { setTrackSettings } from '../store/player';


export const ColorPickerPanel: React.FC = () => {
    const dispatch = useDispatch();
    const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
    const tracks = useSelector((state: RootState) => state.player.tracks);

    const currentTrackData = tracks[currentTrack];

    const handleColorSelect = (color: NoteColor) => {
        if (currentTrackData) {
            dispatch(setTrackSettings({
                trackId: currentTrackData.id,
                updates: { color }
            }));
        }
    };

    if (!currentTrackData) return null;

    return (
        <div className="fixed right-4 top-4">
            <ColorStrip
                selectedColor={currentTrackData.color}
                onColorSelect={handleColorSelect}
            />
        </div>
    );
};