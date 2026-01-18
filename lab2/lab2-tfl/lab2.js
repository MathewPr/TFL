"use strict";
function nfa() {
    return {
        kind: "nfa",
        symbols: "bcd",
        initials: [2],
        finals: [2],
        transitions: new Map([
            ["0,b", [0, 2]],
            ["1,b", [1, 2, 5]],
            ["1,c", [4, 6]],
            ["1,d", [0, 7]],
            ["2,b", [1, 2, 5]],
            ["2,c", [4, 6]],
            ["2,d", [0, 7]],
            ["3,b", [2]],
            ["4,b", [2]],
            ["4,c", [4]],
            ["4,d", [7]],
            ["5,b", [5]],
            ["5,c", [6]],
            ["6,b", [3]],
            ["7,b", [8]],
            ["8,d", [4]],
        ]),
    };
}
function dfa() {
    return {
        kind: "dfa",
        symbols: "bcd",
        initials: [0],
        finals: [0, 3],
        transitions: new Map([
            ["0,b", [0]],
            ["0,c", [1]],
            ["0,d", [2]],
            ["1,b", [0]],
            ["1,c", [1]],
            ["1,d", [5]],
            ["2,b", [3]],
            ["3,b", [0]],
            ["3,c", [1]],
            ["3,d", [4]],
            ["4,b", [3]],
            ["4,c", [1]],
            ["4,d", [5]],
            ["5,b", [6]],
            ["6,d", [1]],
        ]),
    };
}
function afa() {
    return {
        kind: "afa", // first invariant ending with c and d
        prefix: {
            kind: "nfa",
            symbols: "bcd",
            initials: [0],
            finals: [0, 1],
            transitions: new Map([
                ["0,b", [1]],
                ["0,c", [2]],
                ["0,d", [2]],
                ["1,b", [1]],
                ["1,c", [2]],
                ["1,d", [2]],
                ["2,c", [2]],
                ["2,d", [2]],
                ["2,b", [0]],
            ]),
        },
        main: {
            kind: "afa", // second invariant contains cdc
            prefix: {
                kind: "nfa",
                symbols: "bcd",
                initials: [0],
                finals: [0, 1, 2],
                transitions: new Map([
                    ["0,b", [0]],
                    ["0,d", [0]],
                    ["0,c", [1]],
                    ["1,b", [0]],
                    ["1,c", [1]],
                    ["1,d", [2]],
                    ["2,b", [0]],
                    ["2,d", [0]],
                    ["2,c", [3]],
                    ["3,b", [3]],
                    ["3,c", [3]],
                    ["3,d", [3]],
                ]),
            },
            main: nfa()
        },
    };
}
const regexp = /^(b*(db*|c*(dbdc*)*|b*cb)b)*$/;
const extendedRegexp = /^((b*cbb)|(b*db+)|b*(c*(dbdc*)*)b)*$/;
function checkRegex(kind, word) {
    return kind === "regex"
        ? regexp.test(word)
        : extendedRegexp.test(word);
}
function randomInt(max) {
    return Math.floor(Math.random() * max);
}
function generateWordRandom(alphabet, minLen, maxLen) {
    const len = minLen + randomInt(maxLen - minLen + 1);
    return Array.from({ length: len }, () => alphabet[randomInt(alphabet.length)])
        .join("");
}
function generateWordRegex(maxBlocks, maxBOutside, maxInside) {
    const blockCount = randomInt(maxBlocks) + 1;
    const resultBlocks = [];
    for (let i = 0; i < blockCount; i++) {
        const bStart = "b".repeat(randomInt(maxBOutside + 1));
        const choice = randomInt(3);
        let center = "";
        switch (choice) {
            case 0: // db*
                const bCount0 = randomInt(maxInside + 1);
                center = "d" + "b".repeat(bCount0);
                break;
            case 1: // c*(dbdc*)*
                const cPrefix = "c".repeat(randomInt(maxInside + 1));
                const innerRepeats = Array.from({ length: randomInt(3) }, () => {
                    const b1 = "b".repeat(randomInt(maxInside + 1));
                    const b2 = "b".repeat(randomInt(maxInside + 1));
                    const c = "c".repeat(randomInt(maxInside + 1));
                    return "d" + b1 + "d" + b2 + c;
                });
                center = cPrefix + innerRepeats.join("");
                break;
            case 2: // b*cb
                const bPrefix = "b".repeat(randomInt(maxInside + 1));
                center = bPrefix + "c" + "b";
                break;
        }
        const bEnd = "b".repeat(maxBlocks);
        resultBlocks.push(bStart + center + bEnd);
    }
    return resultBlocks.join("");
}
function step(automaton, states, symbol) {
    const next = new Set();
    for (const s of states) {
        const key = `${s},${symbol}`;
        const targets = automaton.transitions.get(key);
        if (targets) {
            for (const t of targets) {
                next.add(t);
            }
        }
    }
    return Array.from(next);
}
function checkWordAutomaton(word, automaton) {
    if (automaton.kind === "afa") {
        return (checkWordAutomaton(word, automaton.prefix) &&
            checkWordAutomaton(word, automaton.main));
    }
    let states = [...automaton.initials];
    for (const ch of word) {
        states = step(automaton, states, ch);
        if (states.length === 0)
            break;
    }
    for (const s of states) {
        for (const f of automaton.finals) {
            if (s === f)
                return true;
        }
    }
    return false;
}
function fuzzTest(iterations) {
    let missNfa = 0;
    let missDfa = 0;
    let missAfa = 0;
    let missExt = 0;
    for (let i = 0; i < iterations; i++) {
        const word = Math.random() < 0.1
            ? generateWordRegex(5, 5, 5)
            : generateWordRandom("bdc", 3, 25);
        const rRegex = checkRegex("regex", word);
        const rNfa = checkWordAutomaton(word, nfa());
        const rDfa = checkWordAutomaton(word, dfa());
        const rAfa = checkWordAutomaton(word, afa());
        const rExt = checkRegex("extregex", word);
        if (rNfa !== rRegex) {
            console.log("NFA mismatch:", word);
            missNfa++;
        }
        console.log(i);
        console.log(rDfa, "-", rRegex, "-", word);
        if (rDfa !== rRegex) {
            console.log("DFA mismatch:", word);
            missDfa++;
        }
        if (rAfa !== rRegex) {
            console.log("AFA mismatch:", word);
            missAfa++;
        }
        if (rExt !== rRegex) {
            console.log("ExtRegex mismatch:", word);
            missExt++;
        }
    }
    if (missNfa + missDfa + missAfa + missExt === 0) {
        console.log("fuzz: passed");
    }
    else {
        missNfa && console.log("MissNfa:", missNfa);
        missDfa && console.log("MissDfa:", missDfa);
        missAfa && console.log("MissAfa:", missAfa);
        missExt && console.log("MissExtRegex:", missExt);
    }
}
function main() {
    fuzzTest(300);
}
main();
