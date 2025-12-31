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
    const regex = /\s+|program-end|program|call-if|call|write|\[\d+,\d+\]|:=|<=|>=|=|<|>|,|"[^"]*"|\d+|[A-Za-z_]\w*/g

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
        
        if (/^\[\d+,\d+\]$/.test(tok)) {
            const match = tok.match(/\[(\d+),(\d+)\]/)
            return { row: Number(match[1]), col: Number(match[2]) }
        }
        if (/^\d+$/.test(tok)) return Number(tok)
        if (/^".*"$/.test(tok)) return tok.slice(1, -1)
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
                if (!/^\[\d+,\d+\]$/.test(addr)) {
                    throw new Error(`Fehler in '${progName}': Ungültige Adresse '${addr}'. Erwartet Format [Zeile,Spalte]`)
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

                instructions.push({
                    op: "call-if",
                    left: parseExpression(left),
                    opr,
                    right: parseExpression(right),
                    target
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

function run(programs, start, memory) {
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
            // Kariertes Papier: [row, col]
            if (!memory[v.row]) memory[v.row] = {}
            const value = memory[v.row][v.col]
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

            return memory
        }

        const ins = instrs[pc]

        if (ins.op === "write") {
            // Kariertes Papier: [row, col]
            if (!memory[ins.row]) memory[ins.row] = {}
            memory[ins.row][ins.col] = evalVal(ins.value)
            pc++
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
                pc++
            }
        }

        else {
            throw new Error(`Fehler in '${progName}': Unbekannte Instruktion '${ins.op}'`)
        }
    }
}