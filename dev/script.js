import { globalSeed, setSeed } from './js/mathUtils.js';
export { globalSeed, setSeed };
import { generateProblemsData as genData } from './js/problemGenerators.js?v=4';
import { TRANSLATIONS, getPreferredLanguage, setPreferredLanguage } from './js/translations.js';
import { loadBuilderState, initBuilder, getBuilderState, hasBuilderContent } from './js/worksheet-builder.js?v=final';
import { getURLParams, getPageFromHash } from './js/urlUtils.js';

// Expose to window for inline HTML handlers

window.generateSheet = generateSheet;
window.renderCurrentState = renderCurrentState;
window.updateURLState = updateURLState;
window.toggleQRVisibility = toggleQRVisibility;
window.validateInput = validateInput;
window.switchLanguage = switchLanguage;

export let lang = getPreferredLanguage();
window.lang = lang; // Expose for easy access in other modules
let basePath = './';
export let T = TRANSLATIONS[lang];
window.T = T;

if (document.getElementById('htmlRoot')) {
    document.getElementById('htmlRoot').lang = lang;
}

// State for Modern UI
let currentGeneratorGrade = '1';
let selectedGeneratorTopics = new Set();
// Note: We might want to persist these to URL/Storage

export const GRADE_TOPICS_STRUCTURE = {
    '1': ['add_10', 'sub_10', 'add_20_simple', 'sub_20_simple', 'bonds_10', 'rechenmauer_10', 'money_10'],
    '2': ['add_20', 'sub_20', 'add_100_simple', 'add_100_carry', 'sub_100_simple', 'sub_100_carry', 'mult_2_5_10', 'mult_all', 'div_2_5_10', 'rechenmauer', 'rechenmauer_4', 'doubling_halving', 'zahlenhaus_20', 'word_problems', 'time_reading', 'time_analog_set', 'visual_add_100', 'rechendreiecke', 'rechenstrich', 'married_100', 'money_100', 'word_types'],
    '3': ['add_1000', 'sub_1000', 'mult_advanced', 'div_100', 'div_remainder', 'rechenmauer_100', 'time_duration', 'time_analog_set_complex', 'rechendreiecke_100', 'zahlenhaus_100'],
    '4': ['add_written', 'sub_written', 'mult_large', 'div_long', 'rounding'],
    '5': ['dec_add', 'dec_sub', 'mult_10_100', 'units'],
    '6': ['frac_simplify', 'frac_add', 'percent_basic']
};

const GRADE_TOPICS = {};
// Initial Population
updateGradeTopics();

function updateGradeTopics() {
    Object.keys(GRADE_TOPICS_STRUCTURE).forEach(g => {
        GRADE_TOPICS[g] = GRADE_TOPICS_STRUCTURE[g].map(v => ({ value: v, text: T.topics[v] }));
    });
}

const mascots = ['🦊', '🦉', '🦁', '🐼', '🐨', '🐯', '🦄', '🦖'];

function trackEvent(name, props = {}) {
    if (window.posthog) {
        window.posthog.capture(name, props);
    }
}

function printSheet() {
    try {
        const topics = Array.from(selectedGeneratorTopics);
        let topic;
        let customModules = '';

        if (topics.length > 1) {
            topic = 'custom';
            customModules = topics.join(',');
        } else if (topics.length === 1) {
            topic = topics[0];
        } else {
            topic = 'unknown';
        }

        const props = {
            grade: currentGeneratorGrade,
            topic: topic,
            count: document.getElementById('pageCount').value,
            solutions: document.getElementById('solutionToggle').checked,
            lang: lang
        };

        if (topic === 'custom') {
            props.custom_modules = customModules;
        }

        trackEvent('print_sheet', props);
    } catch (e) {
        console.error('Analytics error:', e);
    }

    window.print();
}
window.printSheet = printSheet;
function applyTranslations() {
    document.title = T.ui.title;
    const ids = {
        'labelSolutions': T.ui.solutionsLabel,
        'btnGenerate': T.ui.btnGenerate,
        'btnSave': T.ui.btnSave,
        'btnSaved': T.ui.btnSaved,
        'btnPrint': T.ui.btnPrint,
        'btnPlay': T.ui.btnPlay,
        'labelShowQR': T.ui.labelShowQR,
        'customTitle': T.ui.customTitle,
        'labelMultiplesOf10': T.ui.multiplesOf10,
        'labelCurrency': T.ui.currency,
        'labelHours': T.ui.hours,
        'labelMinutes': T.ui.minutes,
        'modalTitle': T.ui.modalTitle,
        'btnModalClose': T.ui.modalClose,
        'labelFeedback': T.ui.feedback,
        'labelDensity': T.ui.labelDensity,
        'navGenerator': T.ui.navGenerator,
        'navGames': T.ui.navGames,
        'navGameGeo': T.ui.navGameGeo,
        'navAbout': T.ui.navAbout,
        'titleGames': T.ui.titleGames,
        'titleAbout': T.ui.titleAbout,
        'gameCantonTitle': T.ui.gameCantonTitle,
        'gameCantonDesc': T.ui.gameCantonDesc,
        'aboutIntro': T.ui.aboutIntro,
        btnAddElement: T.ui.builder.addItem,
        btnRefreshBuilder: T.ui.builder.refresh,
        btnClearBuilderSheet: T.ui.builder.clear
    };

    for (const [id, text] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = text;
    }

    // Builder Print Button (if id differs or for specific handling)
    const btnPrintBuilder = document.getElementById('btnPrintBuilder');
    if (btnPrintBuilder) btnPrintBuilder.innerHTML = T.ui.btnPrint;

    const btnCopyBuilderLink = document.getElementById('btnCopyBuilderLink');
    if (btnCopyBuilderLink) btnCopyBuilderLink.innerHTML = '🔗 ' + T.ui.builder.copyLink;

    const gradeSelector = document.getElementById('gradeSelector');
    if (gradeSelector) {
        Array.from(gradeSelector.options).forEach(opt => {
            if (T.ui.grades[opt.value]) {
                opt.textContent = T.ui.grades[opt.value];
            }
        });
    }
}

// --- TABS & CHIPS RENDERING (Modern UI) ---

function renderGeneratorTabs() {
    const container = document.getElementById('gradeTabs');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(GRADE_TOPICS_STRUCTURE).forEach(g => {
        const tab = document.createElement('div');
        tab.className = `grade-tab ${g === currentGeneratorGrade ? 'active' : ''}`;
        tab.textContent = T.ui.grades[g];
        tab.onclick = () => handleGeneratorGradeSelect(g);
        container.appendChild(tab);
    });
}

function handleGeneratorGradeSelect(grade) {
    if (currentGeneratorGrade === grade) return;
    currentGeneratorGrade = grade;

    // Default behavior on grade switch: Select first topic? Or clear?
    // Let's select the first topic by default to match old behavior
    const topics = GRADE_TOPICS_STRUCTURE[grade] || [];
    selectedGeneratorTopics.clear();
    if (topics.length > 0) {
        selectedGeneratorTopics.add(topics[0]);
    }

    renderGeneratorTabs();
    renderGeneratorChips();
    generateSheet(); // Auto-generate
}

function renderGeneratorChips() {
    const container = document.getElementById('topicChips');
    if (!container) return;
    container.innerHTML = '';

    const topics = GRADE_TOPICS_STRUCTURE[currentGeneratorGrade] || [];

    topics.forEach(topicKey => {
        const chip = document.createElement('div');
        const isActive = selectedGeneratorTopics.has(topicKey);
        chip.className = `topic-chip ${isActive ? 'active' : ''}`;
        chip.textContent = T.topics[topicKey];
        chip.onclick = () => handleGeneratorTopicClick(topicKey);
        container.appendChild(chip);
    });

    // Update Visibility of Side Panels (Money, Time, Married) based on Active Selection
    updateSidePanelsVisibility();
}

