// ============================================================
// ZİRVE FIRTINASI - Zengin Çevre, 4 Biyom & Mesafe Bayrakları
// Yeşil Tepeler, Altın Çöl, Kutup Dağları & Volkanik Cehennem
// ============================================================

class TerrainSystem {
  constructor() {
    this.biome = 'country';
    this.collectibles = [];
    this.checkpoints = [];
    this.scenery = [];
    this.lastGeneratedX = 0;
    this.chunkSize = 300;

    // 4 Efsanevi Biyom
    this.biomes = {
      country: {
        name: 'Yeşil Tepeler',
        sky: '#5dade2',
        skyBottom: '#aed6f1',
        mountainFar: '#27ae60',
        mountainNear: '#229954',
        groundTop: '#2ecc71',
        groundSoil: '#795548',
        dirtColor: '#5d4037',
        gravity: 0.36
      },
      desert: {
        name: 'Altın Çöl',
        sky: '#f39c12',
        skyBottom: '#f9e79f',
        mountainFar: '#d35400',
        mountainNear: '#e67e22',
        groundTop: '#f1c40f',
        groundSoil: '#d68910',
        dirtColor: '#b9770e',
        gravity: 0.36
      },
      arctic: {
        name: 'Kutup Dağları',
        sky: '#2980b9',
        skyBottom: '#d4e6f1',
        mountainFar: '#1f618d',
        mountainNear: '#2471a3',
        groundTop: '#ffffff',
        groundSoil: '#34495e',
        dirtColor: '#2c3e50',
        gravity: 0.36
      },
      volcano: {
        name: 'Volkanik Dağ',
        sky: '#922b21',
        skyBottom: '#d35400',
        mountainFar: '#4a235a',
        mountainNear: '#641e16',
        groundTop: '#e74c3c',
        groundSoil: '#1c1c1c',
        dirtColor: '#17202a',
        gravity: 0.38
      },
      moon: {
        name: 'Ay Yüzeyi',
        sky: '#0b0d2a',
        skyBottom: '#3b3f73',
        mountainFar: '#4b4f7a',
        mountainNear: '#6c708f',
        groundTop: '#d5d8e0',
        groundSoil: '#7f8497',
        dirtColor: '#4a4f63',
        gravity: 0.18
      }
    };

    this.checkpointDistances = [100, 250, 500, 750, 1000, 1500, 2000, 3000];
  }

  setBiome(key) {
    if (this.biomes[key]) this.biome = key;
  }

  getCurrentTheme() {
    return this.biomes[this.biome];
  }

  reset() {
    this.collectibles = [];
    this.checkpoints = [];
    this.scenery = [];
    this.lastGeneratedX = 0;

    // Kontrol noktası bayraklarını hazırla
    for (const d of this.checkpointDistances) {
      const worldX = d * 20; // 1 metre = 20px
      this.checkpoints.push({
        distance: d,
        x: worldX,
        passed: false
      });
    }

    this.generateAhead(1600);
  }

  getHeight(x) {
    if (x < 280) return 420;

    const rawBlend = Math.min(1.0, (x - 280) / 250);
    const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);

    const f1 = Math.sin((x - 280) * 0.0035) * 90;
    const f2 = Math.sin((x - 280) * 0.0075 + 0.8) * 34;
    const f3 = Math.sin((x - 280) * 0.018) * 7;

    const jumpWave = Math.sin(x * 0.011);
    const jt = (jumpWave > 0.85) ? (jumpWave - 0.85) / 0.15 : 0;
    const ramp = jt * jt * (3 - 2 * jt) * 8; // yumuşak kalkış rampası

