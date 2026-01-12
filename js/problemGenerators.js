import { getRandomInt, seededRandom, gcd } from './mathUtils.js';
import { TRANSLATIONS } from './translations.js';
import { LAYOUT_CONFIG } from './problemConfig.js';

export const PAGE_CAPACITY = 80;

export function generateProblemsData(type, availableTopics = [], allowedCurrencies = ['CHF'], options = {}, lang = 'de', customCapacity = PAGE_CAPACITY) {
    const data = [];
    const getCurrencyForProblem = () => {
        if (!allowedCurrencies || allowedCurrencies.length === 0) return 'CHF';
        return allowedCurrencies[getRandomInt(0, allowedCurrencies.length - 1)];
    };

    let currentLoad = 0;
    const topicsToUse = (type === 'custom') ? availableTopics : [type];
    if (topicsToUse.length === 0) return [];

    // Pre-shuffle indices for word_types if present
    const currentWordTypes = TRANSLATIONS[lang].word_types;
    const wordTypeIndices = Array.from({ length: currentWordTypes.length }, (_, i) => i);
    wordTypeIndices.sort(() => seededRandom() - 0.5);
    let wordTypeCount = 0;

    let retries = 0;
    while (currentLoad < customCapacity && retries < 50) {
        // Pick a topic
        let topic;
        if (type === 'custom') {
            topic = topicsToUse[getRandomInt(0, topicsToUse.length - 1)];
        } else {
            topic = type;
        }

        const config = LAYOUT_CONFIG[topic] || LAYOUT_CONFIG['default'];
        const w = config.weight;

        if (currentLoad + w <= customCapacity) {
            const currency = getCurrencyForProblem();
            const wordTypeIndex = topic === 'word_types' ? wordTypeIndices[wordTypeCount++ % currentWordTypes.length] : -1;
            data.push(generateProblem(topic, currency, options, wordTypeIndex, lang));
            currentLoad += w;
            retries = 0;
        } else {
            retries++;
        }
    }
    return data;
}

export function generateProblem(type, currency = 'CHF', options = {}, index = -1, lang = 'de') {
    const problem = _generateProblemInternal(type, currency, options, index, lang);
    const config = LAYOUT_CONFIG[type] || LAYOUT_CONFIG['default'];
    problem.weight = config.weight;
    problem.span = config.span;
    problem.moduleType = type;
    return problem;
}

