#!/usr/bin/env node

/**
 * Micro-Lang CLI - Kommandozeilen-Engine für Micro-Lang
 * 
 * Verwendung:
 *   node micro-lang-cli.js <datei.ml> [startprogramm]
 *   node micro-lang-cli.js --help
 *   node micro-lang-cli.js --interactive
 * 
 * Beispiele:
 *   node micro-lang-cli.js beispiel.ml kuchen_backen
 *   node micro-lang-cli.js --interactive
 */

const fs = require('fs');
const readline = require('readline');

// Importiere Micro-Lang Interpreter-Funktionen
// (Für Node.js müssen wir die Funktionen hier kopieren oder als Module exportieren)

function tokenize(text) {
    // Kommentare entfernen: alles nach ; bis Zeilenende
    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
        const commentIndex = line.indexOf(';');
        if (commentIndex !== -1) {
            return line.substring(0, commentIndex);
        }
        return line;
    });
    const cleanedText = cleanedLines.join('\n');
    
    const tokens = []
    // Erweiterte Regex: Unterstützt verschachtelte Ausdrücke wie [h[1,1], 1]
    const regex = /\s+|program-end|program|call-else-if|call-if|call|write|exit|h\[\d+,\d+\]|\[(?:[^[\]]+|\[[^\]]*\])*\]|:=|<=|>=|=|<|>|,|"[^"]*"|\d+|[A-Za-z_]\w*/g

    let m
    while ((m = regex.exec(cleanedText)) !== null) {
        const t = m[0].trim()
        if (t.length > 0) tokens.push(t)
    }

    return tokens
}

