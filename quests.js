// ============================================================
// ZİRVE FIRTINASI - Görevler & Başarılar Sistemi (Quests & Achievements)
// ============================================================

const GAME_QUESTS = [
  { id: 'dist_300', title: 'Mesafe Ustası I', desc: 'Tek yarışta 300m mesafeye ulaş', reward: 300, icon: '🚩', type: 'distance', target: 300 },
  { id: 'coins_30', title: 'Altın Avcısı', desc: 'Tek yarışta 30 altın topla', reward: 250, icon: '💰', type: 'coins', target: 30 },
  { id: 'air_2s', title: 'Kuş Gibi Süzül', desc: 'Havada 2.5 saniye kesintisiz kal', reward: 350, icon: '🦅', type: 'airtime', target: 2.5 },
  { id: 'flip_back', title: 'Akrobat Pilot', desc: 'Havada 1 geri takla at', reward: 500, icon: '🔄', type: 'backflip', target: 1 },
  { id: 'speed_60', title: 'Hız Tutkunu', desc: '60 km/h hıza ulaş', reward: 300, icon: '⚡', type: 'speed', target: 60 },
  { id: 'gas_2', title: 'Depo Dolu', desc: 'Tek turda 2 benzin bidonu al', reward: 250, icon: '⛽', type: 'fuel', target: 2 },
  { id: 'gem_1', title: 'Elmas Koleksiyoncusu', desc: 'Parlayan 1 nadir elmas topla', reward: 400, icon: '💎', type: 'gem', target: 1 },
  { id: 'dist_1000', title: 'Efsanevi Sürücü', desc: 'Tek yarışta 1000m mesafeye ulaş', reward: 1200, icon: '🏆', type: 'distance', target: 1000 }
];

class QuestManager {
  constructor() {
    this.storageKey = 'hill_climb_quests_save_v1';
    this.completed = this.load();
    
    // Anlık tur istatistikleri
    this.currentRun = {
      distance: 0,
      coins: 0,
      maxAirtime: 0,
      backflips: 0,
      maxSpeed: 0,
      fuels: 0,
      gems: 0
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.completed));
    } catch (e) {}
  }

  resetRunStats() {
    this.currentRun = {
      distance: 0,
      coins: 0,
      maxAirtime: 0,
      backflips: 0,
      maxSpeed: 0,
      fuels: 0,
      gems: 0
    };
  }

  recordDistance(m) {
    this.currentRun.distance = Math.max(this.currentRun.distance, m);
    this.checkProgress('distance', this.currentRun.distance);
  }

  recordCoin() {
    this.currentRun.coins++;
    this.checkProgress('coins', this.currentRun.coins);
  }

  recordFuel() {
    this.currentRun.fuels++;
    this.checkProgress('fuel', this.currentRun.fuels);
  }

  recordGem() {
    this.currentRun.gems++;
    this.checkProgress('gem', this.currentRun.gems);
  }

  recordAirtime(seconds) {
    this.currentRun.maxAirtime = Math.max(this.currentRun.maxAirtime, seconds);
    this.checkProgress('airtime', this.currentRun.maxAirtime);
  }

  recordFlip(isBackflip) {
    if (isBackflip) {
      this.currentRun.backflips++;
      this.checkProgress('backflip', this.currentRun.backflips);
    }
  }

  recordSpeed(kmh) {
    this.currentRun.maxSpeed = Math.max(this.currentRun.maxSpeed, kmh);
    this.checkProgress('speed', this.currentRun.maxSpeed);
  }

  checkProgress(type, val) {
    for (const q of GAME_QUESTS) {
      if (this.completed[q.id]) continue;

      if (q.type === type && val >= q.target) {
        this.completed[q.id] = true;
        this.save();
        this.rewardQuest(q);
      }
    }
  }

  rewardQuest(quest) {
    window.vehicleStore.addCoins(quest.reward);
    window.soundManager.playCheckpoint();
    
    // Ekranda kupa bildirimi
    if (window.particleSystem) {
      window.particleSystem.addFloatingText(`GÖREV TAMAMLANDI! ${quest.title} +${quest.reward} ₺`, window.game.physics ? window.game.physics.x : 200, window.game.physics ? window.game.physics.y - 70 : 200, '#f1c40f', 22);
    }

    if (navigator.vibrate) {
      navigator.vibrate([40, 40, 80]);
    }

    this.renderQuestsModal();
  }

  renderQuestsModal() {
    const list = document.getElementById('quests-list');
    if (!list) return;
    list.innerHTML = '';

    for (const q of GAME_QUESTS) {
      const isDone = !!this.completed[q.id];
      const div = document.createElement('div');
      div.className = `quest-item ${isDone ? 'done' : ''}`;
      div.innerHTML = `
        <div class="quest-icon">${q.icon}</div>
        <div class="quest-info">
          <span class="quest-title">${q.title}</span>
          <span class="quest-desc">${q.desc}</span>
        </div>
        <div class="quest-reward ${isDone ? 'claimed' : ''}">
          ${isDone ? 'TAMAMLANDI ✓' : `+${q.reward} ₺`}
        </div>
      `;
      list.appendChild(div);
    }
  }
}

window.questManager = new QuestManager();
