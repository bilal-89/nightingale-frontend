import React from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { selectOscillatorMode, toggleOscillatorType } from '../store/slices/keyboard.slice';

interface OscillatorTypeToggleProps {
  className?: string;
}

const OscillatorTypeToggle: React.FC<OscillatorTypeToggleProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const oscillatorMode = useAppSelector(selectOscillatorMode);
  const isSingleMode = oscillatorMode === 'single';

  const handleToggle = () => {
    dispatch(toggleOscillatorType());
  };

  // Neumorphic styles with reduced intensity
  const neumorphicStyles = {
    active: {
      filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.15))',
      transform: 'scale(1.1)',
    },
    inactive: {
      filter: 'drop-shadow(0.5px 0.5px 1px rgba(255, 255, 255, 0.4)) drop-shadow(-0.5px -0.5px 1px rgba(0, 0, 0, 0.07))',
      transform: 'scale(1.1)',
    },
    hover: {
      filter: 'drop-shadow(1.5px 1.5px 3px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1.5px rgba(255, 255, 255, 0.3))',
    }
  };

  return (
    <div className={`flex items-center space-x-2 pb-3 ${className}`}>
      {/* Single oscillator mode button */}
      <div 
        onClick={() => !isSingleMode && handleToggle()}
        className="cursor-pointer transition-all duration-200 hover:z-10"
        title="Single Oscillator Mode (Classic)"
        style={{
          ...(isSingleMode ? neumorphicStyles.active : neumorphicStyles.inactive),
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          if (!isSingleMode) {
            e.currentTarget.style.filter = neumorphicStyles.hover.filter;
          }
        }}
        onMouseOut={(e) => {
          if (!isSingleMode) {
            e.currentTarget.style.filter = neumorphicStyles.inactive.filter;
          }
        }}
      >
        <svg width="35" height="25" viewBox="0 0 79 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            opacity={isSingleMode ? "1" : "0.8"} 
            d="M23.5 26.0001C23.5 32.9037 29.0964 38.5001 36 38.5001C42.9036 38.5001 48.5 32.9037 48.5 26.0001C48.5 19.0966 42.9036 13.5001 36 13.5001C29.0964 13.5001 23.5 19.0966 23.5 26.0001Z" 
            fill="#EEE3D6"
          />
        </svg>
        <span className="sr-only">Single Oscillator Mode</span>
      </div>

      {/* Multi oscillator mode button */}
      <div
        onClick={() => isSingleMode && handleToggle()}
        className="cursor-pointer transition-all duration-200 hover:z-10"
        title="Multi Oscillator Mode (Advanced)"
        style={{
          ...(!isSingleMode ? neumorphicStyles.active : neumorphicStyles.inactive),
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          if (isSingleMode) {
            e.currentTarget.style.filter = neumorphicStyles.hover.filter;
          }
        }}
        onMouseOut={(e) => {
          if (isSingleMode) {
            e.currentTarget.style.filter = neumorphicStyles.inactive.filter;
          }
        }}
      >
        <svg width="35" height="25" viewBox="0 0 79 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            opacity={!isSingleMode ? "1" : "0.8"} 
            d="M13.5 26.0001C13.5 31.799 18.201 36.5001 24 36.5001C29.799 36.5001 34.5 31.799 34.5 26.0001C34.5 20.2011 29.799 15.5001 24 15.5001C18.201 15.5001 13.5 20.2011 13.5 26.0001Z" 
            fill="#EEE3D6"
          />
          <path 
            opacity={!isSingleMode ? "1" : "0.8"} 
            d="M29.5 26.0001C29.5 31.799 34.201 36.5001 40 36.5001C45.799 36.5001 50.5 31.799 50.5 26.0001C50.5 20.2011 45.799 15.5001 40 15.5001C34.201 15.5001 29.5 20.2011 29.5 26.0001Z" 
            fill="#EEE3D6"
          />
          <path 
            opacity={!isSingleMode ? "1" : "0.8"} 
            d="M44.5 26.0001C44.5 31.799 49.201 36.5001 55 36.5001C60.799 36.5001 65.5 31.799 65.5 26.0001C65.5 20.2011 60.799 15.5001 55 15.5001C49.201 15.5001 44.5 20.2011 44.5 26.0001Z" 
            fill="#EEE3D6"
          />
        </svg>
        <span className="sr-only">Multi Oscillator Mode</span>
      </div>
    </div>
  );
};

export default OscillatorTypeToggle; 