function tokenize(text) {
    const tokens = []
    const regex = /\s+|program-end|program|call-if|call|write|\[\d+\]|:=|<=|>=|=|<|>|,|"[^"]*"|\d+|[A-Za-z_]\w*/g

    let m
    while ((m = regex.exec(text)) !== null) {
        const t = m[0].trim()
        if (t.length > 0) tokens.push(t)
    }

    return tokens
}

function parse(tokens) {
    let i = 0
    
    function peek() { return tokens[i] }
    function next() { return tokens[i++] }

    const programs = {}

    function parseExpression(tok) {
        if (/^\[\d+\]$/.test(tok)) return { addr: Number(tok.match(/\d+/)[0]) }
        if (/^\d+$/.test(tok)) return Number(tok)
        if (/^".*"$/.test(tok)) return tok.slice(1, -1)
        return tok // Programmname oder Identifier
    }

    while (i < tokens.length) {
        if (next() !== "program") 
            throw new Error("Expected 'program'")

        const progName = next()
        const instructions = []
        programs[progName] = instructions

        while (peek() !== "program-end") {
            let t = next()

            if (t === "write") {
                const addr = next()
                next() // :=
                const expr = next()

                instructions.push({
                    op: "write",
                    addr: Number(addr.match(/\d+/)[0]),
                    value: parseExpression(expr)
                })
            }

            else if (t === "call-if") {
                const left = parseExpression(next())
                const opr  = next()
                const right = parseExpression(next())
                next() // Komma
                const target = next()

                instructions.push({
                    op: "call-if",
                    left,
                    opr,
                    right,
                    target
                })
            }

            else if (t === "call") {
                const target = next()
                instructions.push({
                    op: "call",
                    target
                })
            }

            else {
                throw new Error("Unknown token in program body: " + t)
            }
        }

        next() // program-end aufnehmen
    }

    return programs
}

function run(programs, start, memory) {
    let progName = start
    let instrs = programs[progName]
    let pc = 0
    const callStack = []

    function evalVal(v) {
        if (typeof v === "number") return v
        if (typeof v === "string") return v
        if (typeof v === "object") return memory[v.addr]
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
            memory[ins.addr] = evalVal(ins.value)
            pc++
        }

        else if (ins.op === "call") {
            callStack.push({ progName, pc: pc + 1 })
            progName = ins.target
            instrs = programs[progName]
            pc = 0
        }

        else if (ins.op === "call-if") {
            const L = evalVal(ins.left)
            const R = evalVal(ins.right)

            let cond = false
            switch (ins.opr) {
                case "=": cond = (L == R); break
                case "<": cond = (L < R); break
                case "<=": cond = (L <= R); break
                case ">": cond = (L > R); break
                case ">=": cond = (L >= R); break
            }

            if (cond) {
                callStack.push({ progName, pc: pc + 1 })
                progName = ins.target
                instrs = programs[progName]
                pc = 0
            } else {
                pc++
            }
        }

        else {
            throw new Error("Unknown instruction: " + ins.op)
        }
    }
}