function _generateProblemInternal(type, currency = 'CHF', options = {}, index = -1, lang = 'de') {
    let a, b, op;

    switch (type) {
        case 'add_10':
            a = getRandomInt(0, 9);
            b = getRandomInt(1, 10 - a);
            op = '+';
            break;
        case 'sub_10':
            a = getRandomInt(1, 10);
            b = getRandomInt(1, a);
            op = '-';
            break;
        case 'add_20_simple':
            a = getRandomInt(10, 22);
            b = getRandomInt(1, 23 - a);
            op = '+';
            break;
        case 'sub_20_simple':
            a = getRandomInt(11, 24);
            b = getRandomInt(1, a - 10);
            op = '-';
            break;
        case 'bonds_10':
            a = getRandomInt(0, 10);
            return { type: 'missing_addend', a: a, sum: 10, op: '+', answer: 10 - a };
        case 'rechenmauer_10':
            return generatePyramid(10);
        case 'add_20':
            a = getRandomInt(1, 23);
            b = getRandomInt(1, 24 - a);
            op = '+';
            break;
        case 'sub_20':
            a = getRandomInt(1, 24);
            b = getRandomInt(1, a);
            op = '-';
            break;
        case 'add_100_simple':
            a = getRandomInt(1, 89);
            {
                let a_ones = a % 10;
                b = getRandomInt(1, 99 - a);
                while ((b % 10) + a_ones >= 10) {
                    b = getRandomInt(1, 99 - a);
                }
            }
            op = '+';
            break;
        case 'add_100_carry':
            do {
                a = getRandomInt(10, 89);
                b = getRandomInt(1, 99 - a);
            } while ((a % 10) + (b % 10) < 10);
            op = '+';
            break;
        case 'sub_100_simple':
            a = getRandomInt(10, 99);
            {
                let max_b_ones = a % 10;
                let max_b_tens = Math.floor(a / 10);
                let b_tens = getRandomInt(0, max_b_tens);
                let b_ones = getRandomInt(0, max_b_ones);
                b = b_tens * 10 + b_ones;
                if (b === 0) b = 1;
            }
            op = '-';
            break;
        case 'sub_100_carry':
            do {
                a = getRandomInt(20, 99);
                b = getRandomInt(1, a - 1);
            } while ((a % 10) >= (b % 10));
            op = '-';
            break;
        case 'mult_2_5_10':
            b = [2, 5, 10][getRandomInt(0, 2)];
            a = getRandomInt(1, 10);
            op = '×';
            break;
        case 'mult_all':
            a = getRandomInt(1, 10);
            b = getRandomInt(1, 10);
            op = '×';
            break;
        case 'div_2_5_10':
            {
                let divisor = [2, 5, 10][getRandomInt(0, 2)];
                let result = getRandomInt(1, 10);
                a = result * divisor;
                b = divisor;
            }
            op = ':';
            break;
        case 'doubling_halving':
            {
                const isDouble = seededRandom() < 0.5;
                if (isDouble) {
                    a = getRandomInt(1, 50);
                    return { type: 'doubling_halving', subtype: 'double', val: a, answer: a * 2 };
                } else {
                    let val = getRandomInt(1, 50) * 2;
                    return { type: 'doubling_halving', subtype: 'halve', val: val, answer: val / 2 };
                }
            }
        case 'rechenmauer':
            return generatePyramid(100, 3);
        case 'rechenmauer_4':
            return generatePyramid(100, 4);
        case 'word_problems':
            const wordProblems = TRANSLATIONS[lang].word_problems;
            return { type: 'text', ...wordProblems[getRandomInt(0, wordProblems.length - 1)] };
        case 'add_1000':
            a = getRandomInt(100, 899);
            b = getRandomInt(1, 999 - a);
            op = '+';
            break;
        case 'sub_1000':
            a = getRandomInt(100, 999);
            b = getRandomInt(1, a - 1);
            op = '-';
            break;
        case 'mult_advanced':
            a = getRandomInt(11, 20);
            b = getRandomInt(2, 6);
            op = '×';
            break;
        case 'div_100':
            {
                let divisor = getRandomInt(2, 9);
                let result = getRandomInt(2, 10);
                a = result * divisor;
                b = divisor;
            }
            op = ':';
            break;
        case 'div_remainder':
            {
                let divisor = getRandomInt(2, 9);
                let result = getRandomInt(2, 10);
                let remainder = getRandomInt(1, divisor - 1);
                a = (result * divisor) + remainder;
                b = divisor;
                return { type: 'div_remainder', a, b, op: ':', answer: result, remainder };
            }
        case 'rechenmauer_100':
            return generatePyramid(200, 3);
        case 'add_written':
            a = getRandomInt(1000, 99999);
            b = getRandomInt(1000, 99999);
            return { type: 'written', a, b, op: '+', answer: a + b };
        case 'sub_written':
            a = getRandomInt(5000, 99999);
            b = getRandomInt(1000, a - 1);
            return { type: 'written', a, b, op: '-', answer: a - b };
        case 'mult_large':
            a = getRandomInt(100, 999);
            b = getRandomInt(11, 99);
            return { type: 'long_calculation', a, b, op: '×', answer: a * b };
        case 'div_long':
            {
                let divisor = getRandomInt(2, 9);
                let result = getRandomInt(100, 999);
                a = result * divisor;
                b = divisor;
                return { type: 'long_calculation', a, b, op: ':', answer: result };
            }
        case 'dec_add':
            {
                let numA = getRandomInt(100, 9999) / 100;
                let numB = getRandomInt(100, 9999) / 100;
                return { type: 'standard', a: numA, b: numB, op: '+', answer: parseFloat((numA + numB).toFixed(2)) };
            }
        case 'dec_sub':
            {
                let numA = getRandomInt(500, 9999) / 100;
                let numB = getRandomInt(100, 499) / 100;
                return { type: 'standard', a: numA, b: numB, op: '-', answer: parseFloat((numA - numB).toFixed(2)) };
            }
        case 'mult_10_100':
            {
                a = (getRandomInt(10, 9999) / 100);
                b = [10, 100, 1000][getRandomInt(0, 2)];
                let ans = Math.round((a * b) * 1000) / 1000;
                return { type: 'standard', a, b, op: '×', answer: ans };
            }
        case 'units':
            {
                const unitTypes = [
                    { from: 'm', to: 'cm', factor: 100 },
                    { from: 'km', to: 'm', factor: 1000 },
                    { from: 'kg', to: 'g', factor: 1000 },
                    { from: 'min', to: 's', factor: 60 },
                    { from: 'h', to: 'min', factor: 60 }
                ];
                const u = unitTypes[getRandomInt(0, unitTypes.length - 1)];
                let val = getRandomInt(1, 20);
                if (u.factor === 1000 && seededRandom() > 0.5) val = val / 2;
                return { type: 'unit_conv', val, from: u.from, to: u.to, answer: val * u.factor };
            }
        case 'percent_basic':
            {
                const rates = [10, 20, 25, 50, 75];
                let rate = rates[getRandomInt(0, rates.length - 1)];
                let base = getRandomInt(1, 20) * 100;
                if (rate === 25 || rate === 75) base = getRandomInt(1, 20) * 4;
                return { type: 'percent', rate, base, answer: (base * rate) / 100 };
            }
        case 'rounding':
            {
                let val = getRandomInt(1000, 99999);
                let place = [10, 100, 1000][getRandomInt(0, 2)];
                return { type: 'rounding', val, place, answer: Math.round(val / place) * place };
            }
        case 'rechendreiecke':
            return generateTriangle(24);
        case 'rechendreiecke_100':
            return generateTriangle(100);
        case 'zahlenhaus_10':
            return generateHouse(10);
        case 'zahlenhaus_20':
            return generateHouse(24);
        case 'zahlenhaus_100':
            return generateHouse(100);
        case 'rechenstrich':
            return generateRechenstrich();
        case 'money_10':
            return generateMoneyProblem(10, currency);
        case 'money_100':
            return generateMoneyProblem(100, currency);
        case 'word_types':
            return generateWordTypeProblem(index, lang);
        case 'time_reading':
            {
                const minutes = getRandomInt(0, 11) * 5;
                const hours = getRandomInt(1, 12);
                const minStr = minutes.toString().padStart(2, '0');
                const answer = `${hours}:${minStr}`;
                return { type: 'time_reading', hours, minutes, answer };
            }
        case 'time_analog_set':
            {
                const minutes = getRandomInt(0, 3) * 15;
                const hours = getRandomInt(1, 12);
                const minStr = minutes.toString().padStart(2, '0');
                return { type: 'time_analog_set', hours, minutes, digital: `${hours}:${minStr}` };
            }
        case 'time_analog_set_complex':
            {
                const minutes = getRandomInt(0, 59);
                const hours = getRandomInt(0, 23);
                const hStr = hours.toString().padStart(2, '0');
                const minStr = minutes.toString().padStart(2, '0');
                return { type: 'time_analog_set', hours, minutes, digital: `${hStr}:${minStr}`, isComplex: true };
            }
        case 'time_duration':
            {
                const startH = getRandomInt(6, 18);
                const startM = getRandomInt(0, 11) * 5;
                const duration = getRandomInt(1, 12) * 5;
                let endM = startM + duration;
                let endH = startH;
                if (endM >= 60) {
                    endH += Math.floor(endM / 60);
                    endM %= 60;
                }
                const sH = startH.toString();
                const sM = startM.toString().padStart(2, '0');
                const eH = endH.toString();
                const eM = endM.toString().padStart(2, '0');

                const qTemplate = TRANSLATIONS[lang].ui.timeReadingQuestion;
                const question = qTemplate.replace('{time}', `${sH}:${sM}`).replace('{duration}', duration);

                return {
                    type: 'time_duration',
                    q: question,
                    answer: `${eH}:${eM}`
                };
            }
        case 'visual_add_100':
            {
                const totalVis = getRandomInt(20, 100);
                const partsCount = getRandomInt(2, 3);
                const parts = [];
                let currentSum = 0;
                for (let i = 0; i < partsCount - 1; i++) {
                    const maxVal = totalVis - currentSum - (partsCount - 1 - i);
                    const valP = getRandomInt(1, maxVal);
                    parts.push(valP);
                    currentSum += valP;
                }
                parts.push(totalVis - currentSum);
                const grid = new Array(100).fill(0);
                let cursor = 0;
                parts.forEach((p, idx) => {
                    const groupId = idx + 1;
                    for (let k = 0; k < p; k++) {
                        if (cursor < 100) {
                            grid[cursor] = groupId;
                            cursor++;
                        }
                    }
                });
                return { type: 'visual_add_100', grid, parts, total: totalVis };
            }
        case 'frac_simplify':
            {
                let num = getRandomInt(1, 10);
                let den = getRandomInt(num + 1, 20);
                let factor = getRandomInt(2, 6);
                let a = num * factor;
                let b = den * factor;
                const common = gcd(a, b);
                const simpleNum = a / common;
                const simpleDen = b / common;
                return { type: 'fraction_simplify', num: a, den: b, answer: `${simpleNum}/${simpleDen}` };
            }
        case 'frac_add':
            {
                let den = getRandomInt(2, 12);
                let numA = getRandomInt(1, den - 1);
                let numB = getRandomInt(1, den - numA);
                return { type: 'fraction_op', numA, denA: den, numB, denB: den, op: '+', answer: `${numA + numB}/${den}` };
            }
        case 'married_100':
            return generateMarriedNumbers(options.marriedMultiplesOf10 || false);
    }

    const res = { a, b, op, type: 'standard' };
    if (op === '+') res.answer = a + b;
    else if (op === '-') res.answer = a - b;
    else if (op === '×') res.answer = a * b;
    else if (op === ':') res.answer = a / b;
    return res;
}

