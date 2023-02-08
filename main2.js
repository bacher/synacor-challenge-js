const fs = require('fs');
const Stack = require('./stack');

const LOG_OPERATIONS = false;

const magicNumber = Number(process.argv[2]);

const input = Buffer.concat([fs.readFileSync('./input.data'), Buffer.from('use teleporter')]);
let curInputIndex = 0;

if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
    process.stdin.on('data', globalHandler);
}

function globalHandler(key) {
    if (key.readUInt8(0) === 3) {
        process.stdin.removeListener('data', globalHandler);

        halt(0);
    }
}

const OP_CODES = {
    0: { name: 'halt', args: '' },
    1: { name: 'set', args: 'rv' },
    2: { name: 'push', args: 'v' },
    3: { name: 'pop', args: 'r' },
    4: { name: 'eq', args: 'rvv' },
    5: { name: 'gt', args: 'rvv' },
    6: { name: 'jmp', args: 'a' },
    7: { name: 'jt', args: 'va' },
    8: { name: 'jf', args: 'va' },
    9: { name: 'add', args: 'rvv' },
    10: { name: 'mult', args: 'rvv' },
    11: { name: 'mod', args: 'rvv' },
    12: { name: 'and', args: 'rvv' },
    13: { name: 'or', args: 'rvv' },
    14: { name: 'not', args: 'rv' },
    15: { name: 'rmem', args: 'rv' },
    16: { name: 'wmem', args: 'av' },
    17: { name: 'call', args: 'a' },
    18: { name: 'ret', args: '' },
    19: { name: 'out', args: 'v' },
    20: { name: 'in', args: 'a' },
    21: { name: 'noop', args: '' },
};

const MAX_NUMBER     = 32767;
const NUMBER_BOUND   = 32768;
const FIRST_REGISTER = 32768;
const LAST_REGISTER  = 32775;

const MEM_SIZE = Math.pow(2, 15);

const registers = [0, 0, 0, 0, 0, 0, 0, 0];
const stack     = new Stack();
const memory    = Buffer.alloc(MEM_SIZE * 2);
let index       = 0;

let errorCode = 0;
let isHalting = false;

let operations = [];

const program = fs.readFileSync('./challenge.bin');
program.copy(memory);

let curOp = 0;
let opIndex = 0;

function run() {
    while (true) {
        curOp++;

        // if (curOp === 1000000) {
        //     halt();
        //     return;
        // }

        opIndex = index;
        const opCode = readOpCode();

        if (curOp >= 869115 && LOG_OPERATIONS) {
            if (opCode === 21) {
                if (operations.length && operations[operations.length - 1][1] === opCode) {
                    operations[operations.length - 1][3][0]++;
                } else {
                    operations.push([curOp, opCode, opIndex, [1]]);
                }
            } else {
                const args = [];

                for (let i = 0; i < OP_CODES[opCode].args.length; i++) {
                    const argType = OP_CODES[opCode].args[i];

                    if (argType === 'v') {
                        args.push(readValueDesc());
                    } else if (argType === 'a') {
                        args.push('@' + readAddress());
                    } else if (argType === 'r') {
                        args.push('R' + readRegisterIndex());
                    }
                }

                index -= args.length;

                operations.push([curOp, opCode, opIndex, args]);
            }

            // if (operations.length > 2000) {
            //     operations = operations.slice(-1000)
            // }
        }

        switch (opCode) {
            case 0: { // halt
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
                if (stack.size() === 0) {
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

                // if (opIndex === 6035 && curOp > 800000) {
                //     // for (let i = 1; i < registers[1]; i++) {
                //     //     stack.push(registers[0]);
                //     //     stack.push(6047);
                //     // }
                //
                //     registers[1] = 0;
                //     //console.log('HEH');
                //     break;
                // }

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

                // if (opIndex === 6050) {
                //     setRegister(a, 0);
                //     break;
                // }

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
                if (stack.size() === 0) {
                    halt();
                    return;

                } else {
                    const address = stack.pop();

                    goTo(address);
                    break;
                }
            }
            case 19: { // out
                const a = readValue();

                process.stdout.write(String.fromCharCode(a));
                break;
            }
            case 20: { // in
                registers[7] = magicNumber || 1;

                const a = readRegisterIndex();

                if (curInputIndex < input.length) {
                    const charCode = input.readUInt8(curInputIndex);
                    setRegister(a, charCode === 13 ? 10 : charCode);
                    curInputIndex++;
                    break;
                } else {
                    //halt();
                    //return;
                    registers[7] = 5;

                    process.stdin.once('data', byte => {
                        //fs.appendFileSync('./input.data', byte);

                        const charCode = byte.readUInt8();

                        if (charCode !== 3) {
                            setRegister(a, charCode === 13 ? 10 : charCode);
                            process.stdout.write(byte);

                            safeRun();
                        }
                    });
                    return
                }
            }
            case 21: // No-op
                break;
            default: {
                throw new Error(`Unregistered Op Code [${opCode}]`);
            }
        }
    }
}

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

        // if (cellValue - FIRST_REGISTER === 7) {
        //     console.log('register8 access');
        // }

        if (value > MAX_NUMBER) {
            throw new Error(`Invalid value [${value}]`);
        }

        return value;
    } else {
        throw new Error(`Invalid value [${cellValue}]`);
    }
}

function readValueDesc() {
    const cellValue = readCell();

    if (cellValue <= MAX_NUMBER) {
        return cellValue;
    } else if (cellValue <= LAST_REGISTER) {
        const value = registers[cellValue - FIRST_REGISTER];

        if (value > MAX_NUMBER) {
            throw new Error(`Invalid value [${value}]`);
        }

        return `${value}(R${cellValue - FIRST_REGISTER})`;
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

function halt(_errorCode) {
    if (isHalting) {
        return;
    }

    isHalting = true;

    if (LOG_OPERATIONS) {
        fs.writeFileSync(
            './last-operations.log',
            operations
            //.slice(-1000)
                .map(([opN, opCode, index, args]) => {
                    const command = OP_CODES[opCode];

                    return `${Date.now()} ${opN} ${index} Cmd ${n(command.name)} ${args.join(', ')}`
                })
                .join('\n')
        );
    }

    //console.log(`Exit(0), operations compete: [${operationsComplete}]`);
    process.exit(_errorCode || errorCode);
}

function setRegister(registerIndex, value) {
    if (registerIndex === 7) {
        console.log(`!!! Set Eighth-Register to [${value}]`);
    }

    registers[registerIndex] = value;
}

function safeRun() {
    try {
        run();
    } catch(err) {
        console.error(err);
        halt(1);
    }
}

safeRun();

// setTimeout(() => {
//     saveMemoryImage();
//     console.log('Image saved');
// }, 5000);

function saveMemoryImage() {
    fs.writeFileSync('memory-image.bin', memory);
    fs.writeFileSync('state.json', JSON.stringify({
        registers,
        stack,
        index,
    }));
}

function n(str) {
    return str + ' '.repeat(4 - str.length);
}
