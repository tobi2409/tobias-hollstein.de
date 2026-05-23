program one
write [1,1] := 1
program-end

program two
write [1,1] := 2
program-end

program three
write [1,1] := 3
program-end

program four
write [1,1] := 4
program-end

program five
write [1,1] := 5
program-end

program six
write [1,1] := 6
program-end

program seven
write [1,1] := 7
program-end

program eight
write [1,1] := 8
program-end

program nine
write [1,1] := 9
program-end

program inc
call-if [1,1] = 8, nine
call-if [1,1] = 7, eight
call-if [1,1] = 6, seven
call-if [1,1] = 5, six
call-if [1,1] = 4, five
call-if [1,1] = 3, four
call-if [1,1] = 2, three
call-if [1,1] = 1, two
call-if [1,1] = 0, one
program-end

program init
write [1,1] := 3
call inc
program-end