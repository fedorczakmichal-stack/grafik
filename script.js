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
            modal: document.getElementById('day-modal'),
            modalDateDisplay: document.getElementById('modal-date-display'),
            closeModalBtn: document.getElementById('close-modal-btn'),
            modalTagsContainer: document.getElementById('modal-tags-container'),
            modalShowFormBtn: document.getElementById('modal-show-form-btn'),
            modalAddShiftForm: document.getElementById('modal-add-shift-form'),
            modalAddShiftBtn: document.getElementById('modal-add-shift-btn'),
            modalCancelBtn: document.getElementById('modal-cancel-add-btn'),
            modalNewStart: document.getElementById('modal-new-start'),
            modalNewEnd: document.getElementById('modal-new-end'),
        };

        this.selectedDate = null;

        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.elements.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.elements.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        this.elements.closeModalBtn.addEventListener('click', () => this.toggleModal(false));
        this.elements.modalShowFormBtn.addEventListener('click', () => this.toggleAddShiftForm(true));
        this.elements.modalCancelBtn.addEventListener('click', () => this.toggleAddShiftForm(false));
        this.elements.modalAddShiftBtn.addEventListener('click', () => this.addShift());
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.render();
    }

    toggleModal(visible, dateString = null) {
        if (visible && dateString) {
            this.selectedDate = dateString;
            const date = new Date(dateString);
            this.elements.modalDateDisplay.textContent = date.toLocaleDateString('pl-PL', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            this.renderShiftTags();
            this.toggleAddShiftForm(false);
        }
        this.elements.modal.classList.toggle('is-visible', visible);
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
            tag.innerHTML = `${shift.start} - ${shift.end} <button class="remove-tag-btn" data-index="${index}">&times;</button>`;
            this.elements.modalTagsContainer.appendChild(tag);
        });

        // Dodaj obsługę usuwania
        this.elements.modalTagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.removeShift(e.target.dataset.index));
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
                indicator.textContent = `${shiftsForDay.length} zmian`;
                dayCell.appendChild(indicator);
            }

            dayCell.addEventListener('click', () => this.toggleModal(true, dateString));

            this.elements.grid.appendChild(dayCell);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});