// ============================================================
// ZİRVE FIRTINASI - Zengin Web Audio Ses Motoru
// Motor, müzik, korna, nitro, elmas, takla ve bayrak sesleri
// ============================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    
    // Motor ses düğümleri
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.engineStarted = false;

    // Araç ses profilleri (t1/t2: dalga, base+rpm*rpmK: frekans, r2: ikinci osilatör oranı,
    // lfo: motor "tıkırtısı" Hz, horn: korna notaları)
    this.profiles = {
      default: { t1: 'sawtooth', t2: 'square', base: 42, rpm: 115, r2: 0.5, o2: 0.25, f0: 180, fr: 650, gain: 1, lfo: 0, lfoDepth: 0, horn: [440, 554.37], hornType: 'sawtooth', hornDur: 0.3 },
      jeep:    { base: 42, rpm: 115, lfo: 6, lfoDepth: 0.12 },
      murat:   { t1: 'sawtooth', t2: 'square', base: 36, rpm: 100, r2: 0.5, o2: 0.3, f0: 200, fr: 560, lfo: 9, lfoDepth: 0.28, horn: [392, 494], hornType: 'square', hornDur: 0.35 },
      anadol:  { t1: 'sawtooth', t2: 'triangle', base: 40, rpm: 125, r2: 0.5, o2: 0.4, f0: 220, fr: 700, lfo: 7, lfoDepth: 0.22, horn: [466], hornType: 'square', hornDur: 0.3 },
      sahin:   { t1: 'sawtooth', t2: 'square', base: 38, rpm: 110, r2: 0.5, o2: 0.3, f0: 190, fr: 620, lfo: 8, lfoDepth: 0.2, horn: [392, 466], hornType: 'square', hornDur: 0.4 },
      toros:   { t1: 'sawtooth', t2: 'square', base: 34, rpm: 95, r2: 0.5, o2: 0.35, f0: 170, fr: 540, gain: 1.1, lfo: 6, lfoDepth: 0.25, horn: [440, 554.37], hornType: 'sawtooth', hornDur: 0.45 },
      dogan:   { t1: 'sawtooth', t2: 'sawtooth', base: 44, rpm: 140, r2: 0.5, o2: 0.3, f0: 240, fr: 800, lfo: 10, lfoDepth: 0.15, horn: [420, 523], hornType: 'square', hornDur: 0.3 },
      doblo:   { t1: 'sawtooth', t2: 'square', base: 32, rpm: 85, r2: 0.5, o2: 0.4, f0: 160, fr: 480, gain: 1.1, lfo: 5, lfoDepth: 0.3, horn: [349, 440], hornType: 'square', hornDur: 0.5 },
      togg:    { t1: 'sine', t2: 'triangle', base: 90, rpm: 420, r2: 2, o2: 0.12, f0: 500, fr: 1800, gain: 0.8, lfo: 0, lfoDepth: 0, horn: [660, 880], hornType: 'sine', hornDur: 0.25 },
      bike:    { t1: 'sawtooth', t2: 'square', base: 70, rpm: 190, r2: 0.5, o2: 0.25, f0: 300, fr: 1100, lfo: 14, lfoDepth: 0.2 },
      tractor: { base: 28, rpm: 70, o2: 0.4, f0: 140, fr: 420, lfo: 7, lfoDepth: 0.45, horn: [330], hornType: 'square', hornDur: 0.5 },
      tank:    { base: 26, rpm: 60, o2: 0.45, f0: 120, fr: 380, gain: 1.2, lfo: 4, lfoDepth: 0.3 },
      monster: { base: 30, rpm: 85, o2: 0.4, f0: 150, fr: 500, gain: 1.15, lfo: 6, lfoDepth: 0.2 },
      f1:      { t1: 'sawtooth', t2: 'sawtooth', base: 130, rpm: 400, r2: 2, o2: 0.2, f0: 500, fr: 1600 },
      rally:   { base: 55, rpm: 170, f0: 260, fr: 900, lfo: 11, lfoDepth: 0.1 },
      hover:   { t1: 'sine', t2: 'triangle', base: 85, rpm: 260, r2: 2, o2: 0.2, f0: 400, fr: 1200, gain: 0.8 },
      dragster:{ base: 34, rpm: 135, o2: 0.4, f0: 220, fr: 900, gain: 1.35, lfo: 12, lfoDepth: 0.15 }
    };
    this.profileKey = 'default';
    this.profile = this.profiles.default;

    // Fon müziği
    this.musicTimer = null;
    this.musicStep = 0;
    this.bassNotes = [65.41, 65.41, 87.31, 98.00]; // C2, C2, F2, G2
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.initEngine();
    this.startMusic();
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getProfile(key) {
    return { ...this.profiles.default, ...(this.profiles[key] || {}) };
  }

  setEngineProfile(key) {
    this.profileKey = key;
    this.profile = this.getProfile(key);
    if (this.engineOsc) {
      this.engineOsc.type = this.profile.t1;
      this.engineOsc2.type = this.profile.t2;
    }
  }

  initEngine() {
    if (!this.ctx || this.engineStarted) return;
    const t = this.ctx.currentTime;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc.type = this.profile.t1;
    this.engineOsc2.type = this.profile.t2;
    this.engineOsc.frequency.setValueAtTime(45, t);
    this.engineOsc2.frequency.setValueAtTime(22, t);
    this.engineOsc2Gain = this.ctx.createGain();
    this.engineOsc2Gain.gain.setValueAtTime(0.3, t);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(220, t);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, t);

    // Motor tıkırtısı (LFO)
    this.engineLfo = this.ctx.createOscillator();
    this.engineLfo.type = 'sine';
    this.engineLfo.frequency.setValueAtTime(8, t);
    this.engineLfoGain = this.ctx.createGain();
    this.engineLfoGain.gain.setValueAtTime(0, t);
    this.engineLfo.connect(this.engineLfoGain);
    this.engineLfoGain.connect(this.engineGain.gain);

    this.engineOsc.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineOsc2Gain);
    this.engineOsc2Gain.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
    this.engineOsc2.start();
    this.engineLfo.start();
    this.engineStarted = true;
  }

  updateEngine(rpm, isGrounded, isGas, isNitro) {
    if (!this.engineGain || !this.soundEnabled) return;
    const p = this.profile;
    const now = this.ctx.currentTime;
    const targetFreq = p.base + (rpm * p.rpm) + (isNitro ? 40 : 0);
    const targetFilter = p.f0 + (rpm * p.fr) + (isNitro ? 300 : 0);
    const targetGain = (isNitro ? 0.35 : (isGas ? 0.22 : 0.08)) * p.gain;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * p.r2, now, 0.08);
    this.engineOsc2Gain.gain.setTargetAtTime(p.o2, now, 0.1);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    this.engineLfo.frequency.setTargetAtTime(p.lfo ? p.lfo * (0.6 + rpm * 1.6) : 1, now, 0.1);
    this.engineLfoGain.gain.setTargetAtTime(targetGain * p.lfoDepth, now, 0.1);
  }

  stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      this.engineLfoGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  // Garajda araç değiştirince kısa motor sesi örneği
  previewEngine(key) {
    if (!this.ctx || !this.soundEnabled) return;
    const p = this.getProfile(key);
    const now = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter(), g = this.ctx.createGain(), g2 = this.ctx.createGain();
    o1.type = p.t1; o2.type = p.t2; f.type = 'lowpass';
    const f0 = p.base, f1 = p.base + p.rpm * 0.85;
    o1.frequency.setValueAtTime(f0, now); o1.frequency.exponentialRampToValueAtTime(f1, now + 0.45);
    o2.frequency.setValueAtTime(f0 * p.r2, now); o2.frequency.exponentialRampToValueAtTime(f1 * p.r2, now + 0.45);
    f.frequency.setValueAtTime(p.f0, now); f.frequency.linearRampToValueAtTime(p.f0 + p.fr * 0.8, now + 0.45);
    g2.gain.value = p.o2;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.2 * p.gain, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.masterGain);
    o1.start(now); o2.start(now); o1.stop(now + 0.72); o2.stop(now + 0.72);
  }

  // --- Korna Sesi (araca özel) ---
  playHorn() {
    if (!this.ctx || !this.soundEnabled) return;
    const p = this.profile;
    const now = this.ctx.currentTime;
    p.horn.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = p.hornType;
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + p.hornDur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.hornDur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + p.hornDur + 0.02);
    });
  }

  // --- Nitro Boost Sesi ---
  playNitro() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    // Rüzgar ve itiş gürültüsü
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  // --- Altın Toplama ---
  playCoin() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.5, now + 0.06); // E6
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  // --- Elmas Toplama (Kristal Çınlaması) ---
  playGem() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98, 2093.0].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0.18, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.26);
    });
  }

  // --- Benzin Alma ---
  playFuel() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // --- Mesafe Bayrağı / Checkpoint Zili ---
  playCheckpoint() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.36);
    });
  }

  // --- Takla Fanfarı ---
  playFlip() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.22);
    });
  }

  // --- Kaza Sesi ---
  playCrash() {
    if (!this.ctx || !this.soundEnabled) return;
    this.stopEngine();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  playIntro() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    // Motor "vroom" süpürmesi
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(50, now);
    o.frequency.exponentialRampToValueAtTime(320, now + 0.7);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    o.connect(g); g.connect(this.masterGain);
    o.start(now); o.stop(now + 0.85);
    // Fanfar arpej
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const t = now + 0.45 + i * 0.09;
      const os = this.ctx.createOscillator(), gn = this.ctx.createGain();
      os.type = 'square';
      os.frequency.setValueAtTime(f, t);
      gn.gain.setValueAtTime(0.13, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      os.connect(gn); gn.connect(this.masterGain);
      os.start(t); os.stop(t + 0.34);
    });
  }

  playClick() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(750, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // --- Neşeli Fon Müziği ---
  startMusic() {
    if (this.musicTimer) return;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicEnabled) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep;

      // Bouncy bass
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const f = this.bassNotes[Math.floor(step / 4) % this.bassNotes.length];
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
      }

      this.musicStep = (this.musicStep + 1) % 16;
    }, 240); // 125 BPM
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (!this.soundEnabled) this.stopEngine();
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }
}

window.soundManager = new SoundManager();
