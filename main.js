const fs = require('fs');

const program = fs.readFileSync('./challenge.bin');
const stack   = [];
let index     = 0;

const registers = [0, 0, 0, 0, 0, 0, 0, 0,];

let operationsComplete = 0;

while (true) {
    const cmd = readCommand();

    if (cmd !== 19 && cmd !== 21) {
        console.log(`\nCommand [${cmd}] index: [${index}]`);
    }

    switch (cmd) {
        // halt
        case 0:
            console.log('\nHalt code, terminating');
            console.log(`Exit(0), operations compete: [${operationsComplete}]`);
            return;
        // set a b
        case 1: {
            const a = readRegister();
            const b = readValue();

            registers[a] = b;
            break;
        }
        // push a
        case 2: {
            const a = readValue();
            stack.push(a);
            break;
        }
        // pop a
        case 3: {
            if (stack.length === 0) {
                throw new Error('Stack is empty')
            }

            const a = readRegister();

            registers[a] = stack.pop();
            break;
        }
        // eq a b c
        case 4: {
            const a = readRegister();
            const b = readValue();
            const c = readValue();

            registers[a] = b === c ? 1 : 0;
            break;
        }
        // gt a b c
        case 5: {
            const a = readRegister();
            const b = readValue();
            const c = readValue();

            registers[a] = b > c ? 1 : 0;
            break;
        }
        // jmp a
        case 6: {
            const a = readValue();
            index = a;
            break;
        }
        // jt a b
        case 7: {
            const a = readValue();
            const b = readValue();

            if (a !== 0) {
                index = b;
            }
            break;
        }
        // jf a b
        case 8: {
            const a = readValue();
            const b = readValue();

            if (a === 0) {
                index = b;
            }
            break;
        }
        // out a
        case 19: {
            const a = readValue();
            process.stdout.write(String.fromCharCode(a));
            break;
        }
        // noop
        case 21: {
            break;
        }
        default: {
            throw new Error(`Command [${cmd}] not supported`);
        }
    }

    operationsComplete++;
}

function read() {
    if (index * 2 > program.length - 2) {
        throw new Error(`Seg fault [${index}]`);
    }

    const value = program.readInt16LE(index * 2);
    index++;

    return value;
}

function readCommand() {
    const value = read();

    if (value > 22) {
        throw new Error(`Invalid command code [${value}]`);
    }

    return value;
}

function readValue() {
    const value = read();

    if (value < 32768) {
        return value;
    } else if (value <= 32775) {
        console.log('AAaAaaaa');
        return registers[value - 32768];
    } else {
        throw new Error(`Invalid value [${value}]`);
    }
}

function readRegister() {
    const value = read();

    if (value >= 32768 && value <= 32775) {
        return value - 32768;
    } else {
        throw new Error(`Invalid register [${value}]`);
    }
}
