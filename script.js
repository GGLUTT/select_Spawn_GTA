// Екран завантаження
const loader = document.getElementById('loader');
const loaderVideo = document.getElementById('loaderVideo');
function hideLoader() {
  if (!loader) return;
  if (!loader.classList.contains('hidden')) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 700);
  }
}
if (loaderVideo) {
  loaderVideo.addEventListener('ended', hideLoader);
}
window.addEventListener('load', () => {
  setTimeout(hideLoader, 8000);
});

// Створюємо зірки
const spaceBackground = document.getElementById('spaceBackground');
for (let i = 0; i < 200; i++) {
  const star = document.createElement('div');
  star.className = 'star';
  star.style.left = Math.random() * 100 + '%';
  star.style.top = Math.random() * 100 + '%';
  const size = Math.random() * 2.5 + 0.5;
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.animationDelay = Math.random() * 3 + 's';
  spaceBackground.appendChild(star);
}

// Дані спавнів
const spawns = [
  {
    id: 1,
    name: 'МЕСТО ВЫХОДА',
    description: 'ПОСЛЕДНЕЕ МЕСТО ГДЕ ВЫ БЫЛИ',
    lat: 50,
    lon: 30,
    color: '#0058bc',
    locked: false,
    icon: 'refresh',
  },
  {
    id: 2,
    name: 'НАЧАЛЬНАЯ ПОЗИЦИЯ №1',
    description: 'МЕСТО ГДЕ ПОЯВЛЯЮТЬСЯ НОВИНЬКИЕ',
    lat: 40,
    lon: -74,
    color: '#1d6cff',
    locked: false,
    icon: 'map-pin',
  },
  {
    id: 3,
    name: 'ФРАКЦИЯ',
    description: 'МЕСТО ГДЕ ВЫ РАБОТАЕТЕ',
    lat: 35,
    lon: 139,
    color: '#0058bc',
    locked: false,
    icon: 'users',
  },
  {
    id: 4,
    name: 'ДОМ',
    description: 'ЭТА ПОЗИЦИЯ НЕДОСТУПНА',
    lat: -33,
    lon: 151,
    color: '#ff6658',
    locked: true,
    icon: 'lock',
  },
];

// Іконки SVG
const icons = {
  refresh:
    '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>',
  'map-pin':
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  lock:
    '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};

let selectedSpawn = null;
let rotation = { x: 0, y: 0 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let autoRotate = true;
let hoveredSpawn = null;

// Canvas
const canvas = document.getElementById('earthCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const earthRadius = 150;
const tooltip = document.getElementById('tooltip');

// Функція для конвертації координат на сферу
function latLonToCartesian(lat, lon, radius) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = ((lon + rotation.y) * Math.PI) / 180;

  const x = centerX + radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = centerY - radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);

  return { x, y, z };
}

// Малювання реалістичних хмар
function drawClouds() {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotation.y * Math.PI) / 360);
  ctx.translate(-centerX, -centerY);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.globalCompositeOperation = 'screen';

  const cloudPositions = [
    { x: 30, y: -50, w: 50, h: 25 },
    { x: -60, y: 20, w: 40, h: 20 },
    { x: 70, y: 40, w: 35, h: 18 },
    { x: -30, y: -30, w: 45, h: 22 },
    { x: 10, y: 60, w: 38, h: 19 },
  ];

  cloudPositions.forEach((cloud) => {
    ctx.beginPath();
    ctx.ellipse(centerX + cloud.x, centerY + cloud.y, cloud.w, cloud.h, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

// Малювання атмосфери
function drawAtmosphere() {
  const atmosphereGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    earthRadius,
    centerX,
    centerY,
    earthRadius + 25,
  );
  atmosphereGradient.addColorStop(0, 'rgba(100, 150, 255, 0.4)');
  atmosphereGradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.2)');
  atmosphereGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

  ctx.fillStyle = atmosphereGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius + 25, 0, Math.PI * 2);
  ctx.fill();
}

