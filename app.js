const STORAGE_KEYS = {
    vehicles: 'refuelingcontrol_vehicles',
    repostajes: 'refuelingcontrol_repostajes',
    theme: 'refuelingcontrol_theme',
    lastVehicleId: 'refuelingcontrol_lastVehicleId',
    seeded: 'refuelingcontrol_seeded',
};

const PANEL_IDS = [
    'vehicleSelectorPanel',
    'vehicleListPanel',
    'createVehicleFormPanel',
    'repostajeFormPanel',
    'repostajeListPanel',
];

// Paneles junto a los que debe aparecer, debajo, el resumen de consumo del vehículo seleccionado.
const SUMMARY_VISIBLE_WITH = ['vehicleSelectorPanel', 'repostajeFormPanel', 'repostajeListPanel'];

let selectedVehicleId = null;

// ==========================================
// PERSISTENCIA (localStorage)
// ==========================================

function loadVehicles() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.vehicles) || '[]');
}

function saveVehicles(vehicles) {
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
}

function loadRepostajes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.repostajes) || '[]');
}

function saveRepostajes(repostajes) {
    localStorage.setItem(STORAGE_KEYS.repostajes, JSON.stringify(repostajes));
}

function nextId(items) {
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function seedDataIfEmpty() {
    // Solo precarga los vehículos de ejemplo la primera vez que se usa la app,
    // nunca más (aunque el usuario borre después todos sus vehículos).
    if (localStorage.getItem(STORAGE_KEYS.seeded)) return;
    localStorage.setItem(STORAGE_KEYS.seeded, 'true');

    if (loadVehicles().length > 0) return;
    saveVehicles([
        { id: 1, vehicleType: '🚗 Coche', name: 'Sedán Familiar', licensePlate: '1234ABC', brand: 'Toyota', model: 'Corolla', year: 2020, fuelType: 'Gasolina', description: 'Vehículo familiar, 5 puertas, color blanco' },
        { id: 2, vehicleType: '🏍️ Motocicleta', name: 'Naked Deportiva', licensePlate: '5678DEF', brand: 'Ford', model: 'Focus', year: 2019, fuelType: 'Diésel', description: 'Compacto diésel, bajo consumo' },
        { id: 3, vehicleType: '🚗 Coche', name: 'Eléctrico Premium', licensePlate: '9012GHI', brand: 'Tesla', model: 'Model 3', year: 2022, fuelType: 'Eléctrico', description: '100% eléctrico, autonomía 500km' },
    ]);
}

// ==========================================
// CÁLCULO DE CONSUMO
// ==========================================

function getHistorialConConsumo(vehicleId) {
    const repostajes = loadRepostajes()
        .filter(r => r.vehicleId === vehicleId)
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

    const resultado = [];
    let consumoAnterior = null;

    repostajes.forEach((actual, i) => {
        let consumo = null;

        if (i > 0) {
            const kmRecorridos = actual.kmActuales - repostajes[i - 1].kmActuales;
            if (kmRecorridos > 0) {
                consumo = Math.round((actual.litros / kmRecorridos) * 100 * 100) / 100;
            }
        }

        const esMejor = consumo === null || consumoAnterior === null || consumo <= consumoAnterior;
        resultado.push({ repostaje: actual, consumo, esMejor });

        if (consumo !== null) consumoAnterior = consumo;
    });

    return resultado;
}

function average(values) {
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function getConsumoMedioTotal(vehicleId) {
    const valores = getHistorialConConsumo(vehicleId).filter(h => h.consumo !== null).map(h => h.consumo);
    const avg = average(valores);
    return avg === null ? null : Math.round(avg * 100) / 100;
}

function getConsumoMedioMensual(vehicleId) {
    const haceUnMes = new Date();
    haceUnMes.setDate(haceUnMes.getDate() - 30);

    const valores = getHistorialConConsumo(vehicleId)
        .filter(h => h.consumo !== null && new Date(h.repostaje.fechaHora) >= haceUnMes)
        .map(h => h.consumo);

    const avg = average(valores);
    return avg === null ? null : Math.round(avg * 100) / 100;
}

// Media de litros repostados por repostaje, contando todos los registrados hasta la fecha.
function getMediaLitrosPorRepostaje(vehicleId) {
    const repostajes = loadRepostajes().filter(r => r.vehicleId === vehicleId);
    if (repostajes.length === 0) return null;
    const totalLitros = repostajes.reduce((sum, r) => sum + r.litros, 0);
    return Math.round((totalLitros / repostajes.length) * 100) / 100;
}

// Gasto medio mensual: agrupa el coste de los repostajes por mes natural y promedia
// solo entre los meses en los que hubo al menos un repostaje.
function getGastoMedioMensual(vehicleId) {
    const repostajes = loadRepostajes().filter(r => r.vehicleId === vehicleId);
    if (repostajes.length === 0) return null;

    const gastoPorMes = {};
    repostajes.forEach(r => {
        const fecha = new Date(r.fechaHora);
        const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
        gastoPorMes[clave] = (gastoPorMes[clave] || 0) + (r.litros * r.precioPorLitro);
    });

    const totalesPorMes = Object.values(gastoPorMes);
    return Math.round((totalesPorMes.reduce((a, b) => a + b, 0) / totalesPorMes.length) * 100) / 100;
}

// ==========================================
// TEMA CLARO / OSCURO
// ==========================================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggleButton').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEYS.theme, theme);

    // Refuerzo: fuerza el repintado del fondo del body (en algunos navegadores
    // no se recalcula solo al cambiar la variable CSS del elemento raíz).
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
    document.body.style.backgroundColor = bg;
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ==========================================
// CAMBIO ENTRE PANELES
// ==========================================

function showOnly(panelId) {
    PANEL_IDS.forEach(id => {
        document.getElementById(id).style.display = (id === panelId) ? '' : 'none';
    });
    updateConsumptionSummary(panelId);
}

function updateConsumptionSummary(activePanelId) {
    const panel = document.getElementById('consumptionSummaryPanel');

    if (!selectedVehicleId || !SUMMARY_VISIBLE_WITH.includes(activePanelId)) {
        panel.style.display = 'none';
        return;
    }

    const mediaLitros = getMediaLitrosPorRepostaje(selectedVehicleId);
    const gastoMensual = getGastoMedioMensual(selectedVehicleId);

    document.getElementById('mediaLitrosLabel').textContent = mediaLitros !== null ? `${mediaLitros.toFixed(2)} L` : '—';
    document.getElementById('gastoMedioMensualLabel').textContent = gastoMensual !== null ? `${gastoMensual.toFixed(2)} €` : '—';

    panel.style.display = '';
}

// ==========================================
// SELECTOR DE VEHÍCULO
// ==========================================

function renderVehiclePicker() {
    const vehicles = loadVehicles();
    const picker = document.getElementById('vehiclePicker');

    picker.innerHTML = '<option value="" disabled selected>Selecciona tu vehículo</option>';
    vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.vehicleType} ${v.name} - ${v.licensePlate}`;
        picker.appendChild(opt);
    });

    // Selección por defecto: el último vehículo consultado si sigue existiendo,
    // si no el primero de la lista, si no ninguno (placeholder).
    const lastId = Number(localStorage.getItem(STORAGE_KEYS.lastVehicleId));
    const defaultVehicle = vehicles.find(v => v.id === lastId) || vehicles[0] || null;

    if (defaultVehicle) {
        picker.value = defaultVehicle.id;
        applySelectedVehicle(defaultVehicle.id);
    } else {
        selectedVehicleId = null;
        document.getElementById('repostajeActionsPanel').style.display = 'none';
    }
}

function onVehicleSelected() {
    const picker = document.getElementById('vehiclePicker');
    applySelectedVehicle(picker.value ? Number(picker.value) : null);
}

function applySelectedVehicle(vehicleId) {
    selectedVehicleId = vehicleId;

    if (!selectedVehicleId) {
        document.getElementById('repostajeActionsPanel').style.display = 'none';
        updateConsumptionSummary('vehicleSelectorPanel');
        return;
    }

    localStorage.setItem(STORAGE_KEYS.lastVehicleId, String(selectedVehicleId));
    document.getElementById('repostajeActionsPanel').style.display = '';
    updateConsumoLabels();
    updateConsumptionSummary('vehicleSelectorPanel');
}

function updateConsumoLabels() {
    const mensual = getConsumoMedioMensual(selectedVehicleId);
    const total = getConsumoMedioTotal(selectedVehicleId);

    document.getElementById('consumoMensual').textContent = mensual !== null ? `${mensual.toFixed(2)} L/100km` : '—';
    document.getElementById('consumoTotal').textContent = total !== null ? `${total.toFixed(2)} L/100km` : '—';
}

// ==========================================
// MENÚ HAMBURGUESA
// ==========================================

function toggleMenu(forceClose) {
    const overlay = document.getElementById('menuOverlay');
    if (forceClose) {
        overlay.classList.remove('open');
    } else {
        overlay.classList.toggle('open');
    }
}

// ==========================================
// LISTA DE VEHÍCULOS / BORRADO
// ==========================================

function renderVehicleList() {
    const vehicles = loadVehicles();
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';

    if (vehicles.length === 0) {
        container.innerHTML = '<p class="empty-text">No hay vehículos registrados.</p>';
        return;
    }

    vehicles.forEach(v => {
        const row = document.createElement('div');
        row.className = 'list-item';
        row.innerHTML = `
            <div class="list-item__info">
                <div class="list-item__title">${v.vehicleType} ${v.name} - ${v.licensePlate}</div>
                <div class="list-item__subtitle">${v.brand} ${v.model} (${v.year})</div>
            </div>
            <button class="icon-btn" data-id="${v.id}" aria-label="Borrar vehículo">🗑️</button>
        `;
        container.appendChild(row);
    });

    container.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', () => onDeleteVehicle(Number(btn.dataset.id)));
    });
}

function onDeleteVehicle(vehicleId) {
    const vehicles = loadVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const confirmado = confirm(
        `¿Seguro que quieres borrar el vehículo "${vehicle.name}" (${vehicle.licensePlate})?\n\n` +
        `Se borrarán también todos sus repostajes registrados.`
    );
    if (!confirmado) return;

    saveVehicles(vehicles.filter(v => v.id !== vehicleId));
    saveRepostajes(loadRepostajes().filter(r => r.vehicleId !== vehicleId));

    if (selectedVehicleId === vehicleId) selectedVehicleId = null;

    renderVehiclePicker();
    renderVehicleList();
}

// ==========================================
// FORMULARIO: CREAR VEHÍCULO
// ==========================================

function clearCreateVehicleForm() {
    document.getElementById('vehicleNameInput').value = '';
    document.getElementById('licensePlateInput').value = '';
    document.getElementById('brandInput').value = '';
    document.getElementById('modelInput').value = '';
    document.getElementById('vehicleTypeSelect').selectedIndex = 0;
    document.getElementById('yearInput').value = '';
    document.getElementById('vehicleFuelTypeSelect').selectedIndex = 0;
    document.getElementById('descriptionInput').value = '';
    document.getElementById('createVehicleMessage').style.display = 'none';
}

function showCreateVehicleError(message) {
    const el = document.getElementById('createVehicleMessage');
    el.textContent = '❌ ' + message;
    el.style.display = '';
}

function onSaveVehicle() {
    const name = document.getElementById('vehicleNameInput').value.trim();
    const plate = document.getElementById('licensePlateInput').value.trim().toUpperCase();
    const brand = document.getElementById('brandInput').value.trim();
    const model = document.getElementById('modelInput').value.trim();
    const vehicleType = document.getElementById('vehicleTypeSelect').value;
    const yearStr = document.getElementById('yearInput').value.trim();
    const fuelType = document.getElementById('vehicleFuelTypeSelect').value;
    const description = document.getElementById('descriptionInput').value.trim();

    const currentYear = new Date().getFullYear();
    const year = parseInt(yearStr, 10);

    if (!name) return showCreateVehicleError('El nombre del vehículo es obligatorio.');
    if (!plate) return showCreateVehicleError('La matrícula es obligatoria.');
    if (!brand) return showCreateVehicleError('La marca es obligatoria.');
    if (!model) return showCreateVehicleError('El modelo es obligatorio.');
    if (!vehicleType) return showCreateVehicleError('Debes seleccionar un tipo de vehículo.');
    if (!yearStr || isNaN(year) || year < 1900 || year > currentYear + 1) {
        return showCreateVehicleError(`El año debe ser un número válido entre 1900 y ${currentYear + 1}.`);
    }
    if (!fuelType) return showCreateVehicleError('Debes seleccionar un tipo de combustible.');

    const vehicles = loadVehicles();
    const vehicle = { id: nextId(vehicles), vehicleType, name, licensePlate: plate, brand, model, year, fuelType, description };
    vehicles.push(vehicle);
    saveVehicles(vehicles);

    renderVehiclePicker();
    alert(`✅ Vehículo "${vehicle.name}" guardado correctamente.`);
    showOnly('vehicleSelectorPanel');
}

// ==========================================
// FORMULARIO: NUEVO REPOSTAJE
// ==========================================

function parseNumber(text) {
    const value = parseFloat(String(text).replace(',', '.'));
    return isNaN(value) ? 0 : value;
}

function showRepostajeForm() {
    if (!selectedVehicleId) return;
    const vehicle = loadVehicles().find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    document.getElementById('repostajeFormTitle').textContent = `⛽ Nuevo Repostaje — ${vehicle.name}`;
    document.getElementById('kmActualesInput').value = '';
    document.getElementById('litrosInput').value = '';
    document.getElementById('precioPorLitroInput').value = '';
    document.getElementById('costeTotalDisplay').textContent = '0.00 €';
    document.getElementById('repostajeMessage').style.display = 'none';

    // Prerellena con el combustible ya registrado del vehículo (editable).
    const fuelSelect = document.getElementById('repostajeFuelTypeSelect');
    fuelSelect.value = vehicle.fuelType;
    if (fuelSelect.value !== vehicle.fuelType) fuelSelect.selectedIndex = 0;

    const now = new Date();
    document.getElementById('fechaInput').value = now.toISOString().slice(0, 10);
    document.getElementById('horaInput').value = now.toTimeString().slice(0, 5);

    showOnly('repostajeFormPanel');
}

function updateCosteTotal() {
    const litros = parseNumber(document.getElementById('litrosInput').value);
    const precio = parseNumber(document.getElementById('precioPorLitroInput').value);
    document.getElementById('costeTotalDisplay').textContent = `${(litros * precio).toFixed(2)} €`;
}

function showRepostajeError(message) {
    const el = document.getElementById('repostajeMessage');
    el.textContent = '❌ ' + message;
    el.style.display = '';
}

function onSaveRepostaje() {
    if (!selectedVehicleId) return;

    const kmStr = document.getElementById('kmActualesInput').value.trim();
    const km = parseInt(kmStr, 10);
    const litros = parseNumber(document.getElementById('litrosInput').value);
    const fuelType = document.getElementById('repostajeFuelTypeSelect').value;
    const precio = parseNumber(document.getElementById('precioPorLitroInput').value);
    const fecha = document.getElementById('fechaInput').value;
    const hora = document.getElementById('horaInput').value;

    if (!kmStr || isNaN(km)) return showRepostajeError('Introduce un valor válido de km actuales.');
    if (!litros || litros <= 0) return showRepostajeError('Introduce una cantidad de litros válida.');
    if (!fuelType) return showRepostajeError('Selecciona el tipo de combustible.');
    if (!precio || precio <= 0) return showRepostajeError('Introduce un precio por litro válido.');
    if (!fecha) return showRepostajeError('Selecciona una fecha.');

    const fechaHora = new Date(`${fecha}T${hora || '00:00'}:00`);

    const repostajes = loadRepostajes();
    const repostaje = {
        id: nextId(repostajes),
        vehicleId: selectedVehicleId,
        fechaHora: fechaHora.toISOString(),
        kmActuales: km,
        litros,
        tipoCombustible: fuelType,
        precioPorLitro: precio,
    };
    repostajes.push(repostaje);
    saveRepostajes(repostajes);

    updateConsumoLabels();
    alert('✅ Repostaje guardado correctamente.');
    showOnly('vehicleSelectorPanel');
}

// ==========================================
// LISTA DE REPOSTAJES
// ==========================================

function showRepostajeList() {
    if (!selectedVehicleId) return;
    const vehicle = loadVehicles().find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    document.getElementById('repostajeListTitle').textContent = `REPOSTAJES — ${vehicle.name}`;

    const historial = getHistorialConConsumo(selectedVehicleId).slice().reverse();
    const container = document.getElementById('repostajesList');
    container.innerHTML = '';

    if (historial.length === 0) {
        container.innerHTML = '<p class="empty-text">Todavía no hay repostajes registrados para este vehículo.</p>';
    } else {
        historial.forEach(h => {
            const fecha = new Date(h.repostaje.fechaHora);
            const fechaTexto = fecha.toLocaleDateString('es-ES');
            const horaTexto = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const consumoTexto = h.consumo !== null ? `${h.consumo.toFixed(2)} L/100km` : 'Sin datos';
            const colorClass = h.consumo === null ? 'consumo-neutro' : (h.esMejor ? 'consumo-verde' : 'consumo-rojo');
            const importe = (h.repostaje.litros * h.repostaje.precioPorLitro).toFixed(2);

            const row = document.createElement('div');
            row.className = 'list-item';
            row.innerHTML = `
                <div class="list-item__info">
                    <div class="list-item__title">${fechaTexto} <span class="list-item__time">${horaTexto}</span></div>
                    <div class="list-item__subtitle">${h.repostaje.litros.toFixed(2)} L · ${h.repostaje.precioPorLitro.toFixed(3)} €/L</div>
                </div>
                <div class="list-item__stats">
                    <div class="list-item__amount">${importe} €</div>
                    <div class="list-item__consumo ${colorClass}">${consumoTexto}</div>
                </div>
            `;
            container.appendChild(row);
        });
    }

    showOnly('repostajeListPanel');
}

// ==========================================
// INSTALACIÓN COMO APP (PWA)
// ==========================================

let deferredInstallPrompt = null;

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

function setupInstallButton() {
    const installButton = document.getElementById('installButton');

    // Chrome/Edge/Android: se dispara cuando el navegador considera la app instalable.
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installButton.style.display = '';
    });

    installButton.addEventListener('click', () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(() => {
            deferredInstallPrompt = null;
            installButton.style.display = 'none';
        });
    });

    window.addEventListener('appinstalled', () => {
        installButton.style.display = 'none';
        deferredInstallPrompt = null;
    });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    setupInstallButton();

    applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'light');
    document.getElementById('themeToggleButton').addEventListener('click', toggleTheme);

    seedDataIfEmpty();
    renderVehiclePicker();
    showOnly('vehicleSelectorPanel');

    document.getElementById('vehiclePicker').addEventListener('change', onVehicleSelected);

    document.getElementById('menuButton').addEventListener('click', () => toggleMenu(false));
    document.getElementById('menuOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'menuOverlay') toggleMenu(true);
    });
    document.getElementById('menuCrearVehiculo').addEventListener('click', () => {
        toggleMenu(true);
        clearCreateVehicleForm();
        showOnly('createVehicleFormPanel');
    });
    document.getElementById('menuListarVehiculos').addEventListener('click', () => {
        toggleMenu(true);
        renderVehicleList();
        showOnly('vehicleListPanel');
    });

    document.getElementById('btnCancelCreateVehicle').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnSaveVehicle').addEventListener('click', onSaveVehicle);

    document.getElementById('btnNewRepostaje').addEventListener('click', showRepostajeForm);
    document.getElementById('btnListRepostajes').addEventListener('click', showRepostajeList);

    document.getElementById('litrosInput').addEventListener('input', updateCosteTotal);
    document.getElementById('precioPorLitroInput').addEventListener('input', updateCosteTotal);
    document.getElementById('btnCancelRepostaje').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnSaveRepostaje').addEventListener('click', onSaveRepostaje);

    document.getElementById('btnBackFromVehicleList').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnBackFromRepostajeList').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnBackFromRepostajeForm').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnBackFromCreateVehicle').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
});
