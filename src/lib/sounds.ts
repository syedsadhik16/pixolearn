// Synthesized sound effects using Web Audio API — no external files needed

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silent fail — audio not critical
  }
}

/** Short ascending chime for XP gain */
export function playXPSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.12), i * 80);
  });
}

/** Triumphant fanfare for level up */
export function playLevelUpSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'triangle', 0.15), i * 120);
  });
  // Final chord
  setTimeout(() => {
    playTone(784, 0.5, 'triangle', 0.1);
    playTone(1047, 0.5, 'triangle', 0.1);
  }, notes.length * 120);
}

/** Sparkle sound for badge unlock */
export function playBadgeSound() {
  const notes = [880, 1108, 1318, 1568, 1760];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, 'sine', 0.08), i * 60);
  });
}

/** Quick coin sound for daily reward claim */
export function playRewardSound() {
  playTone(987, 0.1, 'square', 0.08);
  setTimeout(() => playTone(1318, 0.2, 'square', 0.08), 100);
}

/** Soft click / tap */
export function playClickSound() {
  playTone(800, 0.05, 'sine', 0.06);
}