function parse(tokens) {
    let i = 0
    
    function peek() { return tokens[i] }
    function next() { return tokens[i++] }
    function hasNext() { return i < tokens.length }

    const programs = {}

    function parseExpression(tok) {
        if (!tok) {
            throw new Error("Fehler: Unerwartetes Ende des Ausdrucks")
        }
        
        // Hilfsspeicher: h[Zeile,Spalte]
        if (/^h\[\d+,\d+\]$/.test(tok)) {
            const match = tok.match(/h\[(\d+),(\d+)\]/)
            return { type: 'helper', row: Number(match[1]), col: Number(match[2]) }
        }
        
        // Verschachtelte Ausdrücke: [expr1, expr2]
        if (/^\[.+,.+\]$/.test(tok)) {
            // Entferne äußere Klammern
            const inner = tok.slice(1, -1)
            
            // Finde das Komma, das die beiden Ausdrücke trennt
            // Muss verschachtelte Klammern berücksichtigen
            let depth = 0
            let commaPos = -1
            for (let i = 0; i < inner.length; i++) {
                if (inner[i] === '[') depth++
                else if (inner[i] === ']') depth--
                else if (inner[i] === ',' && depth === 0) {
                    commaPos = i
                    break
                }
            }
            
            if (commaPos === -1) {
                throw new Error(`Fehler: Ungültiger verschachtelter Ausdruck '${tok}'`)
            }
            
            const rowExpr = inner.substring(0, commaPos).trim()
            const colExpr = inner.substring(commaPos + 1).trim()
            
            return { 
                type: 'computed', 
                row: parseExpression(rowExpr), 
                col: parseExpression(colExpr) 
            }
        }
        
        // Einfacher Notizblock: [Zeile,Spalte] (nur Zahlen)
        if (/^\[\d+,\d+\]$/.test(tok)) {
            const match = tok.match(/\[(\d+),(\d+)\]/)
            return { type: 'memory', row: Number(match[1]), col: Number(match[2]) }
        }
        
        if (/^\d+$/.test(tok)) return Number(tok)
        if (/^".*"$/.test(tok)) {
            const value = tok.slice(1, -1)
            if (value.length !== 1) {
                throw new Error("Fehler: Strings dürfen nur ein einzelnes Zeichen enthalten")
            }
            return value
        }
        return tok // Programmname oder Identifier
    }

    while (i < tokens.length) {
        if (next() !== "program") 
            throw new Error("Fehler: Erwartet 'program' am Anfang einer Programmdefinition")

        const progName = next()
        if (!progName || progName === "program-end") {
            throw new Error("Fehler: Programmname fehlt nach 'program'")
        }
        
        if (programs[progName]) {
            throw new Error(`Fehler: Programm '${progName}' wurde bereits definiert`)
        }

        const instructions = []
        programs[progName] = instructions

        while (hasNext() && peek() !== "program-end") {
            let t = next()

            if (t === "write") {
                const addr = next()
                if (!addr) {
                    throw new Error(`Fehler in '${progName}': Adresse fehlt nach 'write'`)
                }
                if (!/^(h\[\d+,\d+\]|\[.+,.+\])$/.test(addr)) {
                    throw new Error(`Fehler in '${progName}': Ungültige Adresse '${addr}'. Erwartet Format [Zeile,Spalte] oder h[Zeile,Spalte]`)
                }
                
                const assignment = next()
                if (assignment !== ":=") {
                    throw new Error(`Fehler in '${progName}': Erwartet ':=' nach Adresse, gefunden '${assignment}'`)
                }
                
                const expr = next()
                if (!expr) {
                    throw new Error(`Fehler in '${progName}': Wert fehlt nach ':='`)
                }

                const parsed = parseExpression(addr)
                instructions.push({
                    op: "write",
                    type: parsed.type,
                    row: parsed.row,
                    col: parsed.col,
                    value: parseExpression(expr)
                })
            }

            else if (t === "call-if") {
                const left = next()
                if (!left) {
                    throw new Error(`Fehler in '${progName}': Linker Operand fehlt nach 'call-if'`)
                }
                
                const opr = next()
                if (!opr || !["=", "<", "<=", ">", ">="].includes(opr)) {
                    throw new Error(`Fehler in '${progName}': Ungültiger Vergleichsoperator '${opr}'. Erlaubt: =, <, <=, >, >=`)
                }
                
                const right = next()
                if (!right) {
                    throw new Error(`Fehler in '${progName}': Rechter Operand fehlt nach '${opr}'`)
                }
                
                const comma = next()
                if (comma !== ",") {
                    throw new Error(`Fehler in '${progName}': Komma fehlt nach Bedingung, gefunden '${comma}'`)
                }
                
                const target = next()
                if (!target) {
                    throw new Error(`Fehler in '${progName}': Zielprogramm fehlt nach ','`)
                }

                const elseIfs = []
                while (peek() === "call-else-if") {
                    next() // call-else-if
                    const eLeft = next()
                    if (!eLeft) {
                        throw new Error(`Fehler in '${progName}': Linker Operand fehlt nach 'call-else-if'`)
                    }
                    const eOpr = next()
                    if (!eOpr || !["=", "<", "<=", ">", ">="].includes(eOpr)) {
                        throw new Error(`Fehler in '${progName}': Ungültiger Vergleichsoperator '${eOpr}' in 'call-else-if'`)
                    }
                    const eRight = next()
                    if (!eRight) {
                        throw new Error(`Fehler in '${progName}': Rechter Operand fehlt nach '${eOpr}' in 'call-else-if'`)
                    }
                    const eComma = next()
                    if (eComma !== ",") {
                        throw new Error(`Fehler in '${progName}': Komma fehlt nach Bedingung in 'call-else-if', gefunden '${eComma}'`)
                    }
                    const eTarget = next()
                    if (!eTarget) {
                        throw new Error(`Fehler in '${progName}': Zielprogramm fehlt nach 'call-else-if'`)
                    }
                    elseIfs.push({
                        left: parseExpression(eLeft),
                        opr: eOpr,
                        right: parseExpression(eRight),
                        target: eTarget
                    })
                }

                instructions.push({
                    op: "call-if",
                    left: parseExpression(left),
                    opr,
                    right: parseExpression(right),
                    target,
                    elseIfs
                })
            }

            else if (t === "call") {
                const target = next()
                if (!target) {
                    throw new Error(`Fehler in '${progName}': Zielprogramm fehlt nach 'call'`)
                }
                
                instructions.push({
                    op: "call",
                    target
                })
            }

            else if (t === "exit") {
                instructions.push({
                    op: "exit"
                })
            }

            else {
                throw new Error(`Fehler in '${progName}': Unbekanntes Schlüsselwort '${t}'`)
            }
        }

        if (!hasNext() || peek() !== "program-end") {
            throw new Error(`Fehler in '${progName}': 'program-end' fehlt am Ende der Programmdefinition`)
        }
        
        next() // program-end aufnehmen
    }

    return programs
}

