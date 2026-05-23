program one(x)
write x := 1
program-end

program two(x)
write x := 2
program-end

program three(x)
write x := 3
program-end

program four(x)
write x := 4
program-end

program five(x)
write x := 5
program-end

program six(x)
write x := 6
program-end

program seven(x)
write x := 7
program-end

program eight(x)
write x := 8
program-end

program nine(x)
write x := 9
program-end

program zero(x)
write x := 0
write h[2,1] := 1
program-end

program inc(x)
call-if x = 9, zero(x)
call-else-if x = 8, nine(x)
call-else-if x = 7, eight(x)
call-else-if x = 6, seven(x)
call-else-if x = 5, six(x)
call-else-if x = 4, five(x)
call-else-if x = 3, four(x)
call-else-if x = 2, three(x)
call-else-if x = 1, two(x)
call-else-if x = 0, one(x)
program-end

program add(num1_1, num1_2, num2_1, num2_2)
call-if h[1,2] < num2_2, inc(num1_2)
call-if h[1,2] < num2_2, inc(h[1,2])
call-if h[1,2] < num2_2, add(num1_1, num1_2, num2_1, num2_2)

call-if h[1,1] < num2_1, inc(num1_1)
call-if h[1,1] < num2_1, inc(h[1,1])
call-if h[1,1] < num2_1, add(num1_1, num1_2, num2_1, num2_2)
program-end

program init
write [1,1] := 0
write [1,2] := 3
write [2,1] := 0
write [2,2] := 4
write h[1,1] := 0 ; Zähler für Iteration von [1,1] bis [2,1]
write h[1,2] := 0 ; Zähler für Iteration von [1,2] bis [2,2]
write h[2,1] := 0 ; Übertrag
call add([1,1], [1,2], [2,1], [2,2])
program-end