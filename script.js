// Seeded Random Number Generator (Mulberry32)
let globalSeed = Math.floor(Math.random() * 0xFFFFFFFF);
let seededRandom = mulberry32(globalSeed);

function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function setSeed(seed) {
    globalSeed = seed;
    seededRandom = mulberry32(globalSeed);
}

const mascots = ['🦊', '🦉', '🦁', '🐼', '🐨', '🐯', '🦄', '🦖'];

const GRADE_TOPICS = {
    '1': [
        { value: 'add_10', text: 'Addition bis 10' },
        { value: 'sub_10', text: 'Subtraktion bis 10' },
        { value: 'add_20_simple', text: 'Addition bis 20 (ohne Zehnerübergang)' },
        { value: 'sub_20_simple', text: 'Subtraktion bis 20 (ohne Zehnerübergang)' },
        { value: 'bonds_10', text: '❤️ Verliebte Zahlen (bis 10)' },
        { value: 'rechenmauer_10', text: 'Kleine Rechenmauern (bis 10)' },

    ],
    '2': [
        { value: 'add_20', text: 'Addition bis 20 (mit Zehnerübergang)' },
        { value: 'sub_20', text: 'Subtraktion bis 20 (mit Zehnerübergang)' },
        { value: 'add_100_simple', text: 'Addition bis 100 (ohne Zehnerübergang)' },
        { value: 'add_100_carry', text: 'Addition bis 100 (mit Zehnerübergang)' },
        { value: 'sub_100_simple', text: 'Subtraktion bis 100 (ohne Zehnerübergang)' },
        { value: 'sub_100_carry', text: 'Subtraktion bis 100 (mit Zehnerübergang)' },
        { value: 'mult_2_5_10', text: 'Kleines 1x1 (2er, 5er, 10er)' },
        { value: 'mult_all', text: 'Kleines 1x1 (Gemischt)' },
        { value: 'div_2_5_10', text: 'Geteilt (2er, 5er, 10er)' },
        { value: 'rechenmauer', text: 'Rechenmauern (3 Ebenen)' },
        { value: 'rechenmauer_4', text: 'Rechenmauern (4 Ebenen)' },
        { value: 'doubling_halving', text: 'Halbieren und Verdoppeln' },
        { value: 'zahlenhaus_20', text: 'Zahlenhaus (bis 20)' },
        { value: 'word_problems', text: 'Sachrechnen (Textaufgaben)' },

        { value: 'time_reading', text: 'Uhrzeit lesen' },
        { value: 'visual_add_100', text: 'Hunderterfeld: Addition' },
        { value: 'rechendreiecke', text: 'Rechendreiecke (bis 20)' },
        { value: 'rechenstrich', text: 'Rechenstrich (Addition)' },
        { value: 'married_100', text: '💍 Verheiratete Zahlen (bis 100)' }
    ],
    '3': [
        { value: 'add_1000', text: 'Addition bis 1000' },
        { value: 'sub_1000', text: 'Subtraktion bis 1000' },
        { value: 'mult_advanced', text: 'Erweitertes 1x1 (bis 20)' }, // Or large mult placeholders
        { value: 'div_100', text: 'Division (bis 100 ohne Rest)' },
        { value: 'div_remainder', text: 'Division (mit Rest - Basis)' },
        { value: 'rechenmauer_100', text: 'Grosse Rechenmauern (bis 100)' },

        { value: 'time_duration', text: 'Zeitspannen' },
        { value: 'rechendreiecke_100', text: 'Rechendreiecke (bis 100)' },
        { value: 'zahlenhaus_100', text: 'Zahlenhaus (bis 100)' }
    ],
    '4': [
        { value: 'add_written', text: 'Schriftliche Addition (bis 1 Mio)' },
        { value: 'sub_written', text: 'Schriftliche Subtraktion (bis 1 Mio)' },
        { value: 'mult_large', text: 'Schriftliche Multiplikation' },
        { value: 'div_long', text: 'Schriftliche Division' },
        { value: 'rounding', text: 'Runden (10er, 100er, 1000er)' },

    ],
    '5': [
        { value: 'dec_add', text: 'Dezimalzahlen: Addition' },
        { value: 'dec_sub', text: 'Dezimalzahlen: Subtraktion' },
        { value: 'mult_10_100', text: 'Malnehmen mit 10/100/1000' },
        { value: 'units', text: 'Einheiten umrechnen (m, kg, s)' },

    ],
    '6': [
        { value: 'frac_simplify', text: 'Brüche: Kürzen/Erweitern' },
        { value: 'frac_add', text: 'Brüche: Addition' },
        { value: 'percent_basic', text: 'Prozentrechnung (Basis)' },

    ]
};



function updateTopicSelectorNodes(topics) {
    const topicSelector = document.getElementById('topicSelector');
    topicSelector.innerHTML = '';
    topics.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.value;
        opt.textContent = t.text;
        topicSelector.appendChild(opt);
    });

    // Add Custom Option
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = '🛠️ Individuelle Aufgaben';
    topicSelector.appendChild(customOpt);
}

function updateCustomCheckboxes(topics) {
    const container = document.getElementById('checkboxContainer');
    container.innerHTML = '';

    // Use all topics except custom itself (which shouldn't be in topics anyway)
    topics.forEach(t => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = t.value;
        cb.id = 'cb_' + t.value;
        cb.checked = true; // Default all checked? Or none? Let's say all checked so it works immediately.
        cb.style.marginRight = '8px';
        cb.style.width = '18px';
        cb.style.height = '18px';
        cb.onchange = generateSheet;

        const label = document.createElement('label');
        label.htmlFor = 'cb_' + t.value;
        label.textContent = t.text;
        label.style.cursor = 'pointer';

        div.appendChild(cb);
        div.appendChild(label);
        container.appendChild(div);
    });
}

function updateTopicSelector() {
    const grade = document.getElementById('gradeSelector').value;
    const topicSelector = document.getElementById('topicSelector');
    const topics = GRADE_TOPICS[grade];

    updateTopicSelectorNodes(topics);
    updateCustomCheckboxes(topics);

    // Set the selected value to the first topic
    if (topics.length > 0) {
        topicSelector.value = topics[0].value;
    }

    // Toggle Custom Options Visibility based on selection change
    topicSelector.onchange = function () {
        const customDiv = document.getElementById('customOptions');
        const marriedDiv = document.getElementById('marriedOptions');

        customDiv.style.display = (topicSelector.value === 'custom') ? 'flex' : 'none';
        marriedDiv.style.display = (topicSelector.value === 'married_100') ? 'flex' : 'none';

        generateSheet();
    };

    // Initial selection visibility sync
    const customDiv = document.getElementById('customOptions');
    const marriedDiv = document.getElementById('marriedOptions');
    if (customDiv) customDiv.style.display = (topicSelector.value === 'custom') ? 'flex' : 'none';
    if (marriedDiv) marriedDiv.style.display = (topicSelector.value === 'married_100') ? 'flex' : 'none';
}


