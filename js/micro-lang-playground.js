// Initialer Speicher mit Beispielwerten für kuchen_backen
let memory = {
    1: { 1: 1 },  // Bäcker.bereitschaft = mittel
    2: { 1: 1 },  // Zucker vorhanden
    3: { 1: 1 }   // Eier vorhanden
};

// Hilfsspeicher (Arbeitsblatt)
let helperMemory = {
    // Nutzfeld 1: Zähler & Zeiger (Zeilen 1-5)
    // Nutzfeld 2: Zwischenwerte & Berechnungen (Zeilen 6-10)
    // Nutzfeld 3: Zustände & Merker (Zeilen 11-15)
};

// DOM-Elemente
const codeInput = document.getElementById('code-input');
const startProgramInput = document.getElementById('start-program');
const runBtn = document.getElementById('run-btn');
const clearBtn = document.getElementById('clear-btn');
const memoryGrid = document.getElementById('memory-grid');
const helperGrid = document.getElementById('helper-grid');
const output = document.getElementById('output');

// Event Listeners
runBtn.addEventListener('click', runProgram);
clearBtn.addEventListener('click', clearMemory);

// Initial Memory anzeigen
displayMemory();
displayHelperMemory();

function runProgram() {
    try {
        const code = codeInput.value;
        const startProgram = startProgramInput.value.trim();
        
        if (!code.trim()) {
            showError("Fehler: Code-Editor ist leer");
            return;
        }
        
        if (!startProgram) {
            showError("Fehler: Startprogramm muss angegeben werden");
            return;
        }
        
        // Tokenize und Parse
        const tokens = tokenize(code);
        const programs = parse(tokens);
        
        // Programm ausführen - gibt beide Speicher zurück
        const result = run(programs, startProgram, memory, helperMemory);
        memory = result.memory;
        helperMemory = result.helperMemory;
        
        // Erfolg anzeigen
        showSuccess(`✓ Programm '${startProgram}' erfolgreich ausgeführt`);
        displayMemory();
        displayHelperMemory();
        
    } catch (error) {
        showError(error.message);
    }
}

function clearMemory() {
    memory = {
        1: { 1: 1 },  // Bäcker.bereitschaft = mittel
        2: { 1: 1 },  // Zucker vorhanden
        3: { 1: 1 }   // Eier vorhanden
    };
    helperMemory = {};
    displayMemory();
    displayHelperMemory();
    showSuccess("Speicher auf Startwerte zurückgesetzt");
}

