# Micro-Lang CLI Engine

Eine vollständige Kommandozeilen-Engine für Micro-Lang.

## Installation

```bash
# Node.js erforderlich (v14+)
cd /home/tobias/Programme/tobias-hollstein.de/js
chmod +x micro-lang-cli.js
```

## Verwendung

### Datei ausführen

```bash
node micro-lang-cli.js ../examples/counter.ml
node micro-lang-cli.js ../examples/dynamic.ml
```

### Mit Startprogramm

```bash
node micro-lang-cli.js meinprogramm.ml kuchen_backen
```

### Interaktiver Modus (REPL)

```bash
node micro-lang-cli.js --interactive
```

Im REPL:
```
micro-lang> program test
... write [1,1] := 42
... program-end
... (Ctrl+D drücken)
```

### Befehle im REPL

- `.exit` - Beendet REPL
- `.clear` - Löscht Speicher
- `.show` - Zeigt aktuellen Speicher
- `.help` - Zeigt Hilfe

## Features

✅ Vollständiger Micro-Lang Interpreter  
✅ Unterstützt Notizblock `[Zeile,Spalte]`  
✅ Unterstützt Arbeitsblatt `h[Zeile,Spalte]`  
✅ Verschachtelte Ausdrücke `[h[1,1], 1]`  
✅ Dateien mit `.ml` Endung  
✅ Interaktiver REPL-Modus  
✅ Speicher-Anzeige nach Ausführung  
✅ Laufzeit-Messung  
✅ Ausführliche Fehlermeldungen  

## Beispiele

### counter.ml
```microlang
program counter
write h[1,1] := 0
call count_loop
program-end

program count_loop
write [1,1] := h[1,1]
write h[1,1] := h[1,1]
call-if h[1,1] < 10, count_loop
program-end
```

Ausgabe:
```
📝 Notizblock (Problemdaten):
  [1,1] = 10

🔧 Arbeitsblatt (Hilfsvariablen):
  h[1,1] = 10
```

### dynamic.ml
```microlang
program dynamic_access
write h[1,1] := 1
write h[1,2] := 2
write [h[1,1], h[1,2]] := 99
program-end
```

Ausgabe:
```
📝 Notizblock (Problemdaten):
  [1,2] = 99
```

## Ausgabeformat

```
🚀 Führe Micro-Lang Programm aus: counter.ml
────────────────────────────────────────────────────────────
Startprogramm: counter

✓ Programm erfolgreich ausgeführt
⏱️  Laufzeit: 5ms

📝 Notizblock (Problemdaten):
  [1,1] = 10

🔧 Arbeitsblatt (Hilfsvariablen):
  h[1,1] = 10
```

## Module Export

Die CLI kann auch als Modul verwendet werden:

```javascript
const { tokenize, parse, run } = require('./micro-lang-cli.js');

const code = 'program test\nwrite [1,1] := 5\nprogram-end';
const tokens = tokenize(code);
const programs = parse(tokens);
const result = run(programs, 'test', {}, {});
```
