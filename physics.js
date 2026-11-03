// ============================================================
// ZİRVE FIRTINASI - Kararlı 2D Fizik, Nitro Boost & Modifiye Desteği
// ============================================================

class VehiclePhysics {
  constructor(config, upgradeData) {
    this.config = config;
    this.upgrades = upgradeData || { engine: 1, tires: 1, suspension: 1, fourwd: 1, tank: 1 };

    this.customColor = (upgradeData && upgradeData.customColor) ? upgradeData.customColor : this.config.colorBody;
    this.customRim = (upgradeData && upgradeData.customRim) ? upgradeData.customRim : this.config.colorRim;
    this.customHat = (upgradeData && upgradeData.customHat) ? upgradeData.customHat : 'cap';

    this.gravity = 0.36;
    this.airResistance = 0.996;
    this.angularDamping = 0.94;

    this.x = 120;
    this.y = 350;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.angularVelocity = 0;

    this.spawnSafetyTimer = 3.5;
    this.upsideDownTimer = 0;

    // Nitro Sistemi
    this.nitro = 60;
    this.maxNitro = 100;
    this.isNitroActive = false;

    this.calcStats();

    // Tekerlekler
    this.rearWheel = {
      offsetX: -this.config.wheelBase * 0.5,
      offsetY: 6,
      x: 0,
      y: 0,
      radius: this.config.wheelRadius,
      isGrounded: false,
      rotation: 0,
      compression: 0
    };

    this.frontWheel = {
      offsetX: this.config.wheelBase * 0.5,
      offsetY: 6 + (this.config.wheelRadius - (this.config.wheelRadiusFront || this.config.wheelRadius)),
      x: 0,
      y: 0,
      radius: this.config.wheelRadiusFront || this.config.wheelRadius,
      isGrounded: false,
      rotation: 0,
      compression: 0
    };

    // Sürücü Kafası
    this.driver = {
      localX: -6,
      localY: -16,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 8,
      crashed: false
    };

    this.rpm = 0;
    this.airTime = 0;
    this.accumulatedAirAngle = 0;
    this.isAirborne = false;
    this.distance = 0;
    this.crashed = false;
    this.outOfFuel = false;
    this.throttleSmooth = 0;

    this.reset(120);
  }

  calcStats() {
    const eng = this.upgrades.engine || 1;
    const tire = this.upgrades.tires || 1;
    const susp = this.upgrades.suspension || 1;
    const fwd = this.upgrades.fourwd || 1;
    const tnk = this.upgrades.tank || 1;

    const baseEng = this.config.baseEngine || 1.0;
    const baseGrip = this.config.baseGrip || 1.0;
    const baseSusp = this.config.baseSuspension || 1.0;

    this.motorPower = (0.25 + (eng - 1) * 0.035) * baseEng;
    this.maxSpeed = 19 + (eng - 1) * 1.5;
    this.grip = (1.05 + (tire - 1) * 0.12) * baseGrip;
    this.springStiffness = (0.08 + (susp - 1) * 0.01) * baseSusp;
    this.springDamping = 0.35 + (susp - 1) * 0.02;
    this.fourWheelDrive = (fwd > 1) || this.config.type === 'tank' || this.config.type === 'monster';

    this.maxFuel = 100 + (tnk - 1) * 12;
    this.fuel = this.maxFuel;
  }

  reset(startX = 120) {
    const terrain = window.terrainSystem;
    this.x = startX;

    const rwX = startX - this.config.wheelBase * 0.5;
    const fwX = startX + this.config.wheelBase * 0.5;
    const rwGroundY = terrain.getHeight(rwX);
    const fwGroundY = terrain.getHeight(fwX);

    const slopeAngle = Math.atan2(fwGroundY - rwGroundY, this.config.wheelBase);
    this.angle = slopeAngle;
    this.angularVelocity = 0;

    const eqCompression = (this.gravity * 0.5) / this.springStiffness;
    const avgGroundY = (rwGroundY + fwGroundY) * 0.5;
    this.y = avgGroundY - this.rearWheel.offsetY - this.config.suspensionLength - this.config.wheelRadius + eqCompression;

    this.vx = 0;
    this.vy = 0;

    this.fuel = this.maxFuel;
    this.nitro = 60;
    this.isNitroActive = false;
    this.rpm = 0;
    this.airTime = 0;
    this.accumulatedAirAngle = 0;
    this.isAirborne = false;
    this.distance = 0;
    this.crashed = false;
    this.outOfFuel = false;
    this.driver.crashed = false;
    this.spawnSafetyTimer = 3.5;
    this.upsideDownTimer = 0;
    this.throttleSmooth = 0;

    this.updateWheelPositions();
  }

