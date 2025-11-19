class ScheduleApp {
    constructor() {
        this.date = new Date();
        this.view = 'calendar';
        this.currentUser = null;
        
        // Konfiguracja stanowisk
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

        this.schedule = {};
        this.availability = {};
        this.showAllWeekendStations = false;

        // BEZPIECZNY START
        try {
            this.loadData();
        } catch(e) {
            console.error("Błąd ładowania danych, resetuję.", e);
            this.schedule = {};
            this.availability = {};
        }

        this.init();
    }

    init() {
        this.renderLogin();
    }

    saveData() {
        try {
            localStorage.setItem('oait_v6_fix', JSON.stringify({
                schedule: this.schedule,
                availability: this.availability
            }));
        } catch(e) { console.error("Błąd zapisu", e); }
    }

    loadData() {
        const json = localStorage.getItem('oait_v6_fix');
        if(json) {
            const data = JSON.parse(json);
            this.schedule = data.schedule || {};
            this.availability = data.availability || {};
        }
    }

    // === LOGOWANIE ===
    renderLogin() {
        const list = document.getElementById('staffLoginList');
        if(list) {
            list.innerHTML = this.staff.map(s => 
                `<button class="btn btn-outline w-100 mb-2" onclick="app.login('staff', '${s.id}')">${s.name}</button>`
            ).join('');
        }
    }

    login(role, id) {
        this.currentUser = { role, id };
        
        // Ukryj login, pokaż app
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        const nameDisplay = document.getElementById('currentUserName');
        nameDisplay.textContent = role === 'admin' ? 'Administrator' : (this.staff.find(s => s.id === id)?.name || 'Lekarz');
        document.getElementById('currentUserRole').textContent = role === 'admin' ? 'Zarządzanie' : 'Zespół';

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

    setView(view, event) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
        if(target) target.classList.remove('hidden');
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if (event) event.target.classList.add('active');
        
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
        if(!this.currentUser) return;

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

        for(let i=0; i<offset; i++) {
            const d = document.createElement('div');
            d.className = 'cal-day empty'; // Używamy elementu zamiast innerHTML string
            grid.appendChild(d);
        }

        for(let d=1; d<=days; d++) {
            const dateObj = new Date(y, m, d);
            const dateStr = this.formatDate(dateObj);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            const div = document.createElement('div');
            div.className = `cal-day ${isWeekend ? 'weekend' : ''}`;
            
            // Header
            let html = `<div class="day-head"><span>${d}</span>`;
            if(this.currentUser.role === 'staff') {
                const myAvail = this.availability[this.currentUser.id]?.[dateStr];
                if(myAvail) {
                    const colors = { '24h': '#10b981', 'partial': '#f59e0b', 'none': '#ef4444' };
                    html += `<div style="width:8px; height:8px; border-radius:50%; background:${colors[myAvail.type] || '#ccc'}"></div>`;
                }
            }
            html += `</div>`;

            // Shifts
            const shifts = this.getShiftsForDate(dateStr);
            const visibleShifts = shifts.filter(s => {
                if(s.staffId) return true; 
                const config = this.stationsConfig.find(c => c.id === s.stationId);
                if(isWeekend) return s.isCustom || (config && config.isWeekendMain);
                return true;
            });

            visibleShifts.slice(0, 4).forEach(s => {
                const staff = this.staff.find(st => st.id === s.staffId);
                const config = this.stationsConfig.find(c => c.id === s.stationId);
                let label = staff ? staff.name.split(' ').pop() : (s.customName || config.name);
                
                let classes = ['shift-chip'];
                if(s.staffId) classes.push('assigned');
                if(s.isCustom) classes.push('is-custom');
                if(config?.isWeekendMain) classes.push('weekend-main');
                
                html += `<span class="${classes.join(' ')}">${label}</span>`;
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
        if(this.schedule[dateStr]) return this.schedule[dateStr];
        return this.stationsConfig.map(c => ({
            stationId: c.id,
            staffId: null,
            start: c.start,
            end: c.end,
            isCustom: false
        }));
    }

    // === MODAL EDYCJI DNIA ===
    openDayModal(dateStr, isWeekend) {
        this.currentEditDate = dateStr;
        this.isWeekendEdit = isWeekend;
        this.showAllWeekendStations = !isWeekend; 

        document.getElementById('modalDayTitle').textContent = dateStr;
        document.getElementById('modalDay').classList.remove('hidden');
        
        const notice = document.getElementById('weekendNotice');
        const btnStd = document.getElementById('btnAddStandard');
        
        if(isWeekend) {
            notice.classList.remove('hidden');
            btnStd.classList.remove('hidden');
        } else {
            notice.classList.add('hidden');
            btnStd.classList.add('hidden');
        }
        
        this.renderAssignments();
    }

    renderAssignments() {
        const container = document.getElementById('assignmentsList');
        let shifts = this.schedule[this.currentEditDate];
        if(!shifts) shifts = this.getShiftsForDate(this.currentEditDate);

        // Filtrowanie weekendowe
        let displayShifts = shifts;
        if(this.isWeekendEdit && !this.showAllWeekendStations) {
            displayShifts = shifts.filter(s => {
                if(s.staffId || s.isCustom) return true;
                const conf = this.stationsConfig.find(c => c.id === s.stationId);
                return conf && conf.isWeekendMain;
            });
        }

        container.innerHTML = displayShifts.map((s, idx) => {
            const conf = this.stationsConfig.find(c => c.id === s.stationId);
            const name = s.isCustom ? s.customName : conf.name;
            const isMain = conf?.isWeekendMain;
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
        
        // Zapisz stan, aby nie stracić wygenerowanych domyślnych
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
        const name = prompt("Nazwa:");
        if(!name) return;
        
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
        this.render();
    }
    removeCustom(idx) {
        if(confirm('Usunąć?')) {
            this.schedule[this.currentEditDate].splice(idx, 1);
            this.saveData();
            this.renderAssignments();
        }
    }

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
            let cls = 'status-none'; 
            let txt = 'Brak';
            let sub = '';

            if(avail) {
                cls = 'status-' + avail.type;
                if(avail.type === '24h') txt = '24h';
                if(avail.type === 'partial') { txt = 'Częściowa'; sub = `${avail.start}-${avail.end}`; }
                if(avail.type === 'none') txt = 'Niedostępny';
            } else {
                // Domyślny stan (pusty)
                cls = ''; txt = '-';
            }

            div.className = `avail-cell ${cls}`;
            div.innerHTML = `
                <div style="font-weight:bold; font-size:1.2rem">${d}</div>
                <div style="font-weight:600">${txt}</div>
                <div style="font-size:0.8rem">${sub}</div>
            `;
            div.onclick = () => this.openAvailModal(dateStr);
            grid.appendChild(div);
        }
    }

    openAvailModal(dateStr) {
        this.currentAvailDate = dateStr;
        document.getElementById('modalAvailDate').textContent = dateStr;
        document.getElementById('modalAvailEdit').classList.remove('hidden');
        
        // Reset formularza
        document.querySelectorAll('input[name="availType"]').forEach(i => i.checked = false);
        document.getElementById('availTimeInputs').classList.add('hidden');

        const curr = this.availability[this.currentUser.id]?.[dateStr];
        if(curr) {
            const r = document.querySelector(`input[name="availType"][value="${curr.type}"]`);
            if(r) r.checked = true;
            if(curr.type === 'partial') {
                document.getElementById('availTimeInputs').classList.remove('hidden');
                document.getElementById('availStart').value = curr.start;
                document.getElementById('availEnd').value = curr.end;
            }
        }
    }

    toggleAvailInputs() {
        const type = document.querySelector('input[name="availType"]:checked').value;
        const inputs = document.getElementById('availTimeInputs');
        if(type === 'partial') inputs.classList.remove('hidden');
        else inputs.classList.add('hidden');
    }

    saveAvailability() {
        const typeEl = document.querySelector('input[name="availType"]:checked');
        if(!typeEl) return;

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

    // === TABELA ===
    renderTable() {
        const table = document.getElementById('mainTable');
        const y = this.date.getFullYear(), m = this.date.getMonth();
        const days = new Date(y, m+1, 0).getDate();
        
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
                    cell = `${staff.name}<br><small style="color:#666">${s.start}-${s.end}</small>`;
                }
                html += `<td>${cell}</td>`;
            });
            html += `</tr>`;
        }
        table.innerHTML = html + `</tbody>`;
    }

    // Helpery
    closeModal(id) { document.getElementById(id).classList.add('hidden'); }
    clearMonth() { if(confirm('Wyczyścić?')) { this.schedule={}; this.saveData(); this.render(); } }
    openGenerator() { alert('Generator wyłączony w tej wersji.'); }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScheduleApp();
});
