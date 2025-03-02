import React from 'react';
import TunableKeyboard from '../components/TunableKeyboard';

const KeyboardWorkspace: React.FC = () => {
    return (
        // Remove all background colors and shadows
        <div className="rounded-[19px] p-4 bg-transparent max-h-[500px] max-w-[900px] mx-auto">
            {/* Remove neumorphic styling */}
            <div className="rounded-[39px] p-0">
                <TunableKeyboard />
            </div>
        </div>
    );
};

export default KeyboardWorkspace;

