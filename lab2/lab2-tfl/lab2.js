var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
function nfa() {
    return {
        kind: "nfa",
        symbols: "bcd",
        initials: [0],
        finals: [0],
        transitions: new Map([
            ["0,b", [0]],
            ["0,c", [1]],
            ["0,d", [2]],
            ["1,b", [0]],
            ["1,c", [1]],
            ["1,d", [4]],
            ["2,b", [0, 3]],
            ["3,d", [1]],
            ["4,b", [5]],
            ["5,d", [1]]
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
var regexp = /^(b*(db*|c*(dbdc*)*|b*cb)b)*$/;
var extendedRegexp = /^((d|cb|c*(dbdc*)*)b+)*$/;
function checkRegex(kind, word) {
    return kind === "regex"
        ? regexp.test(word)
        : extendedRegexp.test(word);
}
function randomInt(max) {
    return Math.floor(Math.random() * max);
}
function generateWordRandom(alphabet, minLen, maxLen) {
    var len = minLen + randomInt(maxLen - minLen + 1);
    return Array.from({ length: len }, function () { return alphabet[randomInt(alphabet.length)]; })
        .join("");
}
function generateWordRegex(maxBlocks, maxBOutside, maxInside) {
    var blockCount = randomInt(maxBlocks) + 1;
    var resultBlocks = [];
    for (var i = 0; i < blockCount; i++) {
        var bStart = "b".repeat(randomInt(maxBOutside + 1));
        var choice = randomInt(3);
        var center = "";
        switch (choice) {
            case 0: // db*
                var bCount0 = randomInt(maxInside + 1);
                center = "d" + "b".repeat(bCount0);
                break;
            case 1: // c*(dbdc*)*
                var cPrefix = "c".repeat(randomInt(maxInside + 1));
                var innerRepeats = Array.from({ length: randomInt(3) }, function () {
                    var cTail = "c".repeat(randomInt(maxInside + 1));
                    return "dbd" + cTail;
                });
                center = cPrefix + innerRepeats.join("");
                break;
            case 2: // b*cb
                var bPrefix = "b".repeat(randomInt(maxInside + 1));
                center = bPrefix + "c" + "b";
                break;
        }
        var bEnd = "b".repeat(maxBlocks);
        resultBlocks.push(bStart + center + bEnd);
    }
    return resultBlocks.join("");
}
function step(automaton, states, symbol) {
    var next = new Set();
    for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
        var s = states_1[_i];
        var key = "".concat(s, ",").concat(symbol);
        var targets = automaton.transitions.get(key);
        if (targets) {
            for (var _a = 0, targets_1 = targets; _a < targets_1.length; _a++) {
                var t = targets_1[_a];
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
    var states = __spreadArray([], automaton.initials, true);
    for (var _i = 0, word_1 = word; _i < word_1.length; _i++) {
        var ch = word_1[_i];
        states = step(automaton, states, ch);
        if (states.length === 0)
            break;
    }
    for (var _a = 0, states_2 = states; _a < states_2.length; _a++) {
        var s = states_2[_a];
        for (var _b = 0, _c = automaton.finals; _b < _c.length; _b++) {
            var f = _c[_b];
            if (s === f)
                return true;
        }
    }
    return false;
}
function fuzzTest(iterations) {
    var missNfa = 0;
    var missDfa = 0;
    var missAfa = 0;
    var missExt = 0;
    for (var i = 0; i < iterations; i++) {
        var word = Math.random() < 0.1
            ? generateWordRegex(5, 5, 5)
            : generateWordRandom("bdc", 3, 25);
        var rRegex = checkRegex("regex", word);
        var rNfa = checkWordAutomaton(word, nfa());
        var rDfa = checkWordAutomaton(word, dfa());
        var rAfa = checkWordAutomaton(word, afa());
        var rExt = checkRegex("extregex", word);
        if (rNfa !== rRegex) {
            console.log("NFA mismatch:", word);
            missNfa++;
        }
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