// Малювання Землі
function drawEarth() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Тінь планети
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.arc(centerX + 10, centerY + 10, earthRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Основна сфера з реалістичним градієнтом
  const gradient = ctx.createRadialGradient(
    centerX - earthRadius * 0.4,
    centerY - earthRadius * 0.4,
    earthRadius * 0.1,
    centerX,
    centerY,
    earthRadius * 1.2,
  );
  gradient.addColorStop(0, '#6bc5ff');
  gradient.addColorStop(0.3, '#3a9bd9');
  gradient.addColorStop(0.6, '#1e6eb8');
  gradient.addColorStop(0.85, '#0d4a8a');
  gradient.addColorStop(1, '#052a52');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
  ctx.fill();

  // Континенти з більш реалістичними формами
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotation.y * Math.PI) / 360);
  ctx.translate(-centerX, -centerY);

  // Тіні континентів
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.globalAlpha = 0.5;

  ctx.beginPath();
  ctx.ellipse(centerX + 52, centerY - 38, 70, 35, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(centerX + 22, centerY + 32, 40, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // Континенти
  const continentGradient = ctx.createLinearGradient(centerX - 100, centerY - 100, centerX + 100, centerY + 100);
  continentGradient.addColorStop(0, '#3d9954');
  continentGradient.addColorStop(0.5, '#2d7a3e');
  continentGradient.addColorStop(1, '#1d5a2e');

  ctx.fillStyle = continentGradient;
  ctx.globalAlpha = 0.95;

  // Євразія
  ctx.beginPath();
  ctx.ellipse(centerX + 50, centerY - 40, 70, 35, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Африка
  ctx.beginPath();
  ctx.ellipse(centerX + 20, centerY + 30, 40, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Америка
  ctx.beginPath();
  ctx.ellipse(centerX - 70, centerY - 10, 35, 70, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Південна Америка
  ctx.beginPath();
  ctx.ellipse(centerX - 65, centerY + 50, 28, 40, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Австралія
  ctx.beginPath();
  ctx.ellipse(centerX + 80, centerY + 50, 25, 20, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Хмари
  if (!lazyMode) {
    drawClouds();
  }

  // Динамічне освітлення
  const lightGradient = ctx.createRadialGradient(
    centerX - earthRadius * 0.5,
    centerY - earthRadius * 0.5,
    0,
    centerX,
    centerY,
    earthRadius * 1.5,
  );
  lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  lightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
  lightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
  lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.globalAlpha = 1;
  ctx.fillStyle = lightGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
  ctx.fill();

  // Тінь на темній стороні
  const shadowGradient = ctx.createRadialGradient(
    centerX + earthRadius * 0.5,
    centerY + earthRadius * 0.5,
    0,
    centerX,
    centerY,
    earthRadius * 1.3,
  );
  shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');

  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
  ctx.fill();

  // Атмосфера
  drawAtmosphere();

  // Малюємо маркери
  drawMarkers();
}

// Малювання маркерів
function drawMarkers() {
  spawns.forEach((spawn) => {
    const pos = latLonToCartesian(spawn.lat, spawn.lon, earthRadius);

    if (pos.z > -30) {
      const scale = Math.max(0.3, (pos.z + earthRadius) / (earthRadius * 2));
      const size = 12 * scale;
      const opacity = Math.max(0.3, scale);

      ctx.globalAlpha = opacity;

      const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 3);
      glowGradient.addColorStop(0, spawn.color + 'dd');
      glowGradient.addColorStop(0.4, spawn.color + '88');
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = spawn.color;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size + 5, 0, Math.PI * 2);
      ctx.stroke();

      const markerGradient = ctx.createRadialGradient(
        pos.x - size * 0.3,
        pos.y - size * 0.3,
        0,
        pos.x,
        pos.y,
        size,
      );
      markerGradient.addColorStop(0, '#ffffff');
      markerGradient.addColorStop(0.4, spawn.color);
      markerGradient.addColorStop(1, spawn.color);

      ctx.fillStyle = markerGradient;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (selectedSpawn === spawn.id) {
        const pulse = Math.sin(Date.now() / 200) * 4;
        ctx.globalAlpha = opacity * 0.7;
        ctx.strokeStyle = spawn.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = opacity * 0.4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 15 + pulse * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (hoveredSpawn === spawn.id) {
        ctx.globalAlpha = opacity * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      if (pos.z > 0) {
        const lineGradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + 30 * scale);
        lineGradient.addColorStop(0, spawn.color + 'aa');
        lineGradient.addColorStop(1, spawn.color + '00');

        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y + 30 * scale);
        ctx.stroke();
      }
    }
  });
}

// Показати підказку
function showTooltip(spawn, x, y) {
  const tooltipTitle = tooltip.querySelector('.tooltip-title');
  const tooltipDesc = tooltip.querySelector('.tooltip-desc');
  const tooltipCoords = tooltip.querySelector('.tooltip-coords');

  tooltipTitle.textContent = spawn.name;
  tooltipDesc.textContent = spawn.description;
  tooltipCoords.textContent = `Координати: ${spawn.lat}°, ${spawn.lon}°`;

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.style.borderColor = spawn.color;
  tooltip.classList.add('show');
}

// Сховати підказку
function hideTooltip() {
  tooltip.classList.remove('show');
  hoveredSpawn = null;
}

// Обробка миші
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  autoRotate = false;
  dragStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (isDragging) {
    const deltaX = e.clientX - dragStart.x;
    rotation.y += deltaX * 0.5;
    dragStart = { x: e.clientX, y: e.clientY };
    hideTooltip();
  } else {
    let foundHover = false;
    spawns.forEach((spawn) => {
      const pos = latLonToCartesian(spawn.lat, spawn.lon, earthRadius);

      if (pos.z > -30) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance < 20) {
          canvas.style.cursor = 'pointer';
          hoveredSpawn = spawn.id;
          showTooltip(spawn, e.clientX, e.clientY);
          foundHover = true;
        }
      }
    });

    if (!foundHover) {
      canvas.style.cursor = 'move';
      hideTooltip();
    }
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  canvas.style.cursor = 'move';
  hideTooltip();
});

// Клік на маркер
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  spawns.forEach((spawn) => {
    if (spawn.locked) return;

    const pos = latLonToCartesian(spawn.lat, spawn.lon, earthRadius);

    if (pos.z > -30) {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 20) {
        selectSpawn(spawn.id);
      }
    }
  });
});

