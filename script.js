class ScheduleApp {
    constructor() {
        this.date = new Date();
        this.view = 'calendar';
        this.currentUser = null;
        
        // Dane domyślne - Pełna lista z oryginału
        this.defaultStations = [
            { id: 'oait_d', name: 'OAIT Dzienny', is24h: false, start: '07:00', end: '15:00' },
            { id: 'oait_24', name: 'OAIT 24h', is24h: true, start: '08:00', end: '08:00' },
            { id: 'anes_1', name: 'Anestezjolog I 24h', is24h: true, start: '08:00', end: '08:00' },
            { id: 'anes_2', name: 'Anestezjolog II', is24h: false, start: '08:00', end: '15:00' },
            { id: 'anes_3', name: 'Anestezjolog III', is24h: false, start: '08:00', end: '15:00' },
            { id: 'anes_ort', name: 'Anestezjolog Ortopedia', is24h: false, start: '08:00', end: '15:00' },
            { id: 'wybudz', name: 'Sala Wybudzeń', is24h: false, start: '08:00', end: '15:00' },
            { id: 'endo', name: 'Endoskopia', is24h: false, start: '08:00', end: '15:00' }
        ];

        this.staff = [
            { id: 's1', name: 'Lek. Nowak' },
            { id: 's2', name: 'Lek. Kowalski' },
            { id: 's3', name: 'Lek. Wiśniewski' },
            { id: 's4', name: 'Lek. Wójcik' },
            { id: 's5', name: 'Lek. Mazur' }
        ];

        // Struktura: { 'YYYY-MM-DD': [ {stationId, staffId, start, end, customName?} ] }
        this.schedule = {};
        // Struktura: { 'YYYY-MM-DD': { 'stationId': { start, end } } }
        this.roomHours = {}; 
        this.availability = {}; // { staffId: { date: status } }

        this.loadData();
        this.init();
    }

    init() {
        this.renderLogin();
        // Auto-save co minutę
        setInterval(() => this.saveData(), 60000);
    }

    // === DATA STORAGE ===
    saveData() {
        const data = {
            schedule: this.schedule,
            roomHours: this.roomHours,
            availability: this.availability,
            staff: this.staff,
            stations: this.defaultStations
        };
        localStorage.setItem('oait_schedule_v4', JSON.stringify(data));
    }

    loadData() {
        const json = localStorage.getItem('oait_schedule_v4');
        if (json) {
            try {
                const data = JSON.parse(json);
                this.schedule = data.schedule || {};
                this.roomHours = data.roomHours || {};
                this.availability = data.availability || {};
                if(data.staff) this.staff = data.staff;
                if(data.stations) this.defaultStations = data.stations;
            } catch (e) { console.error('Load error', e); }
        }
    }

    // === LOGOWANIE ===
    renderLogin() {
        const container = document.getElementById('staffLoginList');
        container.innerHTML = this.staff.map(s => 
            `<button class="staff-btn" onclick="app.login('staff', '${s.id}')">${s.name}</button>`
        ).join('');
    }

    selectRole(role) {
        document.getElementById('btnAdmin').classList.toggle('active', role === 'admin');
        document.getElementById('btnStaff').classList.toggle('active', role === 'staff');
        
        if (role === 'admin') {
            document.getElementById('adminLoginView').classList.remove('hidden');
            document.getElementById('staffLoginView').classList.add('hidden');
        } else {
            document.getElementById('adminLoginView').classList.add('hidden');
            document.getElementById('staffLoginView').classList.remove('hidden');
        }
    }

    loginAsAdmin() { this.login('admin', null); }

    login(role, id) {
        this.currentUser = { role, id };
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        // Setup UI based on role
        const nameDisplay = document.getElementById('currentUserName');
        const roleDisplay = document.getElementById('currentUserRole');
        
        if (role === 'admin') {
            nameDisplay.textContent = 'Administrator';
            roleDisplay.textContent = 'Zarządzanie';
            document.getElementById('adminTools').classList.remove('hidden');
            document.getElementById('staffTools').classList.add('hidden');
            document.getElementById('navAvailability').classList.add('hidden');
        } else {
            const person = this.staff.find(s => s.id === id);
            nameDisplay.textContent = person ? person.name : 'Użytkownik';
            roleDisplay.textContent = 'Zespół lekarski';
            document.getElementById('adminTools').classList.add('hidden');
            document.getElementById('staffTools').classList.remove('hidden');
            document.getElementById('navAvailability').classList.remove('hidden');
        }
        this.render();
    }

    logout() {
        this.currentUser = null;
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    }

    // === NAWIGACJA ===
    setView(viewName) {
        this.view = viewName;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        // Prosta detekcja aktywnego przycisku
        const buttons = document.querySelectorAll('.nav-btn');
        if(viewName === 'calendar') buttons[0].classList.add('active');
        if(viewName === 'table') buttons[1].classList.add('active');
        if(viewName === 'availability') buttons[2].classList.add('active');

        document.getElementById('viewCalendar').classList.add('hidden');
        document.getElementById('viewTable').classList.add('hidden');
        document.getElementById('viewAvailability').classList.add('hidden');

        if (viewName === 'calendar') document.getElementById('viewCalendar').classList.remove('hidden');
        if (viewName === 'table') document.getElementById('viewTable').classList.remove('hidden');
        if (viewName === 'availability') document.getElementById('viewAvailability').classList.remove('hidden');
        
        this.render();
    }

    changeMonth(delta) {
        this.date.setMonth(this.date.getMonth() + delta);
        this.render();
    }
    setToday() {
        this.date = new Date();
        this.render();
    }

    // === GŁÓWNY RENDERER ===
    render() {
        this.updateMonthTitle();
        if (this.view === 'calendar') this.renderCalendar();
        if (this.view === 'table') this.renderTable();
        if (this.view === 'availability') this.renderAvailability();
    }

    updateMonthTitle() {
        const str = this.date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        document.getElementById('monthTitle').textContent = str.charAt(0).toUpperCase() + str.slice(1);
    }

    getDaysInMonth() {
        const y = this.date.getFullYear();
        const m = this.date.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        const firstDay = new Date(y, m, 1).getDay(); // 0=Sun
        // Fix Monday as 0 for loop
        const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
        return { y, m, days, startOffset };
    }

    formatDate(y, m, d) {
        return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    // === KALENDARZ ===
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        const { y, m, days, startOffset } = this.getDaysInMonth();

        // Puste dni
        for(let i=0; i<startOffset; i++) {
            grid.innerHTML += `<div class="cal-day empty"></div>`;
        }

        const todayStr = this.formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(y, m, d);
            const dateObj = new Date(y, m, d);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            
            const dayDiv = document.createElement('div');
            dayDiv.className = `cal-day ${isWeekend ? 'weekend' : ''} ${dateStr === todayStr ? 'today' : ''}`;
            
            // Nagłówek dnia
            let header = `<div class="day-head"><span class="day-num">${d}</span>`;
            // Kropka dostępności dla staffu
            if (this.currentUser.role === 'staff') {
                const status = this.availability[this.currentUser.id]?.[dateStr];
                if(status) {
                    let color = status === 'available' ? 'var(--success)' : (status === 'preferred' ? 'var(--primary)' : 'var(--danger)');
                    header += `<div style="width:8px; height:8px; border-radius:50%; background:${color}"></div>`;
                }
            }
            header += `</div>`;

            // Dyżury
            let content = `<div style="display:flex; flex-direction:column; gap:2px">`;
            const shifts = this.getShiftsForDate(dateStr);
            const assignedShifts = shifts.filter(s => s.staffId); // Pokaż tylko obsadzone w widoku ogólnym
            
            // Jeśli admin, pokaż też nieobsadzone ważne (24h)
            const shiftsToShow = this.currentUser.role === 'admin' ? shifts : assignedShifts;
            
            // Limit wyświetlania
            shiftsToShow.slice(0, 4).forEach(s => {
                const staff = this.staff.find(st => st.id === s.staffId);
                const station = this.defaultStations.find(st => st.id === s.stationId);
                const label = staff ? staff.name.split(' ').pop() : (station ? station.name : 'Wakat');
                
                content += `<span class="shift-chip ${s.staffId ? 'assigned' : ''} ${station?.is24h ? 'is-24h' : ''}">
                    ${label}
                </span>`;
            });
            
            if (shiftsToShow.length > 4) {
                content += `<span style="font-size:0.7rem; color:#666; text-align:center">+${shiftsToShow.length - 4} więcej</span>`;
            }
            content += `</div>`;

            dayDiv.innerHTML = header + content;
            
            if (this.currentUser.role === 'admin') {
                dayDiv.onclick = () => this.openDayModal(dateStr);
            }
            grid.appendChild(dayDiv);
        }
    }

    // Zwraca połączoną listę dyżurów (zapisane + domyślne puste miejsca)
    getShiftsForDate(dateStr) {
        const saved = this.schedule[dateStr] || [];
        // Stwórz mapę ID stanowisk, które już są w grafiku
        const usedStationIds = new Set(saved.map(s => s.stationId));
        
        // Dodaj puste sloty dla domyślnych stanowisk, jeśli ich nie ma
        const defaults = this.defaultStations.map(ds => {
            if (usedStationIds.has(ds.id)) return null;
            return {
                stationId: ds.id,
                staffId: null,
                start: ds.start,
                end: ds.end
            };
        }).filter(s => s !== null);

        // Customowe dyżury są już w 'saved'
        return [...defaults, ...saved];
    }

    // === MODAL DNIA (OBSTAWIANIE SAL) ===
    openDayModal(dateStr) {
        this.currentEditDate = dateStr;
        const dateObj = new Date(dateStr);
        document.getElementById('modalDayTitle').textContent = `Grafik na ${dateObj.toLocaleDateString('pl-PL')}`;
        document.getElementById('modalDay').classList.remove('hidden');

        // 1. Render Godzin Sal
        const hoursContainer = document.getElementById('roomHoursList');
        hoursContainer.innerHTML = this.defaultStations.filter(s => !s.is24h).map(s => {
            // Pobierz zapisane godziny lub domyślne
            const savedHours = this.roomHours[dateStr]?.[s.id] || { start: s.start, end: s.end };
            return `
                <div class="hour-edit-item">
                    <div style="flex:1; font-weight:500">${s.name}</div>
                    <input type="time" class="form-input" value="${savedHours.start}" 
                        onchange="app.updateRoomHour('${s.id}', 'start', this.value)">
                    <span>-</span>
                    <input type="time" class="form-input" value="${savedHours.end}" 
                        onchange="app.updateRoomHour('${s.id}', 'end', this.value)">
                </div>
            `;
        }).join('');

        // 2. Render Obsady
        this.renderAssignmentsList();
    }

    renderAssignmentsList() {
        const container = document.getElementById('assignmentsList');
        const shifts = this.getShiftsForDate(this.currentEditDate);
        
        container.innerHTML = shifts.map((shift, idx) => {
            const station = this.defaultStations.find(s => s.id === shift.stationId);
            // Pobierz aktualne godziny (mogły być zmienione wyżej)
            const currentHours = !station?.is24h && this.roomHours[this.currentEditDate]?.[shift.stationId] 
                ? this.roomHours[this.currentEditDate][shift.stationId] 
                : { start: shift.start, end: shift.end };
                
            const stationName = station ? station.name : (shift.customName || 'Inne');
            const is24h = station ? station.is24h : false;

            return `
                <div class="assignment-row ${is24h ? 'is-24h' : ''}">
                    <div class="station-label">
                        ${stationName}
                        ${is24h ? '<span style="color:var(--danger); font-weight:bold">24h</span>' : ''}
                    </div>
                    <div class="text-sm text-muted">
                        ${currentHours.start} - ${currentHours.end}
                    </div>
                    <div>
                        <select class="assign-select" onchange="app.updateAssignment('${shift.stationId}', this.value, ${idx})">
                            <option value="">-- Wakat --</option>
                            ${this.staff.map(s => `
                                <option value="${s.id}" ${s.id === shift.staffId ? 'selected' : ''}>${s.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    ${!station ? `<button class="btn btn-danger btn-sm" onclick="app.removeCustomShift(${idx})">&times;</button>` : ''}
                </div>
            `;
        }).join('');
    }

    updateRoomHour(stationId, field, value) {
        if (!this.roomHours[this.currentEditDate]) this.roomHours[this.currentEditDate] = {};
        if (!this.roomHours[this.currentEditDate][stationId]) {
            const def = this.defaultStations.find(s => s.id === stationId);
            this.roomHours[this.currentEditDate][stationId] = { start: def.start, end: def.end };
        }
        this.roomHours[this.currentEditDate][stationId][field] = value;
        this.saveData();
        this.renderAssignmentsList(); // Odśwież listę, by pokazać nowe godziny
    }

    updateAssignment(stationId, staffId, idx) {
        // Pobierz aktualny stan (połączony)
        const currentShifts = this.getShiftsForDate(this.currentEditDate);
        const shiftToUpdate = currentShifts[idx];
        
        shiftToUpdate.staffId = staffId || null;
        
        // Zapisz tylko te, które mają przypisanie LUB są customowe, LUB mają zmienione godziny (to już w roomHours)
        // Ale dla prostoty zapisu grafiku - nadpisujemy całą tablicę dla tego dnia
        // Musimy jednak odróżnić "domyślne puste" od "zapisanych pustych". 
        // Logika: Zapisujemy w this.schedule wszystkie, które mają staffId lub są customowe.
        
        // Aktualizacja tablicy
        currentShifts[idx] = shiftToUpdate;

        // Filtrujemy: Zapisujemy te które mają lekarza LUB są customowe
        const toSave = currentShifts.filter(s => s.staffId || !this.defaultStations.find(ds => ds.id === s.stationId));
        
        this.schedule[this.currentEditDate] = toSave;
        this.saveData();
        this.render(); // Odśwież tło (kalendarz)
    }

    addCustomShiftRow() {
        const name = prompt("Nazwa stanowiska:");
        if(!name) return;
        
        const newShift = {
            stationId: 'custom_' + Date.now(),
            customName: name,
            staffId: null,
            start: '08:00',
            end: '15:00'
        };
        
        if(!this.schedule[this.currentEditDate]) this.schedule[this.currentEditDate] = [];
        this.schedule[this.currentEditDate].push(newShift);
        this.saveData();
        this.renderAssignmentsList();
    }

    removeCustomShift(idx) {
        // Tutaj logika jest trudniejsza bo idx odnosi się do połączonej listy. 
        // Uproszczenie: customowe zawsze są na końcu listy getShiftsForDate jeśli tak zaimplementowaliśmy, 
        // ale bezpieczniej operować na ID. W tym demo odświeżymy całość.
        if(confirm("Usunąć?")) {
            // Znajdź w saved
            const shifts = this.getShiftsForDate(this.currentEditDate);
            const target = shifts[idx];
            // Usuń z this.schedule
            if(this.schedule[this.currentEditDate]) {
                this.schedule[this.currentEditDate] = this.schedule[this.currentEditDate].filter(s => s.stationId !== target.stationId);
            }
            this.saveData();
            this.renderAssignmentsList();
        }
    }

    closeModal(id) { document.getElementById(id).classList.add('hidden'); }

    // === TABELA ZBIORCZA ===
    renderTable() {
        const table = document.getElementById('mainTable');
        const { y, m, days } = this.getDaysInMonth();
        
        // Header
        let html = `<thead><tr><th class="col-date">Data</th>`;
        this.defaultStations.forEach(s => {
            html += `<th>${s.name} ${s.is24h ? '<span style="color:var(--danger)">(24h)</span>' : ''}</th>`;
        });
        html += `</tr></thead><tbody>`;

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(y, m, d);
            const dateObj = new Date(y, m, d);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const shifts = this.getShiftsForDate(dateStr);
            
            html += `<tr class="${isWeekend ? 'row-weekend' : ''}">`;
            html += `<td class="col-date">${d} <span class="text-muted text-sm">${dateObj.toLocaleDateString('pl-PL', {weekday:'short'})}</span></td>`;
            
            this.defaultStations.forEach(s => {
                const shift = shifts.find(sh => sh.stationId === s.id);
                let cell = '';
                if(shift && shift.staffId) {
                    const staff = this.staff.find(st => st.id === shift.staffId);
                    cell = `<div style="font-weight:600; color:var(--primary)">${staff ? staff.name : '???'}</div>`;
                    if(!s.is24h) {
                        // Sprawdź czy godziny nadpisane
                        const hours = this.roomHours[dateStr]?.[s.id] || {start: shift.start, end: shift.end};
                        cell += `<div class="text-muted text-sm">${hours.start}-${hours.end}</div>`;
                    }
                } else {
                    cell = `<span style="color:#ccc">-</span>`;
                }
                html += `<td>${cell}</td>`;
            });
            html += `</tr>`;
        }
        html += `</tbody>`;
        table.innerHTML = html;
    }

    // === DOSTĘPNOŚĆ ===
    renderAvailability() {
        const grid = document.getElementById('availGrid');
        grid.innerHTML = '';
        const { y, m, days } = this.getDaysInMonth();
        const myId = this.currentUser.id;

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(y, m, d);
            const status = this.availability[myId]?.[dateStr];
            
            const div = document.createElement('div');
            div.className = `avail-cell ${status ? 'status-'+status : ''}`;
            div.innerHTML = `
                <div style="font-weight:bold; font-size:1.2rem">${d}</div>
                <div class="text-sm">${status ? (status==='available'?'Dostępny':(status==='unavailable'?'Niedostępny':'Preferowany')) : '-'}</div>
            `;
            div.onclick = () => {
                this.currentEditDate = dateStr;
                document.getElementById('modalAvailDate').textContent = dateStr;
                document.getElementById('modalAvailEdit').classList.remove('hidden');
            };
            grid.appendChild(div);
        }
    }

    setAvailStatus(status) {
        const myId = this.currentUser.id;
        if(!this.availability[myId]) this.availability[myId] = {};
        
        if(status === null) delete this.availability[myId][this.currentEditDate];
        else this.availability[myId][this.currentEditDate] = status;
        
        this.saveData();
        this.closeModal('modalAvailEdit');
        this.renderAvailability();
    }

    // === GENERATOR I INNE ===
    openGenerator() { document.getElementById('modalGenerator').classList.remove('hidden'); }
    
    runGenerator() {
        // Prosta symulacja generatora
        const { y, m, days } = this.getDaysInMonth();
        const respect = document.getElementById('genRespectAvail').checked;
        
        // Wyczyść obecny grafik
        const newSchedule = {};

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(y, m, d);
            const dayShifts = [];
            
            this.defaultStations.forEach(s => {
                // Prosty randomizer, pomija weekendy dla dziennych
                const dateObj = new Date(y, m, d);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                
                if(isWeekend && !s.is24h) return; 

                // Znajdź kogoś dostępnego
                let candidate = null;
                // Szukamy losowego lekarza 10 razy
                for(let k=0; k<10; k++) {
                    const randStaff = this.staff[Math.floor(Math.random() * this.staff.length)];
                    const avail = this.availability[randStaff.id]?.[dateStr];
                    
                    if (respect && avail === 'unavailable') continue;
                    candidate = randStaff;
                    break;
                }

                if(candidate) {
                    dayShifts.push({
                        stationId: s.id,
                        staffId: candidate.id,
                        start: s.start,
                        end: s.end
                    });
                }
            });
            if(dayShifts.length > 0) newSchedule[dateStr] = dayShifts;
        }
        
        this.schedule = newSchedule;
        this.saveData();
        this.closeModal('modalGenerator');
        this.render();
        alert('Grafik wygenerowany!');
    }

    clearMonth() {
        if(confirm('Czy na pewno wyczyścić CAŁY grafik w tym miesiącu?')) {
            this.schedule = {};
            this.saveData();
            this.render();
        }
    }
    
    // Manage Placeholders
    openStaffModal() { alert('Zarządzanie personelem (Demo)'); }
    openStationsModal() { alert('Zarządzanie stanowiskami (Demo)'); }
    openPreferences() { alert('Preferencje (Demo)'); }
    addStaff() {}
    addStation() {}
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScheduleApp();
});
