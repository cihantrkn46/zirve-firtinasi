// ============================================================
// ZİRVE FIRTINASI - UI, Dokunmatik Kontroller, Modifiye & Görevler
// ============================================================

class UIController {
  constructor() {
    this.input = {
      gas: false,
      brake: false,
      nitro: false
    };

    this.vehicleKeys = Object.keys(VEHICLE_CONFIGS).sort((a, b) => VEHICLE_CONFIGS[a].price - VEHICLE_CONFIGS[b].price);
    this.currentVehicleIndex = Math.max(0, this.vehicleKeys.indexOf(window.vehicleStore.getSelectedVehicleId()));
    this.deferredInstallPrompt = null;
    this.previewBounce = 0;

    this.bindEvents();
    this.bindSplash();
    this.bindPWAInstall();
    this.applySettings();
    this.updateGarageView();
  }

  bindSplash() {
    const splash = document.getElementById('screen-splash');
    const btn = document.getElementById('btn-splash-start');
    if (!splash || !btn) return;
    const best = window.vehicleStore.data.bestDistance || 0;
    const bestEl = document.getElementById('splash-best');
    if (bestEl && best > 0) bestEl.textContent = `🏆 REKOR: ${best} m`;
    const go = () => {
      window.soundManager.ensureContext();
      window.soundManager.playIntro();
      splash.classList.add('hide');
      setTimeout(() => { splash.style.display = 'none'; this.checkDaily(); }, 550);
    };
    btn.addEventListener('click', go);
    splash.addEventListener('click', go);
  }

  checkDaily() {
    const d = window.vehicleStore.data;
    d.daily = d.daily || { last: '', streak: 0 };
    const fmt = (dt) => dt.toLocaleDateString('sv');
    const today = fmt(new Date());
    if (d.daily.last === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const streak = (d.daily.last === fmt(y)) ? d.daily.streak + 1 : 1;
    const day = ((streak - 1) % 7) + 1;
    const reward = day * 200 + (day === 7 ? 1000 : 0);

    document.getElementById('daily-streak').textContent = `🔥 ${streak} günlük seri`;
    document.getElementById('daily-amount').textContent = `+${reward} ₺`;
    document.getElementById('daily-days').innerHTML = Array.from({ length: 7 }, (_, i) =>
      `<div class="daily-day ${i + 1 < day ? 'done' : (i + 1 === day ? 'today' : '')}">${i === 6 ? '🎁' : 'G' + (i + 1)}</div>`).join('');
    const modal = document.getElementById('modal-daily');
    modal.style.display = 'flex';
    document.getElementById('btn-daily-claim').onclick = () => {
      d.daily = { last: today, streak };
      window.vehicleStore.addCoins(reward);
      window.soundManager.playGem();
      modal.style.display = 'none';
      this.updateGarageView();
    };
  }

  releaseAll() {
    this.input.gas = this.input.brake = this.input.nitro = false;
    document.querySelectorAll('.pedal').forEach(p => p.classList.remove('active'));
  }

  bindEvents() {
    // Sekme gizlenince / odak kaybolunca tuşlar takılı kalmasın, ses dursun
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      const c = window.soundManager.ctx;
      if (document.hidden) {
        this.releaseAll();
        if (window.game) window.game.setPaused(true);
        if (c && c.state === 'running') c.suspend();
      } else if (c && c.state === 'suspended') {
        c.resume();
      }
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Klavye kontrolleri
    window.addEventListener('keydown', (e) => {
      window.soundManager.ensureContext();
      const settings = window.vehicleStore.getSettings();
      const isInv = settings.pedalLayout === 'inverted';

      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (isInv) this.input.brake = true; else this.input.gas = true;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (isInv) this.input.gas = true; else this.input.brake = true;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.input.nitro = true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (window.game) window.game.setPaused(!window.game.paused);
      }
      if (e.code === 'KeyH') {
        window.soundManager.playHorn();
      }
    });

    window.addEventListener('keyup', (e) => {
      const settings = window.vehicleStore.getSettings();
      const isInv = settings.pedalLayout === 'inverted';

      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (isInv) this.input.brake = false; else this.input.gas = false;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (isInv) this.input.gas = false; else this.input.brake = false;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.input.nitro = false;
      }
    });

    // Dokunmatik Pedallar (Fren, Gaz ve Nitro)
    const btnGas = document.getElementById('btn-gas');
    const btnBrake = document.getElementById('btn-brake');
    const btnNitro = document.getElementById('btn-nitro');

