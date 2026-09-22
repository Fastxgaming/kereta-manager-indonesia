const SAVE_KEY = 'KMI_SAVE_DATA_V1';

const DEFAULT_STATE = {
  money: 1000000000,
  day: 1,
  currentRegion: 'JAWA',
  bankLoan: 0,
  fleet: [],
  inventoryCoaches: {
    EKONOMI: 0,
    EKSEKUTIF: 0
  },
  activeTrips: [],
  weather: WEATHERS.CLEAR,
  currentEvent: RANDOM_EVENTS[0],
  unlockedAchievements: [],
  financeHistory: [
    { day: 1, revenue: 0, expense: 0 }
  ]
};

let gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));

const Game = {
  init() {
    this.loadGame();
    this.bindEvents();
    UI.initChart();
    this.refreshUI();
    UI.startMapLoop(
      () => gameState.activeTrips,
      () => gameState.currentRegion || 'JAWA'
    );
  },

  saveGame(silent = true) {
    const cleanFleet = gameState.fleet.map(loco => ({
      ...loco,
      status: 'Siap Jalan'
    }));

    const dataToSave = {
      money: isNaN(gameState.money) ? DEFAULT_STATE.money : gameState.money,
      day: gameState.day || 1,
      currentRegion: gameState.currentRegion || DEFAULT_STATE.currentRegion,
      bankLoan: gameState.bankLoan || 0,
      fleet: cleanFleet,
      inventoryCoaches: gameState.inventoryCoaches,
      weather: gameState.weather,
      currentEvent: gameState.currentEvent,
      unlockedAchievements: gameState.unlockedAchievements,
      financeHistory: gameState.financeHistory
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    if (!silent) UI.showSaveStatus('✓ Game Tersimpan');
  },

  loadGame() {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        gameState.money = (parsed.money && !isNaN(parsed.money)) ? parsed.money : DEFAULT_STATE.money;
        gameState.day = parsed.day ?? DEFAULT_STATE.day;
        gameState.currentRegion = parsed.currentRegion === 'SUMATRA' ? 'SUMATRA' : 'JAWA';
        gameState.bankLoan = Number.isFinite(parsed.bankLoan) ? Math.max(0, parsed.bankLoan) : DEFAULT_STATE.bankLoan;
        gameState.fleet = (parsed.fleet || []).map(loco => {
          const defaultLoco = LOCOMOTIVES[loco.id] || {};
          return {
            ...defaultLoco,
            ...loco,
            repairCost: loco.repairCost || defaultLoco.repairCost || 15000000,
            fuelCostPerSec: loco.fuelCostPerSec || defaultLoco.fuelCostPerSec || 1500000
          };
        });
        gameState.inventoryCoaches = parsed.inventoryCoaches ?? DEFAULT_STATE.inventoryCoaches;
        gameState.weather = WEATHERS[parsed.weather?.id] || DEFAULT_STATE.weather;
        gameState.currentEvent = RANDOM_EVENTS.find(event => event.id === parsed.currentEvent?.id) || DEFAULT_STATE.currentEvent;
        gameState.unlockedAchievements = Array.isArray(parsed.unlockedAchievements)
          ? parsed.unlockedAchievements
          : [];
        gameState.financeHistory = Array.isArray(parsed.financeHistory) && parsed.financeHistory.length > 0
          ? parsed.financeHistory
          : JSON.parse(JSON.stringify(DEFAULT_STATE.financeHistory));
        if (!gameState.financeHistory.some(history => history.day === gameState.day)) {
          gameState.financeHistory.push({ day: gameState.day, revenue: 0, expense: 0 });
        }
        gameState.activeTrips = [];
      } catch (e) {
        console.error('Gagal memuat save data:', e);
        gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    }
  },

  resetGame() {
    if (confirm('Apakah Anda yakin ingin menghapus semua progres dan memulai dari awal?')) {
      localStorage.removeItem(SAVE_KEY);
      gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.refreshUI();
      UI.showSaveStatus('Game Di-reset');
    }
  },

  refreshUI() {
    this.checkAchievements();
    UI.setMapRegion(gameState.currentRegion || 'JAWA');
    UI.updateHeader(gameState.money, gameState.day, gameState.weather, gameState.currentEvent);
    UI.updateBankLoan(gameState.bankLoan || 0);
    UI.updateFreeCoaches(gameState.inventoryCoaches);
    UI.renderFleet(gameState.fleet);
    UI.renderActiveTrips(gameState.activeTrips);
    UI.updateFinanceChart(gameState.financeHistory);
  },

  checkAchievements() {
    if (!gameState.unlockedAchievements) gameState.unlockedAchievements = [];

    let achievementUnlocked = false;
    ACHIEVEMENTS.forEach(achievement => {
      if (gameState.unlockedAchievements.includes(achievement.id)) return;

      let unlocked = false;
      if (achievement.id === 'FIRST_TRIP') {
        unlocked = gameState.financeHistory.some(history => history.revenue > 0);
      }
      if (achievement.id === 'FLEET_5' && gameState.fleet.length >= 5) unlocked = true;
      if (achievement.id === 'EXPANSION_SUMATRA' && gameState.currentRegion === 'SUMATRA') unlocked = true;

      if (unlocked) {
        gameState.unlockedAchievements.push(achievement.id);
        gameState.money += achievement.reward;
        achievementUnlocked = true;
        UI.showNotification(`🏆 Achievement Unlocked: "${achievement.name}"! Bonus: ${UI.formatRupiah(achievement.reward)}`);
      }
    });

    if (achievementUnlocked) this.saveGame();
  },

  switchRegion(region) {
    if (region !== 'JAWA' && region !== 'SUMATRA') return;

    gameState.currentRegion = region;
    this.saveGame();
    this.refreshUI();
  },

  recordExpense(amount) {
    const currentDayLog = gameState.financeHistory.find(history => history.day === gameState.day);
    if (currentDayLog) currentDayLog.expense += amount;
  },

  recordRevenue(amount) {
    const currentDayLog = gameState.financeHistory.find(history => history.day === gameState.day);
    if (currentDayLog) currentDayLog.revenue += amount;
  },

  nextDay() {
    gameState.day += 1;

    gameState.financeHistory.push({
      day: gameState.day,
      revenue: 0,
      expense: 0
    });

    const interest = Math.round(gameState.bankLoan * 0.05);
    if (interest > 0) {
      gameState.money -= interest;
      this.recordExpense(interest);
      UI.showNotification(`Bunga pinjaman bank harian sebesar ${UI.formatRupiah(interest)} telah dipotong.`);
    }

    if (Math.random() < 0.3) {
      const eventIndex = Math.floor(Math.random() * (RANDOM_EVENTS.length - 1)) + 1;
      gameState.currentEvent = RANDOM_EVENTS[eventIndex];
    } else {
      gameState.currentEvent = RANDOM_EVENTS[0];
    }

    gameState.weather = WEATHERS.CLEAR;
    this.saveGame();
    this.refreshUI();
    UI.showNotification(`Hari ke-${gameState.day} dimulai! Event Hari Ini: ${gameState.currentEvent.name}`);
  },

  takeLoan(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;

    gameState.bankLoan = (gameState.bankLoan || 0) + amount;
    gameState.money += amount;
    UI.showNotification(`Pinjaman sebesar ${UI.formatRupiah(amount)} telah disetujui!`);
    this.saveGame();
    this.refreshUI();
  },

  payLoan() {
    if (gameState.bankLoan <= 0) {
      UI.showNotification('Tidak ada hutang bank yang perlu dibayar.');
      return;
    }

    if (gameState.money < gameState.bankLoan) {
      UI.showNotification('Uang kas tidak cukup untuk melunasi hutang bank.');
      return;
    }

    const payment = gameState.bankLoan;
    gameState.money -= payment;
    this.recordExpense(payment);
    gameState.bankLoan = 0;
    UI.showNotification('Hutang bank berhasil dilunasi!');
    this.saveGame();
    this.refreshUI();
  },

  buyLocomotive(typeKey) {
    const locoData = LOCOMOTIVES[typeKey];
    if (gameState.money >= locoData.price) {
      gameState.money -= locoData.price;
      this.recordExpense(locoData.price);
      gameState.fleet.push({
        ...locoData,
        coaches: [],
        status: 'Siap Jalan',
        condition: 100
      });
      this.saveGame();
      this.refreshUI();
    } else {
      UI.showNotification('Uang kas Anda tidak cukup!');
    }
  },

  buyCoach(coachKey) {
    const coachData = COACHES[coachKey];
    if (gameState.money >= coachData.price) {
      gameState.money -= coachData.price;
      this.recordExpense(coachData.price);
      gameState.inventoryCoaches[coachKey] += 1;
      this.saveGame();
      this.refreshUI();
    } else {
      UI.showNotification('Uang kas Anda tidak cukup!');
    }
  },

  attachCoach(locoIndex, coachKey) {
    const loco = gameState.fleet[locoIndex];
    
    if (gameState.inventoryCoaches[coachKey] <= 0) {
      UI.showNotification('Anda tidak memiliki stok gerbong ini! Beli di toko dulu.');
      return;
    }

    if (loco.coaches.length >= loco.maxCoaches) {
      UI.showNotification('Daya tarik lokomotif sudah maksimal!');
      return;
    }

    gameState.inventoryCoaches[coachKey] -= 1;
    loco.coaches.push({ ...COACHES[coachKey] });
    this.saveGame();
    this.refreshUI();
  },

  repairLocomotive(locoIndex) {
    const loco = gameState.fleet[locoIndex];
    const cost = loco.repairCost || LOCOMOTIVES[loco.id]?.repairCost || 15000000;

    if (gameState.money >= cost) {
      gameState.money -= cost;
      this.recordExpense(cost);
      loco.condition = 100;
      this.saveGame();
      this.refreshUI();
      UI.showNotification(`Lokomotif ${loco.name} selesai diservis ke kondisi 100%!`);
    } else {
      UI.showNotification('Uang kas Anda tidak cukup untuk biaya servis!');
    }
  },

  startTrip(locoIndex) {
    const loco = gameState.fleet[locoIndex];

    if (!loco.coaches || loco.coaches.length === 0) {
      UI.showNotification('Kereta tidak bisa jalan tanpa gerbong penumpang!');
      return;
    }

    if (loco.condition <= 20) {
      UI.showNotification('Kondisi lokomotif terlalu buruk (<=20%)! Lakukan servis terlebih dahulu.');
      return;
    }

    const routeSelectElem = document.getElementById(`route-select-${locoIndex}`);
    const selectedRouteIndex = routeSelectElem ? parseInt(routeSelectElem.value) : 0;
    const selectedRoute = ROUTES[selectedRouteIndex];

    const rand = Math.random();
    let currentWeather = WEATHERS.CLEAR;
    if (rand > 0.85) currentWeather = WEATHERS.STORM;
    else if (rand > 0.60) currentWeather = WEATHERS.RAIN;

    const actualDuration = Math.round(selectedRoute.durationSeconds * currentWeather.speedMultiplier);
    const fuelCostPerSec = loco.fuelCostPerSec || LOCOMOTIVES[loco.id]?.fuelCostPerSec || 1500000;
    const fuelCost = Math.round(actualDuration * fuelCostPerSec * currentWeather.fuelMultiplier);

    if (gameState.money < fuelCost) {
      UI.showNotification(`Uang kas tidak cukup untuk membeli BBM Solar (${UI.formatRupiah(fuelCost)})!`);
      return;
    }

    SoundSystem.playHorn();
    gameState.weather = currentWeather;
    gameState.money -= fuelCost;
  this.recordExpense(fuelCost);
  this.saveGame();

    let baseTicketRevenue = 0;
    loco.coaches.forEach(coach => {
      baseTicketRevenue += coach.capacity * coach.ticketPrice;
    });

    const eventMultiplier = gameState.currentEvent ? gameState.currentEvent.ticketMultiplier : 1.0;
    const totalRevenue = Math.round(baseTicketRevenue * selectedRoute.multiplier * eventMultiplier);

    loco.status = 'Berjalan';
    const tripId = Date.now();
    const newTrip = {
      id: tripId,
      trainName: loco.name,
      originKey: selectedRoute.originKey,
      destKey: selectedRoute.destKey,
      origin: selectedRoute.origin,
      destination: selectedRoute.destination,
      progress: 0,
      timeLeft: actualDuration,
      totalDuration: actualDuration,
      startTime: Date.now(),
      revenue: totalRevenue,
      fuelCost: fuelCost,
      weather: currentWeather,
      locoRef: loco
    };

    gameState.activeTrips.push(newTrip);
    this.refreshUI();

    const interval = setInterval(() => {
      newTrip.timeLeft -= 1;
      newTrip.progress = Math.round(((actualDuration - newTrip.timeLeft) / actualDuration) * 100);

      if (newTrip.timeLeft <= 0) {
        clearInterval(interval);
        
        gameState.activeTrips = gameState.activeTrips.filter(t => t.id !== tripId);
        newTrip.locoRef.status = 'Siap Jalan';
        
        newTrip.locoRef.condition = Math.max(0, (newTrip.locoRef.condition || 100) - 10);

        gameState.money += newTrip.revenue;
        SoundSystem.playCoin();
        this.recordRevenue(newTrip.revenue);
        
        this.saveGame();
        
        const profit = newTrip.revenue - newTrip.fuelCost;
        UI.showNotification(`Kereta tiba! Omset: ${UI.formatRupiah(newTrip.revenue)} | Profit Bersih: ${UI.formatRupiah(profit)}`);
      }

      this.refreshUI();
    }, 1000);
  },

  bindEvents() {
    document.getElementById('buy-cc201-btn').addEventListener('click', () => this.buyLocomotive('CC201'));
    document.getElementById('buy-cc206-btn').addEventListener('click', () => this.buyLocomotive('CC206'));
    document.getElementById('buy-k3-btn').addEventListener('click', () => this.buyCoach('EKONOMI'));
    document.getElementById('buy-k1-btn').addEventListener('click', () => this.buyCoach('EKSEKUTIF'));
    
    document.getElementById('save-btn').addEventListener('click', () => this.saveGame(false));
    document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    document.getElementById('next-day-btn')?.addEventListener('click', () => this.nextDay());
  }
};

document.addEventListener('DOMContentLoaded', () => Game.init());