import React from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { selectIsIndependentParameterMode, toggleParameterIndependence } from '../store/slices/keyboard.slice';

interface ParameterIndependenceToggleProps {
  className?: string;
}

const ParameterIndependenceToggle: React.FC<ParameterIndependenceToggleProps> = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const isIndependentMode = useAppSelector(selectIsIndependentParameterMode);

  const handleToggle = () => {
    dispatch(toggleParameterIndependence());
  };

  // Neumorphic styles with reduced intensity - similar to other toggles
  const neumorphicStyles = {
    active: {
      filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.15))',
    },
    inactive: {
      filter: 'drop-shadow(0.5px 0.5px 1px rgba(255, 255, 255, 0.4)) drop-shadow(-0.5px -0.5px 1px rgba(0, 0, 0, 0.07))',
    },
    hover: {
      filter: 'drop-shadow(1.5px 1.5px 3px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1.5px rgba(255, 255, 255, 0.3))',
    }
  };

  return (
    <div className={`flex items-center space-x-2 pb-3 ${className}`}>
      {/* Combined parameter independence toggle */}
      <div className="relative cursor-pointer" onClick={handleToggle}>
        <svg width="90" height="42" viewBox="0 0 230 84" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{marginTop:'19px'}}>
          {/* Shared Parameters Side - Left */}
          <g 
            className="cursor-pointer transition-all duration-200"
            style={{
              transition: 'all 0.2s ease',
              ...(!isIndependentMode ? neumorphicStyles.active : neumorphicStyles.inactive),
            }}
            onMouseOver={(e) => {
              if (isIndependentMode) {
                e.currentTarget.style.filter = neumorphicStyles.hover.filter;
              }
            }}
            onMouseOut={(e) => {
              if (isIndependentMode) {
                e.currentTarget.style.filter = neumorphicStyles.inactive.filter;
              }
            }}
          >
            <path d="M97.5 20V63.5C97.5 68.4706 93.4706 72.5 88.5 72.5H52C47.0294 72.5 43 68.4706 43 63.5V20C43 15.0294 47.0294 11 52 11H88.5C93.4706 11 97.5 15.0294 97.5 20Z" fill="#EEE3D6"/>
            <path d="M2.90163 42.6725C1.14114 39.5342 1.41912 35.649 3.60846 32.7933L11.0755 23.0537C11.3581 22.6851 11.6117 22.2952 11.8341 21.8875L17.5 11.5L21.2934 6.36775C23.7311 3.06971 28.5738 2.81896 31.3391 5.84759V5.84759C34.0448 8.81097 33.4524 13.4927 30.0938 15.6887L26.4218 18.0896C24.5422 19.3186 23.1899 21.2059 22.6306 23.3809L19.6218 35.0821C19.2149 36.6641 19.2464 38.3271 19.7127 39.8927L25.2578 58.5082C25.7427 60.1361 26.6784 61.5936 27.9567 62.7121L34.4706 68.4118C36.5261 70.2103 37.0363 73.205 35.6924 75.5828V75.5828C33.6854 79.1336 28.7256 79.532 26.1776 76.347L11.9607 58.5758C11.6541 58.1926 11.3793 57.7849 11.1392 57.3568L2.90163 42.6725Z" fill="#EEE3D6"/>
          </g>
          
          {/* Independent Parameters Side - Right */}
          <g 
            className="cursor-pointer transition-all duration-200"
            style={{
              transition: 'all 0.2s ease',
              ...(isIndependentMode ? neumorphicStyles.active : neumorphicStyles.inactive),
            }}
            onMouseOver={(e) => {
              if (!isIndependentMode) {
                e.currentTarget.style.filter = neumorphicStyles.hover.filter;
              }
            }}
            onMouseOut={(e) => {
              if (!isIndependentMode) {
                e.currentTarget.style.filter = neumorphicStyles.inactive.filter;
              }
            }}
          >
            <path d="M229.5 20V63.5C229.5 68.4706 225.471 72.5 220.5 72.5H184C179.029 72.5 175 68.4706 175 63.5V20C175 15.0294 179.029 11 184 11H220.5C225.471 11 229.5 15.0294 229.5 20Z" fill="#EEE3D6"/>
            <path d="M135.598 40.8275C137.359 43.9658 137.081 47.851 134.892 50.7067L127.425 60.4463C127.142 60.8149 126.888 61.2048 126.666 61.6125L121 72L117.207 77.1322C114.769 80.4303 109.926 80.681 107.161 77.6524V77.6524C104.455 74.689 105.048 70.0073 108.406 67.8113L112.078 65.4104C113.958 64.1814 115.31 62.2941 115.869 60.1191L118.878 48.4179C119.285 46.8359 119.254 45.1729 118.787 43.6073L113.242 24.9918C112.757 23.3639 111.822 21.9064 110.543 20.7879L104.029 15.0882C101.974 13.2897 101.464 10.295 102.808 7.91724V7.91724C104.815 4.3664 109.774 3.96805 112.322 7.15304L126.539 24.9242C126.846 25.3074 127.121 25.7151 127.361 26.1432L135.598 40.8275Z" fill="#EEE3D6"/>
          </g>
        </svg>
        <span className="sr-only">
          {isIndependentMode ? "Independent Parameters Mode" : "Shared Parameters Mode"}
        </span>
      </div>
    </div>
  );
};

export default ParameterIndependenceToggle;