function generateProblemsData(type, count) {
    const data = [];
    let availableTopics = [];

    if (type === 'custom') {
        // Read checkboxes
        const checkboxes = document.querySelectorAll('#checkboxContainer input[type="checkbox"]:checked');
        checkboxes.forEach(cb => availableTopics.push(cb.value));

        if (availableTopics.length === 0) {
            // Fallback if nothing selected
            return [];
        }
    }


    if (type === 'custom') {
        // Advanced "Full Space" Logic for Custom
        // 1. Define Weights (Approximate height units. Page capacity ~= 20-22)
        const WEIGHTS = {
            'default': 1,
            'rechenmauer_10': 2.2, // Increased safety
            'rechenmauer_100': 2.5,
            'rechenmauer': 2.5,
            'rechenmauer_4': 3.5, // 4-layers are tall
            'time_reading': 2.5,
            'word_problems': 2.5,
            'visual_add_100': 4.0, // Large grid
            // Grade 3/4
            'add_written': 1.8,
            'sub_written': 1.8,
            'mult_large': 2.5, // Vertical written multiplication
            'div_long': 2.0,   // Long division
            'rounding': 1.2,
            // Grade 5/6
            'dec_add': 1.8,
            'dec_sub': 1.8,
            'units': 1.5,
            'frac_add': 2.0,     // Fractions are taller
            'frac_simplify': 1.8,
            'percent_basic': 1.5,
            'rechendreiecke': 1.9, // 15 / 8 ~= 1.875, so 1.9 ensures max 7-8
            'zahlenhaus_10': 3.75,
            'zahlenhaus_20': 3.75,
            'zahlenhaus_100': 3.75,
            'married_100': 1.0,
            'rechenstrich': 2.5
        };

        const PAGE_CAPACITY = 15; // Reduced to be safe for printing
        let currentLoad = 0;

        // 1. Ensure at least one of each selected type
        // Shuffle available topics first to avoid order bias in the 'guaranteed' slots if quota is tight
        availableTopics.sort(() => seededRandom() - 0.5);

        availableTopics.forEach(topic => {
            if (currentLoad < PAGE_CAPACITY) {
                // Determine weight first to check safety? 
                // We prioritize "at least one" so we allow a single item even if it overflows slightly 
                // BUT only if we aren't already super full. 
                // Actually, let's just push it if we are under capacity.

                let w = 1;
                if (WEIGHTS[topic]) w = WEIGHTS[topic];
                else if (topic.includes('rechenmauer')) w = 2.2;
                else if (topic.includes('written')) w = 1.8;
                else if (topic.includes('rechendreiecke')) w = 1.9;
                else if (topic.includes('zahlenhaus')) w = 3.75;

                data.push(generateProblem(topic));
                currentLoad += w;
            }
        });

        // 2. Fill the rest of the space randomly
        // Try to fit items until we are full. If a large item doesn't fit, try others.
        let retries = 0;
        while (currentLoad < PAGE_CAPACITY && retries < 15) {
            const topic = availableTopics[getRandomInt(0, availableTopics.length - 1)];
            let w = 1;
            if (WEIGHTS[topic]) w = WEIGHTS[topic];
            else if (topic.includes('rechenmauer')) w = 2.2;
            else if (topic.includes('written')) w = 1.8;

            if (currentLoad + w <= PAGE_CAPACITY) {
                data.push(generateProblem(topic));
                currentLoad += w;
                retries = 0; // Reset retries on success
            } else {
                retries++; // Try picking another topic
            }
        }


    } else {
        for (let i = 0; i < count; i++) {
            data.push(generateProblem(type));
        }
    }
    return data;
}

// ... (rest of logic)

function generateSheet(keepSeed = false) {
    if (!keepSeed) {
        setSeed(Math.floor(Math.random() * 0xFFFFFFFF));
    } else {
        // Reset generator with current seed to ensure same sequence if re-rendering same state
        setSeed(globalSeed);
    }

    const selector = document.getElementById('topicSelector');
    const type = selector.value;
    currentTitle = selector.options[selector.selectedIndex].text;

    // 1. Determine Count per Sheet
    let numProblems = 20;

    // Heuristic for count

    // Specific types...
    if (type === 'word_problems') numProblems = 8;
    else if (type === 'rechenmauer_4') numProblems = 8;
    else if (type.includes('rechenmauer')) numProblems = 10;
    else if (['mult_large', 'div_long'].includes(type)) numProblems = 8;
    else if (type === 'time_reading') numProblems = 8; // Clocks need space
    else if (type === 'visual_add_100') numProblems = 6; // 10x10 grids are large
    else if (type === 'rounding') numProblems = 16;
    else if (type.includes('rechendreiecke')) numProblems = 8;
    else if (['add_written', 'sub_written'].includes(type)) numProblems = 12;
    else if (type === 'rechenstrich') numProblems = 6;
    else if (type.includes('zahlenhaus')) numProblems = 4;

    // 2. Determine Page Count
    const pageCountInput = document.getElementById('pageCount');
    let pageCount = parseInt(pageCountInput.value);
    if (isNaN(pageCount) || pageCount < 1) pageCount = 1;
    if (pageCount > 50) pageCount = 50;

    // 3. Generate Data for ALL pages
    currentSheetsData = [];
    for (let i = 0; i < pageCount; i++) {
        currentSheetsData.push(generateProblemsData(type, numProblems));
    }

    // 4. Render
    renderCurrentState();

    // 5. Update URL
    updateURLState();
}

