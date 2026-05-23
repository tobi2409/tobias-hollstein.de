; Beispiel: Einfacher Zähler von 0 bis 10
; Demonstriert Hilfsvariablen und Schleifen

program counter
; Zähler initialisieren
write h[1,1] := 0
; Schleife starten
call count_loop
program-end

program count_loop
; Aktuellen Wert ins Notizblock kopieren
write [1,1] := h[1,1]
; Zähler erhöhen
write h[1,1] := h[1,1]
; Wenn Zähler < 10, weiter zählen
call-if h[1,1] < 10, count_loop
program-end
