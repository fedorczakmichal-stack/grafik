<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Grafików OAIiT</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="login-wrapper" id="loginScreen">
        <div class="login-card">
            <div class="login-header">
                <div class="logo-icon">🏥</div>
                <h1>OAIiT Manager</h1>
                <p>System Zarządzania Grafikami</p>
            </div>

            <div class="role-switcher">
                <button class="role-btn active" onclick="app.selectRole('admin')" id="adminRoleBtn">
                    <div class="icon">👨‍💼</div>
                    <span>Admin</span>
                </button>
                <button class="role-btn" onclick="app.selectRole('staff')" id="staffRoleBtn">
                    <div class="icon">👨‍⚕️</div>
                    <span>Zespół</span>
                </button>
            </div>

            <div id="staffSelectDiv" class="hidden fade-in">
                <label class="input-label">Wybierz użytkownika:</label>
                <div class="staff-grid" id="staffListLogin"></div>
            </div>

            <div id="adminLoginDiv" class="fade-in">
                <button class="btn btn-primary btn-full" onclick="app.loginAsAdmin()">
                    Wejdź do panelu
                </button>
            </div>
        </div>
    </div>

    <div class="app-layout hidden" id="mainApp">
        
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-text">OAIiT</div>
            </div>
            
            <nav class="nav-menu">
                <button class="nav-item active" onclick="app.switchView('calendar')">
                    <span class="icon">📅</span> Kalendarz
                </button>
                <button class="nav-item" onclick="app.switchView('table')">
                    <span class="icon">📊</span> Tabela
                </button>
                <button class="nav-item hidden" id="availabilityTab" onclick="app.switchView('availability')">
                    <span class="icon">🗓️</span> Moja Dostępność
                </button>
            </nav>

            <div class="sidebar-footer">
                <div class="user-profile" id="currentUser"></div>
                <button class="btn-logout" onclick="app.logout()">Wyloguj</button>
            </div>
        </aside>

        <main class="main-content">
            
            <header class="top-bar">
                <div class="month-navigator">
                    <button class="icon-btn" onclick="app.changeMonth(-1)">‹</button>
                    <h2 id="monthDisplay">Styczeń 2025</h2>
                    <button class="icon-btn" onclick="app.changeMonth(1)">›</button>
                    <button class="btn btn-ghost btn-sm" onclick="app.goToToday()">Dziś</button>
                </div>

                <div class="action-buttons" id="adminControls">
                    <button class="btn btn-ghost btn-sm" onclick="app.manageStations()">⚙️ Stanowiska</button>
                    <button class="btn btn-ghost btn-sm" onclick="app.manageStaff()">👥 Zespół</button>
                    <button class="btn btn-primary btn-sm" onclick="app.showGenerator()">⚡ Auto-Grafik</button>
                    <div class="dropdown">
                        <button class="btn btn-ghost btn-icon">⋮</button>
                        <div class="dropdown-content">
                            <a onclick="app.clearSchedule()">Wyczyść miesiąc</a>
                            <a onclick="app.generateTestData()">Generuj demo</a>
                            <a onclick="app.exportData()">Eksportuj JSON</a>
                            <a onclick="window.print()">Drukuj</a>
                        </div>
                    </div>
                </div>

                <div class="action-buttons hidden" id="staffControls">
                    <button class="btn btn-primary btn-sm" onclick="app.showPreferences()">⚙️ Preferencje</button>
                </div>
            </header>

            <div class="view-container" id="calendarView">
                <div class="calendar-header-days">
                    <div>Pon</div><div>Wt</div><div>Śr</div><div>Czw</div><div>Pt</div><div>Sob</div><div>Niedz</div>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
            </div>

            <div class="view-container hidden" id="tableView">
                <div class="stats-bar" id="statsGrid"></div>
                <div class="table-wrapper">
                    <table class="schedule-table" id="scheduleTable"></table>
                </div>
            </div>

            <div class="view-container hidden" id="availabilityView">
                <div class="info-banner">
                    <span class="icon">ℹ️</span>
                    <p>Kliknij na dzień, aby zmienić status. Zaznacz godziny jeśli nie jesteś dostępny/a cały dzień.</p>
                </div>
                <div class="availability-grid" id="availabilityEditor"></div>
            </div>

        </main>
    </div>

    <div class="modal-backdrop hidden" id="dayModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="dayModalTitle">Szczegóły dnia</h3>
                <button class="close-btn" onclick="app.closeDayModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="shifts-list" id="shiftsEditor"></div>
                <button class="btn btn-dashed mt-3" onclick="app.addShiftToDay()">+ Dodaj dyżur</button>
            </div>
        </div>
    </div>

    <div class="modal-backdrop hidden" id="addShiftModal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3>Nowy dyżur</h3>
                <button class="close-btn" onclick="app.closeAddShiftModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Stanowisko</label>
                    <select id="shiftStation" class="form-control"></select>
                </div>
                <div id="shift24hNotice" class="notice-badge hidden">To stanowisko jest 24h (08:00 - 08:00)</div>
                <div class="form-row" id="shiftTimeInputs">
                    <div class="form-group">
                        <label>Start</label>
                        <input type="time" id="shiftStart" class="form-control" value="08:00">
                    </div>
                    <div class="form-group">
                        <label>Koniec</label>
                        <input type="time" id="shiftEnd" class="form-control" value="15:00">
                    </div>
                </div>
                <div class="form-group">
                    <label>Lekarz</label>
                    <select id="shiftStaff" class="form-control">
                        <option value="">-- Wybierz --</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="app.closeAddShiftModal()">Anuluj</button>
                <button class="btn btn-primary" onclick="app.saveShift()">Zapisz</button>
            </div>
        </div>
    </div>

    <div class="modal-backdrop hidden" id="preferencesModal">
        <div class="modal">
            <div class="modal-header">
                <h3>Moje Preferencje</h3>
                <button class="close-btn" onclick="app.closePreferencesModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Max dni w miesiącu</label>
                        <input type="number" id="prefMaxShifts" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Max dyżurów 24h</label>
                        <input type="number" id="prefMax24h" class="form-control">
                    </div>
                </div>
                <div class="section-title mt-4">Preferowane stanowiska</div>
                <div class="checkbox-grid" id="stationPreferences"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="app.savePreferences()">Zapisz zmiany</button>
            </div>
        </div>
    </div>

    <div class="modal-backdrop hidden" id="availabilityModal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h3 id="availabilityModalTitle">Edycja dostępności</h3>
                <button class="close-btn" onclick="app.closeAvailabilityModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="availability-options">
                    <button class="avail-btn success" onclick="app.setDayAvailability('available')">Dostępny</button>
                    <button class="avail-btn warning" onclick="app.setDayAvailability('preferred')">Preferowany</button>
                    <button class="avail-btn danger" onclick="app.setDayAvailability('unavailable')">Niedostępny</button>
                    <button class="avail-btn neutral" onclick="app.setDayAvailability(null)">Wyczyść</button>
                </div>
                <div class="form-check mt-3">
                    <input type="checkbox" id="hasTimeLimit" onchange="app.toggleTimeLimit()">
                    <label for="hasTimeLimit">Tylko w godzinach...</label>
                </div>
                <div id="timeLimitInputs" class="form-row hidden mt-2">
                    <input type="time" id="availableFrom" class="form-control">
                    <span>-</span>
                    <input type="time" id="availableTo" class="form-control">
                </div>
            </div>
        </div>
    </div>

    <div class="modal-backdrop hidden" id="generatorModal">
        <div class="modal">
            <div class="modal-header">
                <h3>Generator Grafiku</h3>
                <button class="close-btn" onclick="app.closeGeneratorModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="info-banner warning">
                    Uwaga: Nadpisze to grafik w wyświetlanym miesiącu.
                </div>
                <div class="progress-container hidden" id="generatorProgress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <small id="progressText">Przetwarzanie...</small>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="app.generateSchedule()">Generuj</button>
            </div>
        </div>
    </div>

    <div class="modal-backdrop hidden" id="staffModal">
