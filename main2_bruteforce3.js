const fs = require('fs');

const MAX_NUMBER     = 32767;
const NUMBER_BOUND   = 32768;
const FIRST_REGISTER = 32768;
const LAST_REGISTER  = 32775;

const MEM_SIZE = Math.pow(2, 15);

let aaa = 0;
let maxI = 0;
let maxAAA = 0;

const startMemory = fs.readFileSync('memory-image.bin');
const startState  = fs.readFileSync('state.json');

let memory = Buffer.alloc(startMemory.length);
let registers;
let stack;
let index;

const output = Buffer.alloc(1000000000);

for (let i = 1; i <= MAX_NUMBER; i++) {
    //console.log('I:', i);

    resetMemoryImage();

    index -= 2;
    let opIndex = index;

    registers[7] = i;

    let operationsComplete = 0;
    let outputIndex = 0;

    run();

    function run() {
        while (true) {
            if (operationsComplete === 8000) {
                const outputString = output.slice(Math.max(0, outputIndex - 400), outputIndex).toString('utf-8');

                //console.log(outputString);

                if (!outputString.includes('Miscalibration detected!')) {
                    console.log('SUCCESS:', i);
                    console.log(outputString);
                    //process.exit(10);
                }
                return;
            }

            opIndex = index;
            const opCode = readOpCode();

            switch (opCode) {
                case 0: { // halt
                    throw new Error('halt?');
                    halt();
                    return;
                }
                case 1: { // set
                    const a = readRegisterIndex();
                    const b = readValue();

                    setRegister(a, b);
                    break;
                }
                case 2: { // push
                    const a = readValue();

                    stack.push(a);
                    break;
                }
                case 3: { // pop
                    if (stack.length === 0) {
                        throw new Error('Stack is empty');
                    }

                    const a = readRegisterIndex();

                    setRegister(a, stack.pop());
                    break;
                }
                case 4: { // eq
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, b === c ? 1 : 0);
                    break;
                }
                case 5: { // gt
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, b > c ? 1 : 0);
                    break;
                }
                case 6: { // jmp
                    const a = readAddress();

                    goTo(a);
                    break;
                }
                case 7: { // jt
                    const a = readValue();
                    const b = readAddress();

                    if (opIndex === 6035) {
                        registers[1] = 0;
                        break;
                    }

                    if (a !== 0) {
                        goTo(b);
                    }
                    break;
                }
                case 8: { // jf
                    const a = readValue();
                    const b = readAddress();

                    if (a === 0) {
                        goTo(b);
                    }
                    break;
                }
                case 9: { // add
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, (b + c) % NUMBER_BOUND);
                    break;
                }
                case 10: { // mult
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, (b * c) % NUMBER_BOUND);
                    break;
                }
                case 11: { // mod
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, b % c);
                    break;
                }
                case 12: { // and
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, b & c);
                    break;
                }
                case 13: { // or
                    const a = readRegisterIndex();
                    const b = readValue();
                    const c = readValue();

                    setRegister(a, b | c);
                    break;
                }
                case 14: { // not
                    const a = readRegisterIndex();
                    const b = readValue();

                    setRegister(a, b ^ MAX_NUMBER);
                    break;
                }
                case 15: { // rmem
                    const a = readRegisterIndex();
                    const b = readAddress();

                    setRegister(a, getValueByIndex(b));
                    break;
                }
                case 16: { // wmem
                    const a = readAddress();
                    const b = readValue();

                    writeValueByIndex(a, b);
                    break;
                }
                case 17: { // call
                    const a = readAddress();

                    stack.push(index);
                    goTo(a);
                    break;
                }
                case 18: { // ret
                    if (stack.length === 0) {
                        throw new Error('halt?');
                        halt();
                        return;

                    } else {
                        const address = stack.pop();

                        goTo(address);
                        break;
                    }
                }
                case 19: { // Out
                    const a = readValue();

                    output.writeUInt8(a, outputIndex);
                    outputIndex++;
                    break;
                }
                case 20: { // in
                    const a = readRegisterIndex();

                    if (operationsComplete === 0) {
                        setRegister(a, 10);
                    } else {
                        console.log('SS', i);
                        throw new Error(i);
                    }
                    break;
                }
                case 21: // No-op
                    break;
                default: {
                    throw new Error(`Unregistered Op Code [${opCode}]`);
                }
            }

            operationsComplete++;
        }
    }

    if (aaa > maxAAA) {
        maxAAA = aaa;
        maxI = i;
    }

    aaa = 0;
}

console.log('maxAAA', maxAAA, maxI);
process.exit(0);

function goTo(newIndex) {
    if (newIndex == null || newIndex < 0 || newIndex > MEM_SIZE) {
        throw new Error(`Invalid memory index [${newIndex}]`);
    }

    index = newIndex;
}

function readCell() {
    const cellValue = getValueByIndex(index);
    index++;

    return cellValue;
}

function readOpCode() {
    const opCode = readCell();

    if (opCode > 22) {
        throw new Error(`Invalid Op Code [${opCode}]`);
    }

    return opCode;
}

function readValue(isLog) {
    const cellValue = readCell();

    if (cellValue <= MAX_NUMBER) {
        if (isLog) console.log(`read value [${cellValue}]`);
        return cellValue;
    } else if (cellValue <= LAST_REGISTER) {
        if (isLog) console.log(`read from register [${cellValue - FIRST_REGISTER}] [${registers[cellValue - FIRST_REGISTER]}]`);
        const value = registers[cellValue - FIRST_REGISTER];

        if (cellValue - FIRST_REGISTER === 7) {
        //     console.log('register8 access');
            aaa++;
        }

        if (value > MAX_NUMBER) {
            //throw new Error(`Invalid value [${value}]`);
            console.log('get from register');
            return registers[value - FIRST_REGISTER];
        }

        return value;
    } else {
        throw new Error(`Invalid value [${cellValue}]`);
    }
}

function readAddress() {
    const value = readValue();

    if (value > MEM_SIZE) {
        throw new Error(`Invalid memory index [${value}]`);
    }

    return value;
}

function readRegisterIndex() {
    const value = readCell();

    if (value >= FIRST_REGISTER && value <= LAST_REGISTER) {
        return value - FIRST_REGISTER;
    } else {
        throw new Error(`Invalid register [${value}]`);
    }
}

function getValueByIndex(index) {
    // if (index == null || index < 0 || index >= MEM_SIZE) {
    //     throw new Error(`Invalid memory index [${index}]`);
    // }

    return memory.readUInt16LE(index * 2);

    // if (value <= MAX_NUMBER) {
    //     return value;
    // } else {
    //     throw new Error('Invalid memory value');
    // }
}

function writeValueByIndex(index, value) {
    memory.writeUInt16LE(value, index * 2);
}

function setRegister(registerIndex, value) {
    if (registerIndex === 7) {
        console.log(`!!! Set Eighth-Register to [${value}]`);
    }

    registers[registerIndex] = value;
}

function resetMemoryImage() {
    startMemory.copy(memory);

    const state = JSON.parse(startState);

    registers = state.registers;
    stack     = state.stack;
    index     = state.index;
}