function handleGeneratorTopicClick(topic) {
    // If clicking an unselected chip, add it.
    // If clicking a selected chip, remove it UNLESS it's the last one (prevent empty state).

    if (selectedGeneratorTopics.has(topic)) {
        if (selectedGeneratorTopics.size > 1) {
            selectedGeneratorTopics.delete(topic);
        }
    } else {
        selectedGeneratorTopics.add(topic);
    }

    renderGeneratorChips();
    generateSheet();
}

function updateSidePanelsVisibility() {
    // Check if ANY selected topic needs a panel
    let showCustom = selectedGeneratorTopics.size > 1; // Actually custom logic is intrinsic now
    let showMarried = false;
    let showTime = false;
    let showMoney = false;

    selectedGeneratorTopics.forEach(t => {
        if (t === 'married_100') showMarried = true;
        if (t === 'time_reading') showTime = true;
        if (t === 'money_10' || t === 'money_100') showMoney = true;
    });

    const marriedDiv = document.getElementById('marriedOptions');
    const timeDiv = document.getElementById('timeOptions');
    const moneyDiv = document.getElementById('moneyOptions');

    if (marriedDiv) marriedDiv.style.display = showMarried ? 'flex' : 'none';
    if (timeDiv) timeDiv.style.display = showTime ? 'flex' : 'none';
    if (moneyDiv) moneyDiv.style.display = showMoney ? 'flex' : 'none';

    // We don't need 'customOptions' div anymore as chips handle it.
}

// Replaces updateTopicSelector and related helpers
function updateTopicSelector() {
    renderGeneratorTabs();
    renderGeneratorChips();
}
window.updateTopicSelector = updateTopicSelector;


// --- GENERATION & RENDERING ---

// Tracking State
let workStarted = false;

function generateSheet(keepSeed = false) {
    workStarted = false; // Reset interaction tracking
    if (!keepSeed) {
        setSeed(Math.floor(Math.random() * 0xFFFFFFFF));
    } else {
        // Reset generator with current seed to ensure same sequence if re-rendering same state
        setSeed(globalSeed);
    }

    // Track generation (only if new seed/sheet)
    if (!keepSeed) {
        const props = {
            grade: document.getElementById('gradeSelector').value,
            topic: document.getElementById('topicSelector').value,
            count: document.getElementById('pageCount').value,
            solutions: document.getElementById('solutionToggle').checked,
            lang: lang
        };

        if (props.topic === 'custom') {
            const checkboxes = document.querySelectorAll('#checkboxContainer input[type="checkbox"]:checked');
            props.custom_modules = Array.from(checkboxes).map(cb => cb.value).join(',');
        }

        trackEvent('generate_sheet', props);
    }

    // Track generation (only if new seed/sheet)
    if (!keepSeed) {
        trackEvent('generate_sheet', {
            grade: currentGeneratorGrade,
            topic: Array.from(selectedGeneratorTopics).join(','),
            count: document.getElementById('pageCount').value
        });
    }

    // New Logic: Determine Type based on Selected Topics
    let type;
    const availableTopics = Array.from(selectedGeneratorTopics);

    if (availableTopics.length === 1) {
        type = availableTopics[0];
    } else if (availableTopics.length > 1) {
        type = 'custom';
    } else {
        // Fallback if empty (shouldn't happen)
        type = 'add_10';
    }

    // Title is complicated now. Use Generic or Specific?
    // Let's rely on sheet generation to add titles per problem or a generic one.
    // Usually titleText passed to createSheetElement. 
    // We can join titles? Or just "Mathe-Mix"?
    // The previous code grabbed text from selector.
    // Let's approximate:
    let currentTitle;
    if (type === 'custom') {
        currentTitle = T.ui.individuelleAufgaben || "Mix";
    } else {
        currentTitle = T.topics[type] || "Aufgaben";
    }

    // 2. Determine Page Count
    const pageCountInput = document.getElementById('pageCount');
    const pageCount = parseInt(document.getElementById('pageCount').value) || 1;

    // 3. Generate Data for ALL pages
    currentSheetsData = [];
    // availableTopics is already populated from Set above

    for (let i = 0; i < pageCount; i++) {
        const allowedCurrencies = [];
        if (document.getElementById('currencyCHF').checked) allowedCurrencies.push('CHF');
        if (document.getElementById('currencyEUR').checked) allowedCurrencies.push('EUR');
        if (allowedCurrencies.length === 0) allowedCurrencies.push('CHF'); // Default fallback

        const options = {
            marriedMultiplesOf10: document.getElementById('marriedMultiplesOf10').checked
        };

        const density = parseInt(document.getElementById('densitySlider').value) || 100;
        const capacity = Math.round(80 * (density / 100)); // 80 is PAGE_CAPACITY in problemGenerators

        currentSheetsData.push(genData(type, availableTopics, allowedCurrencies, options, lang, capacity));
    }
    // 4. Render
    renderCurrentState();

    // 5. Update URL & QR Codes
    updateURLState();
}

// Save current worksheet state to sessionStorage before navigating to geography game
function saveWorksheetState() {
    const state = {
        grade: currentGeneratorGrade,
        topic: Array.from(selectedGeneratorTopics).join(','),
        count: document.getElementById('pageCount').value,
        seed: globalSeed,
        lang: lang
    };
    sessionStorage.setItem('worksheetState', JSON.stringify(state));
}