function updateURLState() {
    const params = new URLSearchParams();

    // Grade
    const grade = document.getElementById('gradeSelector').value;
    params.set('grade', grade);

    // Topic
    const topic = document.getElementById('topicSelector').value;
    params.set('topic', topic);

    // Page Count
    const count = document.getElementById('pageCount').value;
    params.set('count', count);

    // Options
    const showSolutions = document.getElementById('solutionToggle').checked;
    if (showSolutions) params.set('solutions', '1');

    const marriedMultiples = document.getElementById('marriedMultiplesOf10').checked;
    if (marriedMultiples) params.set('marriedM', '1');

    if (document.getElementById('hideQR').checked) params.set('hideQR', '1');
    if (document.getElementById('hideLogo').checked) params.set('hideLogo', '1');
    if (globalSeed) params.set('seed', globalSeed.toString());

    // Custom params
    if (topic === 'custom') {
        const checkboxes = document.querySelectorAll('#checkboxContainer input[type="checkbox"]:checked');
        const values = Array.from(checkboxes).map(cb => cb.value);
        if (values.length > 0) {
            params.set('custom', values.join(','));
        }
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    // Also update QR Code on existing sheets
    renderQRCode(window.location.href);
}

function getRandomInt(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function generateProblem(type) {
    let a, b, op;

    switch (type) {
        // --- GRADE 1 ---
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
        case 'add_20_simple': // No crossing 10, e.g. 12+3
            a = getRandomInt(10, 18); // Start at 10 to ensure teen number
            b = getRandomInt(1, 19 - a);
            op = '+';
            break;
        case 'sub_20_simple': // No crossing 10, e.g. 15-3
            a = getRandomInt(11, 19);
            b = getRandomInt(1, a - 10); // Ensure result remains >= 10
            op = '-';
            break;
        case 'bonds_10': // Verliebte Zahlen: 3 + _ = 10
            // We'll handle visual rendering in the loop, here just data
            a = getRandomInt(0, 10);
            return { type: 'missing_addend', a: a, sum: 10, op: '+' };

        case 'rechenmauer_10':
            return generatePyramid(10);

        // --- GRADE 2 (Legacy + Refined) ---
        case 'add_20':
            // Keep existing logic: random sum to 20
            a = getRandomInt(1, 19);
            b = getRandomInt(1, 20 - a);
            op = '+';
            break;
        case 'sub_20':
            a = getRandomInt(1, 20);
            b = getRandomInt(1, a);
            op = '-';
            break;
        case 'add_100_simple': // No carry
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
        case 'add_100_carry': // Forced carry
            do {
                a = getRandomInt(10, 89);
                b = getRandomInt(1, 99 - a);
            } while ((a % 10) + (b % 10) < 10);
            op = '+';
            break;
        case 'sub_100_simple': // No borrowing
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
        case 'sub_100_carry': // Forced borrowing
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
                    // Double: 1..50 -> 2..100
                    a = getRandomInt(1, 50);
                    return { type: 'doubling_halving', subtype: 'double', val: a, answer: a * 2 };
                } else {
                    // Halve: Even numbers 2..100
                    let val = getRandomInt(1, 50) * 2;
                    return { type: 'doubling_halving', subtype: 'halve', val: val, answer: val / 2 };
                }
            }
        case 'rechenmauer':
            return generatePyramid(100, 3);
        case 'rechenmauer_4':
            return generatePyramid(100, 4);
        case 'word_problems':
            // Existing word problems (could be graded too, but keeping simple for now)
            const problems = [
                { q: "Lisa hat 5 Äpfel. Sie kauft 3 dazu. Wie viele hat sie?", a: 8 },
                { q: "Tom hat 10 Ballons. 2 fliegen weg. Wie viele bleiben?", a: 8 },
                { q: "Eine Katze hat 4 Beine. Wie viele Beine haben 2 Katzen?", a: 8 },
                { q: "Oma backt 12 Kekse. Sie verteilt sie an 3 Enkel. Wie viele kriegt jeder?", a: 4 },
                { q: "Im Bus sind 5 Leute. An der Haltestelle steigen 4 ein. Wie viele sind es?", a: 9 },
                { q: "Max hat 20 Franken. Ein Buch kostet 15. Wie viel bleibt übrig?", a: 5 }
            ];
            return { type: 'text', ...problems[getRandomInt(0, problems.length - 1)] };

        // --- GRADE 3 ---
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
            // e.g. 15 * 4
            a = getRandomInt(11, 20);
            b = getRandomInt(2, 6); // Keep multipliers manageable
            op = '×';
            break;
        case 'div_100':
            {
                // Inverse of 1x1 mixed
                let divisor = getRandomInt(2, 9);
                let result = getRandomInt(2, 10);
                a = result * divisor;
                b = divisor;
            }
            op = ':';
            break;
        case 'div_remainder':
            {
                // a / b = result R remainder
                let divisor = getRandomInt(2, 9);
                let result = getRandomInt(2, 10);
                let remainder = getRandomInt(1, divisor - 1);
                a = (result * divisor) + remainder;
                b = divisor;
            }
            op = ':';
            return { type: 'div_remainder', a, b, op };

        case 'rechenmauer_100': // Actually same as grade 2 limit but user might want harder masking? 
            // Let's go up to 200 for grade 3? Or just stick to 100 but maybe harder start?
            // Standard Grade 3 adds numbers up to 1000, so pyramid sum could go higher?
            // Defaulting to 200 top.
            return generatePyramid(200, 3);

        // --- GRADE 4 ---
        case 'add_written':
            a = getRandomInt(1000, 99999);
            b = getRandomInt(1000, 99999);
            op = '+';
            return { type: 'written', a, b, op, answer: a + b };
        case 'sub_written':
            a = getRandomInt(5000, 99999);
            b = getRandomInt(1000, a - 1);
            op = '-';
            return { type: 'written', a, b, op, answer: a - b };
        case 'mult_large':
            a = getRandomInt(100, 999);
            b = getRandomInt(11, 99);
            op = '×';
            return { type: 'long_calculation', a, b, op, answer: a * b };
        case 'div_long':
            {
                let divisor = getRandomInt(2, 9);
                let result = getRandomInt(100, 999);
                a = result * divisor;
                b = divisor;
                op = ':';
                return { type: 'long_calculation', a, b, op, answer: result };
            }
        // --- GRADE 5 ---
        case 'dec_add':
            // e.g. 12.5 + 3.45
            // Keep precision manageable (1 or 2 decimal places)
            a = (getRandomInt(100, 9999) / 100).toFixed(2);
            b = (getRandomInt(100, 9999) / 100).toFixed(2);
            // Standard type renders with regular input, but we need to ensure answer matching works for strings
            // Or cast to number for calculation?
            // Better to determine answer here.
            // Note: float arithmetic issues. 
            {
                let numA = parseFloat(a);
                let numB = parseFloat(b);
                let ans = (numA + numB).toFixed(2);
                // Remove trailing zeros for display? "12.50" -> "12.5"
                a = parseFloat(a);
                b = parseFloat(b);
                // Actually standard rendering expects a/b to be numbers usually, but text works too.
                return { type: 'standard', a, b, op: '+', answer: parseFloat(ans) };
            }

        case 'dec_sub':
            {
                let numA = getRandomInt(500, 9999) / 100;
                let numB = getRandomInt(100, 499) / 100;
                let ans = (numA - numB).toFixed(2);
                return { type: 'standard', a: numA, b: numB, op: '-', answer: parseFloat(ans) };
            }

        case 'mult_10_100':
            a = (getRandomInt(10, 9999) / 100);
            b = [10, 100, 1000][getRandomInt(0, 2)];
            // Fix float issues
            {
                let ans = a * b;
                // Round to avoid 14.300000001
                ans = Math.round(ans * 1000) / 1000;
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
                if (u.factor === 1000 && seededRandom() > 0.5) val = val / 2; // 0.5 kg etc

                let answer = val * u.factor;

                // Need special rendering for units? "1.5 m = ___ cm"
                return { type: 'unit_conv', val, from: u.from, to: u.to, answer };
            }

        // --- GRADE 6 ---
        case 'frac_simplify':
            {
                // Generate a fraction that can be simplified. e.g. 4/8 -> 1/2
                // Start with irreducible fraction
                let num = getRandomInt(1, 10);
                let den = getRandomInt(num + 1, 20);
                // This might not be irreducible, but let's multiply both by a factor
                let factor = getRandomInt(2, 6);
                a = num * factor;
                b = den * factor;
                // simplify again properly to find expected answer?
                // Actually let's assume valid start format "a / b"
                // user needs to enter "num/den" or just "num" and "den"?
                // Let's expect "1/2" as string? Or "1 / 2"?
                // Simplest: render equation "a/b =" and two inputs? 
                // Or just one input string "1/2"

                // Let's calculate the real simplified form for answer
                const gcd = (x, y) => (!y ? x : gcd(y, x % y));
                const common = gcd(a, b);
                const simpleNum = a / common;
                const simpleDen = b / common;

                return { type: 'fraction_simplify', num: a, den: b, answer: `${simpleNum}/${simpleDen}` };
            }

        case 'frac_add':
            {
                // Simple: Same denominator or easy common?
                // Let's do common denominator <= 20
                let den = getRandomInt(2, 12);
                let numA = getRandomInt(1, den - 1);
                let numB = getRandomInt(1, den - numA); // sum <= 1

                // e.g. 1/5 + 2/5 = 3/5
                // Or 1/4 + 1/8 ?
                // Let's stick to same denominator for easy starting
                return { type: 'fraction_op', numA, denA: den, numB, denB: den, op: '+', answer: `${numA + numB}/${den}` };
            }

        case 'percent_basic':
            {
                // 10% von 200
                // 50% von 40
                const rates = [10, 20, 25, 50, 75];
                let rate = rates[getRandomInt(0, rates.length - 1)];
                let base = getRandomInt(1, 20) * 100; // 100, 200..
                if (rate === 25 || rate === 75) base = getRandomInt(1, 20) * 4; // Ensure clean div by 4

                let ans = (base * rate) / 100;
                return { type: 'percent', rate, base, answer: ans };
            }

        case 'rounding':
            {
                let val = getRandomInt(1000, 99999);
                let place = [10, 100, 1000][getRandomInt(0, 2)];
                let answer = Math.round(val / place) * place;
                return { type: 'rounding', val, place, answer };
            }

        case 'time_reading':
            {
                // Grade 2: Analog Clock -> Digital "hh:mm"
                // Difficulties: 5 min intervals? Quarter hours?
                // Let's mix: 50% 5-min steps, 30% quarters, 20% full/half.
                // Actually all are 5-min steps (multiplier of 5).
                // Minutes: 0, 5, 10... 55.
                const minutes = getRandomInt(0, 11) * 5;
                const hours = getRandomInt(1, 12);

                // Answer string "hh:mm". Pad minutes.
                // For solution, we might accept variations? 
                // But let's stick to standard 12h format for reading or 24h?
                // Grade 2 usually starts with 12h or "It is X o'clock".
                // Let's expect Digital Format e.g. "03:15" or "3:15".
                // Let's store standardized "h:mm" for checking.
                // Maybe simplified: just numbers.
                const minStr = minutes.toString().padStart(2, '0');
                const answer = `${hours}:${minStr}`;

                return { type: 'time_reading', hours, minutes, answer };
            }

        case 'visual_add_100':
            {
                // Total between 20 and 100
                const totalVis = getRandomInt(20, 100);

                // Number of parts: 2 or 3
                const partsCount = getRandomInt(2, 3);
                const parts = [];
                let currentSum = 0;

                for (let i = 0; i < partsCount - 1; i++) {
                    // Ensure remaining parts have at least 1
                    const maxVal = totalVis - currentSum - (partsCount - 1 - i);
                    // Ensure this part has at least 1
                    const valP = getRandomInt(1, maxVal);
                    parts.push(valP);
                    currentSum += valP;
                }
                parts.push(totalVis - currentSum);

                // Create grid data (array of 100 ints: 0=empty, 1=group1, 2=group2, 3=group3)
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

                return {
                    type: 'visual_add_100',
                    grid,
                    parts,
                    total: totalVis
                };
            }

        case 'time_duration':
            {
                // Grade 3: Duration logic.
                // "Es ist 14:10. Wie spät ist es in 40 Minuten?"
                const startH = getRandomInt(6, 18);
                const startM = getRandomInt(0, 11) * 5;
                const duration = getRandomInt(1, 12) * 5; // 5 to 60 mins (actually max 12*5=60)

                // Calculate end
                let endM = startM + duration;
                let endH = startH;
                if (endM >= 60) {
                    endH += Math.floor(endM / 60);
                    endM %= 60;
                }

                const sH = startH.toString(); // .padStart(2,'0') not strictly needed but nice
                const sM = startM.toString().padStart(2, '0');
                const eH = endH.toString();
                const eM = endM.toString().padStart(2, '0');

                return {
                    type: 'time_duration',
                    q: `Es ist ${sH}:${sM} Uhr. Wie spät ist es in ${duration} Min?`,
                    answer: `${eH}:${eM}`
                };
            }
        case 'rechendreiecke':
            return generateTriangle(20);
        case 'rechendreiecke_100':
            return generateTriangle(100);
        case 'zahlenhaus_10':
            return generateHouse(10);
        case 'zahlenhaus_20':
            return generateHouse(20);
        case 'zahlenhaus_100':
            return generateHouse(100);
        case 'married_100':
            const onlyMultiplesOf10 = document.getElementById('marriedMultiplesOf10').checked;
            return generateMarriedNumbers(onlyMultiplesOf10);
        case 'rechenstrich':
            return generateRechenstrich();
    }
    return { a, b, op };
}