  // --- Akıcılık: çizim interpolasyonu için durum anlık görüntüsü ---
  getState(useDy) {
    const r = this.rearWheel, f = this.frontWheel, d = this.driver;
    return [this.x, this.y, this.angle,
      r.x, useDy ? r.dy : r.y, r.rotation, f.x, useDy ? f.dy : f.y, f.rotation,
      d.x, d.y, r.compSmooth || 0, f.compSmooth || 0];
  }

  applyState(s) {
    const r = this.rearWheel, f = this.frontWheel, d = this.driver;
    this.x = s[0]; this.y = s[1]; this.angle = s[2];
    r.x = s[3]; r.y = s[4]; r.rotation = s[5];
    f.x = s[6]; f.y = s[7]; f.rotation = s[8];
    d.x = s[9]; d.y = s[10]; r.compSmooth = s[11]; f.compSmooth = s[12];
  }

  snapshot() {
    this.prev = this.getState(true);
  }

  smoothVisuals() {
    for (const w of [this.rearWheel, this.frontWheel]) {
      w.dy = (w.dy === undefined) ? w.y : w.dy + (w.y - w.dy) * 0.55;
      w.compSmooth = (w.compSmooth || 0) + (w.compression - (w.compSmooth || 0)) * 0.3;
    }
  }

  localToWorld(lx, ly) {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return {
      x: this.x + (lx * cos - ly * sin),
      y: this.y + (lx * sin + ly * cos)
    };
  }

  updateWheelPositions() {
    const rw = this.localToWorld(this.rearWheel.offsetX, this.rearWheel.offsetY + this.config.suspensionLength);
    const fw = this.localToWorld(this.frontWheel.offsetX, this.frontWheel.offsetY + this.config.suspensionLength);
    this.rearWheel.x = rw.x;
    this.rearWheel.y = rw.y;
    this.frontWheel.x = fw.x;
    this.frontWheel.y = fw.y;

    const head = this.localToWorld(this.driver.localX, this.driver.localY);
    this.driver.x = head.x;
    this.driver.y = head.y;
  }

