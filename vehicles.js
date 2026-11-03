// ============================================================
// ZİRVE FIRTINASI - 12 Efsanevi Araç Kataloğu & Modifiye Deposu
// ============================================================

const VEHICLE_CONFIGS = {
  murat: {
    id: 'murat',
    name: 'Murat 124 (Nostalji Sedan)',
    price: 500,
    unlocked: false,
    chassisWidth: 80,
    chassisHeight: 30,
    wheelRadius: 16,
    wheelBase: 56,
    suspensionLength: 22,
    mass: 1.0,
    colorBody: '#f5f0e1',
    colorSecondary: '#c0392b',
    colorWheel: '#1a1d20',
    colorRim: '#bdc3c7',
    description: 'Anadolu yollarının efsanesi! Hafif, sevimli ve inatçı bir 1.2 litrelik motor.',
    type: 'murat',
    baseEngine: 0.95,
    baseGrip: 1.0,
    baseSuspension: 1.05
  },
  anadol: {
    id: 'anadol',
    name: 'Anadol A1 STC-16',
    price: 1400,
    unlocked: false,
    chassisWidth: 78,
    chassisHeight: 26,
    wheelRadius: 16,
    wheelBase: 54,
    suspensionLength: 22,
    mass: 0.8,
    colorBody: '#2980b9',
    colorSecondary: '#ecf0f1',
    colorWheel: '#1a1d20',
    colorRim: '#ecf0f1',
    description: 'İlk yerli otomobil! Fiberglas gövdesi sayesinde hafif ve çevik.',
    type: 'anadol',
    baseEngine: 1.1,
    baseGrip: 1.0,
    baseSuspension: 1.1
  },
  sahin: {
    id: 'sahin',
    name: 'Tofaş Şahin 131',
    price: 2500,
    unlocked: false,
    chassisWidth: 84,
    chassisHeight: 32,
    wheelRadius: 17,
    wheelBase: 58,
    suspensionLength: 23,
    mass: 1.1,
    colorBody: '#ecf0f1',
    colorSecondary: '#e74c3c',
    colorWheel: '#1a1d20',
    colorRim: '#bdc3c7',
    description: 'Babamın arabası! Kutu gibi sağlam gövde, dört silindirin kükremesi.',
    type: 'sahin',
    baseEngine: 1.12,
    baseGrip: 1.1,
    baseSuspension: 1.1
  },
  toros: {
    id: 'toros',
    name: 'Renault 12 Toros Taksi',
    price: 4200,
    unlocked: false,
    chassisWidth: 86,
    chassisHeight: 32,
    wheelRadius: 17,
    wheelBase: 60,
    suspensionLength: 23,
    mass: 1.15,
    colorBody: '#f1c40f',
    colorSecondary: '#111111',
    colorWheel: '#1a1d20',
    colorRim: '#ecf0f1',
    description: 'Sarı Toros taksi! Yokuşta durmaz, çatıdaki TAKSİ lambası bile heyecanlı.',
    type: 'toros',
    baseEngine: 1.18,
    baseGrip: 1.15,
    baseSuspension: 1.15
  },
  dogan: {
    id: 'dogan',
    name: 'Tofaş Doğan SLX',
    price: 5000,
    unlocked: false,
    chassisWidth: 84,
    chassisHeight: 30,
    wheelRadius: 16,
    wheelBase: 58,
    suspensionLength: 22,
    mass: 1.0,
    colorBody: '#c0392b',
    colorSecondary: '#ecf0f1',
    colorWheel: '#1a1d20',
    colorRim: '#f1c40f',
    description: 'Doksanların klasiği! Spor şeritleri ve atılgan motoruyla Doğan SLX.',
    type: 'dogan',
    baseEngine: 1.25,
    baseGrip: 1.15,
    baseSuspension: 1.1
  },
  doblo: {
    id: 'doblo',
    name: 'Fiat Doblo Kurye',
    price: 7000,
    unlocked: false,
    chassisWidth: 88,
    chassisHeight: 42,
    wheelRadius: 17,
    wheelBase: 62,
    suspensionLength: 25,
    mass: 1.3,
    colorBody: '#ecf0f1',
    colorSecondary: '#e67e22',
    colorWheel: '#1a1d20',
    colorRim: '#bdc3c7',
    description: 'Her işe koşan kurye! Uzun boylu ama inanılmaz yol tutuşu ve tork.',
    type: 'doblo',
    baseEngine: 1.2,
    baseGrip: 1.3,
    baseSuspension: 1.25
  },
  togg: {
    id: 'togg',
    name: 'TOGG T10X (Elektrikli)',
    price: 15000,
    unlocked: false,
    chassisWidth: 88,
    chassisHeight: 36,
    wheelRadius: 19,
    wheelBase: 62,
    suspensionLength: 26,
    mass: 1.15,
    colorBody: '#95a5a6',
    colorSecondary: '#00f0ff',
    colorWheel: '#1a1d20',
    colorRim: '#00f0ff',
    description: 'Yerli ve milli elektrikli! Anında tork, sessiz güç ve LED ışık şeridi.',
    type: 'togg',
    baseEngine: 1.4,
    baseGrip: 1.25,
    baseSuspension: 1.3
  },
  jeep: {
    id: 'jeep',
    name: 'Zirve Jeep (Klasik 4x4)',
    price: 0,
    unlocked: true,
    chassisWidth: 76,
    chassisHeight: 32,
    wheelRadius: 16,
    wheelBase: 50,
    suspensionLength: 22,
    mass: 1.0,
    colorBody: '#e74c3c',
    colorSecondary: '#c0392b',
    colorWheel: '#2d3436',
    colorRim: '#bdc3c7',
    description: 'Efsanevi kırmızı 4x4 Jeep. Sağlam yol tutuşu, alçak ağırlık merkezi ve her tepeye tırmanan tork!',
    type: 'jeep',
    baseEngine: 1.0,
    baseGrip: 1.0,
    baseSuspension: 1.0
  },
  bike: {
    id: 'bike',
    name: 'Kros Motoru (Dirt Bike)',
    price: 800,
    unlocked: false,
    chassisWidth: 62,
    chassisHeight: 26,
    wheelRadius: 16,
    wheelBase: 46,
    suspensionLength: 22,
    mass: 0.62,
    colorBody: '#f1c40f',
    colorSecondary: '#e67e22',
    colorWheel: '#2d3436',
    colorRim: '#f39c12',
    description: 'Ultra hafif yarış krosu. Havada seri taklalar atar ve dik yokuşları hızla tırmanır!',
    type: 'bike',
    baseEngine: 1.15,
    baseGrip: 0.95,
    baseSuspension: 1.1
  },
  tractor: {
    id: 'tractor',
    name: 'Çılgın Çiftlik Traktörü',
    price: 1800,
    unlocked: false,
    chassisWidth: 74,
    chassisHeight: 36,
    wheelRadius: 22, // Devasa arka teker
    wheelRadiusFront: 13, // Küçük ön teker
    wheelBase: 52,
    suspensionLength: 22,
    mass: 1.35,
    colorBody: '#27ae60',
    colorSecondary: '#f1c40f',
    colorWheel: '#1a1d20',
    colorRim: '#f1c40f',
    description: 'Devasa arka tekerlekler ve duman tüten egzoz borusu! Çamurlu tepeleri zahmetsizce aşar.',
    type: 'tractor',
    baseEngine: 1.2,
    baseGrip: 1.35,
    baseSuspension: 1.15
  },
  monster: {
    id: 'monster',
    name: 'Titan Canavar Kamyon',
    price: 3200,
    unlocked: false,
    chassisWidth: 88,
    chassisHeight: 40,
    wheelRadius: 24,
    wheelBase: 64,
    suspensionLength: 30,
    mass: 1.5,
    colorBody: '#2980b9',
    colorSecondary: '#1f618d',
    colorWheel: '#1a1d20',
    colorRim: '#f1c40f',
    description: 'Devasa 24px arazi lastikleri ve çift amortisörler! Taşları ve hendekleri ezer geçer.',
    type: 'monster',
    baseEngine: 1.25,
    baseGrip: 1.3,
    baseSuspension: 1.35
  },
  buggy: {
    id: 'buggy',
    name: 'Dune Sand Buggy',
    price: 5500,
    unlocked: false,
    chassisWidth: 78,
    chassisHeight: 28,
    wheelRadius: 18,
    wheelBase: 56,
    suspensionLength: 25,
    mass: 0.85,
    colorBody: '#e67e22',
    colorSecondary: '#d35400',
    colorWheel: '#2d3436',
    colorRim: '#ecf0f1',
    description: 'Çelik kafesli çöl canavarı. Geniş arka lastikler kum tepelerinde patinajı önler.',
    type: 'buggy',
    baseEngine: 1.2,
    baseGrip: 1.2,
    baseSuspension: 1.25
  },
  pickup: {
    id: 'pickup',
    name: 'Cyber Muscle Pickup',
    price: 8500,
    unlocked: false,
    chassisWidth: 86,
    chassisHeight: 34,
    wheelRadius: 18,
    wheelBase: 60,
    suspensionLength: 24,
    mass: 1.2,
    colorBody: '#34495e',
    colorSecondary: '#00f0ff',
    colorWheel: '#1a1d20',
    colorRim: '#00f0ff',
    description: 'Köşeli zırhlı gövde, çift turbo motor ve agresif V8 tork gücü!',
    type: 'pickup',
    baseEngine: 1.3,
    baseGrip: 1.2,
    baseSuspension: 1.2
  },
  rally: {
    id: 'rally',
    name: 'Turbo WRC Ralli',
    price: 12000,
    unlocked: false,
    chassisWidth: 74,
    chassisHeight: 26,
    wheelRadius: 15,
    wheelBase: 52,
    suspensionLength: 19,
    mass: 0.92,
    colorBody: '#9b59b6',
    colorSecondary: '#8e44ad',
    colorWheel: '#2d3436',
    colorRim: '#ffffff',
    description: 'Arka rüzgarlıklı ralli şampiyonu. Çift turbo besleme ve yere yapışan yol tutuşu!',
    type: 'rally',
    baseEngine: 1.35,
    baseGrip: 1.25,
    baseSuspension: 1.05
  },
  f1: {
    id: 'f1',
    name: 'Aero Formula Hız Canavarı',
    price: 18000,
    unlocked: false,
    chassisWidth: 84,
    chassisHeight: 20,
    wheelRadius: 15,
    wheelBase: 60,
    suspensionLength: 16,
    mass: 0.75,
    colorBody: '#e74c3c',
    colorSecondary: '#111111',
    colorWheel: '#1a1d20',
    colorRim: '#e74c3c',
    description: 'Ön ve arka hava kanatları. Düzlüklerde ve tepelerde rüzgar hızında uçar!',
    type: 'f1',
    baseEngine: 1.5,
    baseGrip: 1.35,
    baseSuspension: 0.95
  },
  lunar: {
    id: 'lunar',
    name: 'Apollo Ay Gezgini',
    price: 24000,
    unlocked: false,
    chassisWidth: 80,
    chassisHeight: 34,
    wheelRadius: 18,
    wheelBase: 58,
    suspensionLength: 26,
    mass: 0.88,
    colorBody: '#ecf0f1',
    colorSecondary: '#bdc3c7',
    colorWheel: '#34495e',
    colorRim: '#f1c40f',
    description: 'Uzay alaşımlı esnek kafes tekerlekler ve çanak anten. Zıplamalarda yerçekimine meydan okur!',
    type: 'lunar',
    baseEngine: 1.3,
    baseGrip: 1.2,
    baseSuspension: 1.4
  },
  hover: {
    id: 'hover',
    name: 'Aero Glider (Hovercraft)',
    price: 32000,
    unlocked: false,
    chassisWidth: 82,
    chassisHeight: 24,
    wheelRadius: 14,
    wheelBase: 56,
    suspensionLength: 20,
    mass: 0.7,
    colorBody: '#00f0ff',
    colorSecondary: '#0984e3',
    colorWheel: '#1a1d20',
    colorRim: '#00f0ff',
    description: 'Çift türbinli hava yastığı. Zemin sürtünmesini neredeyse sıfıra indirir!',
    type: 'hover',
    baseEngine: 1.45,
    baseGrip: 1.15,
    baseSuspension: 1.3
  },
  tank: {
    id: 'tank',
    name: 'Zırhlı Çöl Tankı',
    price: 40000,
    unlocked: false,
    chassisWidth: 90,
    chassisHeight: 36,
    wheelRadius: 17,
    wheelBase: 62,
    suspensionLength: 20,
    mass: 1.9,
    colorBody: '#27ae60',
    colorSecondary: '#1e8449',
    colorWheel: '#2d3436',
    colorRim: '#27ae60',
    description: 'Döner namlulu ağır paletli zırhlı! Asla devrilmez, en dik uçurumları tırmanır!',
    type: 'tank',
    baseEngine: 1.6,
    baseGrip: 1.5,
    baseSuspension: 1.2
  },
  dragster: {
    id: 'dragster',
    name: 'Ateş Roketi (Rocket Dragster)',
    price: 55000,
    unlocked: false,
    chassisWidth: 88,
    chassisHeight: 24,
    wheelRadius: 20,
    wheelRadiusFront: 12,
    wheelBase: 66,
    suspensionLength: 18,
    mass: 0.78,
    colorBody: '#d63031',
    colorSecondary: '#fdcb6e',
    colorWheel: '#1a1d20',
    colorRim: '#d63031',
    description: 'Arkada devasa roket iticisi! Nitro açıldığında ekrandan taşan çılgın ses hızı!',
    type: 'dragster',
    baseEngine: 1.8,
    baseGrip: 1.3,
    baseSuspension: 1.1
  }
};

