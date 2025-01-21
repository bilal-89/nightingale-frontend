import React from 'react';
import TunableKeyboard from '../../../features/keyboard/components/TunableKeyboard';
import ParameterPanel from '../../../features/parameters/components/ParameterPanel';

const KeyboardWorkspace: React.FC = () => {
    return (
        // Using a flex container to create a side-by-side layout
        <div className="flex flex-col lg:flex-row gap-8 p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Keyboard section takes up more space */}
            <div className="flex-1">
                <TunableKeyboard />
            </div>

            {/* Parameter panel has a fixed width */}
            <div className="w-full lg:w-96 flex-shrink-0">
                <ParameterPanel />
            </div>
        </div>
    );
};

export default KeyboardWorkspace;