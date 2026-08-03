// Ported from index.html's Web Audio oscillator synthesis — no audio
// files, just theme-aware beep sequences. Client-only (uses window.Audio
// APIs), so this must only be imported from client components.
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function beep(
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "square",
  peakGain = 0.15
) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + startTime;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(masterGain!);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playCorrectSound(theme: string) {
  if (theme === "blocks") {
    beep(1046.5, 0, 0.06, "square", 0.16);
    beep(1318.5, 0.05, 0.08, "square", 0.14);
    return;
  }
  if (theme === "plumber") {
    beep(987.77, 0, 0.07, "square", 0.16);
    beep(1567.98, 0.06, 0.22, "square", 0.16);
    return;
  }
  beep(880, 0, 0.12, "square", 0.15);
  beep(1318.5, 0.1, 0.18, "square", 0.15);
}

export function playLifeLostSound(theme: string) {
  if (theme === "blocks") {
    beep(196, 0, 0.09, "square", 0.2);
    beep(146.83, 0.09, 0.09, "square", 0.2);
    beep(196, 0.18, 0.09, "square", 0.2);
    beep(110, 0.27, 0.18, "square", 0.2);
    return;
  }
  if (theme === "plumber") {
    beep(783.99, 0, 0.08, "square", 0.18);
    beep(587.33, 0.07, 0.08, "square", 0.18);
    beep(466.16, 0.14, 0.08, "square", 0.18);
    beep(349.23, 0.21, 0.1, "square", 0.18);
    return;
  }
  beep(400, 0, 0.15, "sawtooth", 0.15);
  beep(300, 0.1, 0.15, "sawtooth", 0.15);
  beep(200, 0.2, 0.3, "sawtooth", 0.15);
}