    this.bindPedal(btnGas, (state) => {
      const isInv = window.vehicleStore.getSettings().pedalLayout === 'inverted';
      if (isInv) this.input.brake = state; else this.input.gas = state;
    });

    this.bindPedal(btnBrake, (state) => {
      const isInv = window.vehicleStore.getSettings().pedalLayout === 'inverted';
      if (isInv) this.input.gas = state; else this.input.brake = state;
    });

    this.bindPedal(document.getElementById('btn-horn'), (state) => {
      if (state) window.soundManager.playHorn();
    });

    this.bindPedal(btnNitro, (state) => {
      this.input.nitro = state;
    });

    // Duraklat menüsü
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('btn-pause', () => { window.soundManager.playClick(); window.game.setPaused(true); });
    on('btn-resume', () => { window.soundManager.playClick(); window.game.setPaused(false); });
    on('btn-pause-retry', () => { window.game.paused = false; document.getElementById('modal-pause').style.display = 'none'; window.game.startRun(); });
    on('btn-pause-garage', () => { window.game.openGarage(); });

    // Sekme Değiştirme (Geliştirme / Modifiye)
    const tabUp = document.getElementById('tab-btn-upgrades');
    const tabTune = document.getElementById('tab-btn-tuning');
    const panelUp = document.getElementById('garage-upgrades');
    const panelTune = document.getElementById('garage-tuning');

    if (tabUp && tabTune) {
      tabUp.addEventListener('click', () => {
        tabUp.classList.add('active');
        tabTune.classList.remove('active');
        panelUp.style.display = 'flex';
        panelTune.style.display = 'none';
        window.soundManager.playClick();
      });

      tabTune.addEventListener('click', () => {
        tabTune.classList.add('active');
        tabUp.classList.remove('active');
        panelTune.style.display = 'flex';
        panelUp.style.display = 'none';
        window.soundManager.playClick();
      });
    }

    // Oyun Başlat / Tekrar / Garaj
    document.getElementById('btn-play').addEventListener('click', () => {
      window.soundManager.ensureContext();
      window.game.startRun();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      window.soundManager.ensureContext();
      window.game.startRun();
    });

    document.getElementById('btn-garage').addEventListener('click', () => {
      window.soundManager.ensureContext();
      window.game.openGarage();
    });

    document.getElementById('btn-prev-vehicle').addEventListener('click', () => {
      this.cycleVehicle(-1);
    });

    document.getElementById('btn-next-vehicle').addEventListener('click', () => {
      this.cycleVehicle(1);
    });

    document.getElementById('btn-unlock-vehicle').addEventListener('click', () => {
      const vId = this.vehicleKeys[this.currentVehicleIndex];
      if (window.vehicleStore.unlockVehicle(vId)) {
        window.soundManager.playCoin();
        this.updateGarageView();
      }
    });

    // Garaj İnteraktif Korna & Süspansiyon Test Butonu
    const btnHonk = document.getElementById('btn-test-honk');
    const btnTestSusp = document.getElementById('btn-test-suspension');

    if (btnHonk) {
      btnHonk.addEventListener('click', () => {
        window.soundManager.playHorn();
      });
    }

    if (btnTestSusp) {
      btnTestSusp.addEventListener('click', () => {
        this.previewBounce = 16;
        window.soundManager.playClick();
        this.renderCurrentPreview();
      });
    }