  update(input, dt) {
    if (this.crashed) {
      this.vy += this.gravity;
      this.vx *= 0.98;
      this.x += this.vx;
      this.y += this.vy;
      this.angularVelocity *= 0.95;
      this.angle += this.angularVelocity;

      this.driver.vy += this.gravity;
      this.driver.x += this.driver.vx;
      this.driver.y += this.driver.vy;
      this.smoothVisuals();
      return;
    }

    const terrain = window.terrainSystem;
    this.gravity = terrain.getCurrentTheme().gravity;
    this.distance = Math.max(0, Math.floor(this.x / 20));

    // Görev takibi mesafe kaydı
    if (window.questManager) {
      window.questManager.recordDistance(this.distance);
    }

    if (this.spawnSafetyTimer > 0) {
      this.spawnSafetyTimer -= dt;
    }

    const gasInput = input.gas ? 1 : 0;
    const brakeInput = input.brake ? 1 : 0;
    const nitroInput = input.nitro && this.nitro > 0;

    // Nitro Durumu
    if (nitroInput && !this.outOfFuel) {
      this.isNitroActive = true;
      this.nitro = Math.max(0, this.nitro - 0.45);
      const exhaustPt = this.localToWorld(-this.config.chassisWidth * 0.55, 4);
      window.particleSystem.emitNitroFlame(exhaustPt.x, exhaustPt.y, this.angle);
    } else {
      this.isNitroActive = false;
      this.nitro = Math.min(this.maxNitro, this.nitro + 0.04); // Yavaş şarj
    }

    this.throttleSmooth += (gasInput - this.throttleSmooth) * 0.2;

    // Benzin Tüketimi
    if (gasInput > 0 || this.isNitroActive) {
      const burn = this.isNitroActive ? 0.05 : 0.026;
      this.fuel = Math.max(0, this.fuel - burn);
      if (this.fuel <= 0) this.outOfFuel = true;
    }

    this.vy += this.gravity;

    // Tekerlek simülasyonları
    this.simulateWheel(this.rearWheel, true, this.throttleSmooth, brakeInput, terrain);
    this.simulateWheel(this.frontWheel, this.fourWheelDrive, this.throttleSmooth, brakeInput, terrain);

    const bothAirborne = !this.rearWheel.isGrounded && !this.frontWheel.isGrounded;

    // Yerdeyken araç arazi eğimine kendiliğinden hizalanır (devrilmeyi / ters takla atmayı önler)
    const gR = this.rearWheel.isGrounded, gF = this.frontWheel.isGrounded;
    if (gR || gF) {
      const wb = this.config.wheelBase;
      const slopeAng = Math.atan2(terrain.getHeight(this.x + wb * 0.5) - terrain.getHeight(this.x - wb * 0.5), wb);
      let diff = slopeAng - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.angularVelocity += diff * ((gR && gF) ? 0.03 : 0.01);
      if (gR && gF) this.angularVelocity *= 0.9;
    }
    this.angularVelocity = Math.max(-0.11, Math.min(0.11, this.angularVelocity));

    // Havada Takla Kontrolleri
    if (bothAirborne) {
      this.airTime += dt;
      this.isAirborne = true;

      const sens = { low: 0.7, normal: 1, high: 1.4 }[window.vehicleStore.getSettings().sensitivity] || 1;
      const tiltPower = 0.004 * sens;
      if (gasInput) this.angularVelocity -= tiltPower;
      if (brakeInput) this.angularVelocity += tiltPower;

      this.accumulatedAirAngle += this.angularVelocity;
      if (Math.abs(this.accumulatedAirAngle) >= Math.PI * 2) {
        const isBackflip = this.accumulatedAirAngle < 0;
        const reward = 500;
        window.vehicleStore.addCoins(reward);
        window.soundManager.playFlip();
        window.particleSystem.addFloatingText(isBackflip ? 'GERİ TAKLA! +500 ₺' : 'ÖN TAKLA! +500 ₺', this.x, this.y - 60, '#f1c40f');
        if (window.questManager) window.questManager.recordFlip(isBackflip);
        this.accumulatedAirAngle = 0;
      }
    } else {
      if (this.isAirborne && this.airTime > 1.2) {
        const airBonus = Math.floor(this.airTime * 70);
        window.vehicleStore.addCoins(airBonus);
        window.particleSystem.addFloatingText(`UÇUŞ ${this.airTime.toFixed(1)}s! +${airBonus} ₺`, this.x, this.y - 50, '#2ecc71');
        if (window.questManager) window.questManager.recordAirtime(this.airTime);
        window.particleSystem.triggerShake(4, 0.2); // İnişte sarsıntı
      }
      this.airTime = 0;
      this.accumulatedAirAngle = 0;
      this.isAirborne = false;
    }

    this.vx *= this.airResistance;
    this.vy *= this.airResistance;
    this.angularVelocity *= this.angularDamping;

    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.angularVelocity;

    // Sürücü Kafası Yaylanması
    const headTarget = this.localToWorld(this.driver.localX, this.driver.localY);
    this.driver.vx += (headTarget.x - this.driver.x) * 0.45;
    this.driver.vy += (headTarget.y - this.driver.y) * 0.45;
    this.driver.vx *= 0.65;
    this.driver.vy *= 0.65;
    this.driver.x += this.driver.vx;
    this.driver.y += this.driver.vy;

    // Şasi Altı Zemin Desteği
    const bottomPt = this.localToWorld(0, this.config.chassisHeight * 0.35);
    const groundY = terrain.getHeight(bottomPt.x);
    if (bottomPt.y >= groundY) {
      const pen = bottomPt.y - groundY;
      this.y -= Math.min(2, pen * 0.3);
      this.vy = Math.min(0, this.vy * -0.05);
      this.vx *= 0.96;
      this.angularVelocity *= 0.85;
    }

    // Adil Kaza Kontrolü
    if (this.spawnSafetyTimer <= 0) {
      const normalizedAngle = Math.abs(Math.atan2(Math.sin(this.angle), Math.cos(this.angle)));
      const isUpsideDown = normalizedAngle > 2.4;

      if (isUpsideDown) {
        this.upsideDownTimer += dt;
      } else {
        this.upsideDownTimer = Math.max(0, this.upsideDownTimer - dt * 3);
      }

      const headGround = terrain.getHeight(this.driver.x);
      const headTouchesGround = (this.driver.y + this.driver.radius >= headGround + 4);

      if (isUpsideDown && (headTouchesGround || this.upsideDownTimer > 2.0)) {
        this.crashDriver();
      }
    }

    // Motor Sesi ve Hız Kaydı
    let targetRpm = 0.1;
    if (gasInput && !this.outOfFuel) {
      targetRpm = bothAirborne ? 0.95 : 0.4 + (Math.abs(this.vx) / this.maxSpeed) * 0.6;
    }
    this.rpm += (targetRpm - this.rpm) * 0.15;
    window.soundManager.updateEngine(this.rpm, !bothAirborne, gasInput, this.isNitroActive);

    this.smoothVisuals();

    const kmh = Math.floor(Math.abs(this.vx) * 3.6);
    if (window.questManager) window.questManager.recordSpeed(kmh);
  }

