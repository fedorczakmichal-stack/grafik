<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonogram OAIiT</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="login-container" id="loginScreen">
        <div class="login-box">
            <div class="login-header">
                <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <h1>Harmonogram OAIiT</h1>
                <p>Panel zarządzania dyżurami</p>
            </div>

            <div class="role-tabs">
                <button class="role-tab active" onclick="app.selectRole('admin')" id="btnAdmin">
                    Administrator
                </button>
                <button class="role-tab" onclick="app.selectRole('staff')" id="btnStaff">
                    Zespół
                </button>
            </div>

            <div id="staffLoginView" class="hidden fade-in">
                <label class="form-label">Wybierz użytkownika</label>
                <div class="staff-grid" id="staffLoginList"></div>
            </div>

            <div id="adminLoginView" class="fade-in">
                <button class="btn btn-primary btn-block" onclick="app.loginAsAdmin()">
                    Zaloguj do panelu
                </button>
            </div>
        </div>
    </div>

    <div class="app-container hidden" id="mainApp">
        
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-icon">H</div>
                <span>OAIiT Manager</span>
            </div>

            <nav class="nav-links">
                <button class="nav-btn active" onclick="app.setView('calendar')">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Kalendarz
                </button>
                <button class="nav-btn" onclick="app.setView('table')">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    Tabela zbiorcza
                </button>
                <button class="nav-btn hidden" id="navAvailability" onclick="app.setView('availability')">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Moja dostępność
                </button>
            </nav>

            <div class="user-panel">
                <div class="user-info">
                    <div class="user-name" id="currentUserName"></div>
                    <div class="user-role" id="currentUserRole"></div>
                </div>
                <button class="btn-logout" onclick="app.logout()">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        </aside>

        <main class="content">
            <header class="topbar">
                <div class="date-nav">
                    <button class="btn-icon" onclick="app.changeMonth(-1)">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <h2 id="monthTitle">Styczeń 2025</h2>
                    <button class="btn-icon" onclick="app.changeMonth(1)">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="app.setToday()">Dziś</button>
                </div>

                <div class="tools hidden" id="adminTools">
                    <button class="btn btn-outline btn-sm" onclick="app.openStationsModal()">Stanowiska</button>
                    <button class="btn btn-outline btn-sm" onclick="app.openStaffModal()">Zespół</button>
                    <button class="btn btn-primary btn-sm" onclick="app.openGenerator()">Auto-Grafik</button>
                    <button class="btn btn-danger btn-sm" onclick="app.clearMonth()">Wyczyść</button>
                </div>

                <div class="tools hidden" id="staffTools">
                    <button class="btn btn-primary btn-sm" onclick="app.openPreferences()">Preferencje</button>
                </div>
            </header>

            <div id="viewCalendar" class="view-section">
                <div class="calendar-header-row">
                    <div>Poniedziałek</div><div>Wtorek</div><div>Środa</div><div>Czwartek</div><div>Piątek</div><div>Sobota</div><div>Niedziela</div>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
            </div>

            <div id="viewTable" class="view-section hidden">
                <div class="stats-container" id="tableStats"></div>
                <div class="table-responsive">
                    <table class="main-table" id="mainTable"></table>
                </div>
            </div>

            <div id="viewAvailability" class="view-section hidden">
                <div class="info-box">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <span>Kliknij na dzień, aby zmienić status.</span>
                </div>
                <div class="avail-grid" id="availGrid"></div>
            </div>
        </main>
    </div>

    <div class="modal-overlay hidden" id="modalDay">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3 id="modalDayTitle">Szczegóły dnia</h3>
                <button class="btn-close" onclick="app.closeModal('modalDay')">&times;</button>
            </div>
            <div class="modal-body">
                
                <div class="section-header">
                    <h4>Godziny pracy sal</h4>
                    <span class="text-muted text-sm">Edytuj jeśli inne niż standardowe</span>
                </div>
                <div id="roomHoursList" class="room-hours-grid"></div>

                <hr class="divider">

                <div class="section-header">
                    <h4>Obsada (Dyżury i Sale)</h4>
                </div>
                <div class="assignments-list" id="assignmentsList">
                    </div>

                <div class="add-custom-shift">
                    <button class="btn btn-outline btn-sm w-100" onclick="app.addCustomShiftRow()">+ Dodaj niestandardowy dyżur</button>
                </div>

            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="app.closeModal('modalDay')">Zapisz i zamknij</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay hidden" id="modalGenerator">
        <div class="modal">
            <div class="modal-header">
                <h3>Generator Grafiku</h3>
                <button class="btn-close" onclick="app.closeModal('modalGenerator')">&times;</button>
            </div>
            <div class="modal-body">
                <p class="alert alert-warning">
                    Uwaga: Generator nadpisze obecne przypisania w tym miesiącu, zachowując ustawienia sal.
                </p>
                <div class="form-check">
                    <input type="checkbox" id="genRespectAvail" checked>
                    <label for="genRespectAvail">Respektuj dostępność</label>
                </div>
                <div class="progress-bar hidden" id="genProgress">
                    <div class="fill"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="app.closeModal('modalGenerator')">Anuluj</button>
                <button class="btn btn-primary" onclick="app.runGenerator()">Generuj</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay hidden" id="modalAvailEdit">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3 id="modalAvailDate">Edycja</h3>
                <button class="btn-close" onclick="app.closeModal('modalAvailEdit')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="avail-actions">
                    <button class="btn-avail available" onclick="app.setAvailStatus('available')">Dostępny</button>
                    <button class="btn-avail preferred" onclick="app.setAvailStatus('preferred')">Preferowany</button>
                    <button class="btn-avail unavailable" onclick="app.setAvailStatus('unavailable')">Niedostępny</button>
                    <button class="btn-avail neutral" onclick="app.setAvailStatus(null)">Wyczyść</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal-overlay hidden" id="modalStaff">
        <div class="modal">
            <div class="modal-header"><h3>Zespół</h3><button class="btn-close" onclick="app.closeModal('modalStaff')">&times;</button></div>
            <div class="modal-body">
                <div id="staffManageList" class="manage-list"></div>
                <div class="input-group mt-3">
                    <input type="text" id="newStaffInput" class="form-input" placeholder="Nowa osoba...">
                    <button class="btn btn-success" onclick="app.addStaff()">Dodaj</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal-overlay hidden" id="modalStations">
        <div class="modal">
            <div class="modal-header"><h3>Stanowiska</h3><button class="btn-close" onclick="app.closeModal('modalStations')">&times;</button></div>
            <div class="modal-body">
                <div id="stationsManageList" class="manage-list"></div>
                <div class="input-group mt-3">
                    <input type="text" id="newStationInput" class="form-input" placeholder="Nowe stanowisko...">
                    <button class="btn btn-success" onclick="app.addStation()">Dodaj</button>
                </div>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