// Modifiye Paletleri
const TUNING_COLORS = [
  { name: 'Alev Kırmızısı', hex: '#e74c3c' },
  { name: 'Yarış Sarısı', hex: '#f1c40f' },
  { name: 'Okyanus Mavisi', hex: '#2980b9' },
  { name: 'Zehir Yeşili', hex: '#2ecc71' },
  { name: 'Karbon Siyah', hex: '#2c3e50' },
  { name: 'Bordo Canavar', hex: '#962d22' },
  { name: 'Neon Turuncu', hex: '#e67e22' },
  { name: 'Kraliyet Moru', hex: '#8e44ad' },
  { name: 'Gümüş Beyaz', hex: '#ecf0f1' },
  { name: 'Siber Cyan', hex: '#00f0ff' }
];

const TUNING_RIMS = [
  { id: 'steel', name: 'Çelik Gri', hex: '#bdc3c7' },
  { id: 'gold', name: 'Altın Yıldız', hex: '#f1c40f' },
  { id: 'sport', name: 'Yarış Beyazı', hex: '#ecf0f1' },
  { id: 'red', name: 'Ateş Kırmızı', hex: '#e74c3c' },
  { id: 'cyan', name: 'Neon Mavi', hex: '#00f0ff' },
  { id: 'dark', name: 'Karbon Siyah', hex: '#1a1d20' }
];