  simulateWheel(wheel, isDriveWheel, gas, brake, terrain) {
    const anchor = this.localToWorld(wheel.offsetX, wheel.offsetY);
    const restY = anchor.y + this.config.suspensionLength;
    const groundY = terrain.getHeight(anchor.x);
    const normal = terrain.getNormal(anchor.x);

    const penetration = (restY + wheel.radius) - groundY;

    if (penetration > 0) {
      wheel.isGrounded = true;
      wheel.compression = Math.min(1.0, penetration / this.config.suspensionLength);

      const leverX = wheel.offsetX * Math.cos(this.angle) - wheel.offsetY * Math.sin(this.angle);
      const vertSpeed = this.vy + (leverX * this.angularVelocity);

      const springF = penetration * this.springStiffness;
      const dampF = vertSpeed * this.springDamping;
      const totalF = Math.max(0, Math.min(this.gravity * 2.2, springF + dampF));

      this.vy -= totalF * normal.ny;
      this.vx -= totalF * normal.nx * 0.5;
      this.angularVelocity -= (leverX * totalF * 0.0016);

      const tx = Math.cos(normal.angle);
      const ty = Math.sin(normal.angle);

      // Gaz & Nitro İtmesi
      if ((gas > 0 || this.isNitroActive) && !this.outOfFuel && isDriveWheel) {
        const topSpeed = this.isNitroActive ? this.maxSpeed * 1.5 : this.maxSpeed;
        const power = (this.motorPower * gas) + (this.isNitroActive ? 0.28 : 0);

        if (Math.abs(this.vx) < topSpeed) {
          this.vx += tx * power * this.grip;
          this.vy += ty * power * this.grip;
        }

        if (Math.random() < 0.2) {
          window.particleSystem.emitDirt(anchor.x, groundY, -tx * 3, -2);
        }
      }

      // Fren
      if (brake) {
        if (this.vx > 0.4) {
          this.vx -= tx * 0.45 * this.grip;
          this.vy -= ty * 0.45 * this.grip;
        } else if (!this.outOfFuel) {
          this.vx -= tx * 0.25 * this.grip;
          this.vy -= ty * 0.25 * this.grip;
        }
      }

      wheel.x = anchor.x;
      wheel.y = groundY - wheel.radius;
      wheel.rotation += this.vx * 0.08;
    } else {
      wheel.isGrounded = false;
      wheel.compression = 0;
      wheel.x = anchor.x;
      wheel.y = restY;
      wheel.rotation += this.vx * 0.08;
    }
  }

