// ============================================================
// ZİRVE FIRTINASI - Hızlı & Canlı Görsel Efekt Sistemi (FX)
// Ekran sarsıntısı (Screenshake), kar, nitro alevleri, duman ve altın parıltıları
// ============================================================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.maxParticles = 35;
    
    // Ekran sarsıntısı
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  triggerShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  emitDirt(x, y, vx, vy, color = '#795548') {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y,
      vx: vx * 0.3 + (Math.random() - 0.5) * 2,
      vy: vy * 0.3 - Math.random() * 2.5,
      radius: 3 + Math.random() * 3,
      life: 1.0,
      decay: 0.05,
      color: color,
      type: 'dirt'
    });
  }

  emitNitroFlame(x, y, angle) {
    for (let i = 0; i < 2; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const spd = 7 + Math.random() * 5;
      const cosA = Math.cos(angle + Math.PI + spread);
      const sinA = Math.sin(angle + Math.PI + spread);
      const colors = ['#00f0ff', '#3498db', '#ffffff', '#9b59b6'];

      this.particles.push({
        x: x,
        y: y,
        vx: cosA * spd,
        vy: sinA * spd,
        radius: 4 + Math.random() * 4,
        life: 1.0,
        decay: 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'nitro'
      });
    }
  }

  emitCoinBurst(x, y, color = '#f1c40f') {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 3.5,
        life: 1.0,
        decay: 0.035,
        color: color,
        type: 'spark'
      });
    }
  }

  addFloatingText(text, x, y, color = '#f1c40f', fontSize = 18) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -2.2,
      life: 1.0,
      decay: 0.018,
      color: color,
      fontSize: fontSize
    });
  }

  update(dt) {
    // Ekran sarsıntısı zamanlayıcısı
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeIntensity = 0;
    }

    // Partiküller
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'dirt' || p.type === 'spark') {
        p.vy += 0.2; // Yerçekimi
      }
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Uçuşan Yazılar
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= t.decay;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  getShakeOffset() {
    if (this.shakeDuration > 0 && this.shakeIntensity > 0) {
      return {
        x: (Math.random() - 0.5) * this.shakeIntensity,
        y: (Math.random() - 0.5) * this.shakeIntensity
      };
    }
    return { x: 0, y: 0 };
  }

  render(ctx, camera) {
    ctx.save();

    for (const p of this.particles) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      if (sx < -20 || sx > camera.width + 20) continue;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const t of this.floatingTexts) {
      const sx = t.x - camera.x;
      const sy = t.y - camera.y;

      ctx.globalAlpha = Math.max(0, t.life);
      ctx.font = `900 ${t.fontSize || 18}px "Fredoka One", "Nunito", sans-serif`;
      ctx.textAlign = 'center';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(t.text, sx, sy);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