function generateMarriedNumbers(onlyMultiplesOf10) {
    let a;
    if (onlyMultiplesOf10) {
        a = getRandomInt(0, 10) * 10;
    } else {
        // Ensure a mix of "easy" (multiples of 10) and "hard" numbers
        if (seededRandom() < 0.3) {
            a = getRandomInt(0, 10) * 10;
        } else {
            a = getRandomInt(1, 99);
        }
    }
    return { type: 'married_numbers', a: a, sum: 100, op: '+' };
}

function renderClock(hours, minutes) {
    // Helper to generate clock HTML
    let html = '<div class="clock-face"><div class="clock-center"></div>';

    // Markers for 12, 3, 6, 9
    // 0 deg = 12. 90 deg = 3.
    for (let i = 0; i < 12; i++) {
        const deg = i * 30;
        // We draw markers. We can reuse 'clock-marker' with rotation.
        // Standard marker is at top (12). Rotate it.
        html += `<div class="clock-marker" style="transform: rotate(${deg}deg) translate(0, 2px)"></div>`;
        // Wait, transform origin is center? CSS says "50% 50px". (Radius 50px).
        // "left: 50%" "margin-left: -1px".
        // Rotation rotates around center of clock. 
        // The marker is defined as top? 
        // "height: 6px". 
        // If I rotate 0deg, it's at top? 
        // If origin is "50% 50px", that means origin is 50px DOWN from the marker's top? 
        // If marker is at top (top:0?), then 50px down is center. 
        // Let's refine CSS for marker pos.
        // CSS: "left: 50%", "transform-origin: 50% 50px".
        // We need to position marker visually at top initially.
        // "top: 0" isn't set in CSS. Default static? No absolute.
        // Let's add "top: 0" to CSS or inline.
        // Actually simpler:
    }

    // Hands
    const minDeg = minutes * 6;
    const hourDeg = (hours % 12) * 30 + minutes * 0.5;

    html += `<div class="clock-hand hand-hour" style="transform: rotate(${hourDeg}deg)"></div>`;
    html += `<div class="clock-hand hand-minute" style="transform: rotate(${minDeg}deg)"></div>`;

    html += '</div>';
    return html;
}

function generatePyramid(maxTop, levels = 3) {
    let values = [];
    let mask = [];

    // Re-implementing generation bottom-up with flat array
    // Layers are stored sequentially bottom to top.
    let top;
    do {
        values = [];
        // 1. Generate Base
        let baseCount = levels;
        let maxBase = Math.floor(maxTop / (2 ** (levels - 1)));
        if (maxBase < 1) maxBase = 1;

        // Push base layer
        for (let i = 0; i < baseCount; i++) {
            values.push(getRandomInt(1, maxBase));
        }

        // 2. Calculate upper layers
        let currentLayerStart = 0;
        let currentLayerLength = baseCount;

        for (let l = 1; l < levels; l++) {
            // Next layer has currentLayerLength - 1 elements
            for (let i = 0; i < currentLayerLength - 1; i++) {
                let val = values[currentLayerStart + i] + values[currentLayerStart + i + 1];
                values.push(val);
            }
            currentLayerStart += currentLayerLength;
            currentLayerLength--;
        }

        top = values[values.length - 1];

    } while (top > maxTop);

    // Generate Mask
    // Just simple random masking for now. 
    const totalItems = values.length;
    const itemsToHide = Math.floor(totalItems * 0.5); // 50% hidden

    mask = new Array(totalItems).fill(false);

    // Ensure we don't hide everything.
    let hiddenCount = 0;
    while (hiddenCount < itemsToHide) {
        let idx = getRandomInt(0, totalItems - 1);
        if (!mask[idx]) {
            mask[idx] = true;
            hiddenCount++;
        }
    }

    return { type: 'pyramid', values, mask, levels };
}

function renderWrittenMultiplicationSolution(a, b) {
    const sA = a.toString();
    const sB = b.toString();
    let html = `<div class="written-vertical" style="align-items: flex-end; font-size:1rem;">
                <div class="written-row">${sA} &middot; ${sB}</div>
                <div class="written-line"></div>`;

    for (let i = 0; i < sB.length; i++) {
        const digit = parseInt(sB[i]);
        const partial = a * digit;
        const paddingRight = sB.length - 1 - i;
        html += `<div class="written-row" style="padding-right: ${paddingRight}ch;">${partial}</div>`;
    }

    html += `<div class="written-line"></div>
                    <div class="written-row"><strong>${a * b}</strong></div>
    </div>`;

    return html;
}

// --- NEW RENDERING ARCHITECTURE ---