const TUNING_HATS = [
  { id: 'cap', name: 'Kırmızı Kasket (Bill)', color: '#e74c3c' },
  { id: 'helmet', name: 'Yarış Kaskı', color: '#f1c40f' },
  { id: 'cowboy', name: 'Kovboy Şapkası', color: '#795548' },
  { id: 'crown', name: 'Altın Taç 👑', color: '#ffd700' },
  { id: 'viking', name: 'Viking Miğferi ⚔️', color: '#bdc3c7' }
];

class VehicleStore {
  constructor() {
    this.storageKey = 'turbo_peak_save_v1';
    this.data = this.load();
  }

  getDefaultData() {
    const defaultVehicles = {};
    for (const key of Object.keys(VEHICLE_CONFIGS)) {
      defaultVehicles[key] = {
        unlocked: VEHICLE_CONFIGS[key].unlocked,
        engine: 1,
        tires: 1,
        suspension: 1,
        fourwd: 1,
        tank: 1,
        customColor: VEHICLE_CONFIGS[key].colorBody,
        customRim: VEHICLE_CONFIGS[key].colorRim,
        customHat: 'cap'
      };
    }

    return {
      coins: 1000,
      selectedVehicle: 'jeep',
      vehicles: defaultVehicles,
      bestDistance: 0,
      bestByBiome: {},
      daily: { last: '', streak: 0 },
      settings: {
        sensitivity: 'normal',
        pedalLayout: 'default',
        musicStation: 0, // 0: Country, 1: Synthwave, 2: Rock
        hapticsEnabled: true,
        showFps: false
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const defaults = this.getDefaultData();
        const mergedVehicles = {};
        for (const k of Object.keys(VEHICLE_CONFIGS)) {
          mergedVehicles[k] = { ...defaults.vehicles[k], ...(parsed.vehicles ? parsed.vehicles[k] : {}) };
        }
        return { ...defaults, ...parsed, vehicles: mergedVehicles, settings: { ...defaults.settings, ...(parsed.settings || {}) } };
      }
    } catch (e) {}
    return this.getDefaultData();
  }

