import { useCallback, useRef } from 'react';

// Using Web Audio API to generate a pleasant notification sound
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playReadySound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Create oscillator for a pleasant chime
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      
      // Play a pleasant two-tone chime (like a doorbell)
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.setValueAtTime(1175, now + 0.15); // D6 (up a fourth)
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  return { playReadySound };
}
