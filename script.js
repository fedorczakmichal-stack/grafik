class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.shifts = {}; // np. { '2024-07-28': [{ start: '08:00', end: '16:00' }] }

        this.elements = {
            appContainer: document.getElementById('app-container'),
            monthDisplay: document.getElementById('current-month-display'),
            grid: document.getElementById('calendar-grid'),
            prevMonthBtn: document.getElementById('prev-month-btn'),
            nextMonthBtn: document.getElementById('next-month-btn'),

            dayModal: document.getElementById('day-modal'),
            modalDateDisplay: document.getElementById('modal-date-display'),
            closeDayModalBtn: document.getElementById('close-modal-btn'),
            modalTagsContainer: document.getElementById('modal-tags-container'),
            modalShowFormBtn: document.getElementById('modal-show-form-btn'),
            modalAddShiftForm: document.getElementById('modal-add-shift-form'),
            modalAddShiftBtn: document.getElementById('modal-add-shift-btn'),
            modalCancelBtn: document.getElementById('modal-cancel-add-btn'),
            modalNewStart: document.getElementById('modal-new-start'),
            modalNewEnd: document.getElementById('modal-new-end'),

            staffModal: document.getElementById('staff-modal'),
            manageStaffBtn: document.getElementById('manage-staff-btn'),
            closeStaffModalBtn: document.getElementById('close-staff-modal-btn'),
            staffListContainer: document.getElementById('staff-list-container'),
            addStaffBtn: document.getElementById('add-staff-btn'),
            newStaffName: document.getElementById('new-staff-name'),
        };

        this.selectedDate = null;
        this.staff = [
            { name: 'M. Olszewska' }, { name: 'E. Jaszczuk' }, { name: 'M. Fedorczak' }
        ];
        this.availability = {}; // { 'M. Olszewska': { '2024-07-28': 'available' } }
        this.availabilityEditMode = { active: false, staffName: null };

        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.elements.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.elements.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));

        // Day Modal Events
        this.elements.closeDayModalBtn.addEventListener('click', () => this.toggleDayModal(false));
        this.elements.modalShowFormBtn.addEventListener('click', () => this.toggleAddShiftForm(true));
        this.elements.modalCancelBtn.addEventListener('click', () => this.toggleAddShiftForm(false));
        this.elements.modalAddShiftBtn.addEventListener('click', () => this.addShift());

        // Staff Modal Events
        this.elements.manageStaffBtn.addEventListener('click', () => this.toggleStaffModal(true));
        this.elements.closeStaffModalBtn.addEventListener('click', () => this.toggleStaffModal(false));
        this.elements.addStaffBtn.addEventListener('click', () => this.addStaffMember());

        // Generator Event
        this.elements.generateScheduleBtn.addEventListener('click', () => this.generateSchedule());
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }

    toggleDayModal(visible, dateString = null) {
        if (visible && dateString) {
            this.selectedDate = dateString;
            const date = new Date(dateString);
            this.elements.modalDateDisplay.textContent = date.toLocaleDateString('pl-PL', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            this.renderShiftTags();
            this.toggleAddShiftForm(false);
        }
        this.elements.dayModal.classList.toggle('is-visible', visible);
    }

    toggleStaffModal(visible) {
        if (visible) {
            this.renderStaffList();
        }
        this.elements.staffModal.classList.toggle('is-visible', visible);
    }

    renderStaffList() {
        this.elements.staffListContainer.innerHTML = '';
        this.staff.forEach((person, index) => {
            const item = document.createElement('div');
            item.className = 'staff-list-item';
            item.innerHTML = `
                <span>${person.name}</span>
                <div class="staff-actions">
                    <button class="secondary" data-name="${person.name}">Dyspozycje</button>
                    <button class="danger" data-index="${index}">&times;</button>
                </div>
            `;
            this.elements.staffListContainer.appendChild(item);
        });

        this.elements.staffListContainer.querySelectorAll('.danger').forEach(btn => {
            btn.addEventListener('click', (e) => this.removeStaffMember(e.target.dataset.index));
        });

        this.elements.staffListContainer.querySelectorAll('.secondary').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleAvailabilityEditMode(true, e.target.dataset.name));
        });
    }

    toggleAvailabilityEditMode(active, staffName = null) {
        this.availabilityEditMode = { active, staffName };
        this.toggleStaffModal(false); // Zamknij modal personelu

        if (active) {
            const header = this.elements.appContainer.querySelector('.calendar-header');
            let indicator = header.querySelector('.edit-mode-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'edit-mode-indicator';
                header.appendChild(indicator);
            }
            indicator.innerHTML = `Edytujesz dyspozycje dla: <strong>${staffName}</strong>. Kliknij dzień, aby zmienić status. <button id="exit-edit-mode" class="danger">Zakończ</button>`;
            indicator.style.display = 'flex';
            indicator.querySelector('#exit-edit-mode').addEventListener('click', () => this.toggleAvailabilityEditMode(false));
        } else {
            const indicator = this.elements.appContainer.querySelector('.edit-mode-indicator');
            if (indicator) indicator.style.display = 'none';
        }

        this.renderCalendarGrid(); // Przerenderuj kalendarz, aby pokazać dyspozycje
    }

    generateSchedule() {
        // Zresetuj istniejące przypisania
        Object.values(this.shifts).forEach(dayShifts => {
            dayShifts.forEach(shift => shift.staff = null);
        });

        const staffWorkload = this.staff.reduce((acc, person) => ({ ...acc, [person.name]: 0 }), {});

        // Iteruj po dniach i zmianach
        for (const dateString in this.shifts) {
            for (const shift of this.shifts[dateString]) {
                const candidates = this.staff
                    .map(person => ({
                        name: person.name,
                        availability: this.availability[person.name]?.[dateString],
                        workload: staffWorkload[person.name]
                    }))
                    .filter(p => p.availability === 'available' || p.availability === 'preferred')
                    .sort((a, b) => {
                        // Preferuj 'preferred'
                        if (a.availability !== b.availability) {
                            return a.availability === 'preferred' ? -1 : 1;
                        }
                        // Potem osoby z mniejszą liczbą godzin
                        return a.workload - b.workload;
                    });

                if (candidates.length > 0) {
                    const assignedStaff = candidates[0].name;
                    shift.staff = assignedStaff;
                    staffWorkload[assignedStaff]++;
                } else {
                    shift.staff = 'BRAK'; // Oznacz jako nieobsadzone
                }
            }
        }

        alert('Grafik został wygenerowany!');
        this.renderCalendarGrid();
    }

    setAvailability(dateString, status) {
        const { staffName } = this.availabilityEditMode;
        if (!this.availability[staffName]) {
            this.availability[staffName] = {};
        }

        if (status) {
            this.availability[staffName][dateString] = status;
        } else {
            delete this.availability[staffName][dateString]; // Usuń status, jeśli brak
        }

        this.renderCalendarGrid();
    }

    addStaffMember() {
        const name = this.elements.newStaffName.value.trim();
        if (name) {
            this.staff.push({ name });
            this.elements.newStaffName.value = '';
            this.renderStaffList();
        }
    }

    removeStaffMember(index) {
        this.staff.splice(index, 1);
        this.renderStaffList();
    }

    render() {
        this.elements.monthDisplay.textContent = this.currentDate.toLocaleDateString('pl-PL', {
            month: 'long',
            year: 'numeric'
        });

        this.renderCalendarGrid();
    }

    renderShiftTags() {
        this.elements.modalTagsContainer.innerHTML = '';
        const shiftsForDay = this.shifts[this.selectedDate] || [];

        shiftsForDay.forEach((shift, index) => {
            const tag = document.createElement('div');
            tag.className = 'shift-tag';

            const staffSelect = this.staff.length > 0 ? `
                <select class="shift-staff-select" data-index="${index}">
                    <option value="">-- Przypisz --</option>
                    ${this.staff.map(p => `<option value="${p.name}" ${p.name === shift.staff ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
            ` : `<span>${shift.staff || 'BRAK'}</span>`;

            tag.innerHTML = `
                <span>${shift.start} - ${shift.end}</span>
                ${staffSelect}
                <button class="remove-tag-btn" data-index="${index}">&times;</button>
            `;
            this.elements.modalTagsContainer.appendChild(tag);
        });

        // Dodaj obsługę usuwania
        this.elements.modalTagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.removeShift(e.target.dataset.index));
        });

        this.elements.modalTagsContainer.querySelectorAll('.shift-staff-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const shiftIndex = e.target.dataset.index;
                const newStaffName = e.target.value;
                this.shifts[this.selectedDate][shiftIndex].staff = newStaffName || null;
                this.renderCalendarGrid(); // Aktualizuj wskaźniki
            });
        });
    }

    toggleAddShiftForm(visible) {
        this.elements.modalAddShiftForm.style.display = visible ? 'flex' : 'none';
        this.elements.modalShowFormBtn.style.display = visible ? 'none' : 'block';
    }

    addShift() {
        const start = this.elements.modalNewStart.value;
        const end = this.elements.modalNewEnd.value;
        if (!start || !end) return;

        if (!this.shifts[this.selectedDate]) {
            this.shifts[this.selectedDate] = [];
        }
        this.shifts[this.selectedDate].push({ start, end });

        this.renderShiftTags();
        this.renderCalendarGrid(); // Aktualizuj siatkę
        this.toggleAddShiftForm(false);
    }

    removeShift(index) {
        this.shifts[this.selectedDate].splice(index, 1);
        if (this.shifts[this.selectedDate].length === 0) {
            delete this.shifts[this.selectedDate];
        }
        this.renderShiftTags();
        this.renderCalendarGrid(); // Aktualizuj siatkę
    }

    renderCalendarGrid() {
        this.elements.grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Poniedziałek

        // Dodaj puste komórki na początku
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day is-empty';
            this.elements.grid.appendChild(emptyCell);
        }

        // Dodaj dni miesiąca
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            const date = new Date(year, month, day);
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            dayCell.className = 'calendar-day';
            dayCell.innerHTML = `<span class="day-number">${day}</span>`;
            dayCell.dataset.date = dateString;

            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayCell.classList.add('is-weekend');
            }

            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                dayCell.classList.add('is-today');
            }

            const shiftsForDay = this.shifts[dateString];
            if (shiftsForDay && shiftsForDay.length > 0) {
                const indicator = document.createElement('div');
                indicator.className = 'shifts-indicator';

                const assignedCount = shiftsForDay.filter(s => s.staff).length;
                if (assignedCount === shiftsForDay.length) {
                    indicator.classList.add('all-assigned');
                    indicator.textContent = `Obsadzone`;
                } else if (assignedCount > 0) {
                    indicator.classList.add('partially-assigned');
                    indicator.textContent = `${assignedCount}/${shiftsForDay.length} zmian`;
                } else {
                    indicator.textContent = `${shiftsForDay.length} zmian`;
                }

                dayCell.appendChild(indicator);
            }

            if (this.availabilityEditMode.active) {
                const staffName = this.availabilityEditMode.staffName;
                const availabilityStatus = this.availability[staffName]?.[dateString];
                if (availabilityStatus) {
                    const overlay = document.createElement('div');
                    overlay.className = `availability-overlay availability-${availabilityStatus}`;
                    dayCell.appendChild(overlay);
                }

                dayCell.addEventListener('click', () => {
                    const statuses = ['available', 'preferred', 'unavailable', null];
                    const currentStatus = this.availability[staffName]?.[dateString];
                    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
                    this.setAvailability(dateString, statuses[nextIndex]);
                });
            } else {
                dayCell.addEventListener('click', () => this.toggleDayModal(true, dateString));
            }

            this.elements.grid.appendChild(dayCell);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});