export function updateURLState() {
    const params = new URLSearchParams();

    // Determine current section to filter parameters
    const section = getPageFromHash();
    const isGenerator = (section === 'generator');

    // Lang (always include)
    if (lang) {
        params.set('lang', lang);
    }

    // Generator-specific parameters
    if (isGenerator) {
        // Grade
        params.set('grade', currentGeneratorGrade);

        const topics = Array.from(selectedGeneratorTopics);
        let topicStr = '';

        // Topic & Custom
        if (topics.length > 1) {
            params.set('topic', 'custom');
            params.set('custom', topics.join(','));
            topicStr = 'custom';
        } else if (topics.length === 1) {
            params.set('topic', topics[0]);
            topicStr = topics[0];
        }

        // Page Count
        const count = document.getElementById('pageCount').value;
        params.set('count', count);

        // Options
        const showSolutions = document.getElementById('solutionToggle').checked;
        if (showSolutions) params.set('solutions', '1');

        const isCustom = (topicStr === 'custom');

        // Only set these parameters if they are relevant to the selected topic or custom mode
        if (topicStr === 'married_100' || isCustom) {
            const marriedMultiples = document.getElementById('marriedMultiplesOf10').checked;
            if (marriedMultiples) params.set('marriedM', '1');
        }

        if (topicStr === 'time_reading' || isCustom) {
            const showHours = document.getElementById('showHours').checked;
            if (showHours) params.set('showH', '1');

            const showMinutes = document.getElementById('showMinutes').checked;
            if (showMinutes) params.set('showM', '1');
        }

        const isMoney = topicStr === 'money_10' || topicStr === 'money_100';
        if (isMoney || isCustom) {
            const currencies = [];
            if (document.getElementById('currencyCHF').checked) currencies.push('CHF');
            if (document.getElementById('currencyEUR').checked) currencies.push('EUR');
            if (currencies.length > 0) params.set('currencies', currencies.join(','));
        }
    }

    // Global UI Settings
    if (document.getElementById('solutionToggle').checked) params.set('solutions', '1');
    if (document.getElementById('densitySlider').value !== '100') params.set('density', document.getElementById('densitySlider').value);
    if (document.getElementById('marriedMultiplesOf10').checked) params.set('marriedM', '1');

    // QR Code defaults to true now. If unchecked, we might track it, or just if checked.
    // If we want showQR to be default YES, we only need to track if it's NO? Or just track state.
    // Let's track expected state.
    if (document.getElementById('showQR').checked) {
        // Default is true? If we want a clean URL, we can omit if default.
        // Let's clear param if true (default), set to 0 if false.
        params.delete('showQR');
    } else {
        params.set('showQR', '0');
    }

    if (globalSeed) params.set('seed', globalSeed.toString());

    // Builder State
    if (hasBuilderContent()) {
        const buildState = getBuilderState();
        params.set('build', buildState);
    }

    const newUrl = `${window.location.pathname}#${section}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    // Also update QR Code on existing sheets
    renderQRCode(window.location.href);

    // Update language toggle buttons to reflect current state
    updateLanguageButtons();

    // Update navigation links to reflect current state
    updateNavigationLinks();
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

    // Width handling based on weight (4-column grid)
    const span = problemData.span || 4;
    problemDiv.style.gridColumn = `span ${span}`;

    // Height handling based on weight
    const rowSpan = Math.max(1, Math.round(problemData.weight / (span || 1)));
    problemDiv.style.gridRow = `span ${rowSpan}`;

    if (problemData.type === 'text') {
        problemDiv.style.flexDirection = 'column';
        problemDiv.style.alignItems = 'flex-start';
        problemDiv.style.borderBottom = '1px solid #eee';
        problemDiv.style.paddingBottom = '9px';

        const answerVal = isSolution ? problemData.a : '';
        const correctClass = isSolution ? 'correct-answer-show' : ''; // custom class if needed

        problemDiv.innerHTML = `
                    <div style="font-size: 14pt; margin-bottom:10px;"> ${problemData.q}</div>
                        <div style="display:flex; gap:10px; align-items:center; width:100%; justify-content: flex-end;">
                            <span>${T.ui.answerLabel}</span>
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
        problemDiv.style.gap = span === 1 ? '8px' : '15px'; // Consistent spacing

        const inputWidth = span === 1 ? '50px' : '60px';

        problemDiv.innerHTML = `
                <span class="number" style="text-align:right; width:auto;">${a}</span>
                <span class="operator" style="width:auto;">${op || '+'}</span>
                <input type="number" class="answer-input" style="width:${inputWidth}; text-align:center; ${style}" 
                       data-expected="${expected}" 
                       value="${val}"
                       oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
                <span class="equals" style="width:auto;">=</span>
                <span class="number" style="text-align:left; width:auto;">${sum}</span>
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
            `;

    } else if (problemData.type === 'doubling_halving') {
        const { subtype, val, answer } = problemData;
        const label = subtype === 'double' ? T.ui.doubleLabel : T.ui.halfLabel;
        // const icon = subtype === 'double' ? '✨2x' : '✂️½'; // Maybe too noisy? Text is engaging enough.

        const valAns = isSolution ? answer : '';
        const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

        problemDiv.innerHTML = `
                <div style="flex:1; display:flex; align-items:center; gap:5px;">
                    <span style="font-weight:bold; min-width:60px;">${label}</span>
                    <span class="number" style="text-align:center; font-size:1.1em;">${val}</span>
                </div>
                <span style="margin:0 5px;">➜</span>
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
                 <div style="margin-bottom:5px;">${T.ui.roundingLabel.replace('{val}', val).replace('{place}', place)}</div>
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

        } else if (isSolution && op === ':') {
            const sA = a.toString();
            const divisor = b;
            const quotient = answer;
            const sAns = quotient.toString();

            let stepsHtml = `<div class="written-vertical" style="align-items: flex-start; font-size:1.1rem; font-family:'Courier New', monospace; line-height: 1.2;">
                <div class="written-row" style="justify-content: flex-start; letter-spacing: 2px;">${sA} : ${divisor} = ${sAns}</div>`;

            let dividendIndex = 0;
            let currentVal = 0;

            for (let i = 0; i < sAns.length; i++) {
                const qDigit = parseInt(sAns[i]);

                // Pull down digits until we can divide
                if (i === 0) {
                    let firstValStr = "";
                    while (dividendIndex < sA.length) {
                        firstValStr += sA[dividendIndex];
                        dividendIndex++;
                        if (parseInt(firstValStr) >= divisor) break;
                    }
                    currentVal = parseInt(firstValStr);
                } else {
                    // Bring down NEXT digit from dividend
                    if (dividendIndex < sA.length) {
                        const nextDigitStr = sA[dividendIndex];
                        currentVal = parseInt(currentVal.toString() + nextDigitStr);
                        dividendIndex++;
                    }
                }

                const subtrahend = qDigit * divisor;
                const remainder = currentVal - subtrahend;

                // Render Subtrahend
                const subStr = subtrahend.toString();
                const subPadding = (dividendIndex - 1) - (subStr.length - 1);
                stepsHtml += `<div class="written-row" style="justify-content: flex-start; padding-left: ${subPadding}ch; border-bottom: 1px solid #000; width: fit-content;">-${subStr}</div>`;

                if (dividendIndex < sA.length) {
                    // Render Remainder + Next digit
                    const nextDigitChar = sA[dividendIndex];
                    const nextValToDisplay = remainder.toString() + nextDigitChar;
                    const remPadding = dividendIndex - (nextValToDisplay.length - 1);
                    stepsHtml += `<div class="written-row" style="justify-content: flex-start; padding-left: ${remPadding}ch;">${nextValToDisplay}</div>`;

                    // Preparation for next loop: currentVal becomes just the remainder
                    // BUT: The loop code will append sA[dividendIndex] to it.
                    // So we set currentVal to just the remainder here.
                    currentVal = remainder;
                } else {
                    // Final Remainder
                    const remStr = remainder.toString();
                    const remPadding = (dividendIndex - 1) - (remStr.length - 1);
                    stepsHtml += `<div class="written-row" style="justify-content: flex-start; padding-left: ${remPadding}ch;">${remStr}</div>`;
                }
            }

            stepsHtml += `</div>`;
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
                <svg viewBox="0 0 200 175" class="triangle-svg">
                    <polygon points="100,15 180,145 20,145" fill="none" stroke="#ddd" stroke-width="2"/>
                </svg>
                <div class="triangle-pos corner-top">${renderField(inner[0], inner[0], isInnerHidden)}</div>
                <div class="triangle-pos side-left">${renderField(outer[2], outer[2], !isInnerHidden)}</div>
                <div class="triangle-pos side-right">${renderField(outer[0], outer[0], !isInnerHidden)}</div>
                <div class="triangle-pos corner-left">${renderField(inner[2], inner[2], isInnerHidden)}</div>
                <div class="triangle-pos side-bottom">${renderField(outer[1], outer[1], !isInnerHidden)}</div>
                <div class="triangle-pos corner-right">${renderField(inner[1], inner[1], isInnerHidden)}</div>
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

    } else if (problemData.type === 'time_reading') {
        const { hours, minutes, answer } = problemData;
        const valAns = isSolution ? answer : '';
        const showHours = document.getElementById('showHours').checked;
        const showMinutes = document.getElementById('showMinutes').checked;

        const clockHtml = renderClock(hours, minutes, showHours, showMinutes);

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
                <span>${T.ui.answerLabel}</span>
                <input type="text" class="answer-input" style="width:60px;" 
                       data-expected="${answer}" 
                       value="${valAns}" 
                       oninput="validateInput(this)" 
                       ${isSolution ? 'readonly' : ''}>
                  <span>${T.ui.timeLabel}</span>
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
        let inputsHtml = '<div style="display:flex; align-items:center; gap:5px; margin-top:5px;">';
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

    } else if (problemData.type === 'money') {
        const { items, answer, currency } = problemData;
        // Format answer based on currency. 
        // CHF: 12.50
        // EUR: usually 12,50 but let's stick to dot for consistency unless user wants comma?
        // Let's stick to dot for input validation simplicity for now.
        const valAns = isSolution ? answer.toFixed(2) : '';
        const readonlyAttr = isSolution ? 'readonly' : '';
        const style = isSolution ? 'style="color:var(--primary-color); font-weight:bold;"' : '';

        problemDiv.style.flexDirection = 'column';
        problemDiv.style.alignItems = 'center';
        problemDiv.style.padding = '10px 0';
        problemDiv.style.gap = '10px';

        const COIN_IMAGES_CHF = {
            '5': basePath + 'images/coins/CHF/smt_coin_5_fr_back.png',
            '2': basePath + 'images/coins/CHF/smt_coin_2_fr_back.png',
            '1': basePath + 'images/coins/CHF/smt_coin_1_fr_back.png',
            '0.5': basePath + 'images/coins/CHF/smt_coin_50rp_back.png',
            '0.2': basePath + 'images/coins/CHF/smt_coin_20rp_back.png',
            '0.1': basePath + 'images/coins/CHF/smt_coin_10rp_back.png',
            '0.05': basePath + 'images/coins/CHF/smt_coin_5rp_back.png'
        };

        const COIN_IMAGES_EUR = {
            '2': basePath + 'images/coins/EUR/Common_face_of_two_euro_coin_(2007).jpg',
            '1': basePath + 'images/coins/EUR/Common_face_of_one_euro_coin.png',
            '0.5': basePath + 'images/coins/EUR/50_eurocent_common_2007.png',
            '0.2': basePath + 'images/coins/EUR/20_eurocent_common_2007.png',
            '0.1': basePath + 'images/coins/EUR/10_eurocent_common_2007.png',
            '0.05': basePath + 'images/coins/EUR/5_eurocent_common_1999.png', // This was missing, added placeholder
            '0.02': basePath + 'images/coins/EUR/2_eurocent_common_1999.png',
            '0.01': basePath + 'images/coins/EUR/1_cent_euro_coin_common_side.png'
        };
        // Wait, did I list 5 cent in EUR?
        // checking list_dir output from earlier...
        // 50_eurocent_common_2007.png
        // 20_eurocent_common_2007.png
        // 10_eurocent_common_2007.png
        // 2_eurocent_common_1999.png
        // 1_cent_euro_coin_common_side.png
        // MISSING 5 cent in list? 
        // I will update COIN_IMAGES_EUR with what I have.

        const COIN_IMAGES = (currency === 'EUR') ? COIN_IMAGES_EUR : COIN_IMAGES_CHF;


        const NOTE_IMAGES_CHF = {
            '10': basePath + 'images/banknotes/CHF/CHF10_8_front.jpg',
            '20': basePath + 'images/banknotes/CHF/CHF20_8_front.jpg',
            '50': basePath + 'images/banknotes/CHF/CHF50_8_front.jpg',
            '100': basePath + 'images/banknotes/CHF/CHF100_8_front.jpg',
            '200': basePath + 'images/banknotes/CHF/CHF200_8_front.jpg',
            '1000': basePath + 'images/banknotes/CHF/CHF1000_8_front.jpg'
        };

        const NOTE_IMAGES_EUR = {
            '5': basePath + 'images/banknotes/EUR/EUR_5_obverse_(2002_issue).jpg',
            '10': basePath + 'images/banknotes/EUR/EUR_10_obverse_(2002_issue).jpg',
            '20': basePath + 'images/banknotes/EUR/EUR_20_obverse_(2002_issue).jpg',
            '50': basePath + 'images/banknotes/EUR/EUR_50_obverse_(2002_issue).jpg',
            '100': basePath + 'images/banknotes/EUR/EUR_100_obverse_(2002_issue).jpg',
            '200': basePath + 'images/banknotes/EUR/EUR_200_obverse_(2002_issue).jpg',
            '500': basePath + 'images/banknotes/EUR/EUR_500_obverse_(2002_issue).jpg'
        };

        const NOTE_IMAGES = (currency === 'EUR') ? NOTE_IMAGES_EUR : NOTE_IMAGES_CHF;

        const COIN_SCALES = {
            '5': 76,
            '2': 66,
            '1': 56,
            '0.5': 44,
            '0.2': 50,
            '0.1': 46,
            '0.05': 42,
            '0.02': 38,
            '0.01': 34
        };

        const banknotes = items.filter(val => val >= 5); // EUR has 5 note. CHF starts at 10.
        // Wait, CHF 5 is a coin. EUR 5 is a note.
        // Generator logic distinguishes?
        // In generator, coins array vs notes array. 
        // items is just a list of values.
        // We need to know if 5 is coin or note.
        // For CHF, 5 is in coins array. For EUR, 5 is in notes array.
        // We can check if value exists in NOTE_IMAGES.

        const isNote = (val) => !!NOTE_IMAGES[val.toString()];

        const banknoteItems = items.filter(val => isNote(val));
        const coinItems = items.filter(val => !isNote(val));

        let itemsHtml = '<div class="money-collection" style="display:flex; flex-direction:column; align-items:center; gap:10px; max-width:400px; min-height:100px;">';

        // Banknotes Container
        if (banknoteItems.length > 0) {
            const overlapClass = banknoteItems.length >= 2 ? 'overlapping' : '';
            itemsHtml += `<div class="banknotes-container ${overlapClass}" style="display:flex; flex-wrap:nowrap; justify-content:center; align-items:center;">`;
            banknoteItems.forEach((val, idx) => {
                const imgPath = NOTE_IMAGES[val.toString()] || '';
                const label = val + (currency === 'EUR' ? ' €' : ' Fr.');
                if (imgPath) {
                    itemsHtml += `<img src="${imgPath}" class="money-note-img" style="width:107px; height:auto; object-fit:contain; border-radius:2px; box-shadow:1px 2px 4px rgba(0,0,0,0.2); z-index:${idx};" alt="${label}">`;
                } else {
                    itemsHtml += `<div class="money-note m-${val}">${label}</div>`;
                }
            });
            itemsHtml += '</div>';
        }

        // Coins Container
        if (coinItems.length > 0) {
            itemsHtml += '<div class="coins-container" style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px; align-items:center;">';
            coinItems.forEach(val => {
                let label = '';
                if (currency === 'EUR') {
                    label = val < 1 ? (Math.round(val * 100)) + ' ct.' : val + ' €';
                } else {
                    label = val < 1 ? (Math.round(val * 100)) + ' Rp.' : val + ' Fr.';
                }

                const imgPath = COIN_IMAGES[val.toString()] || '';
                const size = COIN_SCALES[val.toString()] || 50;
                if (imgPath) {
                    itemsHtml += `<img src="${imgPath}" class="money-coin-img" style="width:${size}px; height:${size}px; object-fit:contain;" alt="${label}">`;
                } else {
                    // Fallback visual
                    itemsHtml += `<div class="money-coin m-${val.toString().replace('.', '_')}">${label}</div>`;
                }
            });
            itemsHtml += '</div>';
        }

        itemsHtml += '</div>';

        const unitLabel = currency === 'EUR' ? '€' : 'Fr.';
        const inputHtml = `<div style="display:flex; align-items:center; gap:10px; font-weight:bold;">
            <span>${T.ui.totalLabel}</span>
            <input type="number" step="${currency === 'EUR' ? '0.01' : '0.05'}" class="answer-input" style="width:100px;" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
            <span>${unitLabel}</span>
        </div>`;

        problemDiv.innerHTML = itemsHtml + inputHtml;

    } else if (problemData.type === 'time_analog_set') {
        const { hours, minutes, digital } = problemData;

        problemDiv.style.flexDirection = 'column';
        problemDiv.style.alignItems = 'center';
        problemDiv.style.gap = '10px';

        // For solutions, show correct hands. For problems, show empty clock in print.
        // In interactive mode (screen), we'll show hands at 12:00.
        const clockHtml = renderClock(hours, minutes, false, false, isSolution);
        const displayHtml = `<div style="font-size: 1.4rem; font-weight: bold; margin-bottom: 5px;">${digital}</div>`;

        if (!isSolution) {
            const interactiveClock = renderClock(12, 0, false, false, true);
            const hourControls = `
                <div class="time-control-group no-print">
                    <span class="time-label">Std</span>
                    <div class="arrow-stack">
                        <button class="btn-arrow" 
                            onmousedown="startTimeAdjustment(this, 'h', 1)" 
                            onmouseup="stopTimeAdjustment()" 
                            onmouseleave="stopTimeAdjustment()"
                            ontouchstart="startTimeAdjustment(this, 'h', 1)"
                            ontouchend="stopTimeAdjustment()">▲</button>
                        <button class="btn-arrow" 
                            onmousedown="startTimeAdjustment(this, 'h', -1)" 
                            onmouseup="stopTimeAdjustment()" 
                            onmouseleave="stopTimeAdjustment()"
                            ontouchstart="startTimeAdjustment(this, 'h', -1)"
                            ontouchend="stopTimeAdjustment()">▼</button>
                    </div>
                </div>
            `;
            const minuteControls = `
                <div class="time-control-group no-print">
                    <span class="time-label">Min</span>
                    <div class="arrow-stack">
                        <button class="btn-arrow" 
                            onmousedown="startTimeAdjustment(this, 'm', ${problemData.isComplex ? 1 : 5})" 
                            onmouseup="stopTimeAdjustment()" 
                            onmouseleave="stopTimeAdjustment()"
                            ontouchstart="startTimeAdjustment(this, 'm', ${problemData.isComplex ? 1 : 5})"
                            ontouchend="stopTimeAdjustment()">▲</button>
                        <button class="btn-arrow" 
                            onmousedown="startTimeAdjustment(this, 'm', ${problemData.isComplex ? -1 : -5})" 
                            onmouseup="stopTimeAdjustment()" 
                            onmouseleave="stopTimeAdjustment()"
                            ontouchstart="startTimeAdjustment(this, 'm', ${problemData.isComplex ? -1 : -5})"
                            ontouchend="stopTimeAdjustment()">▼</button>
                    </div>
                </div>
            `;

            problemDiv.innerHTML = `
                ${interactiveClock}
                <div class="clock-bottom-controls">
                    ${hourControls}
                    ${displayHtml}
                    ${minuteControls}
                </div>
            `;
            problemDiv.dataset.type = 'time_analog_set';
            problemDiv.dataset.targetH = hours % 12;
            problemDiv.dataset.targetM = minutes;
            problemDiv.dataset.currH = 12;
            problemDiv.dataset.currM = 0;
        } else {
            problemDiv.innerHTML = clockHtml + displayHtml;
        }

    } else if (problemData.type === 'word_types') {
        problemDiv.dataset.type = 'word_types';
        problemDiv.style.flexDirection = 'row';
        problemDiv.style.flexWrap = 'wrap';
        problemDiv.style.justifyContent = 'flex-start';
        problemDiv.style.gap = '8px';
        problemDiv.style.lineHeight = '0.5';
        problemDiv.style.fontSize = '1.3rem';

        let sentenceHtml = "";

        problemData.sentence.forEach((word, idx) => {
            let style = "";
            const isPunctuation = ['.', '!', '?', ',', ';', ':'].includes(word.text);
            const punctuationStyle = isPunctuation ? 'margin-left: -8px;' : '';

            if (isSolution) {
                if (word.type === 'noun') style = "border-bottom: 3px solid red;";
                else if (word.type === 'verb') style = "border-bottom: 3px solid blue;";
                else if (word.type === 'adj') style = "border-bottom: 3px solid green;";
                else if (word.type === 'artikel') style = "border-bottom: 3px solid orange;";

                sentenceHtml += `<span style="${style} padding:0 2px; ${punctuationStyle}">${word.text}</span>`;
            } else {
                sentenceHtml += `<span class="interactive-word" 
                    data-type="${word.type}" 
                    data-state="none"
                    style="${punctuationStyle}"
                    onclick="toggleWordType(this)">${word.text}</span>`;
            }
        });
        problemDiv.innerHTML = sentenceHtml;

    } else if (problemData.type === 'standard') {
        // Reuse standard logic but explicitly handle here if needed, or fall through?
        // actually 'standard' maps to default block below if we don't catch it.
        // But wait, the default block expects {a, b, op} directly on problemData or construct.
        // My generateProblem returns {type:'standard', ...}.
        // So I need to set vars for the fall-through or render here.

        const { a, b, op, answer } = problemData;
        const valAns = isSolution ? answer : '';

        problemDiv.style.justifyContent = 'center';
        problemDiv.style.gap = span === 1 ? '8px' : '15px';
        const inputWidth = span === 1 ? '50px' : '65px';

        problemDiv.innerHTML = `
            <span class="number" style="width:auto;">${a}</span>
            <span class="operator" style="width:auto;">${op}</span>
            <span class="number" style="width:auto;">${b}</span>
            <span class="equals" style="width:auto;">=</span>
            <input type="number" class="answer-input" style="width:${inputWidth}; text-align:center;" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
        `;

    } else if (problemData.type === 'unit_conv') {
        const { val, from, to, answer } = problemData;
        const valAns = isSolution ? answer : '';
        const readonlyAttr = isSolution ? 'readonly' : '';
        const style = isSolution ? 'style="color:var(--primary-color); font-weight:bold;"' : '';

        problemDiv.style.justifyContent = 'center';
        problemDiv.style.gap = '10px';

        problemDiv.innerHTML = `
            <span class="number" style="width:auto;">${val} ${from}</span>
            <span class="equals" style="width:auto;">=</span>
            <input type="number" class="answer-input" style="width:80px; text-align:center;" data-expected="${answer}" value="${valAns}" oninput="validateInput(this)" ${readonlyAttr} ${style}>
            <span class="unit" style="width:auto;">${to}</span>
        `;

    } else {
        // Legacy Fallback (for Grade 1 types)
        // Check if we have standard arithmetic props
        if (problemData.a !== undefined && problemData.op) {
            const { a, b, op } = problemData;
            let expected;
            if (op === '+') expected = a + b;
            else if (op === '-') expected = a - b;
            else if (op === '×') expected = a * b;
            else if (op === ':') expected = a / b;

            const val = isSolution ? expected : '';
            const style = isSolution ? 'color:var(--primary-color); font-weight:bold;' : '';

            problemDiv.style.justifyContent = 'center';
            problemDiv.style.gap = span === 1 ? '8px' : '15px';
            const inputWidth = span === 1 ? '50px' : '65px';

            problemDiv.innerHTML = `
                <span class="number" style="width:auto;">${a}</span>
                <span class="operator" style="width:auto;">${op}</span>
                <span class="number" style="width:auto;">${b}</span>
                <span class="equals" style="width:auto;">=</span>
                <input type="number" class="answer-input" style="width:${inputWidth}; ${style}" data-expected="${expected}" value="${val}" oninput="validateInput(this)" ${isSolution ? 'readonly' : ''}>
            `;
        } else {
            // Generic Error Fallback for missing types
            console.warn('Unknown problem type:', problemData.type, problemData);
            problemDiv.innerHTML = `<div style="color:#aaa; font-size:10px; padding:5px; text-align:center;">Type: ${problemData.type}<br>(Not rendered)</div>`;
        }
    }
    return problemDiv;
}

export function createSheetElement(titleText, problemDataList, isSolution, pageInfo, isEditable = false) {
    // Create Sheet
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'sheet';

    // QR Code Container
    // QR Code Container
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-container';
    if (!document.getElementById('showQR').checked) {
        qrContainer.classList.add('qr-hidden');
    }
    sheetDiv.appendChild(qrContainer);

    // Sheet Logo (Top Left)
    // Sheet Logo (Top Left)
    const sheetLogo = document.createElement('img');
    sheetLogo.src = basePath + 'images/logo/logo_ufzgiblatt1_text_below_centered.png';
    sheetLogo.className = 'sheet-logo';
    // Logo is always visible now
    sheetDiv.appendChild(sheetLogo);

    // Header
    const header = document.createElement('div');
    header.className = 'sheet-header';
    header.innerHTML = `
                                                                                    <div style="width:200px;"></div> <!-- Spacer for Logo -->
                                                                                    <div style="display:flex; gap: 40px;">
                                                                                         <div class="header-field">${T.ui.headerName} <span class="line"></span></div>
                                                                                         <div class="header-field">${T.ui.headerDate} <span class="line"></span></div>
                                                                                    </div>
                                                                                    <div style="width:100px;"></div> <!-- Spacer for QR Code -->
                                                                                    `;
    sheetDiv.appendChild(header);

    // Title
    const h1 = document.createElement('h1');
    h1.textContent = titleText + (isSolution ? T.ui.solutionsSuffix : '');
    if (isSolution) h1.style.color = '#27ae60';

    if (isEditable && !isSolution) {
        h1.contentEditable = "true";
        h1.style.outline = "1px dashed #ccc"; // visual cue
        h1.style.minWidth = "200px";
        h1.oninput = function () {
            if (window.updateBuilderTitle) {
                window.updateBuilderTitle(this.textContent);
            }
        };
        h1.onkeydown = function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        };
        // Remove visual cue on blur? Or keep it? Perhaps hidden in print.
        // Let's rely on CSS for print hiding cues.
    }

    sheetDiv.appendChild(h1);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'problem-grid';

    // Check layout needs
    // We can infer layout from the first problem or pass it as arg
    // But existing code checked 'type' string. Let's inspect first problem to guess or stick to global 'type' passed down?
    // Simplest is to pass the 'type' string to this function or check content.
    // problemDataList[0].type ...

    const isPyramid = problemDataList.length > 0 && problemDataList[0].type === 'pyramid';
    const isGeo = false;

    problemDataList.forEach(p => {
        grid.appendChild(createProblemElement(p, isSolution));
    });

    sheetDiv.appendChild(grid);

    if (problemDataList.length > 0 && problemDataList[0].type === 'word_types' && !isSolution) {
        const legend = document.createElement('div');
        legend.className = 'word-types-legend';
        legend.innerHTML = `
            <div class="legend-item" data-type="noun" onclick="setActiveWordType('noun')"><div class="legend-color" style="background:red"></div> ${T.ui.wordTypesLegend.noun}</div>
            <div class="legend-item" data-type="verb" onclick="setActiveWordType('verb')"><div class="legend-color" style="background:blue"></div> ${T.ui.wordTypesLegend.verb}</div>
            <div class="legend-item" data-type="adj" onclick="setActiveWordType('adj')"><div class="legend-color" style="background:green"></div> ${T.ui.wordTypesLegend.adj}</div>
            <div class="legend-item" data-type="artikel" onclick="setActiveWordType('artikel')"><div class="legend-color" style="background:orange"></div> ${T.ui.wordTypesLegend.artikel}</div>
            <div class="legend-item" data-type="none" onclick="setActiveWordType('none')"><div class="legend-color" style="background:#888; height: 10px; width: 10px; border-radius: 2px;"></div> ${T.ui.wordTypesLegend.eraser}</div>
            <div style="font-style:italic; margin-left:10px;">${T.ui.wordTypesLegend.instruction}</div>
        `;
        sheetDiv.insertBefore(legend, grid);
    }

    // Layout adjustments: Removed Mascot and Footer per user request NO WAIT - User wants Page Numbers now.
    const footer = document.createElement('div');
    footer.className = 'sheet-footer';

    // Page numbering
    if (pageInfo) {
        footer.textContent = `${pageInfo.current}${isSolution ? T.ui.solutionsSuffix : ''}`;
    }

    sheetDiv.appendChild(footer);

    return sheetDiv;
}



// Stores an array of problem sets, one for each page. 
// e.g. [ [problem1, problem2...], [problem1, problem2...] ]
let currentSheetsData = [];
let currentTitle = "";



export function renderCurrentState() {
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
            wrapper.appendChild(solutionSheet);
        }
    });
    updateURLState();
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

window.setupFocusNavigation = function () {
    const wrapper = document.getElementById('sheetsWrapper');
    if (!wrapper) return;

    // Use event delegation on the wrapper to catch Enter key on any input
    wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const target = e.target;
            // Check if it's one of our answer inputs
            if (target.matches('.answer-input, .rechenstrich-input, .house-input, .brick-input, .triangle-field')) {
                e.preventDefault(); // Prevent accidental form submission or other default behaviors

                // Find all visible, non-readonly numeric inputs in the worksheet
                const allInputs = Array.from(wrapper.querySelectorAll('input:not([readonly])'));
                const currentIndex = allInputs.indexOf(target);

                if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
                    const nextInput = allInputs[currentIndex + 1];
                    nextInput.focus();

                    // Optional: highlight text for easier overwriting
                    if (nextInput.type === 'number' || nextInput.type === 'text') {
                        nextInput.select();
                    }

                    // Smooth scroll into view if hidden (especially useful for mobile)
                    nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });

    // Track First Interaction (Work Started)
    wrapper.addEventListener('input', (e) => {
        if (!workStarted && e.target.tagName === 'INPUT') {
            workStarted = true;

            const topics = Array.from(selectedGeneratorTopics);
            let topicStr = '';
            let customStr = '';

            if (topics.length > 1) {
                topicStr = 'custom';
                customStr = topics.join(',');
            } else if (topics.length === 1) {
                topicStr = topics[0];
            } else {
                topicStr = 'unknown';
            }

            const props = {
                grade: currentGeneratorGrade,
                topic: topicStr,
                count: document.getElementById('pageCount').value,
                lang: lang
            };
            if (topicStr === 'custom') {
                props.custom_modules = customStr;
            }
            trackEvent('work_started', props);
        }
    });
};

// Initialize on load
function init() {
    applyTranslations();
    updateLanguageButtons();
    try {
        // 1. Initial UI Setup (Defaults)
        // Grade 2 is default in HTML

        // 2. Load State from URL
        loadStateFromURL();

        const qrDiv = document.getElementById('qrCodeContainer');
        if (qrDiv && qrDiv.innerHTML === '') {
            // new QRCode(qrDiv, ...); 
            // We'll init later or lazily
        }

        // 3. Generate initial sheet
        // If seed was loaded, generateSheet(true) will use it.
        // Otherwise it will generate a new one.
        generateSheet(true);

        // 4. Scale
        autoScaleSheet();

        // Check for Shared URL (deep linking)
        const params = new URLSearchParams(window.location.search);
        const isShared = params.has('seed') || params.has('topic');

        // Track Page View
        // Track Page View
        // Derive props safely
        const topics = Array.from(selectedGeneratorTopics);
        const topicStr = topics.length > 1 ? 'custom' : (topics[0] || 'unknown');

        trackEvent('page_view', {
            grade: currentGeneratorGrade,
            topic: topicStr,
            is_shared_url: isShared,
            hostname: window.location.hostname,
            path: window.location.pathname,
            lang: lang
        });

        // 5. Setup Focus Navigation
        setupFocusNavigation();

        // 6. Update Language Buttons state
        updateLanguageButtons();

        // 7. Update navigation links with current language
        updateNavigationLinks();

        // 8. Setup Section Navigation
        setupSectionNavigation();

        // 9. Init Builder
        initBuilder();
    } catch (e) {
        console.error("Initialization Error:", e);
        alert("Fehler beim Starten: " + e.message);
    }
}

function loadStateFromURL() {
    // First, check if we have saved state from geography game navigation
    const savedState = sessionStorage.getItem('worksheetState');
    if (savedState) {
        const state = JSON.parse(savedState);

        // Restore state
        // Restore state
        if (state.grade) currentGeneratorGrade = state.grade;

        selectedGeneratorTopics.clear();
        if (state.topic) {
            if (state.topic.includes(',')) {
                state.topic.split(',').forEach(t => selectedGeneratorTopics.add(t));
            } else {
                selectedGeneratorTopics.add(state.topic);
            }
        }

        // Re-render
        renderGeneratorTabs();
        renderGeneratorChips();

        const pageCount = document.getElementById('pageCount');
        if (pageCount) pageCount.value = state.count;

        setSeed(state.seed);

        // Clear the saved state
        sessionStorage.removeItem('worksheetState');

        // Update URL to reflect restored state
        updateURLState();
        return;
    }

    const params = getURLParams();

    // IMPORTANT: Load seed FIRST before any handlers that might call generateSheet()
    // 1. Seed
    if (params.has('seed')) {
        setSeed(parseInt(params.get('seed')));
        // We will call generateSheet(true) in init to use this seed
    }

    // 2. Grade
    if (params.has('grade')) {
        currentGeneratorGrade = params.get('grade');
    }

    // 3. Topic & Custom
    selectedGeneratorTopics.clear();
    const topicParam = params.get('topic');
    const customParam = params.get('custom');

    if (topicParam === 'custom' && customParam) {
        customParam.split(',').forEach(t => selectedGeneratorTopics.add(t));
    } else if (topicParam && topicParam !== 'custom') {
        selectedGeneratorTopics.add(topicParam);
    } else {
        // Fallback default
        const topics = GRADE_TOPICS_STRUCTURE[currentGeneratorGrade] || [];
        if (topics.length > 0) selectedGeneratorTopics.add(topics[0]);
    }

    // Render UI
    renderGeneratorTabs();
    renderGeneratorChips();

    // 4. Count
    if (params.has('count')) {
        const count = params.get('count');
        const pageInput = document.getElementById('pageCount');
        if (pageInput) {
            pageInput.value = count;
        }
    }

    // 5. Options
    if (params.has('solutions')) {
        document.getElementById('solutionToggle').checked = params.get('solutions') === '1';
    }
    if (params.has('density')) {
        document.getElementById('densitySlider').value = params.get('density');
    }
    if (params.has('marriedM')) {
        document.getElementById('marriedMultiplesOf10').checked = params.get('marriedM') === '1';
    }
    if (params.has('hideQR')) {
        document.getElementById('hideQR').checked = params.get('hideQR') === '1';
    }
    if (params.has('showQR')) {
        document.getElementById('showQR').checked = params.get('showQR') !== '0';
    }
    if (params.has('showH')) {
        document.getElementById('showHours').checked = params.get('showH') === '1';
    }
    if (params.has('showM')) {
        document.getElementById('showMinutes').checked = params.get('showM') === '1';
    }

    if (params.has('currencies')) {
        const curs = params.get('currencies').split(',');
        document.getElementById('currencyCHF').checked = curs.includes('CHF');
        document.getElementById('currencyEUR').checked = curs.includes('EUR');
    }
    // Backward compatibility for single 'currency' param? usually not needed if we deprecated it immediately. 
    // But good for robustness:
    if (params.has('currency')) {
        const c = params.get('currency');
        document.getElementById('currencyCHF').checked = (c === 'CHF');
        document.getElementById('currencyEUR').checked = (c === 'EUR');
    }

}

function toggleQRVisibility() {
    const show = document.getElementById('showQR').checked;
    const qrContainers = document.querySelectorAll('.qr-code-container');
    qrContainers.forEach(container => {
        if (!show) {
            container.classList.add('qr-hidden');
        } else {
            container.classList.remove('qr-hidden');
        }
    });
    updateURLState();
}

function renderQRCode(url) {
    const containers = document.querySelectorAll('.qr-code-container');
    containers.forEach(container => {
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        QRCode.toCanvas(canvas, url, {
            width: 100,
            margin: 0,
            color: {
                dark: "#000000",
                light: "#ffffff"
            },
            errorCorrectionLevel: 'L'
        }, function (error) {
            if (error) {
                console.warn('QR code generation failed:', error);
                container.innerHTML = '<div style="font-size: 10px; color: #999; text-align: center; border: 1px dashed #ccc; padding: 4px; height: 100%; display: flex; align-items: center; justify-content: center; line-height: 1.2;">QR Error</div>';
            }
        });
    });
}


function renderClock(hours, minutes, showHours = false, showMinutes = false, showHands = true) {
    let html = '<div class="clock-face"><div class="clock-center"></div>';

    // Hours (Inner, Green)
    if (showHours) {
        for (let i = 1; i <= 12; i++) {
            const angleDeg = i * 30;
            // Radius: 30 (inner)
            html += `<div class="clock-number-hour" style="transform: rotate(${angleDeg}deg) translate(0, -38px) rotate(-${angleDeg}deg)">${i}</div>`;
        }
    }

    // Minutes (Outer, BlueViolet)
    if (showMinutes) {
        for (let i = 1; i <= 12; i++) {
            const angleDeg = i * 30;
            const minVal = i * 5;
            // Radius: 65 (outer, extended)
            html += `<div class="clock-number-minute" style="transform: rotate(${angleDeg}deg) translate(0, -65px) rotate(-${angleDeg}deg)">${minVal}</div>`;
        }
    }

    for (let i = 0; i < 12; i++) {
        const deg = i * 30;
        html += `<div class="clock-marker" style="transform: rotate(${deg}deg) translate(0, 2px)"></div>`;
    }

    const minDeg = minutes * 6;
    const hourDeg = (hours % 12) * 30 + minutes * 0.5;

    // Hand colors
    const hColor = showHours ? 'green' : '#333';
    const mColor = showMinutes ? 'blueviolet' : '#000';

    if (showHands) {
        html += `<div class="clock-hand hand-hour" style="background:${hColor}; transform: rotate(${hourDeg}deg)"></div>`;
        html += `<div class="clock-hand hand-minute" style="background:${mColor}; transform: rotate(${minDeg}deg)"></div>`;
    }
    html += '</div>';
    return html;
}

window.adjustTime = function (btn, type, amount = 1) {
    const problem = btn.closest('.problem');
    let h = parseInt(problem.dataset.currH);
    let m = parseInt(problem.dataset.currM);

    if (type === 'h') {
        h = (h + amount) % 12;
        if (h <= 0) h += 12;
    } else {
        m = (m + amount + 60) % 60;
    }

    problem.dataset.currH = h;
    problem.dataset.currM = m;

    const hourHand = problem.querySelector('.hand-hour');
    const minHand = problem.querySelector('.hand-minute');

    const minDeg = m * 6;
    const hourDeg = (h % 12) * 30 + m * 0.5;

    hourHand.style.transform = `rotate(${hourDeg}deg)`;
    minHand.style.transform = `rotate(${minDeg}deg)`;

    // Check if correct
    const targetH = parseInt(problem.dataset.targetH);
    const targetM = parseInt(problem.dataset.targetM);

    problem.classList.remove('correct', 'incorrect');
    if (h % 12 === targetH % 12 && m === targetM) {
        problem.classList.add('correct');
    }
};

let adjustmentInterval = null;

window.startTimeAdjustment = function (btn, type, amount) {
    adjustTime(btn, type, amount);
    adjustmentInterval = setInterval(() => {
        adjustTime(btn, type, amount);
    }, 150);
};

window.stopTimeAdjustment = function () {
    if (adjustmentInterval) {
        clearInterval(adjustmentInterval);
        adjustmentInterval = null;
    }
};

window.onload = init;

window.saveCurrentState = function () {
    updateURLState(); // Sync current state to URL
    const params = window.location.search;
    if (!params) {
        alert(T.ui.saveNothing);
        return;
    }

    const topics = Array.from(selectedGeneratorTopics);
    let topicName;
    if (topics.length > 1) {
        topicName = T.ui.individuelleAufgaben || "Mix";
    } else if (topics.length === 1) {
        topicName = T.topics[topics[0]] || topics[0];
    } else {
        topicName = "Arbeitsblatt";
    }

    const defaultName = `${topicName} (${new Date().toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-US')})`;
    const name = prompt(T.ui.savePrompt, defaultName);
    if (name === null) return; // Cancelled

    const saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');
    saved.push({
        id: Date.now(),
        name: name || defaultName,
        params: params,
        timestamp: new Date().toLocaleString(lang === 'de' ? 'de-CH' : 'en-US')
    });

    localStorage.setItem('ufzgiblatt_saved', JSON.stringify(saved));
    alert(T.ui.saveSuccess);
};

window.toggleSavedModal = function () {
    const modal = document.getElementById('savedModal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        renderSavedList();
        modal.style.display = 'block';
    }
};

window.renderSavedList = function () {
    const list = document.getElementById('savedList');
    const saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');

    if (saved.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding: 20px;">${T.ui.noSavedWorksheets}</p>`;
        return;
    }

    // Sort by most recent
    saved.sort((a, b) => b.id - a.id);

    list.innerHTML = saved.map(item => `
        <div class="saved-item">
            <div class="saved-item-info">
                <span class="saved-item-name">${item.name}</span>
                <span class="saved-item-date">${item.timestamp}</span>
            </div>
            <div class="saved-item-actions">
                <button class="btn-load" onclick="loadSavedState(${item.id})">${T.ui.btnLoad}</button>
                <button class="btn-delete" onclick="deleteSavedState(${item.id})">${T.ui.btnDelete}</button>
            </div>
        </div>
    `).join('');
};

window.loadSavedState = function (id) {
    const saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');
    const item = saved.find(s => s.id === id);
    if (!item) return;

    // Apply the saved parameters to the URL and reload
    window.history.replaceState({}, '', window.location.pathname + item.params);
    loadStateFromURL();
    generateSheet(true);
    toggleSavedModal();
};

window.deleteSavedState = function (id) {
    if (!confirm(T.ui.confirmDelete)) return;

    let saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');
    saved = saved.filter(s => s.id !== id);
    localStorage.setItem('ufzgiblatt_saved', JSON.stringify(saved));
    renderSavedList();
};

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

// --- Interactive Word Types Logic ---
let activeWordType = 'none';

window.setActiveWordType = function (type) {
    activeWordType = type;
    // Update legend item visual states (they exist in the DOM inside sheets)
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.type === type) {
            item.classList.add('active');
        }
    });

    // Update cursor style based on word type
    const problems = document.querySelectorAll('.problem[data-type="word_types"]');
    problems.forEach(problem => {
        // Remove all cursor classes
        problem.classList.remove('cursor-noun', 'cursor-verb', 'cursor-adj', 'cursor-artikel', 'cursor-eraser');

        // Add appropriate cursor class
        if (type === 'noun') {
            problem.classList.add('cursor-noun');
        } else if (type === 'verb') {
            problem.classList.add('cursor-verb');
        } else if (type === 'adj') {
            problem.classList.add('cursor-adj');
        } else if (type === 'artikel') {
            problem.classList.add('cursor-artikel');
        } else if (type === 'none') {
            problem.classList.add('cursor-eraser');
        }
    });
};