function displayMemory() {
    // Prüfen ob Speicher leer ist
    const hasData = Object.keys(memory).length > 0;
    
    if (!hasData) {
        memoryGrid.innerHTML = '<div class="memory-empty">Speicher ist leer</div>';
        return;
    }
    
    // Alle Zeilen und Spalten sammeln
    const rows = Object.keys(memory).map(Number).sort((a, b) => a - b);
    let allCols = new Set();
    
    for (const row of rows) {
        const cols = Object.keys(memory[row]).map(Number);
        cols.forEach(col => allCols.add(col));
    }
    
    const cols = Array.from(allCols).sort((a, b) => a - b);
    
    if (cols.length === 0) {
        memoryGrid.innerHTML = '<div class="memory-empty">Speicher ist leer</div>';
        return;
    }
    
    // Matrix-Tabelle erstellen
    let html = '<table class="memory-table">';
    
    // Header mit Spaltennummern
    html += '<thead><tr><th></th>';
    for (const col of cols) {
        html += `<th>Spalte ${col}</th>`;
    }
    html += '</tr></thead>';
    
    // Zeilen mit Werten
    html += '<tbody>';
    for (const row of rows) {
        html += `<tr><th>Zeile ${row}</th>`;
        for (const col of cols) {
            const value = memory[row] && memory[row][col] !== undefined ? memory[row][col] : '';
            html += `<td><input type="text" class="memory-cell" data-row="${row}" data-col="${col}" value="${escapeHtml(value)}"></td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    
    memoryGrid.innerHTML = html;
    
    // Event Listener für alle Input-Felder hinzufügen
    const inputs = memoryGrid.querySelectorAll('.memory-cell');
    inputs.forEach(input => {
        input.addEventListener('input', handleMemoryChange);
    });
}

function handleMemoryChange(event) {
    const input = event.target;
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const value = input.value.trim();
    
    // Speicher aktualisieren
    if (!memory[row]) {
        memory[row] = {};
    }
    
    // Wert parsen (Zahl oder String)
    if (value === '') {
        memory[row][col] = 0;
    } else if (!isNaN(value) && value !== '') {
        memory[row][col] = Number(value);
    } else {
        memory[row][col] = value;
    }
}

function escapeHtml(text) {
    if (text === undefined || text === null || text === '') {
        return '';
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatValue(value) {
    if (value === undefined || value === null || value === '') {
        return '<span style="color: #ddd;">·</span>';
    }
    if (typeof value === 'string') {
        return `"${value}"`;
    }
    return value;
}

function showSuccess(message) {
    output.textContent = message;
    output.className = 'success';
}

function showError(message) {
    output.textContent = message;
    output.className = 'error';
}

function displayHelperMemory() {
    // Nutzfelder-Kategorien definieren
    const categories = [
        { name: 'Zähler & Zeiger', question: 'Wo bin ich gerade?', rows: [1, 2, 3, 4, 5], color: '#e3f2fd' },
        { name: 'Zwischenwerte & Berechnungen', question: 'Was berechne ich gerade?', rows: [6, 7, 8, 9, 10], color: '#f3e5f5' },
        { name: 'Zustände & Merker', question: 'Was habe ich gefunden/erreicht?', rows: [11, 12, 13, 14, 15], color: '#fff3e0' }
    ];
    
    let html = '';
    
    for (const category of categories) {
        html += `<div class="helper-category" style="background-color: ${category.color};">`;
        html += `<div class="category-header">`;
        html += `<strong>${category.name}</strong>`;
        html += `<span class="category-question">${category.question}</span>`;
        html += `</div>`;
        
        // Mini-Grid für diese Kategorie
        const rows = category.rows;
        const cols = [1, 2, 3]; // Standardmäßig 3 Spalten
        
        html += '<table class="memory-table category-table">';
        html += '<thead><tr><th></th>';
        for (const col of cols) {
            html += `<th>Sp. ${col}</th>`;
        }
        html += '</tr></thead>';
        
        html += '<tbody>';
        for (const row of rows) {
            html += `<tr><th>Z. ${row}</th>`;
            for (const col of cols) {
                const value = helperMemory[row] && helperMemory[row][col] !== undefined ? helperMemory[row][col] : '';
                html += `<td><input type="text" class="memory-cell" data-row="${row}" data-col="${col}" data-memory="helper" value="${escapeHtml(value)}" placeholder="·"></td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        html += '</div>';
    }
    
    helperGrid.innerHTML = html;
    
    // Event Listener für alle Input-Felder hinzufügen
    const inputs = helperGrid.querySelectorAll('.memory-cell');
    inputs.forEach(input => {
        input.addEventListener('input', handleHelperMemoryChange);
    });
}

function handleHelperMemoryChange(event) {
    const input = event.target;
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const value = input.value.trim();
    
    // Hilfsspeicher aktualisieren
    if (!helperMemory[row]) {
        helperMemory[row] = {};
    }
    
    // Wert parsen (Zahl oder String)
    if (value === '') {
        delete helperMemory[row][col];
        if (Object.keys(helperMemory[row]).length === 0) {
            delete helperMemory[row];
        }
    } else if (!isNaN(value) && value !== '') {
        helperMemory[row][col] = Number(value);
    } else {
        helperMemory[row][col] = value;
    }
}