function createProblemElement(problemData, isSolution) {
    const problemDiv = document.createElement('div');
    problemDiv.className = 'problem';

    if (problemData.type === 'text') {
        problemDiv.style.flexDirection = 'column';
        problemDiv.style.alignItems = 'flex-start';
        problemDiv.style.borderBottom = '1px solid #eee';
        problemDiv.style.paddingBottom = '10px';

        const answerVal = isSolution ? problemData.a : '';
        const correctClass = isSolution ? 'correct-answer-show' : ''; // custom class if needed

        problemDiv.innerHTML = `
                    <div style="font-size: 14pt; margin-bottom:10px;"> ${problemData.q}</div>
                        <div style="display:flex; gap:10px; align-items:center; width:100%; justify-content: flex-end;">
                            <span>Antwort:</span>
                            <input type="number" class="answer-input ${correctClass}" style="width:100px;"
                                data-expected="${problemData.a}"
                                value="${answerVal}"
                                oninput="validateInput(this)"
                                ${isSolution ? 'readonly style="color:var(--primary-color); font-weight:bold;"' : ''}>
                        </div>
                `;

    } else if (problemData.type === 'pyramid') {
        const v = problemData.values;
        const m = problemData.mask;
        const levels = problemData.levels || 3;

        const renderBrick = (idx) => {
            if (idx >= v.length) return '';
            const val = v[idx];
            const isHidden = m[idx];

            if (isHidden) {
                const valueToFill = isSolution ? val : '';
                const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
                return `<div class="brick input"><input type="number" class="brick-input answer-input"
                    data-expected="${val}"
                    value="${valueToFill}"
                    oninput="validateInput(this)"
                    ${isSolution ? 'readonly' : ''} style="${style}"></div>`;
            } else {
                return `<div class="brick">${val}</div>`;
            }
        };

        let html = '<div class="pyramid-container">';

        let currentStartIndex = 0;
        let rowStarts = [];
        let currentRowLen = levels;
        for (let l = 0; l < levels; l++) {
            rowStarts.push(currentStartIndex);
            currentStartIndex += currentRowLen;
            currentRowLen--;
        }

        // Render from Top (last layer) down to Base (layer 0)
        for (let l = levels - 1; l >= 0; l--) {
            let startIdx = rowStarts[l];
            let count = levels - l;

            html += '<div class="pyramid-row">';
            for (let i = 0; i < count; i++) {
                html += renderBrick(startIdx + i);
            }
            html += '</div>';
        }

        html += '</div>';

        problemDiv.innerHTML = html;
        // Fix layout to ensure centering
        problemDiv.style.display = 'flex';
        problemDiv.style.justifyContent = 'center';
        problemDiv.style.padding = '0';
        problemDiv.style.border = 'none'; // Ensure no border interference

    } else if (problemData.type === 'missing_addend') {
        const { a, sum, op } = problemData;
        const expected = sum - a;
        const val = isSolution ? expected : '';
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        // Use more compact layout for "Verliebte Zahlen"
        problemDiv.style.justifyContent = 'center'; // Center the equation
        problemDiv.style.gap = '15px'; // Consistent spacing

        problemDiv.innerHTML = `
                <span class="number" style="text-align:right;">${a}</span>
                <span class="operator">${op || '+'}</span>
                <input type="number" class="answer-input" style="width:60px; text-align:center; ${style}" 
                       data-expected="${expected}" 
                       value="${val}"
                       oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                <span class="equals">=</span>
                <span class="number" style="text-align:left;">${sum}</span>
            `;

    } else if (problemData.type === 'married_numbers') {
        const { a, sum, op } = problemData;
        const expected = sum - a;
        const val = isSolution ? expected : '';
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        problemDiv.style.justifyContent = 'center';
        problemDiv.style.gap = '15px';

        problemDiv.innerHTML = `
                <span class="number" style="text-align:right;">${a}</span>
                <span class="operator">${op || '+'}</span>
                <input type="number" class="answer-input" style="width:70px; text-align:center; ${style}" 
                       data-expected="${expected}" 
                       value="${val}"
                       oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                <span class="equals">=</span>
                <span class="number" style="text-align:left;">${sum}</span>
            `;

    } else if (problemData.type === 'div_remainder') {
        const { a, b, op } = problemData;
        const quotient = Math.floor(a / b);
        const remainder = a % b;

        const valQ = isSolution ? quotient : '';
        const valR = isSolution ? remainder : '';
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        problemDiv.innerHTML = `
                <span class="number">${a}</span>
                <span class="operator">${op}</span>
                <span class="number">${b}</span>
                <span class="equals">=</span>
                <input type="number" class="answer-input" style="width:40px; margin-right:5px; ${style}" 
                       data-expected="${quotient}" value="${valQ}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                <span style="font-size:12pt; margin-right:5px;">R</span>
                <input type="number" class="answer-input" style="width:40px; ${style}" 
                       data-expected="${remainder}" value="${valR}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                <input type="number" class="answer-input" style="width:40px; ${style}" 
                       data-expected="${remainder}" value="${valR}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            `;

    } else if (problemData.type === 'doubling_halving') {
        const { subtype, val, answer } = problemData;
        const label = subtype === 'double' ? 'Verdopple:' : 'Halbiere:';
        // const icon = subtype === 'double' ? '✨2x' : '✂️½'; // Maybe too noisy? Text is engaging enough.

        const valAns = isSolution ? answer : '';
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        problemDiv.innerHTML = `
                <div style="flex:1; display:flex; align-items:center; gap:10px;">
                    <span style="font-weight:bold; min-width:80px;">${label}</span>
                    <span class="number" style="text-align:center; font-size:1.2em;">${val}</span>
                </div>
                <span style="margin:0 10px;">➜</span>
                <input type="number" class="answer-input" style="${style}" 
                       data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            `;

    } else if (problemData.type === 'written') {
        // Vertical Alignment
        const { a, b, op, answer } = problemData;
        // Format numbers with space as thousands separator? standard JS toLocaleString('de-CH') uses ' 
        const strA = a.toLocaleString('de-CH');
        const strB = b.toLocaleString('de-CH');
        const valAns = isSolution ? answer.toLocaleString('de-CH') : '';

        problemDiv.innerHTML = `
                <div class="written-vertical">
                    <div class="written-row">${strA}</div>
                    <div class="written-row"><span class="written-operator">${op}</span>${strB}</div>
                    <div class="written-line"></div>
                    <div class="written-row">
                        <input type="text" class="answer-input" style="width:100%; text-align:right; border:none; background:transparent; font-family:inherit; font-size:inherit; padding:0;" 
                        data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                    </div>
                </div>
            `;

    } else if (problemData.type === 'rounding') {
        const { val, place, answer } = problemData;
        const valAns = isSolution ? answer : '';

        problemDiv.style.flexDirection = 'column';
        problemDiv.innerHTML = `
                 <div style="margin-bottom:5px;">Runde <b>${val}</b> auf <b>${place}er</b>:</div>
                 <input type="number" class="answer-input" style="width:80px;" 
                        data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            `;
    } else if (problemData.type === 'long_calculation') {
        const { a, b, op, answer } = problemData;
        const valAns = isSolution ? answer : '';

        if (isSolution && op === '×') {
            // Render Steps for Multiplication
            const sA = a.toString();
            const sB = b.toString();
            let stepsHtml = `<div class="written-vertical" style="align-items: flex-end; font-size:1rem;">
                <div class="written-row">${sA} &middot; ${sB}</div>
                <div class="written-line"></div>`;

            for (let i = 0; i < sB.length; i++) {
                const digit = parseInt(sB[i]);
                const partial = a * digit;
                // For alignment: padding-right based on position
                // Padding unit: 'ch' (character width in monospace)
                const paddingRight = sB.length - 1 - i;
                stepsHtml += `<div class="written-row" style="padding-right: ${paddingRight}ch;">${partial}</div>`;
            }

            stepsHtml += `<div class="written-line"></div>
                <div class="written-row"><strong>${answer}</strong></div>
            </div>`;

            problemDiv.innerHTML = stepsHtml;

        } else {
            // Standard problem + Grid (or Division solution without steps)
            problemDiv.style.flexDirection = 'column';
            problemDiv.style.alignItems = 'flex-start';

            problemDiv.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center; width:100%;">
                <span class="number" style="width:auto;">${a}</span>
                <span class="operator">${op}</span>
                <span class="number" style="width:auto;">${b}</span>
                <span class="equals">=</span>
                <input type="number" class="answer-input" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            </div>
            <div class="squared-grid"></div>
        `;

        }
    } else if (problemData.type === 'unit_conv') {
        const { val, from, to, answer } = problemData;
        const valAns = isSolution ? answer : '';
        problemDiv.innerHTML = `
            <span style="margin-right:10px;">${val} ${from}</span> = 
            <input type="number" class="answer-input" style="width:80px; margin:0 5px;" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            <span>${to}</span>
         `;

    } else if (problemData.type === 'percent') {
        const { rate, base, answer } = problemData;
        const valAns = isSolution ? answer : '';
        problemDiv.innerHTML = `
            <span>${rate}% von ${base}</span> <span class="equals">=</span>
            <input type="number" class="answer-input" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
         `;

    } else if (problemData.type === 'triangle') {
        const { inner, outer, maskMode } = problemData;
        const isInnerHidden = maskMode === 'inner';

        const renderField = (val, expected, isHidden) => {
            if (isHidden) {
                const solutionVal = isSolution ? expected : '';
                const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';
                return `<input type="number" class="answer-input triangle-field" data-expected="${expected}" value="${solutionVal}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${style}">`;
            } else {
                return `<div class="triangle-field static">${val}</div>`;
            }
        };

        problemDiv.classList.add('triangle-problem');
        problemDiv.innerHTML = `
            <div class="triangle-container">
                <svg viewBox="0 0 200 180" class="triangle-svg">
                    <polygon points="100,20 180,150 20,150" fill="none" stroke="#ddd" stroke-width="2"/>
                </svg>
                <div class="triangle-pos corner-top">${renderField(inner[0], inner[0], isInnerHidden)}</div>
                <div class="triangle-pos corner-right">${renderField(inner[1], inner[1], isInnerHidden)}</div>
                <div class="triangle-pos corner-left">${renderField(inner[2], inner[2], isInnerHidden)}</div>
                <div class="triangle-pos side-right">${renderField(outer[0], outer[0], !isInnerHidden)}</div>
                <div class="triangle-pos side-bottom">${renderField(outer[1], outer[1], !isInnerHidden)}</div>
                <div class="triangle-pos side-left">${renderField(outer[2], outer[2], !isInnerHidden)}</div>
            </div>
        `;

    } else if (problemData.type === 'house') {
        const { roof, floors } = problemData;
        problemDiv.classList.add('house-problem');

        let floorsHtml = '';
        floors.forEach(f => {
            const valA = (f.hiddenSide === 0) ? (isSolution ? f.a : '') : f.a;
            const valB = (f.hiddenSide === 1) ? (isSolution ? f.b : '') : f.b;
            const isHiddenA = f.hiddenSide === 0;
            const isHiddenB = f.hiddenSide === 1;

            const styleA = (isHiddenA && isSolution) ? 'color:var(--primary-color); font-weight:bold;' : '';
            const styleB = (isHiddenB && isSolution) ? 'color:var(--primary-color); font-weight:bold;' : '';

            floorsHtml += `
                <div class="house-floor">
                    <div class="house-cell ${isHiddenA ? 'input' : 'static'}">
                        ${isHiddenA ? `<input type="number" class="answer-input house-input" data-expected="${f.a}" value="${valA}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${styleA}">` : f.a}
                    </div>
                    <div class="house-cell ${isHiddenB ? 'input' : 'static'}">
                        ${isHiddenB ? `<input type="number" class="answer-input house-input" data-expected="${f.b}" value="${valB}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''} style="${styleB}">` : f.b}
                    </div>
                </div>
            `;
        });

        problemDiv.innerHTML = `
            <div class="house-container">
                <div class="house-roof">${roof}</div>
                <div class="house-body">
                    ${floorsHtml}
                </div>
            </div>
        `;

    } else if (problemData.type === 'fraction_simplify') {
        // e.g. 4/8 = [input] (expects "1/2")
        const { num, den, answer } = problemData;
        const valAns = isSolution ? answer : '';
        problemDiv.innerHTML = `
            <div class="fraction">
                <span class="fraction-top">${num}</span>
                <span class="fraction-bottom">${den}</span>
            </div>
            <span class="equals">=</span>
            <input type="text" class="answer-input" style="width:60px;" placeholder="a/b" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
         `;

    } else if (problemData.type === 'fraction_op') {
        const { numA, denA, numB, denB, op, answer } = problemData;
        const valAns = isSolution ? answer : '';
        problemDiv.innerHTML = `
            <div class="fraction">
                <span class="fraction-top">${numA}</span>
                <span class="fraction-bottom">${denA}</span>
            </div>
            <span class="operator">${op}</span>
            <div class="fraction">
                <span class="fraction-top">${numB}</span>
                <span class="fraction-bottom">${denB}</span>
            </div>
           <span class="equals">=</span>
           <input type="text" class="answer-input" style="width:60px;" placeholder="a/b" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
         `;

    } else if (problemData.type === 'written') {
        // Vertical Alignment
        const { a, b, op, answer } = problemData;
        // Format numbers with space as thousands separator? standard JS toLocaleString('de-CH') uses ' 
        const strA = a.toLocaleString('de-CH');
        const strB = b.toLocaleString('de-CH');
        const valAns = isSolution ? answer.toLocaleString('de-CH') : '';

        problemDiv.innerHTML = `
                <div class="written-vertical">
                    <div class="written-row">${strA}</div>
                    <div class="written-row"><span class="written-operator">${op}</span>${strB}</div>
                    <div class="written-line"></div>
                    <div class="written-row">
                        <input type="text" class="answer-input" style="width:100%; text-align:right; border:none; background:transparent; font-family:inherit; font-size:inherit; padding:0;" 
                        data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                    </div>
                </div>
            `;

    } else if (problemData.type === 'rounding') {
        const { val, place, answer } = problemData;
        const valAns = isSolution ? answer : '';

        problemDiv.style.flexDirection = 'column';
        problemDiv.innerHTML = `
                 <div style="margin-bottom:5px;">Runde <b>${val}</b> auf <b>${place}er</b>:</div>
                 <input type="number" class="answer-input" style="width:80px;" 
                        data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            `;
    } else if (problemData.type === 'time_reading') {
        const { hours, minutes, answer } = problemData;
        const valAns = isSolution ? answer : '';

        const clockHtml = renderClock(hours, minutes);

        problemDiv.style.flexDirection = 'column';
        problemDiv.innerHTML = `
            ${clockHtml}
            <div style="margin-top:10px; display:flex; align-items:center; gap:2px;">
                <input type="number" class="answer-input" style="width:45px; text-align:center;" 
                       data-expected="${answer.split(':')[0]}" 
                       value="${isSolution ? answer.split(':')[0] : ''}" 
                       oninput="validateInput(this)" 
                       ${isSolution ? 'readonly' : ''}>
                <span style="font-weight:bold; font-size:1.2rem;">:</span>
                <input type="number" class="answer-input" style="width:45px; text-align:center;" 
                       data-expected="${answer.split(':')[1]}" 
                       value="${isSolution ? answer.split(':')[1] : ''}" 
                       oninput="validateInput(this)" 
                       ${isSolution ? 'readonly' : ''}>
                 <span style="margin-left:5px;">Uhr</span>
            </div>
        `;

    } else if (problemData.type === 'time_duration') {
        const { q, answer } = problemData;
        const valAns = isSolution ? answer : '';

        problemDiv.style.flexDirection = 'column';
        problemDiv.style.alignItems = 'flex-start';
        problemDiv.innerHTML = `
            <div style="margin-bottom:8px;">${q}</div>
            <div style="display:flex; align-items:center; gap:5px;">
                <span>Antwort:</span>
                <input type="text" class="answer-input" style="width:60px;" 
                       data-expected="${answer}" 
                       value="${valAns}" 
                       oninput="validateInput(this)" 
                       ${isSolution ? 'readonly' : ''}>
                 <span>Uhr</span>
            </div>
        `;

    } else if (problemData.type === 'visual_add_100') {
        const { grid, parts, total } = problemData;

        // 1. Render Grid
        let gridHtml = '<div class="visual-grid-100">';
        grid.forEach(val => {
            const className = val === 0 ? 'circle-empty' : `circle-group-${val}`;
            gridHtml += `<div class="visual-circle ${className}"></div>`;
        });
        gridHtml += '</div>';

        // 2. Render Equation Inputs
        // Form: [Count1] + [Count2] = [Total]
        let inputsHtml = '<div style="display:flex; align-items:center; gap:5px; margin-top:10px;">';
        parts.forEach((p, idx) => {
            const valAns = isSolution ? p : '';
            // Match input border color to group? We can use classes for that.
            inputsHtml += `<input type="number" class="answer-input circle-input-group-${idx + 1}" style="width:50px; text-align:center;" 
                        data-expected="${p}" 
                        value="${valAns}" 
                        oninput="validateInput(this)" 
                        ${isSolution ? 'readonly' : ''}>`;

            if (idx < parts.length - 1) {
                inputsHtml += '<span style="font-weight:bold;">+</span>';
            }
        });
        inputsHtml += '<span style="font-weight:bold;">=</span>';

        const totalAns = isSolution ? total : '';
        inputsHtml += `<input type="number" class="answer-input" style="width:60px; text-align:center; font-weight:bold;" 
                    data-expected="${total}" 
                    value="${totalAns}" 
                    oninput="validateInput(this)" 
                    ${isSolution ? 'readonly' : ''}>`;

        inputsHtml += '</div>';

        problemDiv.style.flexDirection = 'column';
        problemDiv.innerHTML = gridHtml + inputsHtml;

    } else if (problemData.type === 'rechenstrich') {
        const { start, jump1, mid, jump2, sum } = problemData;
        const sJ1 = isSolution ? jump1 : '';
        const sMid = isSolution ? mid : '';
        const sJ2 = isSolution ? jump2 : '';
        const sSum = isSolution ? sum : '';

        const style = isSolution ? 'style="color:var(--primary-color); font-weight:bold;"' : '';
        const readonlyAttr = isSolution ? 'readonly' : '';

        problemDiv.style.flexDirection = 'column';
        problemDiv.style.alignItems = 'center';
        problemDiv.style.padding = '20px 0';

        // Equation at the top
        const equationHtml = `<div style="font-size: 1.2rem; margin-bottom: 20px;">
            ${start} + ${jump1 + jump2} = <input type="number" class="answer-input" style="width:70px;" data-expected="${sum}" value="${sSum}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
        </div>`;

        // Rechenstrich Visualization
        const vizHtml = `
            <div class="rechenstrich-container" style="position:relative; width:300px; height:80px; margin-top:20px;">
                <!-- Main Line -->
                <div style="position:absolute; top:50px; left:0; width:100%; height:2px; background:#000;"></div>
                
                <!-- Start Point -->
                <div class="rechenstrich-station rechenstrich-fixed" style="left:0; top:55px;">${start}</div>
                
                <!-- Jump 1 (Tens) -->
                <svg style="position:absolute; top:10px; left:0; width:66.6%; height:40px; overflow:visible;">
                    <path d="M 0 40 Q 50 0 100 40" fill="none" stroke="var(--primary-color)" stroke-width="2" vector-effect="non-scaling-stroke" style="transform: scaleX(2); transform-origin: left;"></path>
                </svg>
                <div class="rechenstrich-jump" style="left:33.3%; top:15px;">
                    +<input type="number" class="rechenstrich-input small" data-expected="${jump1}" value="${sJ1}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                </div>
                
                <!-- Mid Point -->
                <div class="rechenstrich-station" style="left:66.6%; top:55px;">
                    <input type="number" class="rechenstrich-input" data-expected="${mid}" value="${sMid}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                </div>
                
                <!-- Jump 2 (Ones) -->
                <svg style="position:absolute; top:10px; left:66.6%; width:33.3%; height:40px; overflow:visible;">
                    <path d="M 0 40 Q 25 10 50 40" fill="none" stroke="var(--primary-color)" stroke-width="2" vector-effect="non-scaling-stroke" style="transform: scaleX(2); transform-origin: left;"></path>
                </svg>
                <div class="rechenstrich-jump" style="left:83.3%; top:15px;">
                    +<input type="number" class="rechenstrich-input small" data-expected="${jump2}" value="${sJ2}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                </div>
                
                <!-- End Point -->
                <div class="rechenstrich-station rechenstrich-fixed" style="left:100%; top:55px;">
                    <input type="number" class="rechenstrich-input" data-expected="${sum}" value="${sSum}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
                </div>
            </div>
        `;

        problemDiv.innerHTML = equationHtml + vizHtml;

    } else if (problemData.type === 'standard') {
        // Reuse standard logic but explicitly handle here if needed, or fall through?
        // actually 'standard' maps to default block below if we don't catch it.
        // But wait, the default block expects {a, b, op} directly on problemData or construct.
        // My generateProblem returns {type:'standard', ...}.
        // So I need to set vars for the fall-through or render here.

        const { a, b, op, answer } = problemData;
        const valAns = isSolution ? answer : '';

        problemDiv.innerHTML = `
                                                                            <span class="number" style="width:auto;">${a}</span>
                                                                            <span class="operator">${op}</span>
                                                                            <span class="number" style="width:auto;">${b}</span>
                                                                            <span class="equals">=</span>
                                                                            <input type="number" class="answer-input" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                                                                                `;

    } else {
        // Legacy Fallback (for Grade 1-3 types not migrated to specific 'type' yet)
        const { a, b, op } = problemData;
        let expected;
        if (op === '+') expected = a + b;
        else if (op === '-') expected = a - b;
        else if (op === '×') expected = a * b;
        else if (op === ':') expected = a / b;

        const val = isSolution ? expected : '';
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        problemDiv.innerHTML = `
                                                                                <span class="number">${a}</span>
                                                                                <span class="operator">${op}</span>
                                                                                <span class="number">${b}</span>
                                                                                <span class="equals">=</span>
                                                                                <input type="number" class="answer-input" style="${style}" data-expected="${expected}" value="${val}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                                                                                    `;
    }
    return problemDiv;
}

function createSheetElement(titleText, problemDataList, isSolution, pageInfo) {
    // Create Sheet
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'sheet';

    // QR Code Container
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-container';
    if (document.getElementById('hideQR').checked) {
        qrContainer.classList.add('qr-hidden');
    }
    sheetDiv.appendChild(qrContainer);

    // Sheet Logo (Top Left)
    const sheetLogo = document.createElement('img');
    sheetLogo.src = 'images/Thalwil_Familien_Logo.png';
    sheetLogo.className = 'sheet-logo';
    if (document.getElementById('hideLogo').checked) {
        sheetLogo.classList.add('logo-hidden');
    }
    sheetDiv.appendChild(sheetLogo);

    // Header
    const header = document.createElement('div');
    header.className = 'sheet-header';
    header.innerHTML = `
                                                                                    <div style="width:100px;"></div> <!-- Spacer for Logo -->
                                                                                    <div style="display:flex; gap: 40px;">
                                                                                        <div class="header-field">Name: <span class="line"></span></div>
                                                                                        <div class="header-field">Datum: <span class="line"></span></div>
                                                                                    </div>
                                                                                    <div style="width:100px;"></div> <!-- Spacer for QR Code -->
                                                                                    `;
    sheetDiv.appendChild(header);

    // Title
    const h1 = document.createElement('h1');
    h1.textContent = titleText + (isSolution ? ' (Lösungen)' : '');
    if (isSolution) h1.style.color = '#27ae60';
    sheetDiv.appendChild(h1);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'problem-grid';

    // Check layout needs
    // We can infer layout from the first problem or pass it as arg
    // But existing code checked 'type' string. Let's inspect first problem to guess or stick to global 'type' passed down?
    // Simplest is to pass the 'type' string to this function or check content.
    // problemDataList[0].type ...

    // Let's rely on standard Layout unless it's a pyramid.
    const isPyramid = problemDataList.length > 0 && problemDataList[0].type === 'pyramid';

    if (isPyramid) {
        const levels = problemDataList[0].levels || 3;

        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.columnGap = '20px';
        grid.style.rowGap = '25px';
    } else {
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.columnGap = '40px';
        grid.style.rowGap = '25px';
    }

    problemDataList.forEach(p => {
        grid.appendChild(createProblemElement(p, isSolution));
    });

    sheetDiv.appendChild(grid);

    // Layout adjustments: Removed Mascot and Footer per user request NO WAIT - User wants Page Numbers now.
    const footer = document.createElement('div');
    footer.className = 'sheet-footer';
    // Style inline or in CSS? CSS is cleaner but let's do minimal changes here.
    footer.style.position = 'absolute';
    footer.style.bottom = '15mm';
    footer.style.right = '15mm';
    footer.style.fontSize = '0.9rem';
    footer.style.color = '#7f8c8d';

    // Page numbering
    if (pageInfo) {
        footer.textContent = `${pageInfo.current}${isSolution ? ' (Lösungen)' : ''}`;
    }

    sheetDiv.appendChild(footer);

    return sheetDiv;
}



// Stores an array of problem sets, one for each page. 
// e.g. [ [problem1, problem2...], [problem1, problem2...] ]
let currentSheetsData = [];
let currentTitle = "";



function renderCurrentState() {
    const wrapper = document.getElementById('sheetsWrapper');
    const showSolutions = document.getElementById('solutionToggle').checked;

    wrapper.innerHTML = '';

    // Loop through all generated sheets
    currentSheetsData.forEach((sheetProblems, index) => {
        // Render Worksheet
        const pageInfo = { current: index + 1, total: currentSheetsData.length };
        const worksheet = createSheetElement(currentTitle, sheetProblems, false, pageInfo);
        wrapper.appendChild(worksheet);

        // Render Solution Sheet immediately after, if requested
        if (showSolutions) {
            const solutionSheet = createSheetElement(currentTitle, sheetProblems, true, pageInfo);
            wrapper.appendChild(solutionSheet);
        }
    });
}

function validateInput(input) {
    const expectedStr = input.dataset.expected.trim();
    const valueStr = input.value.trim();

    const isBrick = input.classList.contains('brick-input');
    const target = isBrick ? input.parentElement : input;

    if (!valueStr) {
        target.classList.remove('correct', 'incorrect');
        return;
    }

    let isCorrect = false;

    // 1. Direct String Match (covers "3:15", "1/2")
    if (valueStr === expectedStr) {
        isCorrect = true;
    }
    // 2. Numeric Match (covers "12" vs "12.0" or "012")
    // Use Number() which is stricter than parseInt/parseFloat (no partial parsing)
    else {
        const expNum = Number(expectedStr);
        const valNum = Number(valueStr);

        // Check if both are valid numbers and equal
        if (!isNaN(expNum) && !isNaN(valNum) && Math.abs(expNum - valNum) < 0.00001) {
            isCorrect = true;
        }
    }

    // 3. Normalized Time Match (Handle 3:15 vs 03:15)
    // If expected has colon, try normalizing time
    if (!isCorrect && expectedStr.includes(':') && valueStr.includes(':')) {
        const [eH, eM] = expectedStr.split(':').map(Number);
        const [vH, vM] = valueStr.split(':').map(Number);
        if (eH === vH && eM === vM) {
            isCorrect = true;
        }
    }

    if (isCorrect) {
        target.classList.add('correct');
        target.classList.remove('incorrect');
        // valid check removed to avoid performance hit on many pages? 
        // Actually user didn't ask for removal, but checkAllDone might need optimization or fix.
        checkAllDone();
    } else {
        target.classList.add('incorrect');
        target.classList.remove('correct');
    }
}

function checkAllDone() {
    // Only check inputs for the sheet the user is typing in, or all?
    // Checking all 1000 inputs is fine.
    const inputs = document.querySelectorAll('.answer-input');
    let allCorrect = true;

    inputs.forEach(input => {
        // Skip read-only inputs (solutions)
        if (input.readOnly) return;

        // Determine target for class check (parent for bricks, self for others)
        const isBrick = input.classList.contains('brick-input');
        const target = isBrick ? input.parentElement : input;

        // If any field is not marked correct, we aren't done.
        // Note: Empty fields are not 'correct' yet.
        if (!target.classList.contains('correct')) {
            allCorrect = false;
        }
    });

    // Mascot logic - check if element exists first
    const mascot = document.getElementById('mascot');
    if (mascot) {
        if (allCorrect) {
            mascot.textContent = '🎉';
        } else {
            mascot.textContent = '🦊'; // Default
        }
    }
}

// Initialize on load
function init() {
    // 1. Initial UI Setup (Defaults)
    // Grade 2 is default in HTML

    // 2. Load State from URL
    loadStateFromURL();

    // 3. Generate initial sheet
    // If seed was loaded, generateSheet(true) will use it.
    // Otherwise it will generate a new one.
    generateSheet(true);

    // 4. Scale
    autoScaleSheet();
}

function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);

    // 1. Grade
    if (params.has('grade')) {
        const grade = params.get('grade');
        const sel = document.getElementById('gradeSelector');
        if (sel) {
            sel.value = grade;
            // Trigger topic update for this grade
            updateTopicSelector();
        }
    } else {
        // Ensure topics are populated for default grade
        updateTopicSelector();
    }

    // 2. Topic
    if (params.has('topic')) {
        const topic = params.get('topic');
        const topicSel = document.getElementById('topicSelector');
        if (topicSel) {
            // Check if option exists (might be invalid for grade?)
            // If custom, we added it.
            topicSel.value = topic;

            // If Custom, handle visibility
            if (topic === 'custom') {
                const customContainer = document.getElementById('customOptions');
                customContainer.style.display = 'flex'; // show it

                // Populate checkboxes if needed (updateTopicSelector did it, but let's be sure)
                // updateCustomCheckboxes was called by updateTopicSelector() -> triggering?
                // Actually updateCustomCheckboxes resets checked status to TRUE by default.
                // We need to overwrite that if custom param exists.

                if (params.has('custom')) {
                    const customVal = params.get('custom').split(',');
                    // Uncheck all first? Or check only matches?
                    const allCbs = document.querySelectorAll('#checkboxContainer input[type="checkbox"]');
                    allCbs.forEach(cb => {
                        cb.checked = customVal.includes(cb.value);
                    });
                }
            } else {
                const customContainer = document.getElementById('customOptions');
                customContainer.style.display = 'none';
            }
        }
    }

    // 3. Count
    if (params.has('count')) {
        const count = params.get('count');
        const pageInput = document.getElementById('pageCount');
        if (pageInput) {
            pageInput.value = count;
        }
    }

    // 4. Options
    if (params.has('solutions')) {
        document.getElementById('solutionToggle').checked = params.get('solutions') === '1';
    }
    if (params.has('marriedM')) {
        document.getElementById('marriedMultiplesOf10').checked = params.get('marriedM') === '1';
    }
    if (params.has('hideQR')) {
        document.getElementById('hideQR').checked = params.get('hideQR') === '1';
    }
    if (params.has('hideLogo')) {
        document.getElementById('hideLogo').checked = params.get('hideLogo') === '1';
    }

    // 5. Seed
    if (params.has('seed')) {
        globalSeed = parseInt(params.get('seed'));
        // We will call generateSheet(true) in init to use this seed
    }
}