export function generateMarriedNumbers(onlyMultiplesOf10) {
    let a;
    if (onlyMultiplesOf10) {
        a = getRandomInt(0, 10) * 10;
    } else {
        // Pure random 1-99 (approx 10% chance of multiple of 10)
        a = getRandomInt(1, 99);
    }
    return { type: 'married_numbers', a: a, sum: 100, op: '+', answer: 100 - a };
}

export function generatePyramid(maxTop, levels = 3) {
    let values = [];
    let top;
    do {
        values = [];
        let baseCount = levels;
        // Heuristic to avoid too large numbers (start small)
        let maxBase = Math.max(1, Math.floor(maxTop / (2 ** (levels - 1))));

        for (let i = 0; i < baseCount; i++) {
            values.push(getRandomInt(1, maxBase));
        }

        let currentLayerStart = 0;
        let currentLayerLength = baseCount;

        for (let l = 1; l < levels; l++) {
            for (let i = 0; i < currentLayerLength - 1; i++) {
                let val = values[currentLayerStart + i] + values[currentLayerStart + i + 1];
                values.push(val);
            }
            currentLayerStart += currentLayerLength;
            currentLayerLength--;
        }
        top = values[values.length - 1];
    } while (top > maxTop);

    const totalItems = values.length;
    const relations = getPyramidRelations(levels);

    // Determine how many items to hide (e.g. 40-60%)
    const minHidden = Math.floor(totalItems * 0.4);
    const maxHidden = Math.floor(totalItems * 0.6);
    // Target hidden count
    let targetHidden = getRandomInt(minHidden, maxHidden);
    if (levels === 3) targetHidden = 3; // For 3 levels (6 items), hide 3 is standard good puzzle
    if (levels === 4) targetHidden = 6; // For 4 levels (10 items), hide 6

    let mask;
    let solvable = false;
    let attempts = 0;

    while (!solvable && attempts < 200) {
        mask = new Array(totalItems).fill(false);
        let hiddenCount = 0;
        let currentTarget = targetHidden;

        // If we fail many times, try hiding fewer items
        if (attempts > 50) currentTarget = Math.max(1, targetHidden - 1);
        if (attempts > 100) currentTarget = Math.max(1, targetHidden - 2);

        while (hiddenCount < currentTarget) {
            let idx = getRandomInt(0, totalItems - 1);
            if (!mask[idx]) {
                mask[idx] = true;
                hiddenCount++;
            }
        }

        if (checkPyramidSolvable(relations, totalItems, mask)) {
            solvable = true;
        } else {
            attempts++;
        }
    }

    // Fallback: if not found, show everything (should rarely happen)
    if (!solvable) {
        mask.fill(false);
    }

    return { type: 'pyramid', values, mask, levels };
}

