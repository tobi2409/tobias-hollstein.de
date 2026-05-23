; Beispiel: Dynamische Adressierung
; Zeigt verschachtelte Ausdrücke [h[1,1], 1]

program dynamic_access
; Zeiger initialisieren
write h[1,1] := 1
write h[1,2] := 2

; Schreibe dynamisch an Position [1,2]
write [h[1,1], h[1,2]] := 99

; Erhöhe Zeiger
write h[1,1] := 2

; Schreibe dynamisch an Position [2,2]
write [h[1,1], h[1,2]] := 77

program-end