function run(programs, start, memory, helperMemory = {}) {
    if (!programs[start]) {
        throw new Error(`Fehler: Startprogramm '${start}' existiert nicht`)
    }
    
    let progName = start
    let instrs = programs[progName]
    let pc = 0
    const callStack = []
    const MAX_STACK_DEPTH = 1000

    function evalVal(v) {
        if (typeof v === "number") return v
        if (typeof v === "string") return v
        if (typeof v === "object" && v.row !== undefined && v.col !== undefined) {
            // Für berechnete Adressen: erst Zeile und Spalte auflösen
            let row = v.row
            let col = v.col
            
            if (typeof row === "object") {
                row = evalVal(row)
                if (typeof row !== "number") {
                    throw new Error(`Fehler: Zeilenindex muss eine Zahl sein, gefunden: ${row}`)
                }
            }
            
            if (typeof col === "object") {
                col = evalVal(col)
                if (typeof col !== "number") {
                    throw new Error(`Fehler: Spaltenindex muss eine Zahl sein, gefunden: ${col}`)
                }
            }
            
            // Unterscheide zwischen Notizblock, Arbeitsblatt und berechneten Adressen
            let targetMemory
            if (v.type === 'helper') {
                targetMemory = helperMemory
            } else if (v.type === 'computed') {
                // Bei berechneten Adressen: Standard ist Notizblock
                targetMemory = memory
            } else {
                targetMemory = memory
            }
            
            if (!targetMemory[row]) targetMemory[row] = {}
            const value = targetMemory[row][col]
            // Wenn Wert undefined ist, geben wir 0 zurück (Standardverhalten)
            return value !== undefined ? value : 0
        }
        throw new Error(`Fehler: Kann Wert nicht auswerten: ${JSON.stringify(v)}`)
    }

    while (true) {

        if (pc >= instrs.length) {
            if (callStack.length > 0) {
                const frame = callStack.pop()
                progName = frame.progName
                instrs = programs[progName]
                pc = frame.pc
                continue
            }

            return { memory, helperMemory }
        }

        const ins = instrs[pc]

        if (ins.op === "write") {
            // Schreibe in Notizblock oder Arbeitsblatt
            let row = ins.row
            let col = ins.col
            
            // Wenn Zeile oder Spalte berechnet werden müssen
            if (typeof row === "object") {
                row = evalVal(row)
                if (typeof row !== "number") {
                    throw new Error(`Fehler: Zeilenindex muss eine Zahl sein, gefunden: ${row}`)
                }
            }
            
            if (typeof col === "object") {
                col = evalVal(col)
                if (typeof col !== "number") {
                    throw new Error(`Fehler: Spaltenindex muss eine Zahl sein, gefunden: ${col}`)
                }
            }
            
            // Bestimme Zielspeicher
            let targetMemory
            if (ins.type === 'helper') {
                targetMemory = helperMemory
            } else if (ins.type === 'computed') {
                targetMemory = memory
            } else {
                targetMemory = memory
            }
            
            if (!targetMemory[row]) targetMemory[row] = {}
            targetMemory[row][col] = evalVal(ins.value)
            pc++
        }

        else if (ins.op === "exit") {
            if (callStack.length > 0) {
                const frame = callStack.pop()
                progName = frame.progName
                instrs = programs[progName]
                pc = frame.pc
            } else {
                return { memory, helperMemory }
            }
        }

        else if (ins.op === "call") {
            if (!programs[ins.target]) {
                throw new Error(`Fehler in '${progName}': Programm '${ins.target}' existiert nicht`)
            }
            
            if (callStack.length >= MAX_STACK_DEPTH) {
                throw new Error(`Fehler: Maximale Call-Tiefe (${MAX_STACK_DEPTH}) überschritten. Möglicherweise Endlosrekursion?`)
            }
            
            callStack.push({ progName, pc: pc + 1 })
            progName = ins.target
            instrs = programs[progName]
            pc = 0
        }

        else if (ins.op === "call-if") {
            const L = evalVal(ins.left)
            const R = evalVal(ins.right)

            // Typprüfung für Vergleiche
            if (typeof L !== "number" || typeof R !== "number") {
                throw new Error(`Fehler in '${progName}': Vergleich nur mit Zahlen möglich. Gefunden: ${L} (${typeof L}) ${ins.opr} ${R} (${typeof R})`)
            }

            let cond = false
            switch (ins.opr) {
                case "=": cond = (L == R); break
                case "<": cond = (L < R); break
                case "<=": cond = (L <= R); break
                case ">": cond = (L > R); break
                case ">=": cond = (L >= R); break
                default:
                    throw new Error(`Fehler in '${progName}': Unbekannter Operator '${ins.opr}'`)
            }

            if (cond) {
                if (!programs[ins.target]) {
                    throw new Error(`Fehler in '${progName}': Programm '${ins.target}' existiert nicht`)
                }
                
                if (callStack.length >= MAX_STACK_DEPTH) {
                    throw new Error(`Fehler: Maximale Call-Tiefe (${MAX_STACK_DEPTH}) überschritten. Möglicherweise Endlosrekursion?`)
                }
                
                callStack.push({ progName, pc: pc + 1 })
                progName = ins.target
                instrs = programs[progName]
                pc = 0
            } else {
                let jumped = false
                if (ins.elseIfs && ins.elseIfs.length > 0) {
                    for (const e of ins.elseIfs) {
                        const eL = evalVal(e.left)
                        const eR = evalVal(e.right)
                        if (typeof eL !== "number" || typeof eR !== "number") {
                            throw new Error(`Fehler in '${progName}': Vergleich nur mit Zahlen möglich. Gefunden: ${eL} (${typeof eL}) ${e.opr} ${eR} (${typeof eR})`)
                        }
                        let eCond = false
                        switch (e.opr) {
                            case "=": eCond = (eL == eR); break
                            case "<": eCond = (eL < eR); break
                            case "<=": eCond = (eL <= eR); break
                            case ">": eCond = (eL > eR); break
                            case ">=": eCond = (eL >= eR); break
                            default:
                                throw new Error(`Fehler in '${progName}': Unbekannter Operator '${e.opr}'`)
                        }
                        if (eCond) {
                            if (!programs[e.target]) {
                                throw new Error(`Fehler in '${progName}': Programm '${e.target}' existiert nicht`)
                            }
                            callStack.push({ progName, pc: pc + 1 })
                            progName = e.target
                            instrs = programs[progName]
                            pc = 0
                            jumped = true
                            break
                        }
                    }
                }

                if (!jumped) {
                    pc++
                }
            }
        }

        else {
            throw new Error(`Fehler in '${progName}': Unbekannte Instruktion '${ins.op}'`)
        }
    }
}