function getPyramidRelations(levels) {
    const relations = [];
    let currentLayerStart = 0;
    let currentLayerLength = levels;

    // A pyramid with 'levels' has levels-1 layers of relationships
    for (let l = 0; l < levels - 1; l++) {
        for (let i = 0; i < currentLayerLength - 1; i++) {
            // Relation: Parent = Left + Right
            // Indices based on flat array construction order: Base layer, then next, etc.
            // Left child index: currentLayerStart + i
            // Right child index: currentLayerStart + i + 1
            // Parent index: Next layer start + i
            // Next layer start is currentLayerStart + currentLayerLength

            const left = currentLayerStart + i;
            const right = currentLayerStart + i + 1;
            const parent = currentLayerStart + currentLayerLength + i;

            relations.push([parent, left, right]);
        }
        currentLayerStart += currentLayerLength;
        currentLayerLength--;
    }
    return relations;
}

function checkPyramidSolvable(relations, totalItems, mask) {
    // mask[i] = true means HIDDEN (unknown)
    // known[i] = true means VISIBLE (known)
    // We simulate solving.

    // workingKnown state: true if number is known/derived
    const known = mask.map(m => !m);

    let progress = true;
    while (progress) {
        progress = false;
        for (const [p, l, r] of relations) {
            // Rule: If 2 of 3 (Parent, Left, Right) are known, the 3rd is determined.

            const pKnown = known[p];
            const lKnown = known[l];
            const rKnown = known[r];

            if (!pKnown && lKnown && rKnown) {
                known[p] = true;
                progress = true;
            } else if (pKnown && !lKnown && rKnown) {
                known[l] = true;
                progress = true;
            } else if (pKnown && lKnown && !rKnown) {
                known[r] = true;
                progress = true;
            }
        }
    }

    // Solvable if all fields are eventually known
    return known.every(k => k);
}

