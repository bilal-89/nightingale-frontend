import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  selectEditableWaveform,
  selectIsHarmonicPanelVisible,
  toggleHarmonicPanel
} from '../../keyboard/store/slices/keyboard.slice';
import { useHarmonicValues } from '../hooks/useHarmonicValues';
import { NoteColor } from '../../../shared/constants/colors';

// Define the SVG path for the container shape (matching ParameterPanel)
const HARMONICS_PANEL_PATH = "M0 39.8046V31C0 13.8792 13.8792 0 31 0H58.6091H174.829H202.713C219.834 0 233.713 13.8792 233.713 31V39.8046V108.59V222.729V336.868V405.654L234.074 418.101C234.581 435.567 220.56 450 203.087 450H176.591H65.3636H31C13.8792 450 0 436.121 0 419V405.654V336.868V222.729V108.59V39.8046Z";

/**
 * A slider specifically for harmonic amplitudes
 */
const HarmonicSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  trackColor?: string;
}> = ({ value, onChange, trackColor = NoteColor.Green }) => {
  // Track if we're currently dragging to bypass animation
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate slider width as percentage
  const percentage = value;
  const sliderWidth = Math.max(6, isDragging ? percentage : percentage);
  
  // Hidden range input ref for native-like dragging
  const rangeInputRef = React.useRef<HTMLInputElement>(null);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  
  // Handle change from the hidden range input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  
  // Handle mouse down on the visible slider
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    if (rangeInputRef.current && sliderRef.current) {
      // Set dragging state to true for immediate updates
      setIsDragging(true);
      
      // Calculate the value based on click position
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const newValue = Math.round(percentage);
      const boundedValue = Math.max(0, Math.min(100, newValue));
      
      // Set the range input value and trigger change
      rangeInputRef.current.value = boundedValue.toString();
      onChange(boundedValue);
      
      // Add mousemove listener for real-time updates during drag
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (sliderRef.current) {
          const rect = sliderRef.current.getBoundingClientRect();
          const x = moveEvent.clientX - rect.left;
          const percentage = (x / rect.width) * 100;
          const newValue = Math.round(percentage);
          const boundedValue = Math.max(0, Math.min(100, newValue));
          
          // Only update if value has changed by at least 1
          if (Math.abs(boundedValue - value) >= 1) {
            // Update input value and trigger change in real-time
            if (rangeInputRef.current) {
              rangeInputRef.current.value = boundedValue.toString();
              onChange(boundedValue);
            }
          }
        }
      };
      
      // Add mouseup listener to clean up
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setIsDragging(false);
      };
      
      // Add document-level event listeners for drag
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
  // Handle the end of dragging
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('mouseleave', handleDragEnd);
  }, []);
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('mouseleave', handleDragEnd);
    };
  }, [handleDragEnd]);

  return (
    <div className="mb-8">
      {/* Slider container with hidden range input */}
      <div
        ref={sliderRef}
        className="relative h-3 cursor-pointer"
        onMouseDown={handleSliderMouseDown}
        style={{ touchAction: 'none' }}
      >
        {/* Hidden native range input for fluid dragging */}
        <input
          ref={rangeInputRef}
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ cursor: 'pointer' }}
        />
        
        {/* SVG Slider container with proper styling */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            width: `${sliderWidth}%`,
            transition: isDragging ? 'none' : 'width 150ms ease-out'
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${Math.max(6, sliderWidth * 1.07)} 6`}
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transition: isDragging ? 'none' : 'all 150ms ease-out' }}
          >
            <path
              d={`M${Math.max(6, sliderWidth * 1.07) - 3} 0H3C1.34315 0 0 1.34315 0 3C0 4.65685 1.34315 6 3 6H${Math.max(6, sliderWidth * 1.07) - 3}C${Math.max(6, sliderWidth * 1.07) - 3 + 1.65685} 6 ${Math.max(6, sliderWidth * 1.07)} 4.65685 ${Math.max(6, sliderWidth * 1.07)} 3C${Math.max(6, sliderWidth * 1.07)} 1.34315 ${Math.max(6, sliderWidth * 1.07) - 3 + 1.65685} 0 ${Math.max(6, sliderWidth * 1.07) - 3} 0Z`}
              fill={trackColor}
              fillOpacity="0.45"
              style={{ transition: isDragging ? 'none' : 'all 150ms ease-out' }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculates a waveform value based on type and phase
 */
const calculateWaveformValue = (
  type: 'sine' | 'square' | 'sawtooth' | 'triangle',
  phase: number
): number => {
  switch (type) {
    case 'sine':
      return Math.sin(phase);
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1;
    case 'sawtooth':
      return 2 * ((phase / (2 * Math.PI)) - Math.floor(0.5 + (phase / (2 * Math.PI))));
    case 'triangle':
      return 2 * Math.abs(2 * ((phase / (2 * Math.PI)) - Math.floor(0.5 + (phase / (2 * Math.PI))))) - 1;
    default:
      return Math.sin(phase);
  }
};

// Custom waveform visualization that uses track color
const CustomWaveformVisualization: React.FC<{
  harmonics: number[];
  waveformType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  width: number;
  height: number;
  trackColor: string;
}> = ({ harmonics, waveformType, width, height, trackColor }) => {
  // Calculate points for the waveform path
  const points = React.useMemo(() => {
    const resolution = 100;
    const points: [number, number][] = [];
    
    // Sample a complete cycle
    for (let i = 0; i < resolution; i++) {
      const x = (i / resolution) * 2 * Math.PI;
      let y = 0;
      
      // Sum all harmonic contributions
      for (let h = 0; h < harmonics.length; h++) {
        if (harmonics[h] > 0) {
          const amplitude = harmonics[h] / 100; // Convert from 0-100 to 0-1
          const frequency = h + 1; // Harmonic number
          const phase = x * frequency;
          
          // Use the appropriate waveform calculation based on the selected type
          y += amplitude * calculateWaveformValue(waveformType, phase);
        }
      }
      
      // Normalize and scale
      const maxPossibleAmplitude = harmonics.reduce((sum, h) => sum + h / 100, 0);
      const normalizedY = maxPossibleAmplitude > 0 
        ? y / (maxPossibleAmplitude * 1.2)
        : 0;
      
      const scaleFactor = 0.8;
      const scaledX = (i / resolution) * width;
      const scaledY = height / 2 - (normalizedY * height / 2 * scaleFactor);
      
      points.push([scaledX, scaledY]);
    }
    
    return points;
  }, [harmonics, waveformType, width, height]);
  
  // Convert points to SVG path
  const pathData = React.useMemo(() => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    
    return path;
  }, [points]);
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Waveform path */}
      <path 
        d={pathData} 
        fill="none" 
        stroke={trackColor} 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.7"
      />
    </svg>
  );
};

// Custom hook to get track color without linter errors
const useTrackColor = () => {
  const selectedKey = useAppSelector(state => state.keyboard.selectedKey);
  
  // Default to Green if no track color is available
  return useAppSelector(state => {
    // Attempt to get color from keyboard state first
    if (selectedKey !== null && state.keyboard.keyParameters[selectedKey]) {
      // This is a simplification - in a real app you'd extract the actual color
      return NoteColor.Green;
    }
    
    // Default fallback
    return NoteColor.Green;
  });
};

/**
 * Harmonics Panel component for controlling additive synthesis parameters
 */
const HarmonicsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const isPanelVisible = useAppSelector(selectIsHarmonicPanelVisible);
  const editableWaveform = useAppSelector(selectEditableWaveform);
  const currentTrackColor = useTrackColor();
  
  // State for position, pressed state, and dragging
  const [position, setPosition] = useState({ right: 220, top: 510 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [clickedOnControl, setClickedOnControl] = useState(false);
  
  // Get harmonic values and update functions from the hook
  const { 
    harmonicValues, 
    updateHarmonicAmplitude, 
    resetToDefault 
  } = useHarmonicValues();
  
  // Toggle panel visibility
  const handleTogglePanel = () => {
    dispatch(toggleHarmonicPanel());
  };
  
  // Combined background handler for mouseDown
  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't initiate drag if clicking on a control
    if ((e.target as HTMLElement).classList.contains('control-element')) {
      return;
    }
    
    setIsPressed(true);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.right,
      y: e.clientY - position.top
    });
    
    // If panel is not visible, toggle it
    if (!isPanelVisible) {
      dispatch(toggleHarmonicPanel());
    }
    
    e.preventDefault();
  }, [dispatch, isPanelVisible, position]);
  
  // Combined background handler for mouseUp
  const handleBackgroundMouseUp = useCallback(() => {
    setIsPressed(false);
    setIsDragging(false);
    setClickedOnControl(false);
  }, []);
  
  // Handler for mouseDown on control elements
  const handleControlMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setClickedOnControl(true);
  }, []);
  
  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
    setIsDragging(false);
    setClickedOnControl(false);
  }, []);
  
  // Handle drag movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !clickedOnControl) {
        // Update position based on mouse movement
        setPosition({
          right: e.clientX - dragOffset.x,
          top: e.clientY - dragOffset.y
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsPressed(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, clickedOnControl]);
  
  // If panel is not visible, return a minimized version
  if (!isPanelVisible) {
    return (
      <div 
        className="absolute right-0 top-[460px] bg-[#F5F2ED] rounded-l-lg p-2 cursor-pointer"
        onClick={handleTogglePanel}
        title="Show Harmonics Panel"
      >
        <span className="text-sm font-medium text-gray-700">Harmonics</span>
      </div>
    );
  }
  
  return (
    <div className="absolute" style={{ right: position.right, top: position.top, zIndex: 10 }}>
      {/* SVG container with mask and visual styling */}
      <svg viewBox="0 0 235 450" width="235" height="450">
        <defs>
          {/* Create a mask from the container path */}
          <mask id="harmonics-panel-mask">
            <path
              d={HARMONICS_PANEL_PATH}
              fill="white"
            />
          </mask>

          {/* Container shadow filters */}
          <filter id="harmonics-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#d1cdc4" floodOpacity="0.4" />
            <feDropShadow dx="-1" dy="-1" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.5" />
          </filter>

          <filter id="harmonics-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset dx="1" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="#c8c4bb" floodOpacity="0.5" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Visual container shape with solid color */}
        <path
          d={HARMONICS_PANEL_PATH}
          className="transition-all duration-75"
          style={{
            fill: "#F5F2ED",
            filter: isPressed ? "url(#harmonics-inner-shadow)" : "url(#harmonics-shadow)",
            stroke: isPressed ? "#d1cdc4" : "#e8e4df",
            strokeWidth: "0.5",
          }}
        />

        {/* Subtle highlight */}
        <path
          d={HARMONICS_PANEL_PATH}
          stroke={isPressed ? "#e0dbd6" : "#ffffff"}
          strokeOpacity={isPressed ? "0.3" : "0.5"}
          strokeWidth="0.75"
          fill="none"
          style={{
            transform: 'scale(0.998)',
            transformOrigin: 'center',
          }}
        />

        {/* Foreign object that is masked to the SVG shape */}
        <foreignObject
          x="0"
          y="0"
          width="235"
          height="450"
          mask="url(#harmonics-panel-mask)"
        >
          {/* Clickable div that's masked to the SVG shape */}
          <div
            className="w-full h-full cursor-grab"
            style={{
              transform: isPressed ? 'translateY(2px)' : 'translateY(0)',
              transition: 'transform 100ms ease-in-out',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
            onMouseDown={handleBackgroundMouseDown}
            onMouseUp={handleBackgroundMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* Content container with padding */}
            <div
              className="p-6"
              style={{
                opacity: isPanelVisible && !isPressed ? 1 : 0,
                transition: 'opacity 150ms ease-in-out',
                pointerEvents: isPanelVisible && !isPressed ? 'auto' : 'none',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                {/* Harmonic Controls */}
                <div className="space-y-4">
                  {/* Waveform visualization */}
                  <div className="mb-4 control-element" onMouseDown={handleControlMouseDown}>
                    <CustomWaveformVisualization
                      harmonics={harmonicValues}
                      width={190}
                      height={80}
                      waveformType={editableWaveform || 'sine'}
                      trackColor={currentTrackColor}
                    />
                  </div>

                  {/* Harmonic sliders */}
                  <div className="control-element" onMouseDown={handleControlMouseDown}>
                    {harmonicValues.map((value, index) => (
                      <HarmonicSlider
                        key={index}
                        value={value}
                        onChange={(newValue) => updateHarmonicAmplitude(index, newValue)}
                        trackColor={currentTrackColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default HarmonicsPanel; 