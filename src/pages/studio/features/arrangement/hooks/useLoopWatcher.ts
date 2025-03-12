import { useEffect, useRef } from 'react';
import { useAppSelector } from '../hooks';
import { selectIsPlaying, selectCurrentTime, selectLoopEnabled, selectLoopStart, selectLoopEnd } from '../../../../../features/player/store/playback';
import keyboardAudioManager from '../../oscillators/engine/synthesis/keyboardEngine.ts';
import { selectTracks } from '../../../../../features/player/store/player';

export const useLoopWatcher = () => {
  // Get relevant state from Redux
  const isPlaying = useAppSelector(selectIsPlaying);
  const currentTime = useAppSelector(selectCurrentTime);
  const loopEnabled = useAppSelector(selectLoopEnabled);
  const loopStart = useAppSelector(selectLoopStart);
  const loopEnd = useAppSelector(selectLoopEnd);
  const tracks = useAppSelector(selectTracks);
  
  // Track the last time position to detect loop transitions
  const lastTimeRef = useRef(0);
  // Track the last time we forced playback to prevent multiple triggers
  const lastForcePlayTimeRef = useRef(0);
  // Keep track of scheduled notes to prevent duplicates
  const scheduledNotesRef = useRef(new Set());
  
  // Reset scheduled notes when playback stops or loop changes
  useEffect(() => {
    if (!isPlaying || !loopEnabled) {
      scheduledNotesRef.current.clear();
    }
  }, [isPlaying, loopEnabled, loopStart, loopEnd]);
  
  // Use an effect to watch for loop transitions
  useEffect(() => {
    if (!isPlaying || !loopEnabled) {
      lastTimeRef.current = currentTime;
      return;
    }
    
    // Check if we crossed a loop boundary
    const crossedLoopBoundary = 
      (lastTimeRef.current < loopEnd && currentTime >= loopStart && currentTime < lastTimeRef.current) ||
      (lastTimeRef.current > loopEnd && currentTime < lastTimeRef.current);
    
    // Update reference time for next check
    lastTimeRef.current = currentTime;
    
    // Prevent multiple triggers within a short time window (100ms)
    const now = performance.now();
    const timeSinceLastPlay = now - lastForcePlayTimeRef.current;
    
    if (crossedLoopBoundary && timeSinceLastPlay > 100) {
      console.log('[LOOP WATCHER] Loop transition detected: Force playing notes!', {
        loopStart,
        loopEnd,
        currentTime,
        timeSinceLastPlay
      });
      
      // Clear scheduled notes on loop transition
      scheduledNotesRef.current.clear();
      
      // Force-play notes in the loop region
      forcePlayLoopRegionNotes();
      lastForcePlayTimeRef.current = now;
    }
  }, [isPlaying, currentTime, loopEnabled, loopStart, loopEnd, tracks]);
  
  // Function to force-play notes in the loop region
  const forcePlayLoopRegionNotes = () => {
    if (!isPlaying || !loopEnabled) return;
    
    // Initialize audio context if needed
    keyboardAudioManager.initialize();
    const audioContext = keyboardAudioManager.getContext();
    if (!audioContext) return;
    
    // Set up parameters for note scheduling
    const now = audioContext.currentTime;
    
    // Use the entire loop region for scheduling
    const loopDuration = loopEnd - loopStart;
    const notesToPlay = [];
    
    // Find all notes in the loop region
    tracks.forEach(track => {
      if (track.isMuted) return; // Skip muted tracks
      
      track.notes.forEach(note => {
        // Check if note is within the loop region
        if (note.timestamp >= loopStart && note.timestamp < loopEnd) {
          const offsetFromLoopStart = note.timestamp - loopStart;
          
          notesToPlay.push({
            note,
            trackId: track.id,
            offsetMs: offsetFromLoopStart,
            priority: offsetFromLoopStart < 500 ? 'high' : 'normal', // Prioritize immediate notes
            noteId: `${track.id}-${note.id}-${note.timestamp}`
          });
        }
      });
    });
    
    // Sort notes by time to ensure proper playback order
    notesToPlay.sort((a, b) => a.offsetMs - b.offsetMs);
    
    // Schedule each note to play
    console.log(`[LOOP WATCHER] Scheduling ${notesToPlay.length} notes from loop region (${loopStart}ms to ${loopEnd}ms)`);
    
    let scheduledCount = 0;
    
    notesToPlay.forEach(item => {
      const { note, offsetMs, priority, noteId } = item;
      
      // Skip if already scheduled recently
      if (scheduledNotesRef.current.has(noteId)) {
        return;
      }
      
      const playTime = now + (offsetMs / 1000);
      
      // Configure the synthesis - make it a bit louder for clarity, especially for high priority notes
      const volumeBoost = priority === 'high' ? 1.25 : 1.15; // 25% boost for immediate notes, 15% for others
      
      const synthesis = {
        ...note.synthesis,
        gain: (note.synthesis?.gain || 0.3) * volumeBoost
      };
      
      // Schedule the note
      keyboardAudioManager.playExactNote({
        ...note,
        timestamp: playTime,
        duration: note.duration ? note.duration / 1000 : 0.1, // Fallback to 100ms if no duration
        synthesis
      }, playTime);
      
      // Mark as scheduled
      scheduledNotesRef.current.add(noteId);
      scheduledCount++;
      
      // Clear this note from scheduled set after it should have played (plus a buffer)
      setTimeout(() => {
        scheduledNotesRef.current.delete(noteId);
      }, offsetMs + 1000); // Clear 1 second after it should have played
    });
    
    console.log(`[LOOP WATCHER] Actually scheduled ${scheduledCount} new notes`);
    
    // For seamless looping, schedule the first few notes of the next iteration
    if (notesToPlay.length > 0) {
      const nextIterationTime = now + (loopDuration / 1000);
      
      // Schedule the first few notes of the next iteration
      notesToPlay
        .filter(item => item.offsetMs < 500) // Only the immediate notes
        .forEach(item => {
          const { note, offsetMs, noteId } = item;
          const nextNoteId = `next-${noteId}`;
          
          // Skip if already scheduled
          if (scheduledNotesRef.current.has(nextNoteId)) {
            return;
          }
          
          const playTime = nextIterationTime + (offsetMs / 1000);
          
          const synthesis = {
            ...note.synthesis,
            gain: (note.synthesis?.gain || 0.3) * 1.2
          };
          
          keyboardAudioManager.playExactNote({
            ...note,
            timestamp: playTime,
            duration: note.duration ? note.duration / 1000 : 0.1,
            synthesis
          }, playTime);
          
          // Mark as scheduled
          scheduledNotesRef.current.add(nextNoteId);
          
          // Clear this note from scheduled set after it should have played
          setTimeout(() => {
            scheduledNotesRef.current.delete(nextNoteId);
          }, loopDuration + offsetMs + 1000);
          
          console.log(`[LOOP WATCHER] Pre-scheduled next iteration note ${note.note}`);
        });
    }
  };
  
  return null; // This hook doesn't render anything
};