// Рендер карток
const spawnsGrid = document.getElementById('spawnsGrid');
function renderSpawnsGrid() {
  spawnsGrid.innerHTML = '';
  spawns.forEach((spawn) => {
    const card = document.createElement('div');
    card.className = 'spawn-card' + (spawn.locked ? ' blocked' : '');
    card.dataset.id = spawn.id;
    card.innerHTML = `
      <div class="spawn-icon">
        <svg viewBox="0 0 24 24">${icons[spawn.icon] || icons['map-pin']}</svg>
      </div>
      <div class="spawn-text">
        <div class="spawn-name">${spawn.name}</div>
        <div class="spawn-desc">${spawn.description}</div>
      </div>
    `;
    if (!spawn.locked) {
      card.addEventListener('click', () => selectSpawn(spawn.id));
    }
    spawnsGrid.appendChild(card);
  });
}
renderSpawnsGrid();

// Вибір спавну
function selectSpawn(id) {
  selectedSpawn = id;
  document.querySelectorAll('.spawn-card').forEach((card) => {
    card.classList.remove('selected');
    if (parseInt(card.dataset.id) === id) {
      card.classList.add('selected');
    }
  });
  document.getElementById('spawnButton').disabled = false;
}

// Кнопка спавну
document.getElementById('spawnButton').addEventListener('click', () => {
  if (selectedSpawn) {
    const spawn = spawns.find((s) => s.id === selectedSpawn);
    Notify.success(`Спавн на позиції: ${spawn.name}`, 'Спавн виконано');
  } else {
    Notify.warning('Спочатку оберіть позицію', 'Немає вибору');
  }
});

// Анімація
function animate() {
  if (autoRotate && !isDragging) {
    rotation.y += 0.2;
  }
  drawEarth();
  requestAnimationFrame(animate);
}

let lazyMode = false;
animate();

