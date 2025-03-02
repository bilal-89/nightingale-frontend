// KeyboardLayoutSwitcher.tsx
import React from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { Keyboard } from 'lucide-react';
import { toggleKeyboardLayout } from '../store/slices/keyboard.slice'; // You'll need to add this action

interface KeyboardLayoutSwitcherProps {
    className?: string;
}

export const KeyboardLayoutSwitcher: React.FC<KeyboardLayoutSwitcherProps> = ({ className = '' }) => {
    const dispatch = useAppDispatch();
    const usingFigmaLayout = useAppSelector(state => state.keyboard.usingFigmaLayout); // You'll need to add this to your state

    const handleToggleLayout = () => {
        dispatch(toggleKeyboardLayout());
    };

    return (
        <div className={`flex items-center ${className}`}>
            <button
                onClick={handleToggleLayout}
                className="p-2 rounded-lg transition-all duration-300 bg-[#e8e4dc] hover:bg-[#f0ece6]"
                style={{
                    boxShadow: '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                }}
                title={`Switch to ${usingFigmaLayout ? 'Classic' : 'New'} Keyboard Layout`}
            >
                <Keyboard className="w-4 h-4 text-[#4a4543]" />
            </button>
            <span className="ml-2 text-xs text-[#6c6661]">
        {usingFigmaLayout ? 'New' : 'Classic'} Layout
      </span>
        </div>
    );
};

export default KeyboardLayoutSwitcher;