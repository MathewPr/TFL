function now(): number {
    return performance.now();
}

function randInt(max: number): number {
    return Math.floor(Math.random() * max);
}

function randomWord(maxLen: number): string {
    const len = randInt(maxLen + 1);
    let s = '';
    for (let i = 0; i < len; i++) {
        s += Math.random() < 0.5 ? 'a' : 'b';
    }
    return s;
}

function positivePool(count: number, maxY: number, maxZ: number): string[] {
    const res: string[] = [];
    for (let i = 0; i < count; i++) {
        const y = randomWord(maxY);
        const z = randomWord(maxZ);
        const X = y + y + y + 'a' + z + 'b' + z;
        res.push(Math.random() < 0.5 ? X : X + X);
    }
    return res;
}

function negativePool(count: number, maxLen: number): string[] {
    return Array.from({ length: count }, () => randomWord(maxLen));
}

function parseNaive(word: string): boolean {
    const n = word.length;

    for (let Xlen = 1; Xlen <= n; Xlen++) {
        const rest = word.slice(Xlen);
        const X = word.slice(0, Xlen);

        if (rest !== '' && rest !== X) continue;

        const Xn = X.length;

        for (let yLen = 0; yLen * 3 + 2 <= Xn; yLen++) {
            let validY = true;

            for (let i = 0; i < yLen; i++) {
                if (X[i] !== X[i + yLen] || X[i] !== X[i + 2 * yLen]) {
                    validY = false;
                    break;
                }
            }
            if (!validY) continue;

            const posAfterY = 3 * yLen;

            if (posAfterY >= Xn || X[posAfterY] !== 'a') continue;
            const afterA = posAfterY + 1;

            const maxZLen = Math.floor((Xn - afterA - 1) / 2);
            for (let zLen = 0; zLen <= maxZLen; zLen++) {
                const bPos = afterA + zLen;
                const afterB = bPos + 1;

                if (bPos >= Xn || X[bPos] !== 'b') continue;

                let validZ = true;
                for (let i = 0; i < zLen; i++) {
                    if (X[afterA + i] !== X[afterB + i]) {
                        validZ = false;
                        break;
                    }
                }
                if (!validZ) continue;

                const expectedLength = 3 * yLen + 1 + 2 * zLen + 1;
                if (expectedLength !== Xn) continue;

                return true;
            }
        }
    }

    return false;
}

function parseEffective(word: string): boolean {
    const n = word.length;

    for (let yLen = 0; yLen * 3 + 2 <= n; yLen++) {
        let validY = true;
        for (let i = 0; i < yLen; i++) {
            if (word[i] !== word[i + yLen] || word[i] !== word[i + 2 * yLen]) {
                validY = false;
                break;
            }
        }
        if (!validY) continue;

        const posAfterY = 3 * yLen;
        if (posAfterY >= n || word[posAfterY] !== 'a') continue;

        const afterA = posAfterY + 1;

        const maxZLen = Math.floor((n - afterA - 1) / 2);
        for (let zLen = 0; zLen <= maxZLen; zLen++) {
            const bPos = afterA + zLen;
            const afterB = bPos + 1;
            if (word[bPos] !== 'b') continue;

            let validZ = true;
            for (let i = 0; i < zLen; i++) {
                if (word[afterA + i] !== word[afterB + i]) {
                    validZ = false;
                    break;
                }
            }
            if (!validZ) continue;

            const Xlen = 3 * yLen + 1 + 2 * zLen + 1;
            if (Xlen > n) continue;

            const rest = word.slice(Xlen);
            if (rest === '' || rest === word.slice(0, Xlen)) {
                return true;
            }
        }
    }

    return false;
}

function benchPool(
    words: string[],
    fn: (w: string) => boolean
): number {
    const t0 = now();
    for (const w of words) fn(w);
    return now() - t0;
}


function compareOnPool(words: string[]) {
    words.forEach(parseNaive);
    words.forEach(parseEffective);

    const effective = benchPool(words, parseEffective);
    const naive = benchPool(words, parseNaive);

    return {
        size: words.length,
        effective,
        naive,
        ratio: naive / effective
    };
}

function comparePools() {
    const sizes = [10, 50, 100, 200, 500];
    const count = 5_000;

    const results = [];

    for (const maxLen of sizes) {
        const pos = positivePool(count, maxLen, maxLen);
        const neg = negativePool(count, maxLen);

        results.push({
            pool: "positive",
            maxLen,
            ...compareOnPool(pos)
        });

        results.push({
            pool: "negative",
            maxLen,
            ...compareOnPool(neg)
        });
    }

    return results;
}


function fuzzTest(iterations: number): void {
    for (let i = 0; i < iterations; i++) {
        const w = randomWord(50);
        const n = parseNaive(w);
        const e = parseEffective(w);

        if (n !== e) {
            console.error("Mismatch!", { w, naive: n, effective: e });
            const regexp = /^(((?:a|b)*)\2\2a((?:a|b)*)b\3)\1?$/;
            console.log(regexp.test(w))
            throw new Error("Fuzz failed");
        }
    }
    console.log("Fuzz OK:", iterations, "tests");
}


const results = comparePools();
console.table(results);
fuzzTest(100_000);
