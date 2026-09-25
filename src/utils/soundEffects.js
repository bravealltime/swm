// Web Audio API Synthesizer for SWM game alerts
// No external MP3/audio files needed — 100% offline & instantaneous

let audioCtx = null;
let isMuted = false;

try {
  const savedMute = localStorage.getItem('swm:alerts-muted');
  if (savedMute !== null) isMuted = savedMute === 'true';
} catch {
  isMuted = false;
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioMuted() {
  return isMuted;
}

export function setAudioMuted(muted) {
  isMuted = !!muted;
  try {
    localStorage.setItem('swm:alerts-muted', String(isMuted));
  } catch {
    // ignore
  }
}

export function toggleAudioMute() {
  setAudioMuted(!isMuted);
  return isMuted;
}

/**
 * Play a grand sparkling chime/fanfare for Nat 5★ summons or 6★ Legend Runes
 */
export function playLegendAlertSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
  } catch (err) {
    console.warn('Failed to play legend sound:', err);
  }
}

/**
 * Play a subtle pleasant ding for normal rune drops / successful syncs
 */
export function playDropSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15); // E6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Failed to play drop sound:', err);
  }
}
