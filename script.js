import { globalSeed, setSeed } from './js/mathUtils.js';
export { globalSeed, setSeed };
import { generateProblemsData as genData, PAGE_CAPACITY } from './js/problemGenerators.js?v=4';
import { TRANSLATIONS, getPreferredLanguage, setPreferredLanguage } from './js/translations.js';
import { loadBuilderState, initBuilder, getBuilderState, hasBuilderContent, renderBuilderSheet } from './js/worksheet-builder.js?v=final';
import { getURLParams, getPageFromHash } from './js/urlUtils.js';
import { LAYOUT_CONFIG } from './js/problemConfig.js';
import { ProblemFactory } from './js/Problem.js';
import { registerAllProblems } from './js/problemTypes/index.js';

registerAllProblems();

// Expose to window for inline HTML handlers

window.generateSheet = generateSheet;
window.renderCurrentState = renderCurrentState;
window.updateURLState = updateURLState;
window.toggleQRVisibility = toggleQRVisibility;
window.validateInput = validateInput;
window.switchLanguage = switchLanguage;
window.renderBuilderSheet = renderBuilderSheet;

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

window.copyLink = function () {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btnCopyLink');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Kopiert!';
        setTimeout(() => {
            // We restore from Translation if available, or just keeping simpler for now
            // Actually let's use the T.ui.builder.copyLink to be safe or originalText
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

function applyTranslations() {
    document.title = T.ui.title;
    const ids = {
        'labelSolutions': T.ui.labelSolutions,
        'btnGenerate': T.ui.btnGenerate,
        'btnSave': T.ui.btnSave,
        'btnSaved': T.ui.btnSaved,
        'btnPrint': T.ui.btnPrint,
        'btnPlay': T.ui.btnPlay,
        'labelShowQR': T.ui.labelShowQR || 'QR-Code anzeigen',
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
    // Use global currentTitle variable (not local)

    // Helper function to remove emojis from text
    const removeEmojis = (text) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '').trim();
    };

    if (type === 'custom') {
        currentTitle = removeEmojis(T.ui.individuelleAufgaben || "Mix");
    } else {
        currentTitle = removeEmojis(T.topics[type] || "Aufgaben");
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
        const capacity = Math.round(PAGE_CAPACITY * (density / 100));

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

        const showQR = document.getElementById('showQR').checked;
        if (!showQR) params.set('showQR', '0');

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

    // Width handling based on weight (12-column grid)
    const span = problemData.span || 12;
    problemDiv.style.gridColumn = `span ${span}`;

    // Height handling based on weight
    const rowSpan = Math.max(1, Math.round(problemData.weight / (span || 1)));
    problemDiv.style.gridRow = `span ${rowSpan}`;

    // BOUNDARY CONTAINER: Ensures content doesn't spill
    const boundaryDiv = document.createElement('div');
    boundaryDiv.className = 'problem-boundary';
    problemDiv.appendChild(boundaryDiv);

    // TARGET: All layout and content goes into boundaryDiv
    const target = boundaryDiv;

    // Content Scaling logic
    const baseConfig = LAYOUT_CONFIG[problemData.moduleType] || LAYOUT_CONFIG[problemData.type] || LAYOUT_CONFIG['default'];
    const baseSpan = baseConfig.span || 12;
    const scaleFactor = span / baseSpan;

    if (Math.abs(scaleFactor - 1) > 0.01) {
        target.style.transform = `scale(${scaleFactor})`;
        target.style.transformOrigin = 'top left';
        target.style.width = `${100 / scaleFactor}%`;
        target.style.height = `${100 / scaleFactor}%`;
    }

    // Use ProblemFactory to handle specific rendering
    const problemInstance = ProblemFactory.create(problemData);
    problemInstance.render(target, isSolution, lang);

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
                                                                                    <div style="width:190px;"></div> <!-- Spacer for Logo (reduced from 200px) -->
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
        // h1.style.outline = "1px dashed #ccc"; // Removed per user request
        h1.style.minWidth = "200px";
        h1.oninput = function () {
            // Support both builder and generator title updates
            if (window.updateBuilderTitle) {
                window.updateBuilderTitle(this.textContent);
            } else if (window.updateGeneratorTitle) {
                window.updateGeneratorTitle(this.textContent);
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

    // Footer with Page Number
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
        // Render Worksheet (editable title)
        const pageInfo = { current: index + 1, total: currentSheetsData.length };
        const worksheet = createSheetElement(currentTitle, sheetProblems, false, pageInfo, true); // Added isEditable
        wrapper.appendChild(worksheet);

        // Render Solution Sheet immediately after, if requested
        if (showSolutions) {
            const solutionSheet = createSheetElement(currentTitle, sheetProblems, true, pageInfo);
            wrapper.appendChild(solutionSheet);
        }
    });
    updateURLState();
    autoScaleSheet();
}

// Function to update generator title when edited
window.updateGeneratorTitle = function (newTitle) {
    currentTitle = newTitle;
    updateURLState();
};

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

    // Add explicit event listeners for language switching
    const deBtn = document.getElementById('lang-de-header');
    if (deBtn) {
        deBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchLanguage('de');
        });
    }

    const enBtn = document.getElementById('lang-en-header');
    if (enBtn) {
        enBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchLanguage('en');
        });
    }
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
        // Apply visibility immediately
        if (window.toggleQRVisibility) window.toggleQRVisibility();
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

    // Check if we are in Builder mode (roughly)
    const isBuilder = window.location.hash.includes('builder') || document.getElementById('builder').classList.contains('active-section');

    if (isBuilder) {
        topicName = T.ui.builder.title || "Baukasten";
    } else if (topics.length > 1) {
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
window.autoScaleSheet = autoScaleSheet;

function autoScaleSheet() {
    // Only scale if screen is smaller than sheet (approx 800px + margins)
    const wrappers = [
        document.getElementById('sheetsWrapper'),
        document.getElementById('builderSheetsWrapper')
    ].filter(el => el !== null);

    wrappers.forEach(wrapper => {
        // Reset first provided we aren't printing
        if (window.matchMedia('print').matches) {
            wrapper.style.transform = 'none';
            wrapper.style.height = 'auto'; // Reset height
            return;
        }

        const screenWidth = window.innerWidth;
        const sheetWidth = 794; // Exactly 210mm at 96dpi

        if (screenWidth < sheetWidth) {
            // Calculate scale
            // Leave 20px margin
            const scale = (screenWidth - 20) / sheetWidth;
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.transformOrigin = 'top center';

            // Fix whitespace: container keeps original height, so we must reduce it manually
            // Important: Reset height to auto first to get true scrollHeight (if we are resizing)
            wrapper.style.height = 'auto';
            const originalHeight = wrapper.scrollHeight;
            // Adding a 20px safety buffer to prevent clipping
            const newHeight = (originalHeight * scale) + 20;
            wrapper.style.height = `${newHeight}px`;

        } else {
            wrapper.style.transform = 'none';
            wrapper.style.height = 'auto';
        }
    });
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