// ===== CLI-spezifische Funktionen =====

function printMemory(memory, label) {
    console.log(`\n${label}:`);
    const rows = Object.keys(memory).map(Number).sort((a, b) => a - b);
    
    if (rows.length === 0) {
        console.log('  (leer)');
        return;
    }
    
    for (const row of rows) {
        const cols = Object.keys(memory[row]).map(Number).sort((a, b) => a - b);
        for (const col of cols) {
            const value = memory[row][col];
            console.log(`  [${row},${col}] = ${JSON.stringify(value)}`);
        }
    }
}

function showHelp() {
    console.log(`
Micro-Lang CLI - Kommandozeilen-Engine

VERWENDUNG:
  node micro-lang-cli.js <datei.ml> [startprogramm]
  node micro-lang-cli.js --help
  node micro-lang-cli.js --interactive

OPTIONEN:
  <datei.ml>          Micro-Lang Quelldatei
  [startprogramm]     Name des Startprogramms (Standard: erstes Programm)
  --help, -h          Zeigt diese Hilfe an
  --interactive, -i   Startet interaktiven Modus (REPL)

BEISPIELE:
  node micro-lang-cli.js beispiel.ml
  node micro-lang-cli.js beispiel.ml kuchen_backen
  node micro-lang-cli.js --interactive

DATEISYNTAX (.ml):
  program name
    write [1,1] := 5
    write h[1,1] := 0
    call-if [1,1] > 0, next_step
  program-end
`);
}

