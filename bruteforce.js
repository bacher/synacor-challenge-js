const NUMS = [2, 3, 5, 7, 9];

for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 5; b++) {
        if (b === a) continue;

        for (let c = 0; c < 5; c++) {
            if (c === b || c === a) continue;

            for (let d = 0; d < 5; d++) {
                if (d === c || d === b || d === a) continue;

                for (let e = 0; e < 5; e++) {
                    if (e === d || e === c || e === b || e === a) continue;

                    if (Math.pow(NUMS[a], 3) + NUMS[b] * Math.pow(NUMS[c], 2) + NUMS[d] - NUMS[e] === 399) {
                        console.log(NUMS[a], NUMS[b], NUMS[c], NUMS[d], NUMS[e]);
                    }
                }
            }
        }
    }
}