    // Mesafe arttıkça tepeler dikleşir (zorluk eğrisi, 1000m'de ~%50)
    const diff = 1 + Math.min(0.5, (x - 280) / 60000);
    return 420 + (f1 + f2 + f3 - ramp) * blend * diff;
  }

  getNormal(x) {
    const delta = 2.0;
    const y1 = this.getHeight(x - delta);
    const y2 = this.getHeight(x + delta);
    const dx = delta * 2;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    return {
      nx: -dy / len,
      ny: dx / len,
      angle: Math.atan2(dy, dx)
    };
  }

  generateAhead(targetX) {
    while (this.lastGeneratedX < targetX) {
      const x = this.lastGeneratedX;

      if (x > 380) {
        // 1. Benzin Bidonları (Her ~550px'de bir düzenli)
        if (Math.floor(x / 550) > Math.floor((x - this.chunkSize) / 550)) {
          this.collectibles.push({
            type: 'fuel',
            x: x + 80,
            y: this.getHeight(x + 80) - 30,
            radius: 18,
            collected: false
          });
        }

        // 2. Mavi Nitro Tüpleri (~800px'de bir)
        if (Math.floor(x / 800) > Math.floor((x - this.chunkSize) / 800)) {
          this.collectibles.push({
            type: 'nitro',
            x: x + 180,
            y: this.getHeight(x + 180) - 32,
            radius: 18,
            collected: false
          });
        }

        // 3. Altın Paralar
        if (Math.random() < 0.48) {
          const count = 3 + Math.floor(Math.random() * 4);
          for (let i = 0; i < count; i++) {
            const cx = x + i * 38;
            const cy = this.getHeight(cx) - 28;
            this.collectibles.push({
              type: 'coin',
              x: cx,
              y: cy,
              radius: 13,
              collected: false
            });
          }
        }

        // 4. Parlayan Elmaslar (Nadir)
        if (Math.random() < 0.12) {
          const gx = x + 240;
          this.collectibles.push({
            type: 'gem',
            x: gx,
            y: this.getHeight(gx) - 40,
            radius: 16,
            collected: false
          });
        }

        // 5. Çevre Objeleri (Ağaçlar, Kaktüsler, Değirmenler)
        if (Math.random() < 0.35) {
          this.scenery.push({
            x: x + Math.random() * 150,
            type: (this.biome === 'desert') ? 'cactus' : ((this.biome === 'volcano' || this.biome === 'moon') ? 'rock' : 'tree')
          });
        }
      }

      this.lastGeneratedX += this.chunkSize;
    }

    if (this.collectibles.length > 250) {
      this.collectibles = this.collectibles.filter(item => !item.collected && item.x > targetX - 3500);
    }
    if (this.scenery.length > 100) {
      this.scenery = this.scenery.filter(s => s.x > targetX - 3500);
    }
  }

  checkCollectibles(box, onCollect) {
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const d = Math.hypot(item.x - box.x, item.y - box.y);
      if (d < item.radius + box.radius) {
        item.collected = true;
        onCollect(item);
      }
    }
  }

  checkCheckpoints(vehicleX, onPass) {
    for (const cp of this.checkpoints) {
      if (!cp.passed && vehicleX >= cp.x) {
        cp.passed = true;
        onPass(cp);
      }
    }
  }

  // --- Arka Plan Çizimi ---
  renderBackground(ctx, camera) {
    const theme = this.getCurrentTheme();
    const w = camera.width;
    const h = camera.height;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, theme.sky);
    skyGrad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Beyaz Bulutlar
    ctx.fillStyle = (this.biome === 'volcano') ? 'rgba(74, 35, 90, 0.5)' : 'rgba(255, 255, 255, 0.75)';
    const cloudSpeed = 0.03;
    const baseCloudX = -(camera.x * cloudSpeed);
    for (let i = 0; i < 5; i++) {
      const cx = ((((baseCloudX + i * 320) % (w + 400)) + (w + 400)) % (w + 400)) - 100;
      const cy = 60 + (i % 3) * 35;
      this.drawCloud(ctx, cx, cy);
    }

    this.drawHills(ctx, camera, 0.1, theme.mountainFar, h * 0.62, 70);
    this.drawHills(ctx, camera, 0.22, theme.mountainNear, h * 0.72, 50);
  }

  drawCloud(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 8, 26, 0, Math.PI * 2);
    ctx.arc(x + 44, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHills(ctx, camera, speed, color, baseY, amplitude) {
    const w = camera.width;
    const step = 160;
    const startX = Math.floor((camera.x * speed) / step) * step;
    const count = Math.ceil(w / step) + 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, camera.height);

    for (let i = 0; i <= count; i++) {
      const wx = startX + i * step;
      const sx = wx - (camera.x * speed);
      const sy = baseY - Math.sin(wx * 0.005) * amplitude;
      ctx.lineTo(sx, sy);
    }

    ctx.lineTo(camera.width, camera.height);
    ctx.closePath();
    ctx.fill();
  }

  // --- Zemin & Çevre Objelerinin Çizimi ---
  renderTerrain(ctx, camera) {
    const theme = this.getCurrentTheme();
    const step = 16;
    const startX = Math.floor(camera.x / step) * step - step * 2;
    const endX = startX + camera.width + step * 4;

    ctx.save();

    // 1. Toprak Gövdesi
    ctx.beginPath();
    ctx.moveTo(startX - camera.x, camera.height + 150);

    for (let x = startX; x <= endX; x += step) {
      const y = this.getHeight(x);
      ctx.lineTo(x - camera.x, y - camera.y);
    }

    ctx.lineTo(endX - camera.x, camera.height + 150);
    ctx.closePath();
    ctx.fillStyle = theme.groundSoil;
    ctx.fill();

    // 2. Üst Çim / Zemin Şeridi
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      const y = this.getHeight(x);
      if (x === startX) ctx.moveTo(x - camera.x, y - camera.y);
      else ctx.lineTo(x - camera.x, y - camera.y);
    }
    ctx.strokeStyle = theme.groundTop;
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.strokeStyle = theme.dirtColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // 3. Ağaçlar & Çevre Çizimi
    this.renderScenery(ctx, camera);

    // 4. Mesafe Bayrakları
    this.renderCheckpoints(ctx, camera);

    // 5. İtemler
    this.renderCollectibles(ctx, camera);
  }

  renderScenery(ctx, camera) {
    ctx.save();
    for (const s of this.scenery) {
      const sx = s.x - camera.x;
      const sy = this.getHeight(s.x) - camera.y;
      if (sx < -60 || sx > camera.width + 60) continue;

      if (s.type === 'tree') {
        // Yeşil Çam Ağacı
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(sx - 3, sy - 20, 6, 20); // Gövde
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(sx - 16, sy - 15);
        ctx.lineTo(sx, sy - 42);
        ctx.lineTo(sx + 16, sy - 15);
        ctx.closePath();
        ctx.fill();
      } else if (s.type === 'cactus') {
        // Çöl Kaktüsü
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(sx - 4, sy - 28, 8, 28);
        ctx.fillRect(sx - 12, sy - 20, 8, 4);
        ctx.fillRect(sx - 12, sy - 24, 4, 8);
        ctx.fillRect(sx + 4, sy - 16, 8, 4);
        ctx.fillRect(sx + 8, sy - 22, 4, 8);
      } else if (s.type === 'rock') {
        // Volkanik Kaya
        ctx.fillStyle = '#1c1c1c';
        ctx.beginPath();
        ctx.arc(sx, sy - 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderCheckpoints(ctx, camera) {
    ctx.save();
    for (const cp of this.checkpoints) {
      const sx = cp.x - camera.x;
      const sy = this.getHeight(cp.x) - camera.y;

      if (sx < -80 || sx > camera.width + 80) continue;

      // Bayrak Direği
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy - 55);
      ctx.stroke();

      // Damalı / Kırmızı-Beyaz Bayrak
      ctx.fillStyle = cp.passed ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(sx, sy - 55, 26, 18);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy - 55, 26, 18);

      // Mesafe Tabelası
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 11px "Fredoka One", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${cp.distance}m`, sx + 13, sy - 42);
    }
    ctx.restore();
  }

  renderCollectibles(ctx, camera) {
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const sx = item.x - camera.x;
      const sy = item.y - camera.y;

      if (sx < -30 || sx > camera.width + 30) continue;

      ctx.save();
      if (item.type === 'coin') {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(sx, sy, item.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d68910';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#7d4e00';
        ctx.font = 'bold 14px "Fredoka One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₺', sx, sy + 1);

      } else if (item.type === 'fuel') {
        ctx.translate(sx, sy);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-12, -14, 24, 28);
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.strokeRect(-12, -14, 24, 28);

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-6, -18, 12, 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px "Fredoka One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAS', 0, 0);

      } else if (item.type === 'nitro') {
        // Mavi Nitro Tüpü
        ctx.translate(sx, sy);
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.roundRect(-8, -16, 16, 32, 6);
        ctx.fill();
        ctx.strokeStyle = '#0984e3';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#0984e3';
        ctx.font = '900 9px "Fredoka One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NOS', 0, 0);

      } else if (item.type === 'gem') {
        // Parlayan Mor Elmas
        ctx.translate(sx, sy);
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(13, 0);
        ctx.lineTo(0, 14);
        ctx.lineTo(-13, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

window.terrainSystem = new TerrainSystem();