// ===== Адмін панель і таблиця локацій =====
document.addEventListener('DOMContentLoaded', () => {
  const adminPanel = document.getElementById('adminPanel');
  const locationsModal = document.getElementById('locationsModal');

  function toggleAdminPanel(force) {
    if (!adminPanel) return;
    const shouldShow = typeof force === 'boolean' ? force : !adminPanel.classList.contains('show');
    adminPanel.classList.toggle('show', shouldShow);
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyU') {
      toggleAdminPanel();
    }
  });

  const palette = document.getElementById('colorPalette');
  const hiddenColor = document.getElementById('colorSelected');
  const customInput = document.getElementById('colorCustomInput');
  if (palette && hiddenColor) {
    const defaultColor = hiddenColor.value || '#1d6cff';
    palette.querySelectorAll('.color-swatch').forEach((btn) => {
      const c = btn.dataset.color;
      btn.style.background = c;
      btn.addEventListener('click', () => {
        hiddenColor.value = c;
        if (customInput) customInput.value = c;
        palette.querySelectorAll('.color-swatch').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
    let initial = Array.from(palette.querySelectorAll('.color-swatch')).find(
      (b) => (b.dataset.color || '').toLowerCase() === defaultColor.toLowerCase(),
    );
    if (!initial) initial = palette.querySelector('.color-swatch');
    if (initial) initial.classList.add('selected');
  }
  if (customInput && hiddenColor) {
    customInput.addEventListener('input', () => {
      hiddenColor.value = customInput.value;
      if (palette) palette.querySelectorAll('.color-swatch').forEach((b) => b.classList.remove('selected'));
    });
  }

  const addForm = document.getElementById('adminAddForm');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(addForm);
      const name = String(data.get('name') || '').trim();
      const description = String(data.get('description') || '').trim();
      const lat = parseFloat(String(data.get('lat')));
      const lon = parseFloat(String(data.get('lon')));
      const color = String(data.get('color') || '#1d6cff');
      const locked = data.get('locked') === 'on';
      const icon = String(data.get('icon') || 'map-pin');

      if (!name || Number.isNaN(lat) || Number.isNaN(lon)) {
        Notify.warning('Заповніть назву і коректні координати', 'Перевірка');
        return;
      }
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        Notify.error('Координати поза діапазоном', 'Помилка');
        return;
      }

      const nextId = (spawns.reduce((m, s) => Math.max(m, s.id), 0) || 0) + 1;
      spawns.push({ id: nextId, name, description, lat, lon, color, locked, icon });
      renderSpawnsGrid();
      Notify.success(`Додано точку: ${name}`, 'Адмін');
      addForm.reset();
    });
  }

  const lazyToggle = document.getElementById('lazyToggle');
  if (lazyToggle) {
    lazyToggle.addEventListener('change', (e) => {
      lazyMode = e.target.checked;
      if (typeof loaderVideo !== 'undefined' && loaderVideo) {
        loaderVideo.preload = lazyMode ? 'none' : 'auto';
      }
      Notify.info(lazyMode ? 'Lazy Mode увімкнено' : 'Lazy Mode вимкнено', 'Режим');
    });
  }

  const locationsButton = document.getElementById('locationsButton');
  const locationsTableBody = document.getElementById('locationsTableBody');
  function renderLocationsTable() {
    if (!locationsTableBody) return;
    locationsTableBody.innerHTML = '';
    spawns.forEach((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.description}</td>
        <td>${s.lat}</td>
        <td>${s.lon}</td>
        <td>${s.locked ? '🔒' : '✅'}</td>
        <td><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${s.color}"></span> ${s.color}</td>
      `;
      locationsTableBody.appendChild(tr);
    });
  }
  if (locationsButton) {
    locationsButton.addEventListener('click', () => {
      renderLocationsTable();
      if (locationsModal) locationsModal.classList.add('show');
    });
  }

  const closeLocationsBtn = document.getElementById('closeLocations');
  if (closeLocationsBtn && locationsModal)
    closeLocationsBtn.addEventListener('click', () => locationsModal.classList.remove('show'));
  const closeAdminBtn = document.getElementById('closeAdmin');
  if (closeAdminBtn && adminPanel) closeAdminBtn.addEventListener('click', () => adminPanel.classList.remove('show'));
});

// Демонстраційна нотифікація
setTimeout(() => {
  Notify.info('Оберіть точку на планеті або зі списку', 'Ласкаво просимо');
}, 1200);