  crashDriver() {
    if (this.crashed) return;
    this.crashed = true;
    this.driver.crashed = true;
    this.driver.vx = this.vx + (Math.random() - 0.5) * 5;
    this.driver.vy = -5;

    window.soundManager.playCrash();
    window.particleSystem.emitCoinBurst(this.driver.x, this.driver.y);
    window.particleSystem.addFloatingText('BOYUN KIRILDI!', this.x, this.y - 60, '#e74c3c');
    window.particleSystem.triggerShake(8, 0.4);

    const settings = window.vehicleStore.getSettings();
    if (settings.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Ön Far Işık Huzmesi (Headlight beam)
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    const headlightGrad = ctx.createRadialGradient(this.config.chassisWidth * 0.5 + 4, 0, 5, this.config.chassisWidth * 0.5 + 160, 20, 180);
    headlightGrad.addColorStop(0, 'rgba(255, 241, 118, 0.45)');
    headlightGrad.addColorStop(0.7, 'rgba(255, 241, 118, 0.08)');
    headlightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = headlightGrad;
    ctx.beginPath();
    ctx.moveTo(this.config.chassisWidth * 0.5 + 4, -4);
    ctx.lineTo(this.config.chassisWidth * 0.5 + 220, -50);
    ctx.lineTo(this.config.chassisWidth * 0.5 + 240, 70);
    ctx.closePath();
    ctx.fill();

    // 1. Süspansiyon Yayları
    this.drawSuspension(ctx, this.rearWheel.offsetX, this.rearWheel.offsetY, this.rearWheel.compSmooth || 0);
    this.drawSuspension(ctx, this.frontWheel.offsetX, this.frontWheel.offsetY, this.frontWheel.compSmooth || 0);

    // 2. Gövde
    this.drawVehicleChassis(ctx);

    // 3. Sürücü (Bill)
    this.drawDriver(ctx);

    ctx.restore();

    // 4. Tekerlekler
    this.drawWheel(ctx, this.rearWheel, camera);
    this.drawWheel(ctx, this.frontWheel, camera);
  }

  drawSuspension(ctx, lx, ly, comp) {
    const botY = ly + this.config.suspensionLength * (1 - comp * 0.5);
    ctx.strokeStyle = '#555e68';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, botY);
    ctx.stroke();

    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const count = 4;
    const step = (botY - ly) / count;
    ctx.moveTo(lx, ly);
    for (let i = 0; i < count; i++) {
      const cy = ly + i * step;
      const off = (i % 2 === 0 ? 5 : -5);
      ctx.lineTo(lx + off, cy + step * 0.5);
      ctx.lineTo(lx, cy + step);
    }
    ctx.stroke();
  }

  drawVehicleChassis(ctx) {
    const type = this.config.type;
    const w = this.config.chassisWidth;
    const h = this.config.chassisHeight;
    const halfW = w * 0.5;

    const bodyColor = this.customColor || this.config.colorBody;

    ctx.save();
    const box = (x, y, bw, bh, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, bw, bh); ctx.strokeStyle = '#1b2028'; ctx.lineWidth = 3; ctx.strokeRect(x, y, bw, bh); };
    const glass = 'rgba(174, 214, 241, 0.85)';
    const sec = this.config.colorSecondary;

