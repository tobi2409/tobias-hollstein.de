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
program-end

program inc(x)
call-if x = 8, nine(x)
call-if x = 7, eight(x)
call-if x = 6, seven(x)
call-if x = 5, six(x)
call-if x = 4, five(x)
call-if x = 3, four(x)
call-if x = 2, three(x)
call-if x = 1, two(x)
call-if x = 0, one(x)
program-end

program inc_digit(digit, carry)
call zero(h[1,6])
call-if digit = 9, inc_digit_overflow(digit, carry)
call-if h[1,6] = 0, inc(digit)
program-end

program inc_digit_overflow(digit, carry)
call zero(digit)
call one(carry)
call one(h[1,6])
program-end

program add(num1_1, num1_2, num2_1, num2_2)
call zero(h[1,1])
call zero(h[1,3])
call zero(h[1,4])
call zero(h[1,5])

call add_ones(num1_2, num2_2, num1_1)

call zero(h[1,1])
call add_tens(num1_1, num2_1)
program-end

program add_ones(digit1, digit2, tens)
call-if h[1,1] < digit2, add_ones_step(digit1, digit2, tens)
call-if h[1,3] = 1, add_carry_to_tens(tens)
program-end

program add_ones_step(digit1, digit2, tens)
call inc_digit(digit1, h[1,3])
call inc(h[1,1])
call add_ones(digit1, digit2, tens)
program-end

program add_carry_to_tens(tens)
call inc_digit(tens, h[1,4])
call zero(h[1,3])
program-end

program add_tens(tens1, tens2)
call-if h[1,1] < tens2, add_tens_step(tens1, tens2)
call-if h[1,4] = 1, one(h[1,5])
program-end

program add_tens_step(tens1, tens2)
call inc_digit(tens1, h[1,4])
call inc(h[1,1])
call add_tens(tens1, tens2)
program-end

program init
write [1,1] := 0
write [1,2] := 3
write [2,1] := 0
write [2,2] := 4
write h[1,1] := 0
call add([1,1], [1,2], [2,1], [2,2])
program-end