// Seeded Random Number Generator (Mulberry32)
export function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export let globalSeed = Math.floor(Math.random() * 0xFFFFFFFF);
export let seededRandom = mulberry32(globalSeed);

export function setSeed(seed) {
    globalSeed = seed;
    seededRandom = mulberry32(globalSeed);
}

export function getRandomInt(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
}

export function gcd(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}
