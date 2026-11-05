// Synthesises a short mechanical key click using Web Audio API (no external audio files)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playKeySound(volumePercent: number, isError = false): void {
  if (volumePercent <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = isError ? 0.045 : 0.024;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp((-i / bufferSize) * (isError ? 6 : 10));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isError ? 420 : 1350;
    filter.Q.value = isError ? 3.0 : 1.8;

    const gain = ctx.createGain();
    gain.gain.value = Math.min(0.4, (volumePercent / 100) * 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // Ignore audio context restrictions
  }
}