    if (type === 'bike') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.7, h * 0.3);
      ctx.lineTo(halfW * 0.75, -h * 0.2);
      ctx.lineTo(halfW * 0.25, -h * 0.6);
      ctx.lineTo(-halfW * 0.35, -h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1b2028';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.2, h * 0.1);
      ctx.lineTo(-halfW * 0.8, -h * 0.1);
      ctx.stroke();

      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(halfW * 0.25, -h * 0.85, 5, 16);

    } else if (type === 'monster') {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-halfW, -h * 0.3, w, h * 0.6);
      ctx.strokeStyle = '#1b2028';
      ctx.lineWidth = 3;
      ctx.strokeRect(-halfW, -h * 0.3, w, h * 0.6);

      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(-halfW * 0.3, -h * 0.75, halfW * 0.95, h * 0.45);
      ctx.strokeRect(-halfW * 0.3, -h * 0.75, halfW * 0.95, h * 0.45);

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-halfW * 0.2 + i * 14, -h * 0.92, 10, 6);
        ctx.strokeRect(-halfW * 0.2 + i * 14, -h * 0.92, 10, 6);
      }

      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-halfW, -h * 0.05, w, 6);

    } else if (type === 'rally') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-halfW, h * 0.35);
      ctx.lineTo(halfW, h * 0.35);
      ctx.lineTo(halfW * 0.9, -h * 0.1);
      ctx.lineTo(halfW * 0.2, -h * 0.6);
      ctx.lineTo(-halfW * 0.6, -h * 0.6);
      ctx.lineTo(-halfW, -h * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1b2028';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#1b2028';
      ctx.fillRect(-halfW - 6, -h * 0.9, 12, 6);
      ctx.fillRect(-halfW, -h * 0.7, 4, 12);

      ctx.fillStyle = '#1b2028';
      ctx.fillRect(halfW - 4, h * 0.3, 10, 4);

    } else if (type === 'f1') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-halfW, h * 0.4);
      ctx.lineTo(halfW, h * 0.4);
      ctx.lineTo(halfW * 0.8, -h * 0.1);
      ctx.lineTo(halfW * 0.2, -h * 0.4);
      ctx.lineTo(-halfW * 0.4, -h * 0.4);
      ctx.lineTo(-halfW, -h * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1b2028';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#111111';
      ctx.fillRect(halfW * 0.6, h * 0.3, 20, 6);

      ctx.fillStyle = '#111111';
      ctx.fillRect(-halfW - 10, -h * 0.9, 16, 8);
      ctx.fillRect(-halfW, -h * 0.6, 5, 14);

    } else if (type === 'lunar') {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-halfW, -h * 0.2, w, h * 0.5);
      ctx.strokeStyle = '#7f8c8d';
      ctx.lineWidth = 3;
      ctx.strokeRect(-halfW, -h * 0.2, w, h * 0.5);

      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-halfW * 0.4, -h * 0.8, 14, Math.PI * 0.8, Math.PI * 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.4, -h * 0.8);
      ctx.lineTo(-halfW * 0.4, -h * 0.2);
      ctx.stroke();

    } else if (type === 'tank') {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-halfW, -h * 0.2, w, h * 0.6);
      ctx.strokeStyle = '#1b2028';
      ctx.lineWidth = 3;
      ctx.strokeRect(-halfW, -h * 0.2, w, h * 0.6);

      ctx.fillStyle = this.config.colorSecondary;
      ctx.fillRect(-halfW * 0.2, -h * 0.7, halfW * 0.8, h * 0.5);
      ctx.strokeRect(-halfW * 0.2, -h * 0.7, halfW * 0.8, h * 0.5);

      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(halfW * 0.6, -h * 0.55, 32, 8);
      ctx.strokeRect(halfW * 0.6, -h * 0.55, 32, 8);

    } else if (type === 'tractor') {
      box(-halfW * 0.3, -h * 0.15, halfW * 1.3, h * 0.5, bodyColor);
      box(-halfW, -h * 0.85, halfW * 0.85, h * 0.9, sec);
      box(-halfW * 0.85, -h * 0.7, halfW * 0.55, h * 0.35, glass);
      box(halfW * 0.7, -h * 0.9, 6, h * 0.75, '#555e68');
    } else if (type === 'pickup') {
      box(-halfW, -h * 0.15, w, h * 0.5, bodyColor);
      box(-halfW * 0.1, -h * 0.7, halfW * 0.85, h * 0.55, bodyColor);
      box(halfW * 0.05, -h * 0.6, halfW * 0.5, h * 0.35, glass);
      box(-halfW, -h * 0.35, halfW * 0.8, h * 0.2, sec);
    } else if (type === 'buggy') {
      box(-halfW, -h * 0.1, w, h * 0.45, bodyColor);
      ctx.strokeStyle = sec; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-halfW * 0.6, -h * 0.1); ctx.lineTo(-halfW * 0.35, -h * 1.0);
      ctx.lineTo(halfW * 0.3, -h * 1.0); ctx.lineTo(halfW * 0.55, -h * 0.1);
      ctx.stroke();
    } else if (type === 'hover') {
      ctx.fillStyle = bodyColor; ctx.strokeStyle = '#1b2028'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, halfW, h * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = glass;
      ctx.beginPath(); ctx.ellipse(halfW * 0.1, -h * 0.25, halfW * 0.4, h * 0.5, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      box(-halfW - 8, -h * 0.5, 8, h * 0.8, sec);
    } else if (type === 'dragster') {
      ctx.fillStyle = bodyColor; ctx.strokeStyle = '#1b2028'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-halfW, h * 0.4); ctx.lineTo(halfW, h * 0.4); ctx.lineTo(halfW, 0);
      ctx.lineTo(-halfW * 0.2, -h * 0.35); ctx.lineTo(-halfW, -h * 0.1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      box(-halfW - 18, -h * 0.2, 20, h * 0.6, '#555e68');
      if (this.isNitroActive) {
        ctx.fillStyle = '#ff9f1a';
        ctx.beginPath(); ctx.moveTo(-halfW - 18, -h * 0.1); ctx.lineTo(-halfW - 46 - Math.random() * 14, h * 0.1); ctx.lineTo(-halfW - 18, h * 0.3); ctx.closePath(); ctx.fill();
      }
      box(halfW * 0.1, -h * 0.55, halfW * 0.3, h * 0.25, glass);
    } else if (['murat', 'anadol', 'sahin', 'toros', 'dogan', 'doblo', 'togg'].includes(type)) {
      const G = {
        murat:  { rb: -0.5,  rt: -0.38, ft: 0.12, fb: 0.42, roof: -0.68 },
        anadol: { rb: -0.6,  rt: -0.2,  ft: 0.05, fb: 0.45, roof: -0.58 },
        sahin:  { rb: -0.55, rt: -0.46, ft: 0.15, fb: 0.4,  roof: -0.72 },
        toros:  { rb: -0.55, rt: -0.42, ft: 0.12, fb: 0.46, roof: -0.68 },
        dogan:  { rb: -0.5,  rt: -0.3,  ft: 0.1,  fb: 0.45, roof: -0.62 },
        doblo:  { rb: -0.92, rt: -0.88, ft: 0.4,  fb: 0.58, roof: -0.98 },
        togg:   { rb: -0.6,  rt: -0.35, ft: 0.15, fb: 0.5,  roof: -0.8 }
      }[type];
      const belt = -h * 0.15, roofY = h * G.roof;
      ctx.fillStyle = bodyColor; ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-halfW, h * 0.35); ctx.lineTo(halfW, h * 0.35); ctx.lineTo(halfW, -h * 0.02);
      ctx.lineTo(halfW * 0.85, belt); ctx.lineTo(G.fb * halfW, belt);
      ctx.lineTo(G.ft * halfW, roofY); ctx.lineTo(G.rt * halfW, roofY);
      ctx.lineTo(G.rb * halfW, belt); ctx.lineTo(-halfW * 0.95, belt); ctx.lineTo(-halfW, -h * 0.05);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Camlar
      ctx.fillStyle = glass;
      ctx.beginPath();
      ctx.moveTo(G.rb * halfW + 3, belt - 2); ctx.lineTo(G.rt * halfW + 3, roofY + 4);
      ctx.lineTo(G.ft * halfW - 3, roofY + 4); ctx.lineTo(G.fb * halfW - 3, belt - 2);
      ctx.closePath(); ctx.fill();
      ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); const bx = (G.rt + G.ft) * 0.5 * halfW;
      ctx.moveTo(bx, roofY + 4); ctx.lineTo(bx, belt - 2); ctx.stroke();
      // Şerit
      if (type !== 'togg') {
        ctx.strokeStyle = sec; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-halfW + 2, h * 0.12); ctx.lineTo(halfW - 2, h * 0.12); ctx.stroke();
      }
      // Farlar & stop lambaları
      ctx.fillStyle = type === 'togg' ? '#00f0ff' : '#fff6a5';
      if (type === 'anadol') { ctx.beginPath(); ctx.arc(halfW - 4, h * 0.05, 4, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(halfW - 6, h * 0.0, type === 'togg' ? 6 : 7, type === 'togg' ? 4 : 8);
      ctx.fillStyle = type === 'togg' ? '#ff4757' : '#c0392b';
      ctx.fillRect(-halfW, h * 0.0, type === 'togg' ? 3 : 5, type === 'togg' ? 4 : 8);
      // Tamponlar
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(halfW - 2, h * 0.22, 6, 5); ctx.fillRect(-halfW - 4, h * 0.22, 6, 5);
      if (type === 'toros') {
        ctx.fillStyle = '#fff'; ctx.fillRect(-halfW * 0.12, roofY - 8, 18, 8);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.strokeRect(-halfW * 0.12, roofY - 8, 18, 8);
        ctx.fillStyle = '#111'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('TAKSİ', -halfW * 0.12 + 9, roofY - 2);
      }
      if (type === 'doblo') {
        ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-halfW * 0.1, belt); ctx.lineTo(-halfW * 0.1, h * 0.33); ctx.stroke();
      }
    } else {
      // Klasik Jeep
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-halfW, h * 0.35);
      ctx.lineTo(halfW, h * 0.35);
      ctx.lineTo(halfW, -h * 0.15);
      ctx.lineTo(halfW * 0.4, -h * 0.15);
      ctx.lineTo(halfW * 0.2, -h * 0.6);
      ctx.lineTo(-halfW * 0.7, -h * 0.6);
      ctx.lineTo(-halfW, -h * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'rgba(174, 214, 241, 0.85)';
      ctx.beginPath();
      ctx.moveTo(halfW * 0.18, -h * 0.55);
      ctx.lineTo(halfW * 0.38, -h * 0.18);
      ctx.lineTo(-halfW * 0.1, -h * 0.18);
      ctx.lineTo(-halfW * 0.1, -h * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-halfW - 8, -h * 0.35, 8, 20);
      ctx.strokeRect(-halfW - 8, -h * 0.35, 8, 20);

      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(halfW, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawDriver(ctx) {
    if (this.driver.crashed) return;

    ctx.save();
    const lx = this.driver.localX;
    const ly = this.driver.localY;

    // Vücut
    ctx.fillStyle = '#3498db';
    ctx.fillRect(lx - 5, ly + 6, 12, 12);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(lx - 5, ly + 6, 12, 12);

    // Kafa
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(lx, ly, this.driver.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Modifiye Şapka
    const hat = this.customHat || 'cap';
    if (hat === 'helmet') {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(lx, ly - 1, this.driver.radius + 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(lx + 2, ly - 3, 7, 5);
    } else if (hat === 'crown') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(lx - 8, ly - 4);
      ctx.lineTo(lx - 8, ly - 14);
      ctx.lineTo(lx - 3, ly - 8);
      ctx.lineTo(lx, ly - 16);
      ctx.lineTo(lx + 3, ly - 8);
      ctx.lineTo(lx + 8, ly - 14);
      ctx.lineTo(lx + 8, ly - 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b7950b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (hat === 'viking') {
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath(); ctx.arc(lx, ly - 1, this.driver.radius + 1.5, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath(); ctx.moveTo(lx - 9, ly - 3); ctx.lineTo(lx - 15, ly - 13); ctx.lineTo(lx - 6, ly - 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(lx + 9, ly - 3); ctx.lineTo(lx + 15, ly - 13); ctx.lineTo(lx + 6, ly - 7); ctx.fill();
    } else if (hat === 'cowboy') {
      ctx.fillStyle = '#795548';
      ctx.fillRect(lx - 12, ly - 6, 24, 4);
      ctx.fillRect(lx - 6, ly - 14, 12, 9);
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx - 12, ly - 6, 24, 4);
    } else {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(lx, ly - 2, this.driver.radius, Math.PI, 0);
      ctx.lineTo(lx + 13, ly - 2);
      ctx.lineTo(lx + 8, ly - 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Göz
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(lx + 4, ly, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawWheel(ctx, wheel, camera) {
    const sx = wheel.x - camera.x;
    const sy = wheel.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(wheel.rotation);

    ctx.fillStyle = this.config.colorWheel;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b2028';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (this.config.type === 'monster') {
      ctx.fillStyle = '#111115';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(wheel.radius - 4, -4, 5, 8);
        ctx.restore();
      }
    }

    const rimColor = this.customRim || this.config.colorRim;
    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (wheel.radius * 0.55), Math.sin(a) * (wheel.radius * 0.55));
      ctx.stroke();
    }

    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.VehiclePhysics = VehiclePhysics;