function runFile(filename, startProgram) {
    try {
        // Datei lesen
        const code = fs.readFileSync(filename, 'utf-8');
        
        console.log(`\n🚀 Führe Micro-Lang Programm aus: ${filename}`);
        console.log('─'.repeat(60));
        
        // Tokenize & Parse
        const tokens = tokenize(code);
        const programs = parse(tokens);
        
        // Bestimme Startprogramm
        const programNames = Object.keys(programs);
        if (programNames.length === 0) {
            throw new Error('Keine Programme in der Datei gefunden');
        }
        
        const start = startProgram || programNames[0];
        console.log(`Startprogramm: ${start}`);
        
        // Initialer Speicher
        const memory = {};
        const helperMemory = {};
        
        // Ausführen
        const startTime = Date.now();
        const result = run(programs, start, memory, helperMemory);
        const duration = Date.now() - startTime;
        
        // Ergebnis anzeigen
        console.log('\n✓ Programm erfolgreich ausgeführt');
        console.log(`⏱️  Laufzeit: ${duration}ms`);
        
        printMemory(result.memory, '📝 Notizblock (Problemdaten)');
        printMemory(result.helperMemory, '🔧 Arbeitsblatt (Hilfsvariablen)');
        
        console.log('\n' + '─'.repeat(60));
        
    } catch (error) {
        console.error(`\n❌ Fehler: ${error.message}`);
        process.exit(1);
    }
}

function startInteractive() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           Micro-Lang Interactive REPL                      ║
║   Gib Micro-Lang Code ein und drücke Ctrl+D zum Ausführen ║
║   Befehle: .help, .exit, .clear                           ║
╚════════════════════════════════════════════════════════════╝
`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'micro-lang> '
    });

    let buffer = '';
    let memory = {};
    let helperMemory = {};

    rl.on('line', (line) => {
        const trimmed = line.trim();
        
        // Spezielle Befehle
        if (trimmed === '.exit') {
            console.log('Auf Wiedersehen!');
            process.exit(0);
        }
        
        if (trimmed === '.help') {
            console.log(`
Befehle:
  .exit         Beendet den REPL
  .clear        Löscht Speicher und Buffer
  .show         Zeigt aktuellen Speicher
  .help         Zeigt diese Hilfe
  
Mehrzeiliger Code: Gib mehrere Zeilen ein und drücke Ctrl+D zum Ausführen
`);
            rl.prompt();
            return;
        }
        
        if (trimmed === '.clear') {
            buffer = '';
            memory = {};
            helperMemory = {};
            console.log('✓ Speicher und Buffer gelöscht');
            rl.prompt();
            return;
        }
        
        if (trimmed === '.show') {
            printMemory(memory, '📝 Notizblock');
            printMemory(helperMemory, '🔧 Arbeitsblatt');
            rl.prompt();
            return;
        }
        
        // Code sammeln
        buffer += line + '\n';
        rl.prompt();
    });

    rl.on('close', () => {
        if (buffer.trim()) {
            try {
                const tokens = tokenize(buffer);
                const programs = parse(tokens);
                const programNames = Object.keys(programs);
                
                if (programNames.length === 0) {
                    console.log('⚠️  Keine Programme gefunden');
                    process.exit(0);
                }
                
                const result = run(programs, programNames[0], memory, helperMemory);
                memory = result.memory;
                helperMemory = result.helperMemory;
                
                console.log('\n✓ Ausgeführt');
                printMemory(memory, '📝 Notizblock');
                printMemory(helperMemory, '🔧 Arbeitsblatt');
                
            } catch (error) {
                console.error(`❌ ${error.message}`);
            }
        }
        
        console.log('\nAuf Wiedersehen!');
        process.exit(0);
    });

    rl.prompt();
}

// ===== Hauptprogramm =====

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }
    
    if (args[0] === '--interactive' || args[0] === '-i') {
        startInteractive();
        return;
    }
    
    const filename = args[0];
    const startProgram = args[1];
    
    if (!fs.existsSync(filename)) {
        console.error(`❌ Datei nicht gefunden: ${filename}`);
        process.exit(1);
    }
    
    runFile(filename, startProgram);
}

// Starte CLI
if (require.main === module) {
    main();
}

// Exportiere für Tests
module.exports = { tokenize, parse, run };
