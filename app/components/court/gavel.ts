/** A short synthesized gavel strike: a low wooden knock with a quick decay. */
let ctx: AudioContext | null = null;

export function strikeGavel(times = 1) {
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const t = now + i * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.55, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);

      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / data.length);
      noise.buffer = buffer;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.18;
      noise.connect(nGain).connect(ctx.destination);
      noise.start(t);
    }
  } catch {
    // Audio is a flourish; the court works without it.
  }
}
