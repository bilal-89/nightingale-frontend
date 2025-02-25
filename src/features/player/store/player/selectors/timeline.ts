import { RootState } from '../../../../../store';
import { createSelector } from '@reduxjs/toolkit';

export const selectTimelineSettings = createSelector(
    (state: RootState) => state.player,
    (player) => ({
        zoom: player.timelineZoom,
        snap: {
            enabled: player.snapEnabled,
            resolution: player.snapResolution,
            strength: player.snapStrength
        }
    })
);
