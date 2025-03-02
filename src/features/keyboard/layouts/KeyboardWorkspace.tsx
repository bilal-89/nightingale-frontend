import React from 'react';
import TunableKeyboard from '../components/TunableKeyboard';

const KeyboardWorkspace: React.FC = () => {
    return (
        // Add max-width constraint to prevent excessive width
        <div className="rounded-[19px] p-4 bg-[#e5e9ec] max-h-[500px] max-w-[900px] mx-auto">
            {/* Keyboard section with neumorphic styling */}
            <div className="rounded-[39px] p-0"
                 style={{
                     boxShadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff'
                 }}>
                <TunableKeyboard />
            </div>
        </div>
    );
};

export default KeyboardWorkspace;