    // Biyom Seçimi
    document.querySelectorAll('.biome-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.biome-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const biome = card.getAttribute('data-biome');
        window.terrainSystem.setBiome(biome);
        window.soundManager.playClick();
      });
    });

    // Üst Bar Butonları
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
      const state = window.soundManager.toggleSound();
      document.getElementById('btn-toggle-sound').classList.toggle('muted', !state);
    });

    document.getElementById('btn-toggle-music').addEventListener('click', () => {
      const state = window.soundManager.toggleMusic();
      document.getElementById('btn-toggle-music').classList.toggle('muted', !state);
    });

    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Görevler Modalı
    const btnQuests = document.getElementById('btn-open-quests');
    const modalQuests = document.getElementById('modal-quests');
    const btnCloseQuests = document.getElementById('btn-close-quests');

    if (btnQuests && modalQuests) {
      btnQuests.addEventListener('click', () => {
        if (window.questManager) window.questManager.renderQuestsModal();
        modalQuests.style.display = 'flex';
        window.soundManager.playClick();
      });
    }

    if (btnCloseQuests && modalQuests) {
      btnCloseQuests.addEventListener('click', () => {
        modalQuests.style.display = 'none';
        window.soundManager.playClick();
      });
    }

    // Ayarlar Modalı
    const btnSettings = document.getElementById('btn-open-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (btnSettings && modalSettings) {
      btnSettings.addEventListener('click', () => {
        modalSettings.style.display = 'flex';
        window.soundManager.playClick();
      });
    }

    if (btnCloseSettings && modalSettings) {
      btnCloseSettings.addEventListener('click', () => {
        window.vehicleStore.updateSettings({
          sensitivity: document.getElementById('setting-sensitivity').value,
          pedalLayout: document.getElementById('setting-layout').value,
          hapticsEnabled: document.getElementById('setting-haptics').checked,
          showFps: document.getElementById('setting-fps').checked
        });
        this.releaseAll();
        this.applySettings();
        modalSettings.style.display = 'none';
        window.soundManager.playClick();
      });
    }

    // Geliştirme Butonları
    ['engine', 'suspension', 'tires', 'fourwd', 'tank'].forEach((stat) => {
      const btn = document.getElementById(`btn-up-${stat}`);
      if (btn) {
        btn.addEventListener('click', () => {
          const vId = this.vehicleKeys[this.currentVehicleIndex];
          if (window.vehicleStore.upgradeStat(vId, stat)) {
            window.soundManager.playCoin();
            this.updateGarageView();
          }
        });
      }
    });

    // Modifiye Renk Paleti
    const colorContainer = document.getElementById('tuning-colors');
    if (colorContainer) {
      TUNING_COLORS.forEach((col) => {
        const circle = document.createElement('div');
        circle.className = 'color-circle';
        circle.style.backgroundColor = col.hex;
        circle.title = col.name;
        circle.addEventListener('click', () => {
          const vId = this.vehicleKeys[this.currentVehicleIndex];
          window.vehicleStore.setCustomColor(vId, col.hex);
          window.soundManager.playClick();
          this.updateGarageView();
        });
        colorContainer.appendChild(circle);
      });
    }

    // Modifiye Jant
    const rimContainer = document.getElementById('tuning-rims');
    if (rimContainer) {
      TUNING_RIMS.forEach((rim) => {
        const chip = document.createElement('div');
        chip.className = 'tuning-chip';
        chip.textContent = rim.name;
        chip.addEventListener('click', () => {
          const vId = this.vehicleKeys[this.currentVehicleIndex];
          window.vehicleStore.setCustomRim(vId, rim.hex);
          window.soundManager.playClick();
          this.updateGarageView();
        });
        rimContainer.appendChild(chip);
      });
    }

    // Modifiye Şapka
    const hatContainer = document.getElementById('tuning-hats');
    if (hatContainer) {
      TUNING_HATS.forEach((h) => {
        const chip = document.createElement('div');
        chip.className = 'tuning-chip';
        chip.textContent = h.name;
        chip.addEventListener('click', () => {
          const vId = this.vehicleKeys[this.currentVehicleIndex];
          window.vehicleStore.setCustomHat(vId, h.id);
          window.soundManager.playClick();
          this.updateGarageView();
        });
        hatContainer.appendChild(chip);
      });
    }
  }

  bindPWAInstall() {
    const installBtn = document.getElementById('btn-install-app');
    const modalInstall = document.getElementById('modal-install');
    const btnCloseInstall = document.getElementById('btn-close-install');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (installBtn) installBtn.style.display = 'flex';
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        window.soundManager.playClick();
        if (this.deferredInstallPrompt) {
          this.deferredInstallPrompt.prompt();
          const { outcome } = await this.deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            installBtn.style.display = 'none';
          }
          this.deferredInstallPrompt = null;
        } else if (modalInstall) {
          modalInstall.style.display = 'flex';
        }
      });
    }

    if (btnCloseInstall && modalInstall) {
      btnCloseInstall.addEventListener('click', () => {
        modalInstall.style.display = 'none';
        window.soundManager.playClick();
      });
    }
  }

  applySettings() {
    const s = window.vehicleStore.getSettings();
    const selSens = document.getElementById('setting-sensitivity');
    const selLayout = document.getElementById('setting-layout');
    const chkHaptics = document.getElementById('setting-haptics');
    const chkFps = document.getElementById('setting-fps');

    if (selSens) selSens.value = s.sensitivity;
    if (selLayout) selLayout.value = s.pedalLayout;
    if (chkHaptics) chkHaptics.checked = s.hapticsEnabled;
    if (chkFps) {
      chkFps.checked = s.showFps;
      const fpsEl = document.getElementById('fps-counter');
      if (fpsEl) fpsEl.style.display = s.showFps ? 'block' : 'none';
    }

    const btnGas = document.getElementById('btn-gas');
    const btnBrake = document.getElementById('btn-brake');
    if (s.pedalLayout === 'inverted') {
      btnBrake.querySelector('.pedal-title').textContent = 'GAZ';
      btnBrake.querySelector('.pedal-sub').textContent = 'İLERİ ▶';
      btnBrake.className = 'pedal pedal-gas';

      btnGas.querySelector('.pedal-title').textContent = 'FREN';
      btnGas.querySelector('.pedal-sub').textContent = '◀ GERİ';
      btnGas.className = 'pedal pedal-brake';
    } else {
      btnBrake.querySelector('.pedal-title').textContent = 'FREN';
      btnBrake.querySelector('.pedal-sub').textContent = '◀ GERİ';
      btnBrake.className = 'pedal pedal-brake';

      btnGas.querySelector('.pedal-title').textContent = 'GAZ';
      btnGas.querySelector('.pedal-sub').textContent = 'İLERİ ▶';
      btnGas.className = 'pedal pedal-gas';
    }
  }

  bindPedal(element, callback) {
    if (!element) return;

    const start = (e) => {
      e.preventDefault();
      window.soundManager.ensureContext();
      element.classList.add('active');
      const settings = window.vehicleStore.getSettings();
      if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate(15);
      callback(true);
    };

    const end = (e) => {
      e.preventDefault();
      element.classList.remove('active');
      callback(false);
    };

    // Pointer capture: parmak pedaldan kayınca gaz/fren bırakılmaz, çoklu dokunma çalışır
    element.addEventListener('pointerdown', (e) => {
      try { element.setPointerCapture(e.pointerId); } catch (_) {}
      start(e);
    });
    element.addEventListener('pointerup', end);
    element.addEventListener('pointercancel', end);
    element.addEventListener('lostpointercapture', end);
  }

  cycleVehicle(dir) {
    window.soundManager.playClick();
    this.currentVehicleIndex = (this.currentVehicleIndex + dir + this.vehicleKeys.length) % this.vehicleKeys.length;
    const vId = this.vehicleKeys[this.currentVehicleIndex];
    const data = window.vehicleStore.getVehicleData(vId);
    if (data.unlocked) {
      window.vehicleStore.setSelectedVehicle(vId);
    }
    this.updateGarageView();
    window.soundManager.previewEngine(vId);
  }

  updateGarageView() {
    const vId = this.vehicleKeys[this.currentVehicleIndex];
    const cfg = VEHICLE_CONFIGS[vId];
    const vData = window.vehicleStore.getVehicleData(vId);
    const coins = window.vehicleStore.getCoins();

    document.querySelectorAll('.val-coins').forEach(el => {
      el.textContent = coins.toLocaleString('tr-TR');
    });

    document.getElementById('vehicle-title').textContent = cfg.name;
    document.getElementById('vehicle-desc').textContent = cfg.description;

    const unlockBtn = document.getElementById('btn-unlock-vehicle');
    const playBtn = document.getElementById('btn-play');
    const rightPanel = document.getElementById('garage-right-panel');

    if (vData.unlocked) {
      unlockBtn.style.display = 'none';
      playBtn.style.display = 'inline-block';
      rightPanel.style.opacity = '1';
      rightPanel.style.pointerEvents = 'auto';

      ['engine', 'suspension', 'tires', 'fourwd', 'tank'].forEach((stat) => {
        const lvl = vData[stat] || 1;
        const cost = window.vehicleStore.getUpgradeCost(lvl);
        const lvlEl = document.getElementById(`lvl-${stat}`);
        const costEl = document.getElementById(`cost-${stat}`);
        const barEl = document.getElementById(`bar-${stat}`);
        const btnEl = document.getElementById(`btn-up-${stat}`);

        if (lvlEl) lvlEl.textContent = `LVL ${lvl}`;
        if (barEl) barEl.style.width = `${(lvl / 10) * 100}%`;

        if (cost !== null) {
          if (costEl) costEl.textContent = `${cost} ₺`;
          if (btnEl) {
            btnEl.disabled = (coins < cost);
            btnEl.classList.toggle('disabled', coins < cost);
          }
        } else {
          if (costEl) costEl.textContent = 'MAX';
          if (btnEl) {
            btnEl.disabled = true;
            btnEl.classList.add('disabled');
          }
        }
      });
    } else {
      unlockBtn.style.display = 'inline-block';
      unlockBtn.textContent = `KİLİDİ AÇ: ${cfg.price.toLocaleString('tr-TR')} ₺`;
      unlockBtn.disabled = (coins < cfg.price);
      playBtn.style.display = 'none';
      rightPanel.style.opacity = '0.4';
      rightPanel.style.pointerEvents = 'none';
    }

    this.renderCurrentPreview();
  }

  renderCurrentPreview() {
    const vId = this.vehicleKeys[this.currentVehicleIndex];
    const cfg = VEHICLE_CONFIGS[vId];
    const vData = window.vehicleStore.getVehicleData(vId);
    this.renderGaragePreview(cfg, vData);
  }

  renderGaragePreview(cfg, vData) {
    const canvas = document.getElementById('garage-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bodyColor = (vData && vData.customColor) ? vData.customColor : cfg.colorBody;
    const rimColor = (vData && vData.customRim) ? vData.customRim : cfg.colorRim;
    const hatId = (vData && vData.customHat) ? vData.customHat : 'cap';

    const bounce = this.previewBounce;
    if (this.previewBounce > 0) {
      this.previewBounce = Math.max(0, this.previewBounce - 1.5);
      requestAnimationFrame(() => this.renderCurrentPreview());
    }

    const fake = Object.create(VehiclePhysics.prototype);
    fake.config = cfg;
    fake.customColor = bodyColor;
    fake.customRim = rimColor;
    fake.customHat = hatId;
    fake.isNitroActive = false;
    fake.driver = { localX: -6, localY: -16, radius: 8, crashed: false };
    const rr = cfg.wheelRadius;
    const fr = cfg.wheelRadiusFront || rr;
    const wheel = (ox, oy, r) => ({ offsetX: ox, offsetY: oy, x: ox, y: oy + cfg.suspensionLength + bounce * 0.5, radius: r, rotation: 0, compression: 0 });
    const rearW = wheel(-cfg.wheelBase * 0.5, 6, rr);
    const frontW = wheel(cfg.wheelBase * 0.5, 6 + (rr - fr), fr);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height * 0.58 - bounce);
    ctx.scale(1.3, 1.3);
    fake.drawSuspension(ctx, rearW.offsetX, rearW.offsetY, 0);
    fake.drawSuspension(ctx, frontW.offsetX, frontW.offsetY, 0);
    fake.drawVehicleChassis(ctx);
    fake.drawDriver(ctx);
    const cam = { x: 0, y: 0 };
    fake.drawWheel(ctx, rearW, cam);
    fake.drawWheel(ctx, frontW, cam);
    ctx.restore();
  }

  updateHUD(physics) {
    const c = this.hudCache || (this.hudCache = {});
    const set = (id, txt) => {
      if (c[id] === txt) return;
      c[id] = txt;
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };
    const bar = (id, pct) => {
      pct = Math.max(0, Math.round(pct));
      if (c[id] === pct) return;
      c[id] = pct;
      const el = document.getElementById(id);
      if (el) el.style.width = `${pct}%`;
    };

    const fuelPct = (physics.fuel / physics.maxFuel) * 100;
    bar('hud-fuel-bar', fuelPct);
    const low = fuelPct < 22;
    if (c.low !== low) {
      c.low = low;
      const fb = document.getElementById('hud-fuel-bar');
      if (fb) fb.parentElement.parentElement.classList.toggle('low-fuel', low);
    }
    bar('hud-nitro-bar', (physics.nitro / physics.maxNitro) * 100);
    set('hud-distance', `${physics.distance}m`);
    set('hud-coins', `${window.vehicleStore.getCoins()} ₺`);
    set('hud-speed', `${Math.floor(Math.abs(physics.vx) * 3.6)} km/h`);
  }

  showGameOver(physics, runCoins, isRecord) {
    document.getElementById('screen-hud').style.display = 'none';
    document.getElementById('screen-gameover').style.display = 'flex';

    document.getElementById('go-distance').textContent = `${physics.distance} m`;
    document.getElementById('go-run-coins').textContent = `+${runCoins} ₺`;
    const bestEl = document.getElementById('go-best');
    if (bestEl) {
      const b = (window.vehicleStore.data.bestByBiome || {})[window.terrainSystem.biome] || 0;
      bestEl.textContent = `${b} m${isRecord ? ' 🏆 YENİ!' : ''}`;
    }
    document.getElementById('go-total-coins').textContent = `${window.vehicleStore.getCoins()} ₺`;

    const reasonEl = document.getElementById('go-reason');
    if (physics.crashed) {
      reasonEl.textContent = 'BOYUN KIRILDI!';
    } else if (physics.outOfFuel) {
      reasonEl.textContent = 'BENZİN BİTTİ!';
    } else {
      reasonEl.textContent = 'OYUN BİTTİ!';
    }
  }
}

window.uiController = new UIController();