window.toggleWordType = function (el) {
    const currentState = el.dataset.state;
    const nextState = activeWordType || 'none';

    // If clicking with the same type, clear it.
    // If clicking with a different type, update it.
    const newState = (currentState === nextState) ? 'none' : nextState;

    el.dataset.state = newState;

    // Remove all marked classes
    el.classList.remove('marked-noun', 'marked-verb', 'marked-adj', 'marked-artikel');

    // Add new class if not 'none'
    if (newState === 'noun') el.classList.add('marked-noun');
    else if (newState === 'verb') el.classList.add('marked-verb');
    else if (newState === 'adj') el.classList.add('marked-adj');
    else if (newState === 'artikel') el.classList.add('marked-artikel');

    validateWord(el);
};

window.validateWord = function (el) {
    const expected = el.dataset.type; // noun, verb, adj, other
    const actual = el.dataset.state;  // noun, verb, adj, none

    el.classList.remove('correct', 'incorrect');

    if (actual === 'none') {
        // Neutral state, remove feedback classes
        return;
    }

    if (expected === actual) {
        el.classList.add('correct');
        checkAllDone();
    } else {
        el.classList.add('incorrect');
    }
}


// --- SECTION NAVIGATION ---
function setupSectionNavigation() {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    function showSection(hash) {
        // Handle params in hash (e.g. #builder?lang=de)
        const targetId = getPageFromHash();

        sections.forEach(s => {
            s.classList.remove('active-section');
            if (s.id === targetId) s.classList.add('active-section');
        });
        links.forEach(l => {
            l.classList.remove('active');
            // Check if link href matches the target section ID
            const rawHref = l.getAttribute('href');
            if (rawHref) {
                const href = rawHref.replace('#', '');
                if (href === targetId) {
                    l.classList.add('active');
                }
            }
        });
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            // Hash will change, triggering the listener below
        });
    });

    window.addEventListener('hashchange', () => {
        showSection(window.location.hash);
        updateURLState();
    });

    // Handle initial load
    showSection(window.location.hash);
}

