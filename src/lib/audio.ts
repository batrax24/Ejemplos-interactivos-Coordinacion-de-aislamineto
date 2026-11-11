/** Motor de audio procedural (Web Audio API): sin archivos externos. */

type Ctx = AudioContext & { _unlocked?: boolean };

class SoundEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  enabled = true;

  private ensure(): Ctx | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC() as Ctx;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master) this.master.gain.value = v ? 0.22 : 0;
  }

  /** Tono simple con envolvente. */
  tone(freq: number, dur = 0.08, type: OscillatorType = 'sine', gain = 0.25, slideTo?: number) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  tick() {
    this.tone(1400, 0.03, 'square', 0.035);
  }

  click() {
    this.tone(760, 0.05, 'triangle', 0.12, 520);
  }

  nav() {
    this.tone(520, 0.06, 'sine', 0.12);
    window.setTimeout(() => this.tone(780, 0.07, 'sine', 0.1), 55);
  }

  success() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.28, 'triangle', 0.16), i * 90);
    });
  }

  fail() {
    this.tone(200, 0.18, 'sawtooth', 0.1, 120);
    window.setTimeout(() => this.tone(150, 0.22, 'sawtooth', 0.08, 90), 110);
  }

  zap() {
    this.tone(90, 0.22, 'sawtooth', 0.10, 40);
    this.tone(2200, 0.06, 'square', 0.04, 300);
  }

  levelUnlock() {
    [392, 523.25, 659.25].forEach((f, i) =>
      window.setTimeout(() => this.tone(f, 0.2, 'sine', 0.14), i * 70),
    );
  }
}

export const sfx = new SoundEngine();