  save() {
    this._dirty = true;
    if (this._timer) return;
    this._timer = setTimeout(() => this.flush(), 600);
  }

  flush() {
    clearTimeout(this._timer);
    this._timer = null;
    if (!this._dirty) return;
    this._dirty = false;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {}
  }

  getCoins() {
    return this.data.coins;
  }

  addCoins(amount) {
    this.data.coins += amount;
    this.save();
    return this.data.coins;
  }

  getSelectedVehicleId() {
    return this.data.selectedVehicle || 'jeep';
  }

  setSelectedVehicle(id) {
    if (this.data.vehicles[id] && this.data.vehicles[id].unlocked) {
      this.data.selectedVehicle = id;
      this.save();
      return true;
    }
    return false;
  }

  getVehicleData(id) {
    return this.data.vehicles[id] || { unlocked: false, engine: 1, tires: 1, suspension: 1, fourwd: 1, tank: 1 };
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
  }

  getUpgradeCost(currentLevel) {
    if (currentLevel >= 10) return null;
    return Math.floor(130 * Math.pow(1.35, currentLevel - 1));
  }

  upgradeStat(vehicleId, statKey) {
    const v = this.data.vehicles[vehicleId];
    if (!v) return false;
    const currentLvl = v[statKey];
    const cost = this.getUpgradeCost(currentLvl);

    if (cost !== null && this.data.coins >= cost) {
      this.data.coins -= cost;
      v[statKey]++;
      this.save();
      return true;
    }
    return false;
  }

  setCustomColor(vehicleId, colorHex) {
    if (this.data.vehicles[vehicleId]) {
      this.data.vehicles[vehicleId].customColor = colorHex;
      this.save();
    }
  }

  setCustomRim(vehicleId, rimHex) {
    if (this.data.vehicles[vehicleId]) {
      this.data.vehicles[vehicleId].customRim = rimHex;
      this.save();
    }
  }

  setCustomHat(vehicleId, hatId) {
    if (this.data.vehicles[vehicleId]) {
      this.data.vehicles[vehicleId].customHat = hatId;
      this.save();
    }
  }

  unlockVehicle(vehicleId) {
    const cfg = VEHICLE_CONFIGS[vehicleId];
    if (!cfg) return false;
    if (this.data.coins >= cfg.price && !this.data.vehicles[vehicleId].unlocked) {
      this.data.coins -= cfg.price;
      this.data.vehicles[vehicleId].unlocked = true;
      this.data.selectedVehicle = vehicleId;
      this.save();
      return true;
    }
    return false;
  }
}

window.vehicleStore = new VehicleStore();
window.addEventListener('pagehide', () => window.vehicleStore.flush());
document.addEventListener('visibilitychange', () => { if (document.hidden) window.vehicleStore.flush(); });
