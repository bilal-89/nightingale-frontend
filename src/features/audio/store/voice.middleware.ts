import { Middleware } from '@reduxjs/toolkit';
import { audioServices } from '../services';
import { RootState } from '../../../store';

export const voiceMiddleware: Middleware<{}, RootState> = store => next => action => {
    const result = next(action);
    
    try {
        switch (action.type) {
            case 'audio/initialized': {
                audioServices.initialize();
                break;
            }
            
            case 'audio/cleanup': {
                audioServices.cleanup();
                break;
            }
        }
    } catch (error) {
        console.error('Error in voice middleware:', error);
    }

    return result;
};

export default voiceMiddleware;
