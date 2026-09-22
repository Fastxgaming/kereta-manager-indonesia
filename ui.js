let financeChart = null;
let activeMapRegion = 'JAWA';

const UI = {
  formatRupiah(number) {
    if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number);
  },

  updateHeader(money, day, weather, currentEvent) {
    document.getElementById('money').innerText = this.formatRupiah(money);
    document.getElementById('day').innerText = day;

    // Element cuaca & event (jika ada di HTML)
    const weatherElem = document.getElementById('current-weather');
    const eventElem = document.getElementById('current-event');
    if (weatherElem) weatherElem.innerText = weather ? weather.name : 'Cerah ☀️';
    if (eventElem) eventElem.innerText = currentEvent ? currentEvent.name : 'Hari Biasa';
  },

  updateBankLoan(amount) {
    const loanElem = document.getElementById('bank-loan-amount');
    if (loanElem) loanElem.innerText = this.formatRupiah(amount);
  },

  renameTrain(index) {
    const loco = gameState.fleet[index];
    if (!loco) return;

    const currentName = loco.name;
    const newName = prompt('Masukkan nama baru untuk lokomotif ini:', currentName);

    if (newName && newName.trim() !== '') {
      const trimmedName = newName.trim();
      loco.name = trimmedName;
      Game.saveGame();
      Game.refreshUI();
      UI.showNotification(`Nama kereta berhasil diubah menjadi "${trimmedName}"!`);
    }
  },

  initChart() {
    const canvas = document.getElementById('financeChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (financeChart) financeChart.destroy();

    financeChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Hari 1'],
        datasets: [
          {
            label: 'Pendapatan (Omset)',
            data: [0],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Pengeluaran (BBM & Servis)',
            data: [0],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.raw || 0;
                return `${context.dataset.label}: ${this.formatRupiah(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => `Rp ${(value / 1000000).toFixed(0)} Jt`
            }
          }
        }
      }
    });
  },

  updateFinanceChart(history = []) {
    if (!financeChart) return;

    const labels = history.map(item => `Hari ${item.day}`);
    const revenues = history.map(item => item.revenue);
    const expenses = history.map(item => item.expense);

    financeChart.data.labels = labels;
    financeChart.data.datasets[0].data = revenues;
    financeChart.data.datasets[1].data = expenses;
    financeChart.update();
  },

  setMapRegion(region) {
    if (region !== 'JAWA' && region !== 'SUMATRA') return;

    activeMapRegion = region;
    document.getElementById('tab-jawa')?.classList.toggle('active', region === 'JAWA');
    document.getElementById('tab-sumatra')?.classList.toggle('active', region === 'SUMATRA');
  },

  getMapRegion() {
    return activeMapRegion;
  },

  updateFreeCoaches(freeCoaches) {
    document.getElementById('free-k3').innerText = freeCoaches?.EKONOMI || 0;
    document.getElementById('free-k1').innerText = freeCoaches?.EKSEKUTIF || 0;
  },

  showSaveStatus(text) {
    const statusElem = document.getElementById('save-status');
    statusElem.innerText = text;
    setTimeout(() => {
      statusElem.innerText = '';
    }, 2000);
  },

  renderFleet(fleet) {
    const fleetList = document.getElementById('fleet-list');
    if (!fleetList) return;
    
    if (!fleet || fleet.length === 0) {
      fleetList.innerHTML = '<p class="empty-state">Belum ada lokomotif. Beli di toko terlebih dahulu.</p>';
      return;
    }

    const routeOptionsHTML = ROUTES.map((route, rIndex) => `
      <option value="${rIndex}">${route.origin} ➔ ${route.destination} (${route.durationSeconds}s)</option>
    `).join('');

    fleetList.innerHTML = fleet.map((item, index) => {
      const totalCoaches = item.coaches ? item.coaches.length : 0;
      const isFull = totalCoaches >= item.maxCoaches;
      const isReady = item.status === 'Siap Jalan';
      const condition = item.condition ?? 100;
      const needRepair = condition < 100;
      const repairCost = item.repairCost || (LOCOMOTIVES[item.id] ? LOCOMOTIVES[item.id].repairCost : 15000000);

      return `
        <div class="card-item">
          <strong>🚆 ${item.name} (#${index + 1})</strong>
          <div><small>Status: <b>${item.status}</b> | Kondisi Mesin: <b>${condition}%</b></small></div>
          <div><small>Rangkaian: ${totalCoaches} / ${item.maxCoaches} Gerbong</small></div>
          <div><small>Detail: ${item.coaches && item.coaches.length > 0 ? item.coaches.map(c => c.name).join(', ') : 'Belum ada gerbong'}</small></div>
          
          ${isReady ? `
            <div class="card-actions">
              <button class="btn-action" onclick="UI.renameTrain(${index})">✏️ Ubah Nama</button>
              <button class="btn-action" onclick="Game.attachCoach(${index}, 'EKONOMI')" ${isFull ? 'disabled' : ''}>+ Ekonomi</button>
              <button class="btn-action" onclick="Game.attachCoach(${index}, 'EKSEKUTIF')" ${isFull ? 'disabled' : ''}>+ Eksekutif</button>
              ${needRepair ? `<button class="btn-action" style="background-color:#e74c3c" onclick="Game.repairLocomotive(${index})">🛠️ Servis (${this.formatRupiah(repairCost)})</button>` : ''}
            </div>
            
            <div style="margin-top: 10px;">
              <label><small>Pilih Rute Perjalanan:</small></label>
              <select id="route-select-${index}" style="width: 100%; padding: 6px; margin-top: 4px; border-radius: 4px; border: 1px solid #ccc;">
                ${routeOptionsHTML}
              </select>
            </div>

            <button class="btn-start" onclick="Game.startTrip(${index})">Jalankan Kereta</button>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  renderActiveTrips(activeTrips) {
    const tripsContainer = document.getElementById('active-trips');
    if (!tripsContainer) return;

    if (!activeTrips || activeTrips.length === 0) {
      tripsContainer.innerHTML = '<p class="empty-state">Tidak ada kereta yang sedang beroperasi.</p>';
      return;
    }

    tripsContainer.innerHTML = activeTrips.map(trip => `
      <div class="card-item">
        <div style="display:flex; justify-content:space-between;">
          <span><strong>${trip.trainName}</strong> (${trip.origin} ➔ ${trip.destination})</span>
          <span>${trip.progress}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${trip.progress}%"></div>
        </div>
        <small>Cuaca: <b>${trip.weather?.name || 'Cerah ☀️'}</b> | Estimasi Omset: ${this.formatRupiah(trip.revenue)} | BBM: ${this.formatRupiah(trip.fuelCost)} | Sisa: ${trip.timeLeft}s</small>
      </div>
    `).join('');
  },

  // Render Loop Canvas
  startMapLoop(getActiveTripsFn, getCurrentRegionFn) {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentRegion = getCurrentRegionFn();

      const filteredRoutes = ROUTES.filter(route => route.region === currentRegion);
      const filteredStations = Object.values(STATIONS).filter(station => station.region === currentRegion);

      // 1. Gambar Rel Putus-putus
      filteredRoutes.forEach(route => {
        const originSt = STATIONS[route.originKey];
        const destSt = STATIONS[route.destKey];

        if (originSt && destSt) {
          ctx.beginPath();
          ctx.moveTo(originSt.x, originSt.y);
          ctx.lineTo(destSt.x, destSt.y);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 2. Gambar Stasiun
      filteredStations.forEach(st => {
        ctx.beginPath();
        ctx.arc(st.x, st.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'center';
        ctx.fillText(st.name, st.x, st.y + 20);
      });

      // 3. Gambar Kereta Berjalan (Smooth Interpolation)
      const activeTrips = getActiveTripsFn();
      if (activeTrips && activeTrips.length > 0) {
        const now = Date.now();
        activeTrips.forEach(trip => {
          const originSt = STATIONS[trip.originKey];
          const destSt = STATIONS[trip.destKey];

          if (originSt && destSt && originSt.region === currentRegion) {
            // Hitung progress realtime berdasarkan timestamp
            const elapsedTime = (now - trip.startTime) / 1000;
            const currentProgress = Math.min(1, elapsedTime / trip.totalDuration);

            const currentX = originSt.x + (destSt.x - originSt.x) * currentProgress;
            const currentY = originSt.y + (destSt.y - originSt.y) * currentProgress;

            // Titik Kereta Interaktif
            ctx.beginPath();
            ctx.arc(currentX, currentY, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label Kereta
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#dc2626';
            ctx.textAlign = 'center';
            ctx.fillText(`🚆 ${trip.trainName}`, currentX, currentY - 12);
          }
          });
      }

      requestAnimationFrame(animate);
    };

    animate();
  },

  showNotification(message) {
    alert(message);
  }
};