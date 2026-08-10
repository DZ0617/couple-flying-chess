type SoundName = 'dice' | 'step' | 'flip' | 'hearts' | 'win' | 'backfire' | 'swap' | 'buy' | 'shield' | 'milestone';

const PREF_KEY = 'couples-ludo-muted';
let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(PREF_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainValue = 0.12, when = 0) {
  const ac = ctx();
  if (!ac || isMuted()) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainValue, ac.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + durationMs / 1000 + 0.05);
}

function noise(durationMs: number, gainValue = 0.08) {
  const ac = ctx();
  if (!ac || isMuted()) return;
  const bufferSize = ac.sampleRate * (durationMs / 1000);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(gainValue, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + durationMs / 1000);
  source.connect(gain).connect(ac.destination);
  source.start();
}

export function playSound(name: SoundName) {
  switch (name) {
    case 'dice':
      noise(180, 0.1);
      tone(300, 80, 'square', 0.05);
      tone(420, 80, 'square', 0.05, 0.09);
      break;
    case 'step':
      tone(660, 40, 'triangle', 0.06);
      break;
    case 'flip':
      noise(120, 0.06);
      tone(880, 100, 'sine', 0.08, 0.06);
      break;
    case 'hearts':
      tone(880, 90, 'sine', 0.09);
      tone(1320, 120, 'sine', 0.09, 0.09);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 200, 'triangle', 0.1, i * 0.13));
      break;
    case 'backfire':
      tone(400, 150, 'sawtooth', 0.08);
      tone(250, 250, 'sawtooth', 0.08, 0.14);
      break;
    case 'swap':
      tone(520, 80, 'sine', 0.08);
      tone(520, 80, 'sine', 0.08, 0.1);
      break;
    case 'buy':
      tone(660, 90, 'sine', 0.08);
      tone(990, 120, 'sine', 0.08, 0.08);
      break;
    case 'shield':
      tone(520, 80, 'triangle', 0.08);
      tone(780, 120, 'triangle', 0.08, 0.08);
      break;
    case 'milestone':
      [523, 659, 784].forEach((f, i) => tone(f, 120, 'sine', 0.08, i * 0.1));
      break;
  }
}
