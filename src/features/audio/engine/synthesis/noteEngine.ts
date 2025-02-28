// Add this to the note synthesis function

// Apply unison settings if available
if (noteEvent.synthesis?.unison) {
    const { count, detune, width } = noteEvent.synthesis.unison;
    
    // Create multiple oscillators for unison effect
    if (count > 1) {
        const unisonOscillators = [];
        
        for (let i = 1; i < count; i++) {
            const unisonOsc = audioContext.createOscillator();
            unisonOsc.type = noteEvent.synthesis.waveform || 'sine';
            
            // Calculate detune value based on position in unison spread
            const spreadFactor = (i / (count - 1)) * 2 - 1; // Range from -1 to 1
            const detuneValue = spreadFactor * detune;
            unisonOsc.detune.value = detuneValue;
            
            // Calculate pan position for stereo width
            const panPosition = spreadFactor * (width / 100);
            
            // Create stereo panner for width
            const panner = audioContext.createStereoPanner();
            panner.pan.value = panPosition;
            
            // Connect oscillator to panner to gain
            unisonOsc.connect(panner);
            panner.connect(gainNode);
            
            // Start oscillator
            unisonOsc.start(startTime);
            unisonOsc.stop(endTime);
            
            unisonOscillators.push(unisonOsc);
        }
        
        // Store unison oscillators for cleanup
        // This depends on how you're managing oscillator references
        // activeOscillators.push(...unisonOscillators);
    }
} 