export function generateTriangle(maxSum) {
    let i1, i2, i3, o1, o2, o3;
    let attempts = 0;
    do {
        const maxInner = Math.floor(maxSum / 1.5);
        i1 = getRandomInt(1, maxInner);
        i2 = getRandomInt(1, maxInner);
        i3 = getRandomInt(1, maxInner);
        o1 = i1 + i2;
        o2 = i2 + i3;
        o3 = i3 + i1;
        attempts++;
    } while ((o1 > maxSum || o2 > maxSum || o3 > maxSum) && attempts < 100);
    const maskMode = seededRandom() < 0.5 ? 'inner' : 'outer';
    return { type: 'triangle', inner: [i1, i2, i3], outer: [o1, o2, o3], maskMode };
}

export function generateHouse(roofNum) {
    const floorsCount = 3;
    const floors = [];
    const usedValues = new Set();
    for (let i = 0; i < floorsCount; i++) {
        let sideA;
        let attempts = 0;
        do {
            sideA = getRandomInt(0, roofNum);
            attempts++;
        } while (usedValues.has(sideA) && attempts < 20);
        usedValues.add(sideA);
        const sideB = roofNum - sideA;
        const hiddenSide = seededRandom() < 0.5 ? 0 : 1;
        floors.push({ a: sideA, b: sideB, hiddenSide });
    }
    return { type: 'house', roof: roofNum, floors };
}

export function generateRechenstrich() {
    const a = getRandomInt(10, 60);
    const b = getRandomInt(11, 39);
    const sum = a + b;
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;
    return { type: 'rechenstrich', start: a, jump1: tens, mid: a + tens, jump2: ones, sum: sum };
}

export function generateMoneyProblem(maxVal, currency = 'CHF') {
    let coins, notes;
    let step;

    if (currency === 'EUR') {
        // Euro: 1, 2, 5, 10, 20, 50 cents, 1, 2 Euro
        coins = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2];
        notes = [5, 10, 20, 50, 100, 200, 500].filter(n => n <= maxVal);
        step = 0.01;
    } else {
        // CHF: 5, 10, 20, 50 cents, 1, 2, 5 Fr
        coins = [0.05, 0.10, 0.20, 0.50, 1, 2, 5];
        notes = [10, 20, 50, 100, 200, 1000].filter(n => n <= maxVal);
        step = 0.05;
    }

    let target;
    if (maxVal <= 10) {
        // Small amounts: mostly coins
        target = (getRandomInt(10, 200) * step);
    } else {
        target = (getRandomInt(10, maxVal) * 1.0);
    }

    // Round to step
    const inv = 1 / step;
    target = Math.round(target * inv) / inv;

    let remaining = target;
    const items = [];
    // Sort descending for greedy approach
    const available = [...notes, ...coins].sort((a, b) => b - a);

    // Greedy-ish filling
    for (const val of available) {
        // Randomly skip some larger denominations to force variety
        if (seededRandom() < 0.2) continue;

        while (remaining >= val - (step / 10) && items.length < 12) {
            items.push(val);
            remaining -= val;
            // Round remaining to avoid float precision issues
            remaining = Math.round(remaining * inv) / inv;
        }
    }

    // Shuffle items
    items.sort(() => seededRandom() - 0.5);

    return { type: 'money', items: items, answer: target, currency: currency };
}

export function generateWordTypeProblem(index = -1, lang = 'de') {
    const currentWordTypes = TRANSLATIONS[lang].word_types;
    if (index >= 0) {
        // Deterministic pick based on index (already shuffled if provided by generateProblemsData)
        return { type: 'word_types', sentence: currentWordTypes[index % currentWordTypes.length] };
    }
    const idx = getRandomInt(0, currentWordTypes.length - 1);
    return { type: 'word_types', sentence: currentWordTypes[idx] };
}
