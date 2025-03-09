import { Waveform } from '../../../keyboard/store/slices/keyboard.slice';

/**
 * AdditiveOscillator implements a customizable oscillator using additive synthesis.
 * Each harmonic uses the same waveform type but with controllable amplitudes.
 */
export class AdditiveOscillator {
  private context: AudioContext;
  private outputGain: GainNode;
  private harmonicOscillators: Array<{
    oscillator: OscillatorNode;
    gain: GainNode;
  }>;
  private currentHarmonics: number[];
  private baseFrequency: number;
  private _isPlaying: boolean = false;
  private _waveformType: OscillatorType = 'sine';
  
  /**
   * Creates a new additive oscillator
   * @param context Audio context
   * @param frequency Base frequency in Hz
   * @param waveformType Type of waveform to use for all harmonics
   */
  constructor(context: AudioContext, frequency: number, waveformType: Waveform = 'sine') {
    this.context = context;
    this.baseFrequency = frequency;
    this.outputGain = context.createGain();
    this.outputGain.gain.value = 1.0; // Start with full gain
    this._waveformType = waveformType as OscillatorType;
    
    console.log(`[ADDITIVE OSC] Created new ${waveformType} oscillator with base frequency ${frequency}Hz`);
    
    // Default harmonic profile (just the fundamental)
    this.currentHarmonics = [100, 0, 0, 0, 0, 0, 0, 0];
    this.harmonicOscillators = [];
    
    this.initializeOscillators();
  }
  
  /**
   * Initialize the internal oscillators for each harmonic
   */
  private initializeOscillators(): void {
    // Create 8 oscillators with the same waveform type but different frequencies
    for (let i = 0; i < 8; i++) {
      const oscillator = this.context.createOscillator();
      oscillator.type = this._waveformType;
      oscillator.frequency.value = this.baseFrequency * (i + 1);
      
      const gain = this.context.createGain();
      gain.gain.value = i === 0 ? 1 : 0; // Default: only fundamental
      
      oscillator.connect(gain);
      gain.connect(this.outputGain);
      
      this.harmonicOscillators.push({ oscillator, gain });
    }
  }
  
  /**
   * Connect the oscillator output to an audio node
   */
  connect(destination: AudioNode): void {
    this.outputGain.connect(destination);
  }
  
  /**
   * Disconnect the oscillator from current destinations
   */
  disconnect(): void {
    this.outputGain.disconnect();
  }
  
  /**
   * Start the oscillator
   */
  start(time?: number): void {
    const startTime = time || this.context.currentTime;
    
    console.log(`[ADDITIVE OSC] Starting ${this._waveformType} oscillator at ${startTime}s with harmonics:`, this.currentHarmonics);
    
    // Start all oscillators
    this.harmonicOscillators.forEach(h => {
      try {
        h.oscillator.start(startTime);
      } catch (e) {
        // Oscillator may already be started
        console.warn('Error starting oscillator:', e);
      }
    });
    
    this._isPlaying = true;
  }
  
  /**
   * Stop the oscillator
   */
  stop(time?: number): void {
    const stopTime = time || this.context.currentTime;
    
    // Stop all oscillators
    this.harmonicOscillators.forEach(h => {
      try {
        h.oscillator.stop(stopTime);
      } catch (e) {
        console.warn('Error stopping oscillator:', e);
      }
    });
    
    this._isPlaying = false;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    try {
      if (this._isPlaying) {
        this.stop();
      }
      
      this.harmonicOscillators.forEach(h => {
        h.oscillator.disconnect();
        h.gain.disconnect();
      });
      
      this.outputGain.disconnect();
    } catch (e) {
      console.error('Error disposing additive oscillator:', e);
    }
  }
  
  /**
   * Update the base frequency
   */
  setFrequency(frequency: number, time?: number): void {
    // Skip update if frequency is the same (avoid unnecessary updates)
    if (Math.abs(this.baseFrequency - frequency) < 0.01) {
      return;
    }
    
    const setTime = time || this.context.currentTime;
    this.baseFrequency = frequency;
    
    this.harmonicOscillators.forEach((h, i) => {
      const harmonicFreq = frequency * (i + 1);
      h.oscillator.frequency.setValueAtTime(harmonicFreq, setTime);
    });
  }
  
  /**
   * Set the output gain (volume)
   */
  setGain(value: number, time?: number): void {
    const setTime = time || this.context.currentTime;
    console.log(`[ADDITIVE OSC] Setting gain to ${value} at ${setTime}s`);
    this.outputGain.gain.setValueAtTime(value, setTime);
  }
  
  /**
   * Ramp the output gain to a value over time
   */
  linearRampToGain(value: number, endTime: number): void {
    this.outputGain.gain.linearRampToValueAtTime(value, endTime);
  }
  
  /**
   * Set all harmonic amplitudes at once (values from 0-100)
   */
  setHarmonics(harmonics: number[], time?: number): void {
    const setTime = time || this.context.currentTime;
    this.currentHarmonics = [...harmonics];
    
    // Apply to gain nodes
    this.harmonicOscillators.forEach((h, i) => {
      if (i < harmonics.length) {
        const amplitude = harmonics[i] / 100; // Convert 0-100 to 0-1
        h.gain.gain.setValueAtTime(amplitude, setTime);
      }
    });
  }
  
  /**
   * Set a single harmonic amplitude (0-100)
   */
  setHarmonic(harmonicIndex: number, value: number, time?: number): void {
    if (harmonicIndex < 0 || harmonicIndex >= this.currentHarmonics.length) {
      return;
    }
    
    const setTime = time || this.context.currentTime;
    this.currentHarmonics[harmonicIndex] = value;
    
    const amplitude = value / 100; // Convert 0-100 to 0-1
    this.harmonicOscillators[harmonicIndex].gain.gain.setValueAtTime(amplitude, setTime);
  }
  
  /**
   * Change the waveform type for all harmonics
   */
  setWaveformType(waveformType: Waveform, time?: number): void {
    console.log(`[ADDITIVE OSC] Changing waveform type to ${waveformType}`);
    this._waveformType = waveformType as OscillatorType;
    
    // Update all oscillators to the new waveform type
    this.harmonicOscillators.forEach(h => {
      h.oscillator.type = this._waveformType;
    });
    
    // Apply default harmonic profiles based on the new waveform
    this.setWaveform(waveformType, time);
  }
  
  /**
   * Apply preset harmonic profiles based on waveform type
   */
  setWaveform(waveform: Waveform, time?: number): void {
    // Note: Unlike traditional additive synthesis where different harmonic amplitudes
    // simulate different waveforms, here we're using the same waveform for all harmonics
    // and just setting default amplitude profiles
    switch (waveform) {
      case 'sine':
        this.setHarmonics([100, 0, 0, 0, 0, 0, 0, 0], time);
        break;
      case 'square':
        // Square-ish profile with emphasis on odd harmonics
        this.setHarmonics([100, 0, 33, 0, 20, 0, 14, 0], time);
        break;
      case 'triangle':
        // Triangle-ish profile with rapidly decreasing odd harmonics
        this.setHarmonics([100, 0, 11, 0, 4, 0, 2, 0], time);
        break;
      case 'sawtooth':
        // Sawtooth-ish profile with all harmonics decreasing by 1/n
        this.setHarmonics([100, 50, 33, 25, 20, 17, 14, 12], time);
        break;
    }
  }
  
  /**
   * Get the current harmonic settings
   */
  getHarmonics(): number[] {
    return [...this.currentHarmonics];
  }
  
  /**
   * Get the current waveform type
   */
  getWaveformType(): Waveform {
    return this._waveformType as Waveform;
  }
} 