function updateNavigationLinks() {
    // Update geography game links to only include lang and seed
    const geoLinks = document.querySelectorAll('a[href*="geography-game"]');

    geoLinks.forEach(link => {
        const params = getURLParams();
        const simplifiedParams = new URLSearchParams();
        if (params.has('lang')) simplifiedParams.set('lang', params.get('lang'));
        if (params.has('seed')) simplifiedParams.set('seed', params.get('seed'));

        link.href = `geography-game?${simplifiedParams.toString()}`;

        // Save worksheet state before navigating
        link.onclick = (e) => {
            saveWorksheetState();
            // Let the link navigate normally
        };
    });
}


// --- INITIALIZATION ---
// execute init on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Setup Section Navigation (Moved inside initialization flow or called directly)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSectionNavigation);
} else {
    setupSectionNavigation();
}

function updateLanguageButtons() {
    const pairs = [
        { de: 'lang-de-header', en: 'lang-en-header' }
    ];

    const params = getURLParams();

    pairs.forEach(pair => {
        const deEl = document.getElementById(pair.de);
        const enEl = document.getElementById(pair.en);

        if (deEl && enEl) {
            if (lang === 'de') {
                deEl.classList.add('active');
                deEl.href = 'javascript:void(0)';
                enEl.classList.remove('active');

                params.set('lang', 'en');
                enEl.href = '#' + getPageFromHash() + '?' + params.toString();
            } else {
                enEl.classList.add('active');
                enEl.href = 'javascript:void(0)';
                deEl.classList.remove('active');

                params.set('lang', 'de');
                deEl.href = '#' + getPageFromHash() + '?' + params.toString();
            }
        }
    });
}

function switchLanguage(newLang) {
    if (newLang === lang) return;

    trackEvent('switch_language', { from: lang, to: newLang });

    setPreferredLanguage(newLang);
    lang = newLang;
    T = TRANSLATIONS[lang];

    // Update HTML lang attribute
    const root = document.getElementById('htmlRoot');
    if (root) root.lang = lang;

    // Update translations
    applyTranslations();

    // Update Topic Definitions with new language
    updateGradeTopics();

    // Re-populate topics (labels change)
    updateTopicSelector();

    // Regenerate sheet (word problems rely on lang)
    // Pass true to preserve seed/values where possible, but text changes
    generateSheet(true);

    // Update URL without reload
    const params = getURLParams();
    params.set('lang', lang);
    const newUrl = `${window.location.pathname}#${getPageFromHash()}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);

    updateLanguageButtons();
    updateNavigationLinks();
}

// --- BUILDER SYNC ---
function checkURLForBuilderState() {
    const params = getURLParams();
    const buildState = params.get('build');
    if (buildState) {
        // Load builder state (in background) but respect current hash for view
        loadBuilderState(buildState);
    }
}

document.addEventListener('DOMContentLoaded', checkURLForBuilderState);
