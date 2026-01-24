var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function now() {
    return performance.now();
}
function randInt(max) {
    return Math.floor(Math.random() * max);
}
function randomWord(maxLen) {
    var len = randInt(maxLen + 1);
    var s = '';
    for (var i = 0; i < len; i++) {
        s += Math.random() < 0.5 ? 'a' : 'b';
    }
    return s;
}
function positivePool(count, maxY, maxZ) {
    var res = [];
    for (var i = 0; i < count; i++) {
        var y = randomWord(maxY);
        var z = randomWord(maxZ);
        var X = y + y + y + 'a' + z + 'b' + z;
        res.push(Math.random() < 0.5 ? X : X + X);
    }
    return res;
}
function negativePool(count, maxLen) {
    return Array.from({ length: count }, function () { return randomWord(maxLen); });
}
function parseNaive(word) {
    var n = word.length;
    for (var Xlen = 1; Xlen <= n; Xlen++) {
        var rest = word.slice(Xlen);
        var X = word.slice(0, Xlen);
        if (rest !== '' && rest !== X)
            continue;
        var Xn = X.length;
        for (var yLen = 0; yLen * 3 + 2 <= Xn; yLen++) {
            var validY = true;
            for (var i = 0; i < yLen; i++) {
                if (X[i] !== X[i + yLen] || X[i] !== X[i + 2 * yLen]) {
                    validY = false;
                    break;
                }
            }
            if (!validY)
                continue;
            var posAfterY = 3 * yLen;
            if (posAfterY >= Xn || X[posAfterY] !== 'a')
                continue;
            var afterA = posAfterY + 1;
            var maxZLen = Math.floor((Xn - afterA - 1) / 2);
            for (var zLen = 0; zLen <= maxZLen; zLen++) {
                var bPos = afterA + zLen;
                var afterB = bPos + 1;
                if (bPos >= Xn || X[bPos] !== 'b')
                    continue;
                var validZ = true;
                for (var i = 0; i < zLen; i++) {
                    if (X[afterA + i] !== X[afterB + i]) {
                        validZ = false;
                        break;
                    }
                }
                if (!validZ)
                    continue;
                var expectedLength = 3 * yLen + 1 + 2 * zLen + 1;
                if (expectedLength !== Xn)
                    continue;
                return true;
            }
        }
    }
    return false;
}
function parseEffective(word) {
    var n = word.length;
    for (var yLen = 0; yLen * 3 + 2 <= n; yLen++) {
        var validY = true;
        for (var i = 0; i < yLen; i++) {
            if (word[i] !== word[i + yLen] || word[i] !== word[i + 2 * yLen]) {
                validY = false;
                break;
            }
        }
        if (!validY)
            continue;
        var posAfterY = 3 * yLen;
        if (posAfterY >= n || word[posAfterY] !== 'a')
            continue;
        var afterA = posAfterY + 1;
        var maxZLen = Math.floor((n - afterA - 1) / 2);
        for (var zLen = 0; zLen <= maxZLen; zLen++) {
            var bPos = afterA + zLen;
            var afterB = bPos + 1;
            if (word[bPos] !== 'b')
                continue;
            var validZ = true;
            for (var i = 0; i < zLen; i++) {
                if (word[afterA + i] !== word[afterB + i]) {
                    validZ = false;
                    break;
                }
            }
            if (!validZ)
                continue;
            var Xlen = 3 * yLen + 1 + 2 * zLen + 1;
            if (Xlen > n)
                continue;
            var rest = word.slice(Xlen);
            if (rest === '' || rest === word.slice(0, Xlen)) {
                return true;
            }
        }
    }
    return false;
}
function benchPool(words, fn) {
    var t0 = now();
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var w = words_1[_i];
        fn(w);
    }
    return now() - t0;
}
function compareOnPool(words) {
    words.forEach(parseNaive);
    words.forEach(parseEffective);
    var effective = benchPool(words, parseEffective);
    var naive = benchPool(words, parseNaive);
    return {
        size: words.length,
        effective: effective,
        naive: naive,
        ratio: naive / effective
    };
}
function comparePools() {
    var sizes = [10, 50, 100, 200, 500];
    var count = 5000;
    var results = [];
    for (var _i = 0, sizes_1 = sizes; _i < sizes_1.length; _i++) {
        var maxLen = sizes_1[_i];
        var pos = positivePool(count, maxLen, maxLen);
        var neg = negativePool(count, maxLen);
        results.push(__assign({ pool: "positive", maxLen: maxLen }, compareOnPool(pos)));
        results.push(__assign({ pool: "negative", maxLen: maxLen }, compareOnPool(neg)));
    }
    return results;
}
function fuzzTest(iterations) {
    for (var i = 0; i < iterations; i++) {
        var w = randomWord(50);
        var n = parseNaive(w);
        var e = parseEffective(w);
        if (n !== e) {
            console.error("Mismatch!", { w: w, naive: n, effective: e });
            var regexp = /^(((?:a|b)*)\2\2a((?:a|b)*)b\3)\1?$/;
            console.log(regexp.test(w));
            throw new Error("Fuzz failed");
        }
    }
    console.log("Fuzz OK:", iterations, "tests");
}
var results = comparePools();
console.table(results);
fuzzTest(100000);
