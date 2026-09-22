// Database Stasiun (Koordinat Canvas Jawa & Sumatra)
const STATIONS = {
  // Jawa
  GMR: { id: 'GMR', region: 'JAWA', name: 'Jakarta Gambir', x: 120, y: 120 },
  BD:  { id: 'BD',  region: 'JAWA', name: 'Bandung',        x: 180, y: 200 },
  SMT: { id: 'SMT', region: 'JAWA', name: 'Semarang Tawang', x: 450, y: 110 },
  YK:  { id: 'YK',  region: 'JAWA', name: 'Yogyakarta',     x: 520, y: 220 },
  SGB: { id: 'SGB', region: 'JAWA', name: 'Surabaya Gubeng', x: 780, y: 160 },

  // Sumatra
  MDN: { id: 'MDN', region: 'SUMATRA', name: 'Medan',         x: 200, y: 90 },
  PKU: { id: 'PKU', region: 'SUMATRA', name: 'Pekanbaru',     x: 350, y: 150 },
  PDG: { id: 'PDG', region: 'SUMATRA', name: 'Padang',        x: 280, y: 200 },
  PLB: { id: 'PLB', region: 'SUMATRA', name: 'Palembang',     x: 580, y: 220 },
  TKG: { id: 'TKG', region: 'SUMATRA', name: 'Bandar Lampung', x: 720, y: 260 }
};

// Database Lokomotif
const LOCOMOTIVES = {
  CC201: {
    id: 'CC201',
    name: 'Lokomotif CC201',
    price: 120000000,
    maxCoaches: 5,
    fuelCostPerSec: 1500000,
    repairCost: 15000000
  },
  CC206: {
    id: 'CC206',
    name: 'Lokomotif CC206',
    price: 220000000,
    maxCoaches: 10,
    fuelCostPerSec: 2500000,
    repairCost: 30000000
  }
};

const COACHES = {
  EKONOMI: {
    id: 'EKONOMI',
    name: 'Gerbong Ekonomi (K3)',
    price: 30000000,
    capacity: 106,
    ticketPrice: 150000
  },
  EKSEKUTIF: {
    id: 'EKSEKUTIF',
    name: 'Gerbong Eksekutif (K1)',
    price: 60000000,
    capacity: 50,
    ticketPrice: 350000
  }
};

// Database Rute Perjalanan (Jawa + Sumatra)
const ROUTES = [
  // Rute Jawa
  { id: 'GMR-BD',  region: 'JAWA', originKey: 'GMR', destKey: 'BD',  origin: 'Jakarta Gambir', destination: 'Bandung',        durationSeconds: 5,  multiplier: 0.7 },
  { id: 'GMR-SMT', region: 'JAWA', originKey: 'GMR', destKey: 'SMT', origin: 'Jakarta Gambir', destination: 'Semarang Tawang', durationSeconds: 8,  multiplier: 1.0 },
  { id: 'BD-YK',   region: 'JAWA', originKey: 'BD',  destKey: 'YK',  origin: 'Bandung',        destination: 'Yogyakarta',     durationSeconds: 7,  multiplier: 1.1 },
  { id: 'SMT-SGB', region: 'JAWA', originKey: 'SMT', destKey: 'SGB', origin: 'Semarang Tawang', destination: 'Surabaya Gubeng', durationSeconds: 9,  multiplier: 1.3 },
  { id: 'YK-SGB',  region: 'JAWA', originKey: 'YK',  destKey: 'SGB', origin: 'Yogyakarta',     destination: 'Surabaya Gubeng', durationSeconds: 7,  multiplier: 1.1 },

  // Rute Sumatra
  { id: 'MDN-PKU', region: 'SUMATRA', originKey: 'MDN', destKey: 'PKU', origin: 'Medan',          destination: 'Pekanbaru',      durationSeconds: 10, multiplier: 1.4 },
  { id: 'PKU-PDG', region: 'SUMATRA', originKey: 'PKU', destKey: 'PDG', origin: 'Pekanbaru',      destination: 'Padang',         durationSeconds: 6,  multiplier: 0.9 },
  { id: 'PKU-PLB', region: 'SUMATRA', originKey: 'PKU', destKey: 'PLB', origin: 'Pekanbaru',      destination: 'Palembang',      durationSeconds: 11, multiplier: 1.5 },
  { id: 'PLB-TKG', region: 'SUMATRA', originKey: 'PLB', destKey: 'TKG', origin: 'Palembang',      destination: 'Bandar Lampung', durationSeconds: 8,  multiplier: 1.2 }
];
// Database Cuaca
const WEATHERS = {
  CLEAR: { name: 'Cereh ☀️', speedMultiplier: 1.0, fuelMultiplier: 1.0 },
  RAIN:  { name: 'Hujan 🌧️', speedMultiplier: 1.2, fuelMultiplier: 1.15 },
  STORM: { name: 'Badai ⛈️', speedMultiplier: 1.5, fuelMultiplier: 1.3 }
};

// Database Event Acak
const RANDOM_EVENTS = [
  {
    id: 'NORMAL',
    name: 'Hari Biasa',
    desc: 'Lalu lintas kereta api berjalan normal.',
    ticketMultiplier: 1.0
  },
  {
    id: 'MUDIK',
    name: 'Musim Mudik Lebaran 🌙',
    desc: 'Lonjakan penumpang tinggi! Harga tiket naik 2x lipat.',
    ticketMultiplier: 2.0
  },
  {
    id: 'HOLIDAY',
    name: 'Libur Sekolah 🎉',
    desc: 'Permintaan tiket meningkat. Harga tiket naik 1.3x lipat.',
    ticketMultiplier: 1.3
  }
];

// Database Pencapaian
const ACHIEVEMENTS = [
  {
    id: 'FIRST_TRIP',
    name: 'Perjalanan Perdana',
    desc: 'Selesaikan 1 perjalanan kereta.',
    reward: 50000000
  },
  {
    id: 'FLEET_5',
    name: 'Juragan Kereta',
    desc: 'Miliki minimal 5 lokomotif di dipo.',
    reward: 200000000
  },
  {
    id: 'EXPANSION_SUMATRA',
    name: 'Lintas Pulau',
    desc: 'Buka dan jelajahi wilayah Pulau Sumatra.',
    reward: 150000000
  }
];