function toggleQRVisibility() {
    const hide = document.getElementById('hideQR').checked;
    const qrContainers = document.querySelectorAll('.qr-code-container');
    qrContainers.forEach(container => {
        if (hide) {
            container.classList.add('qr-hidden');
        } else {
            container.classList.remove('qr-hidden');
        }
    });
    updateURLState();
}

function toggleLogoVisibility() {
    const hide = document.getElementById('hideLogo').checked;
    const logos = document.querySelectorAll('.sheet-logo');
    logos.forEach(logo => {
        if (hide) {
            logo.classList.add('logo-hidden');
        } else {
            logo.classList.remove('logo-hidden');
        }
    });
    updateURLState();
}

function renderQRCode(url) {
    const containers = document.querySelectorAll('.qr-code-container');
    containers.forEach(container => {
        container.innerHTML = '';
        new QRCode(container, {
            text: url,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.L
        });
    });
}

window.onload = init;

window.onresize = autoScaleSheet;

function autoScaleSheet() {
    // Only scale if screen is smaller than sheet (approx 800px + margins)
    // 210mm is approx 794px at 96dpi. Let's say 820px safety.

    const wrapper = document.getElementById('sheetsWrapper');
    // Reset first provided we aren't printing
    if (window.matchMedia('print').matches) {
        wrapper.style.transform = 'none';
        wrapper.style.height = 'auto'; // Reset height
        return;
    }

    const screenWidth = window.innerWidth;
    const sheetWidth = 820; // Approx 210mm in px plus visual margin

    if (screenWidth < sheetWidth) {
        // Calculate scale
        // Leave 20px margin
        const scale = (screenWidth - 20) / sheetWidth;
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'top center';

        // Fix whitespace: container keeps original height, so we must reduce it manually
        // We need to wait for DOM to be stable if we just rendered, but usually it is.
        // The visual height is scrollHeight * scale.
        // However, scrollHeight might be affected by the transform itself if we are not careful.
        // Standard flow: element occupies 'scrollHeight'. Transform shrinks it visually but not in flow.
        // So we set exact height to visual height.

        // Important: Reset height to auto first to get true scrollHeight (if we are resizing)
        wrapper.style.height = 'auto';
        const originalHeight = wrapper.scrollHeight;
        const newHeight = originalHeight * scale;
        wrapper.style.height = `${newHeight}px`;

    } else {
        wrapper.style.transform = 'none';
        wrapper.style.height = 'auto';
    }
}

