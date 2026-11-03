// ============================================================
// ZİRVE FIRTINASI - Ana Oyun Döngüsü, Dinamik Kamera & Checkpointler
// ============================================================

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.camera = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      zoom: 1.0,
      targetZoom: 1.0
    };

    this.state = 'GARAGE'; // 'GARAGE' | 'PLAYING' | 'GAMEOVER'
    this.physics = null;
    this.runCoins = 0;
    this.stopTimer = 0;
    this.lastTime = performance.now();
    this.paused = false;
    this.accumulator = 0;
    this.STEP = 1 / 60; // sabit fizik adımı: 60/90/120Hz ekranlarda aynı hız

    this.frameCount = 0;
    this.fpsTimer = performance.now();
    this.currentFps = 60;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.width = window.innerWidth;
    this.camera.height = window.innerHeight;
  }

  startRun() {
    this.state = 'PLAYING';
    this.runCoins = 0;
    this.stopTimer = 0;

    const vId = window.vehicleStore.getSelectedVehicleId();
    const cfg = VEHICLE_CONFIGS[vId];
    const vData = window.vehicleStore.getVehicleData(vId);

    window.terrainSystem.reset();
    window.particleSystem.reset();
    if (window.questManager) window.questManager.resetRunStats();

    this.physics = new VehiclePhysics(cfg, vData);
    this.physics.reset(120);

    this.camera.x = this.physics.x - this.camera.width * 0.35;
    this.camera.y = this.physics.y - this.camera.height * 0.6;
    this.camera.zoom = 1.0;
    this.paused = false;
    this.accumulator = 0;
    if (window.uiController.releaseAll) window.uiController.releaseAll();

    document.getElementById('screen-garage').style.display = 'none';
    document.getElementById('screen-gameover').style.display = 'none';
    document.getElementById('screen-hud').style.display = 'block';

    window.soundManager.ensureContext();
    window.soundManager.setEngineProfile(cfg.type);
  }

  setPaused(p) {
    if (this.state !== 'PLAYING' || !this.physics || this.physics.crashed) return;
    this.paused = p;
    document.getElementById('modal-pause').style.display = p ? 'flex' : 'none';
    window.uiController.releaseAll();
    if (p) window.soundManager.stopEngine();
    this.lastTime = performance.now();
  }

  openGarage() {
    this.paused = false;
    document.getElementById('modal-pause').style.display = 'none';
    this.state = 'GARAGE';
    if (this.physics) {
      window.soundManager.stopEngine();
    }
    document.getElementById('screen-garage').style.display = 'flex';
    document.getElementById('screen-hud').style.display = 'none';
    document.getElementById('screen-gameover').style.display = 'none';
    window.uiController.updateGarageView();
  }

  triggerGameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    window.soundManager.stopEngine();

    const store = window.vehicleStore.data;
    const biome = window.terrainSystem.biome;
    store.bestByBiome = store.bestByBiome || {};
    const prevBest = store.bestByBiome[biome] || 0;
    const isRecord = this.physics.distance > prevBest;
    if (isRecord) store.bestByBiome[biome] = this.physics.distance;
    if (this.physics.distance > (store.bestDistance || 0)) store.bestDistance = this.physics.distance;
    window.vehicleStore.save();

    window.uiController.showGameOver(this.physics, this.runCoins, isRecord);
  }

  onCollectItem(item) {
    if (item.type === 'coin') {
      window.vehicleStore.addCoins(25);
      this.runCoins += 25;
      window.soundManager.playCoin();
      window.particleSystem.emitCoinBurst(item.x, item.y, '#f1c40f');
      window.particleSystem.addFloatingText('+25 ₺', item.x, item.y - 20, '#f1c40f');
      if (window.questManager) window.questManager.recordCoin();

    } else if (item.type === 'fuel') {
      this.physics.fuel = this.physics.maxFuel;
      this.physics.outOfFuel = false;
      this.stopTimer = 0;
      window.soundManager.playFuel();
      window.particleSystem.emitCoinBurst(item.x, item.y, '#e74c3c');
      window.particleSystem.addFloatingText('DEPO DOLDU! ⛽', item.x, item.y - 25, '#2ecc71', 20);
      if (window.questManager) window.questManager.recordFuel();
      const settings = window.vehicleStore.getSettings();
      if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate(25);

    } else if (item.type === 'nitro') {
      this.physics.nitro = this.physics.maxNitro;
      window.soundManager.playNitro();
      window.particleSystem.emitCoinBurst(item.x, item.y, '#00f0ff');
      window.particleSystem.addFloatingText('NİTRO DOLDU! 🚀', item.x, item.y - 25, '#00f0ff', 20);
      const settings = window.vehicleStore.getSettings();
      if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate([20, 20]);

    } else if (item.type === 'gem') {
      window.vehicleStore.addCoins(100);
      this.runCoins += 100;
      window.soundManager.playGem();
      window.particleSystem.emitCoinBurst(item.x, item.y, '#9b59b6');
      window.particleSystem.addFloatingText('+100 ₺ ELMAS! 💎', item.x, item.y - 25, '#9b59b6', 22);
      if (window.questManager) window.questManager.recordGem();
    }
  }

  onPassCheckpoint(cp) {
    window.soundManager.playCheckpoint();
    window.particleSystem.emitCoinBurst(cp.x, window.terrainSystem.getHeight(cp.x) - 40, '#2ecc71');
    window.particleSystem.addFloatingText(`${cp.distance} METRE GEÇİLDİ! 🚩`, cp.x, window.terrainSystem.getHeight(cp.x) - 70, '#2ecc71', 24);
    window.vehicleStore.addCoins(cp.distance);
    this.runCoins += cp.distance;
  }

  stepGame(dt) {
    const p = this.physics;
    p.snapshot();
    p.update(window.uiController.input, dt);
    window.terrainSystem.generateAhead(p.x + 2200);
    window.terrainSystem.checkCollectibles({ x: p.x, y: p.y, radius: 35 }, (item) => this.onCollectItem(item));
    window.terrainSystem.checkCheckpoints(p.x, (cp) => this.onPassCheckpoint(cp));
    window.particleSystem.update(dt);

    if (p.crashed) {
      this.stopTimer += dt;
      if (this.stopTimer > 1.6) this.triggerGameOver();
    } else if (p.outOfFuel && Math.abs(p.vx) < 0.2) {
      this.stopTimer += dt;
      if (this.stopTimer > 1.4) this.triggerGameOver();
    }
  }

  loop(currentTime) {
    const frameDt = Math.max(0, Math.min((currentTime - this.lastTime) / 1000, 0.1));
    this.lastTime = currentTime;
    const k60 = frameDt * 60;

    this.frameCount++;
    if (currentTime - this.fpsTimer >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = currentTime;
      const fpsEl = document.getElementById('fps-counter');
      if (fpsEl && window.vehicleStore.getSettings().showFps) {
        fpsEl.textContent = `${this.currentFps} FPS`;
      }
    }

    if (this.state === 'PLAYING' && this.physics && !this.paused) {
      this.accumulator += frameDt;
      let steps = 0;
      while (this.accumulator >= this.STEP && steps < 5 && this.state === 'PLAYING') {
        this.stepGame(this.STEP);
        this.accumulator -= this.STEP;
        steps++;
      }
      if (steps >= 5) this.accumulator = 0;

      const alpha = Math.min(1, this.accumulator / this.STEP);
      const pp = this.physics;
      const pv = pp.prev;
      const ix = pv ? pv[0] + (pp.x - pv[0]) * alpha : pp.x;
      const iy = pv ? pv[1] + (pp.y - pv[1]) * alpha : pp.y;
      this.renderAlpha = alpha;

      const speedRatio = Math.min(1.0, Math.abs(this.physics.vx) / 18);
      this.camera.targetZoom = 1.0 - (speedRatio * 0.14);
      this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * (1 - Math.pow(0.96, k60));

      const targetCamX = ix - (this.camera.width * 0.35) / this.camera.zoom + Math.min(220, this.physics.vx * 12);
      const targetCamY = iy - (this.camera.height * 0.6) / this.camera.zoom;
      this.camera.x += (targetCamX - this.camera.x) * (1 - Math.pow(0.9, k60));
      this.camera.y += (targetCamY - this.camera.y) * (1 - Math.pow(0.92, k60));

      window.uiController.updateHUD(this.physics);
    } else if (this.state === 'GARAGE') {
      this.camera.x += 0.5 * k60;
      this.camera.y = 100;
      this.camera.zoom += (1 - this.camera.zoom) * 0.1;
    }

    // Çizim (zoom'a göre görünür alan genişletilir: kenarlarda boşluk kalmaz)
    this.ctx.clearRect(0, 0, this.camera.width, this.camera.height);
    const z = this.camera.zoom;
    const view = { x: this.camera.x, y: this.camera.y, width: this.camera.width / z, height: this.camera.height / z, zoom: z };
    const shake = window.particleSystem.getShakeOffset();

    this.ctx.save();
    this.ctx.translate(shake.x, shake.y);
    if (z !== 1.0) this.ctx.scale(z, z);

    window.terrainSystem.renderBackground(this.ctx, view);
    window.terrainSystem.renderTerrain(this.ctx, view);
    window.particleSystem.render(this.ctx, view);
    if (this.state !== 'GARAGE' && this.physics) {
      const p = this.physics;
      if (this.state === 'PLAYING' && !this.paused && p.prev) {
        // Sabit adımlı fiziği ekran hızına uydurmak için iki adım arasını yumuşatarak çiz
        const real = p.getState(false);
        const cur = p.getState(true);
        const a = this.renderAlpha === undefined ? 1 : this.renderAlpha;
        p.applyState(cur.map((v, i) => p.prev[i] + (v - p.prev[i]) * a));
        p.render(this.ctx, view);
        p.applyState(real);
      } else {
        p.render(this.ctx, view);
      }
    }

    this.ctx.restore();
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
