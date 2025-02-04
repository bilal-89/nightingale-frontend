import { useState } from 'react';
import { ParameterContext } from '../types/types';

export const useParameterContext = () => {
    const [activeContext, setActiveContext] = useState<ParameterContext>('keyboard');

    // Simple toggle function
    const toggleContext = () => {
        setActiveContext(current => current === 'keyboard' ? 'note' : 'keyboard');
    };

    return { activeContext, toggleContext };
};