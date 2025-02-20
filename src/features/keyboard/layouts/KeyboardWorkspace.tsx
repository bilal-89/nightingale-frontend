import React from 'react';
import TunableKeyboard from '../../../features/keyboard/components/TunableKeyboard';
import ParameterPanel from '../../../features/parameters/components/ParameterPanel';

const KeyboardWorkspace: React.FC = () => {
    return (
        // Use the same soft background color as in ParameterPanel
        <div className="flex flex-col lg:flex-row gap-5 rounded-[19px] p-5 min-h-screen bg-[#e5e9ec]">
            {/* Keyboard section with neumorphic styling */}
            <div className="flex-1 rounded-[19px] p-7"
                 style={{
                     boxShadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff'
                 }}>
                <TunableKeyboard />
            </div>

            {/* Parameter panel container with matching neumorphic styling */}
            <div className="w-full lg:w-64 flex-shrink-0 rounded-3xl p-3" // Reduced from w-96 to w-64
                 style={{
                     boxShadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff'
                 }}>
                <ParameterPanel />
            </div>
        </div>
    );
};

export default KeyboardWorkspace;