function generateTriangle(maxSum) {
    let i1, i2, i3, o1, o2, o3;
    let attempts = 0;
    do {
        // max(o) = max(i + i). So max(i) ~ maxSum / 2.
        const maxInner = Math.floor(maxSum / 1.5); // Allow slightly larger inner for variety but check sums
        i1 = getRandomInt(1, maxInner);
        i2 = getRandomInt(1, maxInner);
        i3 = getRandomInt(1, maxInner);

        o1 = i1 + i2;
        o2 = i2 + i3;
        o3 = i3 + i1;
        attempts++;
    } while ((o1 > maxSum || o2 > maxSum || o3 > maxSum) && attempts < 100);

    const maskMode = seededRandom() < 0.5 ? 'inner' : 'outer';

    return {
        type: 'triangle',
        inner: [i1, i2, i3],
        outer: [o1, o2, o3],
        maskMode
    };
}

function generateHouse(roofNum) {
    const floorsCount = getRandomInt(3, 5);
    const floors = [];

    // Ensure variety in decompositions
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
        const hiddenSide = seededRandom() < 0.5 ? 0 : 1; // 0 for A, 1 for B
        floors.push({ a: sideA, b: sideB, hiddenSide });
    }

    return {
        type: 'house',
        roof: roofNum,
        floors
    };
}

function generateRechenstrich() {
    const a = getRandomInt(10, 60);
    const b = getRandomInt(11, 39);
    const sum = a + b;

    // Split b into tens and ones
    const tens = Math.floor(b / 10) * 10;
    const ones = b % 10;

    return {
        type: 'rechenstrich',
        start: a,
        jump1: tens,
        mid: a + tens,
        jump2: ones,
        sum: sum
    };
}


