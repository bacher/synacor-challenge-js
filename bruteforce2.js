const childProcess = require('child_process');

const badResult = 'Estimated time to completion: 1 billion years.';

const part = 3;

const NUMBER_BOUND = 32768;
const NUMBER_PART  = NUMBER_BOUND / 4;

const start = NUMBER_PART * part;
const to    = NUMBER_PART * part + NUMBER_PART;

for (let i = start; i < to; i++) {
    if (i === 0) continue;

    const res = childProcess.spawnSync('node', ['main2.js', String(i)]);

    const output = res.stdout.toString('utf-8').slice(-100);

    if (!output.includes(badResult)) {
        console.log('SUCCESS', i);
        return;
    }

    if (i % 1000 === 0) {
        console.log('I:', i);
    }
}

