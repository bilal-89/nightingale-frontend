import React, { useMemo } from 'react';

interface WaveformVisualizationProps {
  harmonics: number[];
  width: number;
  height: number;
  waveformType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  className?: string;
}

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

/**
 * Calculates points to plot a waveform visualization based on additive synthesis
 */
const calculateWaveformPoints = (
  harmonics: number[], 
  waveformType: 'sine' | 'square' | 'sawtooth' | 'triangle',
  width: number, 
  height: number,
  resolution = 100
): [number, number][] => {
  const points: [number, number][] = [];
  
  // Sample a complete cycle
  for (let i = 0; i < resolution; i++) {
    const x = (i / resolution) * 2 * Math.PI;
    let y = 0;
    
    // Sum all harmonic contributions
    for (let h = 0; h < harmonics.length; h++) {
      if (harmonics[h] > 0) {
        const amplitude = harmonics[h] / 100; // Convert from 0-100 to 0-1
        const frequency = h + 1; // Harmonic number (1×, 2×, etc.)
        const phase = x * frequency;
        
        // Calculate this harmonic's contribution using the specified waveform
        y += amplitude * calculateWaveformValue(waveformType, phase);
      }
    }
    
    // Normalize to prevent extreme values (especially with multiple harmonics)
    const maxPossibleAmplitude = harmonics.reduce((sum, h) => sum + h / 100, 0);
    const normalizedY = maxPossibleAmplitude > 0 
      ? y / (maxPossibleAmplitude * 1.2) // Apply 1.2 divider to ensure no clipping
      : 0;
    
    // Scale to fit the height
    const scaleFactor = 0.8; // Leave 10% margin top and bottom
    const scaledX = (i / resolution) * width;
    const scaledY = height / 2 - (normalizedY * height / 2 * scaleFactor);
    
    points.push([scaledX, scaledY]);
  }
  
  return points;
};

/**
 * Component that visualizes a waveform based on harmonic amplitudes
 */
const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  harmonics,
  width,
  height,
  waveformType = 'sine',
  className = ''
}) => {
  // Calculate points for the waveform path
  const points = useMemo(() => 
    calculateWaveformPoints(harmonics, waveformType, width, height), 
    [harmonics, waveformType, width, height]
  );
  
  // Convert points to SVG path
  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    
    // Start with a move command to the first point
    let path = `M ${points[0][0]} ${points[0][1]}`;
    
    // Add line commands for the rest of the points
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i][0]} ${points[i][1]}`;
    }
    
    return path;
  }, [points]);
  
  // Get color based on waveform type
  const getWaveformColor = () => {
    switch (waveformType) {
      case 'sine': return '#B3D94C'; // Green
      case 'square': return '#FF6B6B'; // Red
      case 'sawtooth': return '#4EA8DE'; // Blue
      case 'triangle': return '#FAA307'; // Orange
      default: return '#B3D94C';
    }
  };
  
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Background rectangle */}
      <rect 
        x="0" 
        y="0" 
        width={width} 
        height={height} 
        rx="4" 
        ry="4" 
        fill="#F5F0E8" 
      />
      
      {/* Center line */}
      <line 
        x1="0" 
        y1={height / 2} 
        x2={width} 
        y2={height / 2} 
        stroke="#DDD8D0" 
        strokeWidth="1" 
      />
      
      {/* Waveform path */}
      <path 
        d={pathData} 
        fill="none" 
        stroke={getWaveformColor()} 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default WaveformVisualization; 