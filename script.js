class ScheduleApp {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'calendar';
        this.selectedDate = null;
        this.currentUser = null;
        this.selectedRole = 'admin';
        this.selectedAvailabilityDate = null;
        
        // Dane domyślne
        this.stations = [
            { name: 'OAIT Dzienny', is24h: false, defaultHours: { start: '08:00', end: '15:00' } },
            { name: 'OAIT 24h', is24h: true, defaultHours: { start: '08:00', end: '08:00' } },
            { name: 'Ortopedia', is24h: false, defaultHours: { start: '08:00', end: '15:00' } },
            { name: 'Sala Wybudzeń', is24h: false, defaultHours: { start: '08:00', end: '15:00' } }
        ];

        this.staff = [
            { id: '1', name: 'Lek. Nowak' },
            { id: '2', name: 'Lek. Kowalski' },
            { id: '3', name: 'Lek. Wiśniewski' }
        ];

        this.shifts = {};
        this.availability = {};
        this.preferences = {};
        this.roomHours = {};

        this.loadData();
        this.init();
    }

    generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

    init() {
        this.renderLoginScreen();
        this.setupStationSelect();
        // Auto-save
        setInterval(() => this.saveData(), 30000);
    }

    // ===== LOGIKA DANYCH =====
    saveData() {
        const data = {
            stations: this.stations,
            staff: this.staff,
            shifts: this.shifts,
            availability: this.availability,
            preferences: this.preferences,
            roomHours: this.roomHours
        };
        localStorage.setItem('scheduleData_v2', JSON.stringify(data));
    }

    loadData() {
        const saved = localStorage.getItem('scheduleData_v2');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.stations = data.stations || this.stations;
                this.staff = data.staff || this.staff;
                this.shifts = data.shifts || {};
                this.availability = data.availability || {};
                this.preferences = data.preferences || {};
                this.roomHours = data.roomHours || {};
            } catch (e) { console.error('Błąd ładowania danych', e); }
        }
    }

    // ===== LOGOWANIE I NAV =====
    renderLoginScreen() {
        const list = document.getElementById('staffListLogin');
        list.innerHTML = this.staff.map(p => 
            `<button onclick="app.loginAsStaff('${p.id}')">${p.name}</button>`
        ).join('');
    }

    selectRole(role) {
        this.selectedRole = role;
        document.getElementById('adminRoleBtn').classList.toggle('active', role === 'admin');
        document.getElementById('staffRoleBtn').classList.toggle('active', role === 'staff');
        
        if (role === 'admin') {
            document.getElementById('adminLoginDiv').classList.remove('hidden');
            document.getElementById('staffSelectDiv').classList.add('hidden');
        } else {
            document.getElementById('adminLoginDiv').classList.add('hidden');
            document.getElementById('staffSelectDiv').classList.remove('hidden');
        }
    }

    loginAsAdmin() {
        this.currentUser = { role: 'admin' };
        this.enterApp();
    }

    loginAsStaff(id) {
        this.currentUser = { role: 'staff', staffId: id };
        this.enterApp();
    }

    enterApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        const userDisplay = document.getElementById('currentUser');
        if (this.currentUser.role === 'admin') {
            userDisplay.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-muted)">Zalogowano jako</div>
                <div>Administrator</div>
            `;
            document.getElementById('adminControls').classList.remove('hidden');
            document.getElementById('staffControls').classList.add('hidden');
            document.getElementById('availabilityTab').classList.add('hidden');
        } else {
            const person = this.staff.find(s => s.id === this.currentUser.staffId);
            userDisplay.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-muted)">Lekarz</div>
                <div>${person.name}</div>
            `;
            document.getElementById('adminControls').classList.add('hidden');
            document.getElementById('staffControls').classList.remove('hidden');
            document.getElementById('availabilityTab').classList.remove('hidden');
        }
        this.render();
    }

    logout() {
        this.currentUser = null;
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active'); // Używamy currentTarget dla bezpieczeństwa
        
        ['calendarView', 'tableView', 'availabilityView'].forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById(view + 'View').classList.remove('hidden');
        this.render();
    }

    // ===== RENDEROWANIE KALENDARZA =====
    render() {
        this.renderMonthDisplay();
        if (this.currentView === 'calendar') this.renderCalendar();
        else if (this.currentView === 'table') this.renderTable();
        else if (this.currentView === 'availability') this.renderAvailability();
    }

    renderMonthDisplay() {
        const dateStr = this.currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        document.getElementById('monthDisplay').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = (firstDay.getDay() + 6) % 7;

        for (let i = 0; i < startDayOfWeek; i++) {
            grid.innerHTML += `<div class="calendar-day empty"></div>`;
        }

        const todayStr = this.formatDate(new Date());

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            const cell = document.createElement('div');
            cell.className = `calendar-day ${isWeekend ? 'weekend' : ''} ${dateStr === todayStr ? 'today' : ''}`;
            
            // Nagłówek dnia
            let headerHtml = `<div class="day-header"><span class="day-number">${day}</span>`;
            
            // Wskaźnik dostępności dla lekarza
            if (this.currentUser.role === 'staff') {
                const avail = this.availability[this.currentUser.staffId]?.[dateStr];
                if (avail) {
                    headerHtml += `<div class="avail-indicator avail-${avail.status}"></div>`;
                }
            }
            headerHtml += `</div>`;
            
            // Lista dyżurów (max 3, potem "+X")
            const shifts = this.shifts[dateStr] || [];
            let shiftsHtml = `<div class="shifts-container">`;
            
            const displayShifts = shifts.slice(0, 4);
            displayShifts.forEach(shift => {
                const station = this.stations.find(s => s.name === shift.station);
                const staff = this.staff.find(s => s.id === shift.staffId);
                const is24h = station && station.is24h;
                
                shiftsHtml += `
                    <div class="shift-badge ${shift.staffId ? 'assigned' : ''} ${is24h ? 'is-24h' : ''}">
                        <span>${staff ? staff.name.split(' ').pop() : station.name}</span>
                    </div>
                `;
            });
            
            if (shifts.length > 4) {
                shiftsHtml += `<div style="font-size:0.7rem; color:var(--text-muted); text-align:center">+${shifts.length - 4} więcej</div>`;
            }
            shiftsHtml += `</div>`;

            cell.innerHTML = headerHtml + shiftsHtml;
            
            if (this.currentUser.role === 'admin') {
                cell.onclick = () => this.openDayModal(dateStr);
            }
            grid.appendChild(cell);
        }
    }

    // ===== RENDEROWANIE TABELI =====
    renderTable() {
        const table = document.getElementById('scheduleTable');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Header
        let html = `<thead><tr><th class="date-col">Data</th>`;
        this.stations.forEach(s => html += `<th>${s.name} ${s.is24h ? '<span style="color:var(--danger)">24h</span>' : ''}</th>`);
        html += `</tr></thead><tbody>`;

        // Rows
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short' });

            html += `<tr class="${isWeekend ? 'weekend-row' : ''}">`;
            html += `<td class="date-col">${day} <span style="color:var(--text-muted)">${dayName}</span></td>`;

            this.stations.forEach(station => {
                const shift = (this.shifts[dateStr] || []).find(s => s.station === station.name);
                let cellContent = '-';
                
                if (shift && shift.staffId) {
                    const staff = this.staff.find(s => s.id === shift.staffId);
                    cellContent = `<span style="font-weight:600; color:var(--primary)">${staff ? staff.name : '?'}</span>`;
                    if(!station.is24h) cellContent += `<div style="font-size:0.75rem; color:var(--text-muted)">${shift.start}-${shift.end}</div>`;
                } else if (shift) {
                    cellContent = `<span style="color:var(--danger)">WAKAT</span>`;
                }
                
                html += `<td>${cellContent}</td>`;
            });
            html += `</tr>`;
        }
        html += `</tbody>`;
        table.innerHTML = html;
        this.renderStats();
    }

    renderStats() {
        // Prosta statystyka
        let total = 0;
        let unassigned = 0;
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for(let day=1; day<=daysInMonth; day++) {
            const dateStr = this.formatDate(new Date(year, month, day));
            const shifts = this.shifts[dateStr] || [];
            total += shifts.length;
            unassigned += shifts.filter(s => !s.staffId).length;
        }

        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Liczba dyżurów</div>
                <div class="stat-value">${total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Nieobsadzone</div>
                <div class="stat-value" style="color:${unassigned > 0 ? 'var(--danger)' : 'var(--success)'}">${unassigned}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Personel</div>
                <div class="stat-value">${this.staff.length}</div>
            </div>
        `;
    }

    // ===== MODALE I FORMULARZE =====
    openDayModal(dateStr) {
        this.selectedDate = dateStr;
        const date = new Date(dateStr);
        document.getElementById('dayModalTitle').textContent = date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
        document.getElementById('dayModal').classList.add('active');
        
        // Renderuj listę dyżurów w modalu
        const container = document.getElementById('shiftsEditor');
        const shifts = this.shifts[dateStr] || [];
        
        if (shifts.length === 0) container.innerHTML = '<div class="text-center" style="color:var(--text-muted); padding:1rem">Brak dyżurów</div>';
        else {
            container.innerHTML = shifts.map((shift, idx) => {
                const staff = this.staff.find(s => s.id === shift.staffId);
                const station = this.stations.find(s => s.name === shift.station);
                return `
                <div class="shift-item">
                    <div class="shift-info">
                        <div>${shift.station} ${station?.is24h ? '<span style="color:var(--danger); font-size:0.7em">24h</span>' : ''}</div>
                        <div>${shift.start} - ${shift.end}</div>
                    </div>
                    <div style="display:flex; gap:0.5rem">
                        <select class="form-control" style="padding:0.4rem; width:auto" onchange="app.updateShiftStaff('${dateStr}', ${idx}, this.value)">
                            <option value="">-- Wakat --</option>
                            ${this.staff.map(s => `<option value="${s.id}" ${s.id === shift.staffId ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                        <button class="btn btn-ghost" style="color:var(--danger)" onclick="app.removeShift('${dateStr}', ${idx})">×</button>
                    </div>
                </div>
            `}).join('');
        }
    }

    closeDayModal() { document.getElementById('dayModal').classList.remove('active'); }
    
    addShiftToDay() {
        this.closeDayModal();
        this.openAddShiftModal(this.selectedDate);
    }

    openAddShiftModal(dateStr) {
        this.selectedDate = dateStr || this.selectedDate;
        document.getElementById('addShiftModal').classList.add('active');
        
        const select = document.getElementById('shiftStation');
        select.innerHTML = this.stations.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        
        const staffSelect = document.getElementById('shiftStaff');
        staffSelect.innerHTML = '<option value="">-- Wakat --</option>' + this.staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        
        this.setupStationSelect(); // Reset event listeners if needed, or handle logic inside onchange
    }

    setupStationSelect() {
        const select = document.getElementById('shiftStation');
        select.onchange = () => {
            const station = this.stations.find(s => s.name === select.value);
            const notice = document.getElementById('shift24hNotice');
            const timeInputs = document.getElementById('shiftTimeInputs');
            
            if(station && station.is24h) {
                notice.classList.remove('hidden');
                timeInputs.style.opacity = '0.5';
                timeInputs.style.pointerEvents = 'none';
                document.getElementById('shiftStart').value = '08:00';
                document.getElementById('shiftEnd').value = '08:00';
            } else {
                notice.classList.add('hidden');
                timeInputs.style.opacity = '1';
                timeInputs.style.pointerEvents = 'auto';
                if(station) {
                    document.getElementById('shiftStart').value = station.defaultHours.start;
                    document.getElementById('shiftEnd').value = station.defaultHours.end;
                }
            }
        };
        // Trigger once to set initial state
        if(select.value) select.onchange(); 
    }

    saveShift() {
        const stationName = document.getElementById('shiftStation').value;
        const staffId = document.getElementById('shiftStaff').value;
        const start = document.getElementById('shiftStart').value;
        const end = document.getElementById('shiftEnd').value;

        if (!this.shifts[this.selectedDate]) this.shifts[this.selectedDate] = [];
        
        this.shifts[this.selectedDate].push({
            id: this.generateId(),
            station: stationName,
            staffId: staffId || null,
            start, end
        });

        this.saveData();
        this.closeAddShiftModal();
        this.render();
        setTimeout(() => this.openDayModal(this.selectedDate), 100); // Wróć do podglądu dnia
    }

    updateShiftStaff(dateStr, idx, staffId) {
        this.shifts[dateStr][idx].staffId = staffId || null;
        this.saveData();
        this.render();
    }

    removeShift(dateStr, idx) {
        if(confirm('Usunąć dyżur?')) {
            this.shifts[dateStr].splice(idx, 1);
            this.saveData();
            this.openDayModal(dateStr); // Refresh modal
            this.render();
        }
    }
    
    closeAddShiftModal() { document.getElementById('addShiftModal').classList.remove('active'); }

    // ===== DOSTĘPNOŚĆ (Dla lekarzy) =====
    renderAvailability() {
        const container = document.getElementById('availabilityEditor');
        container.innerHTML = '';
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = new Date(year, month+1, 0).getDate();

        for(let day=1; day<=daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const avail = this.availability[this.currentUser.staffId]?.[dateStr];
            
            const div = document.createElement('div');
            div.className = `avail-day ${avail ? 'status-' + avail.status : ''}`;
            div.innerHTML = `
                <div style="font-weight:600">${day} ${date.toLocaleDateString('pl-PL', {weekday:'short'})}</div>
                <div style="font-size:0.85rem; color:var(--text-muted)">
                    ${avail ? this.translateStatus(avail.status) : 'Brak wpisu'}
                </div>
                ${avail && avail.from ? `<div style="font-size:0.75rem">${avail.from}-${avail.to}</div>` : ''}
            `;
            div.onclick = () => this.openAvailabilityModal(dateStr);
            container.appendChild(div);
        }
    }

    translateStatus(s) {
        if(s === 'available') return '✅ Dostępny';
        if(s === 'preferred') return '⭐ Preferowany';
        if(s === 'unavailable') return '❌ Niedostępny';
        return '';
    }

    openAvailabilityModal(dateStr) {
        this.selectedAvailabilityDate = dateStr;
        document.getElementById('availabilityModal').classList.add('active');
        const date = new Date(dateStr);
        document.getElementById('availabilityModalTitle').textContent = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
        
        // Reset form
        document.getElementById('hasTimeLimit').checked = false;
        document.getElementById('timeLimitInputs').classList.add('hidden');
        
        const current = this.availability[this.currentUser.staffId]?.[dateStr];
        if(current && current.from) {
            document.getElementById('hasTimeLimit').checked = true;
            document.getElementById('timeLimitInputs').classList.remove('hidden');
            document.getElementById('availableFrom').value = current.from;
            document.getElementById('availableTo').value = current.to;
        }
    }

    setDayAvailability(status) {
        const staffId = this.currentUser.staffId;
        const dateStr = this.selectedAvailabilityDate;
        
        if(!this.availability[staffId]) this.availability[staffId] = {};
        
        if(status === null) {
            delete this.availability[staffId][dateStr];
        } else {
            const entry = { status };
            if(document.getElementById('hasTimeLimit').checked) {
                entry.from = document.getElementById('availableFrom').value;
                entry.to = document.getElementById('availableTo').value;
            }
            this.availability[staffId][dateStr] = entry;
        }
        this.saveData();
        this.closeAvailabilityModal();
        this.renderAvailability();
    }

    toggleTimeLimit() {
        const checked = document.getElementById('hasTimeLimit').checked;
        document.getElementById('timeLimitInputs').classList.toggle('hidden', !checked);
    }

    closeAvailabilityModal() { document.getElementById('availabilityModal').classList.remove('active'); }

    // ===== GENERATOR (Uproszczony na potrzeby demo UI) =====
    showGenerator() { document.getElementById('generatorModal').classList.add('active'); }
    closeGeneratorModal() { document.getElementById('generatorModal').classList.remove('active'); }
    
    async generateSchedule() {
        const progress = document.getElementById('generatorProgress');
        const fill = document.getElementById('progressFill');
        progress.classList.remove('hidden');
        
        // Symulacja pracy
        for(let i=0; i<=100; i+=10) {
            fill.style.width = i + '%';
            await new Promise(r => setTimeout(r, 50));
        }

        // Bardzo prosty algorytm losujący dla demo
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const days = new Date(year, month+1, 0).getDate();

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(new Date(year, month, d));
            if(!this.shifts[dateStr]) this.shifts[dateStr] = [];
            
            // Uzupełnij braki
            this.stations.forEach(station => {
                if(!this.shifts[dateStr].find(s => s.station === station.name)) {
                     const randomStaff = this.staff[Math.floor(Math.random() * this.staff.length)];
                     this.shifts[dateStr].push({
                         id: this.generateId(),
                         station: station.name,
                         staffId: randomStaff.id,
                         start: station.defaultHours.start,
                         end: station.defaultHours.end
                     });
                }
            });
        }

        this.saveData();
        this.closeGeneratorModal();
        this.render();
        alert('Grafik wygenerowany!');
    }

    // ===== UTILS =====
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }
    goToToday() {
        this.currentDate = new Date();
        this.render();
    }
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Placeholder functions for other buttons
    generateTestData() { alert('Dane testowe wylosowane (funkcja symulacji)'); }
    clearSchedule() { 
        if(confirm('Wyczyścić grafik?')) {
            this.shifts = {}; 
            this.saveData(); 
            this.render(); 
        }
    }
    exportData() { alert('Pobrano plik .json'); }
    manageStations() { document.getElementById('stationsModal').classList.add('active'); }
    closeStationsModal() { document.getElementById('stationsModal').classList.remove('active'); }
    manageStaff() { document.getElementById('staffModal').classList.add('active'); }
    closeStaffModal() { document.getElementById('staffModal').classList.remove('active'); }
    showPreferences() { document.getElementById('preferencesModal').classList.add('active'); }
    closePreferencesModal() { document.getElementById('preferencesModal').classList.remove('active'); }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScheduleApp();
});
