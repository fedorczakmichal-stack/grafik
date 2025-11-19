class ScheduleApp {
    constructor() {
        this.date = new Date();
        this.view = 'calendar';
        this.currentUser = null;
        
        // Definicja wszystkich stanowisk
        this.stationsConfig = [
            { id: 'oait_24', name: 'OAIT 24h', isWeekendMain: true, start: '08:00', end: '08:00' },
            { id: 'anes_1', name: 'Anestezjolog I 24h', isWeekendMain: true, start: '08:00', end: '08:00' },
            { id: 'oait_d', name: 'OAIT Dzienny', isWeekendMain: false, start: '07:00', end: '15:00' },
            { id: 'anes_2', name: 'Anestezjolog II', isWeekendMain: false, start: '08:00', end: '15:00' },
            { id: 'anes_3', name: 'Anestezjolog III', isWeekendMain: false, start: '08:00', end: '15:00' },
            { id: 'anes_ort', name: 'Anestezjolog Ortopedia', isWeekendMain: false, start: '08:00', end: '15:00' },
            { id: 'wybudz', name: 'Sala Wybudzeń', isWeekendMain: false, start: '08:00', end: '15:00' },
            { id: 'endo', name: 'Endoskopia', isWeekendMain: false, start: '08:00', end: '15:00' }
        ];

        this.staff = [
            { id: 's1', name: 'Lek. Nowak' },
            { id: 's2', name: 'Lek. Kowalski' },
            { id: 's3', name: 'Lek. Wiśniewski' },
            { id: 's4', name: 'Lek. Wójcik' },
            { id: 's5', name: 'Lek. Mazur' }
        ];

        // Dane: 
        // schedule[date] = [ { stationId, staffId, start, end, isCustom, customName } ]
        // availability[staffId][date] = { type: '24h'|'partial'|'none', start, end }
        this.schedule = {};
        this.availability = {};
        
        // Flaga do edycji dnia - czy pokazac wszystkie stanowiska w weekend
        this.showAllWeekendStations = false;

        this.loadData();
        this.init();
    }

    init() {
        this.renderLogin();
    }

    saveData() {
        localStorage.setItem('oait_v5', JSON.stringify({
            schedule: this.schedule,
            availability: this.availability
        }));
    }

    loadData() {
        const data = JSON.parse(localStorage.getItem('oait_v5'));
        if(data) {
            this.schedule = data.schedule || {};
            this.availability = data.availability || {};
        }
    }

    // === LOGOWANIE I UI ===
    renderLogin() {
        const list = document.getElementById('staffLoginList');
        list.innerHTML = this.staff.map(s => 
            `<button class="btn btn-outline w-100 mb-2" onclick="app.login('staff', '${s.id}')">${s.name}</button>`
        ).join('');
    }

    login(role, id) {
        this.currentUser = { role, id };
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        const nameDisplay = document.getElementById('currentUserName');
        nameDisplay.textContent = role === 'admin' ? 'Administrator' : this.staff.find(s => s.id === id)?.name;
        document.getElementById('currentUserRole').textContent = role === 'admin' ? 'Zarządzanie' : 'Lekarz';

        // Toggle widoczności narzędzi
        const adminTools = document.getElementById('adminTools');
        const navAvail = document.getElementById('navAvailability');
        
        if(role === 'admin') {
            adminTools.classList.remove('hidden');
            navAvail.classList.add('hidden');
        } else {
            adminTools.classList.add('hidden');
            navAvail.classList.remove('hidden');
        }
        this.render();
    }

    logout() { location.reload(); }

    setView(view) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1)).classList.remove('hidden');
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        
        this.view = view;
        this.render();
    }

    changeMonth(delta) {
        this.date.setMonth(this.date.getMonth() + delta);
        this.render();
    }
    setToday() { this.date = new Date(); this.render(); }
    
    formatDate(d) { return d.toISOString().split('T')[0]; }

    // === RENDERER ===
    render() {
        const mName = this.date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        document.getElementById('monthTitle').textContent = mName.charAt(0).toUpperCase() + mName.slice(1);

        if(this.view === 'calendar') this.renderCalendar();
        if(this.view === 'table') this.renderTable();
        if(this.view === 'availability') this.renderAvailability();
    }

    // === KALENDARZ ===
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        const y = this.date.getFullYear();
        const m = this.date.getMonth();
        const days = new Date(y, m+1, 0).getDate();
        const firstDay = new Date(y, m, 1).getDay(); // 0=Nd
        const offset = (firstDay === 0 ? 6 : firstDay - 1);

        for(let i=0; i<offset; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;

        for(let d=1; d<=days; d++) {
            const dateObj = new Date(y, m, d);
            const dateStr = this.formatDate(dateObj);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            const div = document.createElement('div');
            div.className = `cal-day ${isWeekend ? 'weekend' : ''}`;
            
            // Header dnia
            let html = `<div class="day-head"><span>${d}</span>`;
            if(this.currentUser.role === 'staff') {
                const myAvail = this.availability[this.currentUser.id]?.[dateStr];
                if(myAvail) {
                    let color = myAvail.type === '24h' ? '#10b981' : (myAvail.type === 'partial' ? '#f59e0b' : '#ef4444');
                    html += `<div style="width:8px; height:8px; border-radius:50%; background:${color}"></div>`;
                }
            }
            html += `</div>`;

            // Pobierz dyżury do wyświetlenia
            const shifts = this.getShiftsForDate(dateStr);
            // W weekendy w widoku ogólnym pokazujemy tylko główne, chyba że ktoś jest przypisany do innych
            const visibleShifts = shifts.filter(s => {
                if(s.staffId) return true; // Zawsze pokaż obsadzone
                // Jeśli puste: pokaż jeśli to nie weekend LUB jeśli to główne stanowisko weekendowe
                const config = this.stationsConfig.find(c => c.id === s.stationId);
                if(isWeekend) {
                     // Jeśli to customowy dyżur, pokaż go
                     if(s.isCustom) return true;
                     return config && config.isWeekendMain;
                }
                return true;
            });

            visibleShifts.slice(0, 4).forEach(s => {
                const staff = this.staff.find(st => st.id === s.staffId);
                const config = this.stationsConfig.find(c => c.id === s.stationId);
                let label = staff ? staff.name.split(' ').pop() : (s.customName || config.name);
                
                let classes = 'shift-chip';
                if(s.staffId) classes += ' assigned';
                if(config?.isWeekendMain) classes += ' weekend-main';
                
                html += `<span class="${classes}">${label}</span>`;
            });

            if(visibleShifts.length > 4) html += `<small style="color:#888">+${visibleShifts.length - 4}</small>`;

            div.innerHTML = html;
            if(this.currentUser.role === 'admin') {
                div.onclick = () => this.openDayModal(dateStr, isWeekend);
            }
            grid.appendChild(div);
        }
    }

    getShiftsForDate(dateStr) {
        // Jeśli mamy zapisane w DB, zwróć je.
        // Jeśli nie, wygeneruj domyślne "puste" sloty na podstawie konfiguracji
        if(this.schedule[dateStr]) return this.schedule[dateStr];
        
        // Generuj domyślne
        return this.stationsConfig.map(c => ({
            stationId: c.id,
            staffId: null,
            start: c.start,
            end: c.end,
            isCustom: false
        }));
    }

    // === MODAL DNIA (EDYCJA) ===
    openDayModal(dateStr, isWeekend) {
        this.currentEditDate = dateStr;
        this.isWeekendEdit = isWeekend;
        this.showAllWeekendStations = !isWeekend; // Reset flagi: w weekendy ukryj na start

        document.getElementById('modalDayTitle').textContent = dateStr;
        document.getElementById('modalDay').classList.remove('hidden');
        document.getElementById('weekendNotice').classList.toggle('hidden', !isWeekend);
        document.getElementById('btnAddStandard').classList.toggle('hidden', !isWeekend);
        
        this.renderAssignments();
    }

    renderAssignments() {
        const container = document.getElementById('assignmentsList');
        // Pobierz aktualny stan dyżurów (albo z pamięci albo generuj domyślne)
        let shifts = this.schedule[this.currentEditDate];
        if(!shifts) shifts = this.getShiftsForDate(this.currentEditDate); // generuj domyślne

        // Filtrowanie widoku weekendowego w modalu
        let displayShifts = shifts;
        if(this.isWeekendEdit && !this.showAllWeekendStations) {
            displayShifts = shifts.filter(s => {
                if(s.staffId || s.isCustom) return true; // Pokaż jeśli ktoś jest wpisany lub to custom
                const conf = this.stationsConfig.find(c => c.id === s.stationId);
                return conf && conf.isWeekendMain; // Pokaż tylko główne
            });
        }

        container.innerHTML = displayShifts.map((s, idx) => {
            const conf = this.stationsConfig.find(c => c.id === s.stationId);
            const name = s.isCustom ? s.customName : conf.name;
            const isMain = conf?.isWeekendMain;

            // Znajdź prawdziwy indeks w głównej tablicy `shifts` do edycji
            const realIdx = shifts.indexOf(s);

            return `
            <div class="assignment-row ${s.isCustom ? 'custom' : ''}">
                <div style="font-weight:500">
                    ${name} 
                    ${isMain ? '<span style="color:red; font-size:0.7em">24h</span>' : ''}
                </div>
                
                <div class="time-range-row" style="gap:2px">
                    <input type="time" class="form-input" style="padding:2px; font-size:0.8rem" value="${s.start}" 
                        onchange="app.updateShiftTime(${realIdx}, 'start', this.value)">
                    -
                    <input type="time" class="form-input" style="padding:2px; font-size:0.8rem" value="${s.end}" 
                        onchange="app.updateShiftTime(${realIdx}, 'end', this.value)">
                </div>

                <div>
                    <select class="assign-select" onchange="app.updateAssignment(${realIdx}, this.value)">
                        <option value="">-- Wakat --</option>
                        ${this.staff.map(st => `<option value="${st.id}" ${st.id === s.staffId ? 'selected' : ''}>${st.name}</option>`).join('')}
                    </select>
                </div>

                ${s.isCustom ? `<button class="btn btn-danger btn-sm" onclick="app.removeCustom(${realIdx})">×</button>` : ''}
            </div>`;
        }).join('');
        
        // Zapisz ewentualną inicjalizację w pamięci tymczasowej, żeby nie zgubić "wygenerowanych" przy dodawaniu customa
        if(!this.schedule[this.currentEditDate]) {
            this.schedule[this.currentEditDate] = shifts;
        }
    }

    addStandardWeekendStations() {
        this.showAllWeekendStations = true;
        document.getElementById('btnAddStandard').classList.add('hidden');
        this.renderAssignments();
    }

    addCustomShiftRow() {
        const name = prompt("Nazwa stanowiska (np. Dodatkowy zabieg):");
        if(!name) return;

        // Jeśli schedule nie istnieje dla tego dnia, zainicjuj go domyślnymi
        if(!this.schedule[this.currentEditDate]) {
            this.schedule[this.currentEditDate] = this.getShiftsForDate(this.currentEditDate);
        }

        this.schedule[this.currentEditDate].push({
            stationId: 'custom_' + Date.now(),
            staffId: null,
            start: '08:00',
            end: '15:00',
            isCustom: true,
            customName: name
        });
        
        this.saveData();
        this.renderAssignments();
    }

    updateShiftTime(idx, field, val) {
        this.schedule[this.currentEditDate][idx][field] = val;
        this.saveData();
    }

    updateAssignment(idx, staffId) {
        this.schedule[this.currentEditDate][idx].staffId = staffId || null;
        this.saveData();
        this.render(); // Odśwież kalendarz w tle
    }

    removeCustom(idx) {
        if(confirm('Usunąć?')) {
            this.schedule[this.currentEditDate].splice(idx, 1);
            this.saveData();
            this.renderAssignments();
        }
    }

    closeModal(id) { document.getElementById(id).classList.add('hidden'); }

    // === DOSTĘPNOŚĆ ===
    renderAvailability() {
        const grid = document.getElementById('availGrid');
        grid.innerHTML = '';
        const y = this.date.getFullYear(), m = this.date.getMonth();
        const days = new Date(y, m+1, 0).getDate();

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(new Date(y, m, d));
            const avail = this.availability[this.currentUser.id]?.[dateStr];
            
            const div = document.createElement('div');
            let statusClass = 'status-none'; // domyślnie czerwone (brak wpisu traktujemy jako brak dyspozycji lub do uzupełnienia)
            let label = 'Brak';
            let timeInfo = '';

            if(avail) {
                statusClass = 'status-' + avail.type;
                if(avail.type === '24h') label = '24h';
                if(avail.type === 'partial') { label = 'Częściowa'; timeInfo = `${avail.start}-${avail.end}`; }
                if(avail.type === 'none') label = 'Niedostępny';
            } else {
                // Brak wpisu - neutralny szary lub czerwony?
                // Użytkownik prosił o opcję "brak dyspozycji", więc domyślny stan może być neutralny (pusty)
                statusClass = ''; 
                label = '-';
            }

            div.className = `avail-cell ${statusClass}`;
            div.innerHTML = `
                <div style="font-weight:bold; font-size:1.2rem">${d}</div>
                <div style="font-weight:600">${label}</div>
                <div style="font-size:0.8rem">${timeInfo}</div>
            `;
            div.onclick = () => this.openAvailModal(dateStr);
            grid.appendChild(div);
        }
    }

    openAvailModal(dateStr) {
        this.currentAvailDate = dateStr;
        document.getElementById('modalAvailDate').textContent = dateStr;
        document.getElementById('modalAvailEdit').classList.remove('hidden');
        
        // Reset form
        const inputs = document.getElementsByName('availType');
        inputs.forEach(i => i.checked = false);
        document.getElementById('availTimeInputs').classList.add('hidden');

        // Fill form if exists
        const current = this.availability[this.currentUser.id]?.[dateStr];
        if(current) {
            const rad = document.querySelector(`input[name="availType"][value="${current.type}"]`);
            if(rad) rad.checked = true;
            if(current.type === 'partial') {
                document.getElementById('availTimeInputs').classList.remove('hidden');
                document.getElementById('availStart').value = current.start;
                document.getElementById('availEnd').value = current.end;
            }
        }
    }

    toggleAvailInputs() {
        const type = document.querySelector('input[name="availType"]:checked').value;
        document.getElementById('availTimeInputs').classList.toggle('hidden', type !== 'partial');
    }

    saveAvailability() {
        const typeEl = document.querySelector('input[name="availType"]:checked');
        if(!typeEl) return; // nic nie wybrano

        const type = typeEl.value;
        const data = { type };
        if(type === 'partial') {
            data.start = document.getElementById('availStart').value;
            data.end = document.getElementById('availEnd').value;
        }
        
        if(!this.availability[this.currentUser.id]) this.availability[this.currentUser.id] = {};
        this.availability[this.currentUser.id][this.currentAvailDate] = data;
        
        this.saveData();
        this.closeModal('modalAvailEdit');
        this.renderAvailability();
    }

    // === TABELA ZBIORCZA ===
    renderTable() {
        const table = document.getElementById('mainTable');
        const y = this.date.getFullYear(), m = this.date.getMonth();
        const days = new Date(y, m+1, 0).getDate();
        
        // Nagłówki
        let html = `<thead><tr><th>Data</th>`;
        this.stationsConfig.forEach(s => html += `<th>${s.name}</th>`);
        html += `</tr></thead><tbody>`;

        for(let d=1; d<=days; d++) {
            const dateStr = this.formatDate(new Date(y, m, d));
            const shifts = this.getShiftsForDate(dateStr);
            
            html += `<tr><td style="font-weight:bold">${d}</td>`;
            this.stationsConfig.forEach(conf => {
                const s = shifts.find(sh => sh.stationId === conf.id);
                let cell = '-';
                if(s && s.staffId) {
                    const staff = this.staff.find(st => st.id === s.staffId);
                    cell = `${staff.name}<br><small>${s.start}-${s.end}</small>`;
                }
                html += `<td>${cell}</td>`;
            });
            html += `</tr>`;
        }
        table.innerHTML = html + `</tbody>`;
    }

    // Helpery
    clearMonth() { if(confirm('Wyczyścić?')) { this.schedule={}; this.saveData(); this.render(); } }
    runGenerator() { alert('Generator w tej wersji jest wyłączony (wymagałby skomplikowanej logiki dopasowania do nowych godzin).'); }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new ScheduleApp(); });
