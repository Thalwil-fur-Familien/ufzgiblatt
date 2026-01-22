import { globalSeed, setSeed } from './js/mathUtils.js';
export { globalSeed, setSeed };

import { generateProblemsData as genData, PAGE_CAPACITY } from './js/problemGenerators.js';
import { TRANSLATIONS, getPreferredLanguage, setPreferredLanguage } from './js/translations.js';
import { loadBuilderState, initBuilder, getBuilderState, hasBuilderContent, renderBuilderSheet } from './js/worksheet-builder.js';
import { getURLParams, getPageFromHash } from './js/urlUtils.js';

import { registerAllProblems } from './js/problemTypes/index.js';
import { lang, T, setLang, setT, currentSheetsData, setCurrentSheetsData, currentTitle, setCurrentTitle, currentGeneratorGrade, setGrade, selectedGeneratorTopics, GRADE_TOPICS_STRUCTURE } from './js/state.js';
import { createSheetElement } from './js/sheet-renderer.js';

registerAllProblems();

// Initialize state
setLang(getPreferredLanguage());
setT((TRANSLATIONS as any)[lang]);

// Expose to window for inline HTML handlers
(window as any).generateSheet = generateSheet;
(window as any).renderCurrentState = renderCurrentState;
(window as any).updateURLState = updateURLState;
(window as any).toggleQRVisibility = toggleQRVisibility;
(window as any).validateInput = validateInput;
(window as any).switchLanguage = switchLanguage;
(window as any).renderBuilderSheet = renderBuilderSheet;



if (document.getElementById('htmlRoot')) {
    (document.getElementById('htmlRoot') as HTMLElement).lang = lang;
}

// State for Modern UI
// currentGeneratorGrade moved to state.js
// selectedGeneratorTopics moved to state.js

// GRADE_TOPICS_STRUCTURE moved to state.js

const GRADE_TOPICS: Record<string, Array<{ value: string, text: string }>> = {};
updateGradeTopics();

function updateGradeTopics() {
    Object.keys(GRADE_TOPICS_STRUCTURE).forEach(g => {
        GRADE_TOPICS[g] = GRADE_TOPICS_STRUCTURE[g].map(v => ({ value: v, text: (T.topics as any)[v] }));
    });
}

function trackEvent(name: string, props: any = {}) {
    if ((window as any).posthog) {
        (window as any).posthog.capture(name, props);
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
            count: (document.getElementById('pageCount') as HTMLInputElement).value,
            solutions: (document.getElementById('solutionToggle') as HTMLInputElement).checked,
            lang: lang
        };

        if (topic === 'custom') {
            (props as any).custom_modules = customModules;
        }

        trackEvent('print_sheet', props);
    } catch (e) {
        console.error('Analytics error:', e);
    }

    window.print();
}
(window as any).printSheet = printSheet;

(window as any).copyLink = function () {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btnCopyLink') as HTMLElement;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Kopiert!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

function applyTranslations() {
    document.title = T.ui.title;
    const ids: Record<string, string> = {
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

    const btnPrintBuilder = document.getElementById('btnPrintBuilder');
    if (btnPrintBuilder) btnPrintBuilder.innerHTML = T.ui.btnPrint;

    const btnCopyBuilderLink = document.getElementById('btnCopyBuilderLink');
    if (btnCopyBuilderLink) btnCopyBuilderLink.innerHTML = '🔗 ' + T.ui.builder.copyLink;

    const gradeSelector = document.getElementById('gradeSelector') as HTMLSelectElement;
    if (gradeSelector) {
        Array.from(gradeSelector.options).forEach(opt => {
            if ((T.ui.grades as any)[opt.value]) {
                opt.textContent = (T.ui.grades as any)[opt.value];
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
        tab.textContent = (T.ui.grades as any)[g];
        tab.onclick = () => handleGeneratorGradeSelect(g);
        container.appendChild(tab);
    });
}

function handleGeneratorGradeSelect(grade: string) {
    if (currentGeneratorGrade === grade) return;
    setGrade(grade);

    const topics = GRADE_TOPICS_STRUCTURE[grade] || [];
    selectedGeneratorTopics.clear();
    if (topics.length > 0) {
        selectedGeneratorTopics.add(topics[0]);
    }

    renderGeneratorTabs();
    renderGeneratorChips();
    generateSheet();
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
        chip.textContent = (T.topics as any)[topicKey];
        chip.onclick = () => handleGeneratorTopicClick(topicKey);
        container.appendChild(chip);
    });

    updateSidePanelsVisibility();
}

function handleGeneratorTopicClick(topic: string) {
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
}

(window as any).updateTopicSelector = function () {
    renderGeneratorTabs();
    renderGeneratorChips();
};

let workStarted = false;
// currentSheetsData and currentTitle moved to state.js

function generateSheet(keepSeed = false) {
    workStarted = false;
    if (!keepSeed) {
        setSeed(Math.floor(Math.random() * 0xFFFFFFFF));
    } else {
        setSeed(globalSeed);
    }

    if (!keepSeed) {
        trackEvent('generate_sheet', {
            grade: currentGeneratorGrade,
            topic: Array.from(selectedGeneratorTopics).join(','),
            count: (document.getElementById('pageCount') as HTMLInputElement).value
        });
    }

    let type;
    const availableTopics = Array.from(selectedGeneratorTopics);

    if (availableTopics.length === 1) {
        type = availableTopics[0];
    } else if (availableTopics.length > 1) {
        type = 'custom';
    } else {
        type = 'add_10';
    }

    const removeEmojis = (text: string) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '').trim();
    };

    if (type === 'custom') {
        setCurrentTitle(removeEmojis(T.ui.individuelleAufgaben || "Mix"));
    } else {
        setCurrentTitle(removeEmojis((T.topics as any)[type] || "Aufgaben"));
    }

    const pageCount = parseInt((document.getElementById('pageCount') as HTMLInputElement).value) || 1;

    setCurrentSheetsData([]);

    for (let i = 0; i < pageCount; i++) {
        const allowedCurrencies = [];
        if ((document.getElementById('currencyCHF') as HTMLInputElement).checked) allowedCurrencies.push('CHF');
        if ((document.getElementById('currencyEUR') as HTMLInputElement).checked) allowedCurrencies.push('EUR');
        if (allowedCurrencies.length === 0) allowedCurrencies.push('CHF');

        const options = {
            marriedMultiplesOf10: (document.getElementById('marriedMultiplesOf10') as HTMLInputElement).checked
        };

        const density = parseInt((document.getElementById('densitySlider') as HTMLInputElement).value) || 100;
        const capacity = Math.round(PAGE_CAPACITY * (density / 100));

        const generatedData = genData(type, availableTopics, allowedCurrencies, options, lang, capacity);
        currentSheetsData.push(generatedData);
    }
    renderCurrentState();
    updateURLState();
}

function saveWorksheetState() {
    const state = {
        grade: currentGeneratorGrade,
        topic: Array.from(selectedGeneratorTopics).join(','),
        count: (document.getElementById('pageCount') as HTMLInputElement).value,
        seed: globalSeed,
        lang: lang
    };
    sessionStorage.setItem('worksheetState', JSON.stringify(state));
}

export function updateURLState() {
    const params = new URLSearchParams();
    const section = getPageFromHash();
    const isGenerator = (section === 'generator');

    if (lang) {
        params.set('lang', lang);
    }

    if (isGenerator) {
        params.set('grade', currentGeneratorGrade);
        const topics = Array.from(selectedGeneratorTopics);
        let topicStr = '';
        if (topics.length > 1) {
            params.set('topic', 'custom');
            params.set('custom', topics.join(','));
            topicStr = 'custom';
        } else if (topics.length === 1) {
            params.set('topic', topics[0]);
            topicStr = topics[0];
        }

        const count = (document.getElementById('pageCount') as HTMLInputElement).value;
        params.set('count', count);

        const showSolutions = (document.getElementById('solutionToggle') as HTMLInputElement).checked;
        if (showSolutions) params.set('solutions', '1');

        const showQR = (document.getElementById('showQR') as HTMLInputElement).checked;
        if (!showQR) params.set('showQR', '0');

        const isCustom = (topicStr === 'custom');

        if (topicStr === 'married_100' || isCustom) {
            const marriedMultiples = (document.getElementById('marriedMultiplesOf10') as HTMLInputElement).checked;
            if (marriedMultiples) params.set('marriedM', '1');
        }

        if (topicStr === 'time_reading' || isCustom) {
            const showHours = (document.getElementById('showHours') as HTMLInputElement).checked;
            if (showHours) params.set('showH', '1');
            const showMinutes = (document.getElementById('showMinutes') as HTMLInputElement).checked;
            if (showMinutes) params.set('showM', '1');
        }

        const isMoney = topicStr === 'money_10' || topicStr === 'money_100';
        if (isMoney || isCustom) {
            const currencies = [];
            if ((document.getElementById('currencyCHF') as HTMLInputElement).checked) currencies.push('CHF');
            if ((document.getElementById('currencyEUR') as HTMLInputElement).checked) currencies.push('EUR');
            if (currencies.length > 0) params.set('currencies', currencies.join(','));
        }
    }

    if ((document.getElementById('solutionToggle') as HTMLInputElement).checked) params.set('solutions', '1');
    if ((document.getElementById('densitySlider') as HTMLInputElement).value !== '100') params.set('density', (document.getElementById('densitySlider') as HTMLInputElement).value);
    if ((document.getElementById('marriedMultiplesOf10') as HTMLInputElement).checked) params.set('marriedM', '1');

    if ((document.getElementById('showQR') as HTMLInputElement).checked) {
        params.delete('showQR');
    } else {
        params.set('showQR', '0');
    }

    if (globalSeed) params.set('seed', globalSeed.toString());

    if (hasBuilderContent()) {
        const buildState = getBuilderState();
        params.set('build', buildState);
    }

    const newUrl = `${window.location.pathname}#${section}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    renderQRCode(window.location.href);
    updateLanguageButtons();
    updateNavigationLinks();
}

// createProblemElement and createSheetElement moved to sheet-renderer.js

export function renderCurrentState() {
    const wrapper = document.getElementById('sheetsWrapper');
    if (!wrapper) return;
    const showSolutions = (document.getElementById('solutionToggle') as HTMLInputElement).checked;

    wrapper.innerHTML = '';

    currentSheetsData.forEach((sheetProblems, index) => {
        const pageInfo = { current: index + 1, total: currentSheetsData.length };
        const worksheet = createSheetElement(currentTitle, sheetProblems, false, pageInfo, true);
        wrapper.appendChild(worksheet);

        if (showSolutions) {
            const solutionSheet = createSheetElement(currentTitle, sheetProblems, true, pageInfo);
            wrapper.appendChild(solutionSheet);
        }
    });
    updateURLState();
    autoScaleSheet();
}

(window as any).updateGeneratorTitle = function (newTitle: string) {
    setCurrentTitle(newTitle);
    updateURLState();
};

function validateInput(input: HTMLInputElement) {
    const expectedStr = (input.dataset.expected || '').trim();
    const valueStr = input.value.trim();

    const isBrick = input.classList.contains('brick-input');
    const target = isBrick ? (input.parentElement as HTMLElement) : input;

    if (!valueStr) {
        target.classList.remove('correct', 'incorrect');
        return;
    }

    let isCorrect = false;

    if (valueStr === expectedStr) {
        isCorrect = true;
    }
    else {
        const expNum = Number(expectedStr);
        const valNum = Number(valueStr);
        if (!isNaN(expNum) && !isNaN(valNum) && Math.abs(expNum - valNum) < 0.00001) {
            isCorrect = true;
        }
    }

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
        checkAllDone();
    } else {
        target.classList.add('incorrect');
        target.classList.remove('correct');
    }
}

function checkAllDone() {
    const inputs = document.querySelectorAll<HTMLInputElement>('.answer-input');
    let allCorrect = true;

    inputs.forEach(input => {
        if (input.readOnly) return;
        const isBrick = input.classList.contains('brick-input');
        const target = isBrick ? (input.parentElement as HTMLElement) : input;
        if (!target.classList.contains('correct')) {
            allCorrect = false;
        }
    });

    const mascot = document.getElementById('mascot');
    if (mascot) {
        if (allCorrect) {
            mascot.textContent = '🎉';
        } else {
            mascot.textContent = '🦊';
        }
    }
}

(window as any).setupFocusNavigation = function () {
    const wrapper = document.getElementById('sheetsWrapper');
    if (!wrapper) return;

    wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            if (target.matches('.answer-input, .rechenstrich-input, .house-input, .brick-input, .triangle-field')) {
                e.preventDefault();

                const allInputs = Array.from(wrapper.querySelectorAll<HTMLInputElement>('input:not([readonly])'));
                const currentIndex = allInputs.indexOf(target);

                if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
                    const nextInput = allInputs[currentIndex + 1];
                    nextInput.focus();
                    if (nextInput.type === 'number' || nextInput.type === 'text') {
                        nextInput.select();
                    }
                    nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });

    wrapper.addEventListener('input', (e) => {
        if (!workStarted && (e.target as HTMLElement).tagName === 'INPUT') {
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
                count: (document.getElementById('pageCount') as HTMLInputElement).value,
                lang: lang
            };
            if (topicStr === 'custom') {
                (props as any).custom_modules = customStr;
            }
            trackEvent('work_started', props);
        }
    });
};

function init() {
    applyTranslations();
    updateLanguageButtons();

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
        loadStateFromURL();
        generateSheet(true);
        autoScaleSheet();

        const params = new URLSearchParams(window.location.search);
        const isShared = params.has('seed') || params.has('topic');

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

        (window as any).setupFocusNavigation();
        updateLanguageButtons();
        updateNavigationLinks();
        setupSectionNavigation();
        initBuilder();
    } catch (e: any) {
        console.error("Initialization Error:", e);
    }
}

function loadStateFromURL() {
    const savedState = sessionStorage.getItem('worksheetState');
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.grade) setGrade(state.grade);
        selectedGeneratorTopics.clear();
        if (state.topic) {
            if (state.topic.includes(',')) {
                state.topic.split(',').forEach((t: string) => selectedGeneratorTopics.add(t));
            } else {
                selectedGeneratorTopics.add(state.topic);
            }
        }
        renderGeneratorTabs();
        renderGeneratorChips();
        const pageCount = document.getElementById('pageCount') as HTMLInputElement;
        if (pageCount) pageCount.value = state.count;
        setSeed(state.seed);
        sessionStorage.removeItem('worksheetState');
        updateURLState();
        return;
    }

    const params = getURLParams();
    if (params.has('seed')) {
        setSeed(parseInt(params.get('seed')!));
    }
    if (params.has('grade')) {
        setGrade(params.get('grade')!);
    }

    selectedGeneratorTopics.clear();
    const topicParam = params.get('topic');
    const customParam = params.get('custom');

    if (topicParam === 'custom' && customParam) {
        customParam.split(',').forEach(t => selectedGeneratorTopics.add(t));
    } else if (topicParam && topicParam !== 'custom') {
        selectedGeneratorTopics.add(topicParam);
    } else {
        const topics = GRADE_TOPICS_STRUCTURE[currentGeneratorGrade] || [];
        if (topics.length > 0) selectedGeneratorTopics.add(topics[0]);
    }

    renderGeneratorTabs();
    renderGeneratorChips();

    if (params.has('count')) {
        const count = params.get('count')!;
        const pageInput = document.getElementById('pageCount') as HTMLInputElement;
        if (pageInput) pageInput.value = count;
    }
    if (params.has('solutions')) {
        (document.getElementById('solutionToggle') as HTMLInputElement).checked = params.get('solutions') === '1';
    }
    if (params.has('density')) {
        (document.getElementById('densitySlider') as HTMLInputElement).value = params.get('density')!;
    }
    if (params.has('marriedM')) {
        (document.getElementById('marriedMultiplesOf10') as HTMLInputElement).checked = params.get('marriedM') === '1';
    }
    if (params.has('showQR')) {
        (document.getElementById('showQR') as HTMLInputElement).checked = params.get('showQR') !== '0';
        if ((window as any).toggleQRVisibility) (window as any).toggleQRVisibility();
    }
    if (params.has('showH')) {
        (document.getElementById('showHours') as HTMLInputElement).checked = params.get('showH') === '1';
    }
    if (params.has('showM')) {
        (document.getElementById('showMinutes') as HTMLInputElement).checked = params.get('showM') === '1';
    }
    if (params.has('currencies')) {
        const curs = params.get('currencies')!.split(',');
        (document.getElementById('currencyCHF') as HTMLInputElement).checked = curs.includes('CHF');
        (document.getElementById('currencyEUR') as HTMLInputElement).checked = curs.includes('EUR');
    }
}

function toggleQRVisibility() {
    const show = (document.getElementById('showQR') as HTMLInputElement).checked;
    const qrContainers = document.querySelectorAll('.qr-code-container');
    qrContainers.forEach(container => {
        if (!show) container.classList.add('qr-hidden');
        else container.classList.remove('qr-hidden');
    });
    updateURLState();
}

function renderQRCode(url: string) {
    const containers = document.querySelectorAll('.qr-code-container');
    containers.forEach(container => {
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        if ((window as any).QRCode) {
            (window as any).QRCode.toCanvas(canvas, url, {
                width: 100,
                margin: 0,
                color: { dark: "#000000", light: "#ffffff" },
                errorCorrectionLevel: 'L'
            }, function (error: any) {
                if (error) console.warn('QR code generation failed:', error);
            });
        }
    });
}

(window as any).saveCurrentState = function () {
    updateURLState();
    const params = window.location.search;
    if (!params) {
        alert(T.ui.saveNothing);
        return;
    }

    const topics = Array.from(selectedGeneratorTopics);
    let topicName;
    const isBuilder = window.location.hash.includes('builder') || document.getElementById('builder')!.classList.contains('active-section');

    if (isBuilder) {
        topicName = T.ui.builder.title || "Baukasten";
    } else if (topics.length > 1) {
        topicName = T.ui.individuelleAufgaben || "Mix";
    } else if (topics.length === 1) {
        topicName = (T.topics as any)[topics[0]] || topics[0];
    } else {
        topicName = "Arbeitsblatt";
    }

    const defaultName = `${topicName} (${new Date().toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-US')})`;
    const name = prompt(T.ui.savePrompt, defaultName);
    if (name === null) return;

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

(window as any).toggleSavedModal = function () {
    const modal = document.getElementById('savedModal')!;
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        (window as any).renderSavedList();
        modal.style.display = 'block';
    }
};

(window as any).renderSavedList = function () {
    const list = document.getElementById('savedList')!;
    const saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');
    if (saved.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding: 20px;">${T.ui.noSavedWorksheets}</p>`;
        return;
    }
    saved.sort((a: any, b: any) => b.id - a.id);
    list.innerHTML = saved.map((item: any) => `
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

(window as any).loadSavedState = function (id: number) {
    const saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');
    const item = saved.find((s: any) => s.id === id);
    if (!item) return;
    window.history.replaceState({}, '', window.location.pathname + item.params);
    loadStateFromURL();
    generateSheet(true);
    (window as any).toggleSavedModal();
};

(window as any).deleteSavedState = function (id: number) {
    if (!confirm(T.ui.confirmDelete)) return;
    let saved = JSON.parse(localStorage.getItem('ufzgiblatt_saved') || '[]');
    saved = saved.filter((s: any) => s.id !== id);
    localStorage.setItem('ufzgiblatt_saved', JSON.stringify(saved));
    (window as any).renderSavedList();
};

(window as any).autoScaleSheet = autoScaleSheet;

function autoScaleSheet() {
    const wrappers = [
        document.getElementById('sheetsWrapper'),
        document.getElementById('builderSheetsWrapper')
    ].filter(el => el !== null) as HTMLElement[];

    wrappers.forEach(wrapper => {
        if (window.matchMedia('print').matches) {
            wrapper.style.transform = 'none';
            wrapper.style.height = 'auto';
            return;
        }
        const screenWidth = window.innerWidth;
        const sheetWidth = 794;
        if (screenWidth < sheetWidth) {
            const scale = (screenWidth - 20) / sheetWidth;
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.transformOrigin = 'top center';
            wrapper.style.height = 'auto';
            const originalHeight = wrapper.scrollHeight;
            const newHeight = (originalHeight * scale) + 20;
            wrapper.style.height = `${newHeight}px`;
        } else {
            wrapper.style.transform = 'none';
            wrapper.style.height = 'auto';
        }
    });
}

function setupSectionNavigation() {
    const links = document.querySelectorAll<HTMLAnchorElement>('.nav-link');
    const sections = document.querySelectorAll('section');

    function showSection(_hash: string) {
        const targetId = getPageFromHash();
        sections.forEach(s => {
            s.classList.remove('active-section');
            if (s.id === targetId) s.classList.add('active-section');
        });
        links.forEach(l => {
            l.classList.remove('active');
            const rawHref = l.getAttribute('href');
            if (rawHref) {
                const href = rawHref.replace('#', '');
                if (href === targetId) l.classList.add('active');
            }
        });
    }

    window.addEventListener('hashchange', () => {
        showSection(window.location.hash);
        updateURLState();
    });
    showSection(window.location.hash);
}

function updateNavigationLinks() {
    const geoLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="geography-game"]');
    geoLinks.forEach(link => {
        const params = getURLParams();
        const simplifiedParams = new URLSearchParams();
        if (params.has('lang')) simplifiedParams.set('lang', params.get('lang')!);
        if (params.has('seed')) simplifiedParams.set('seed', params.get('seed')!);
        link.href = `geography-game?${simplifiedParams.toString()}`;
        link.onclick = (_e) => {
            saveWorksheetState();
        };
    });
}

function updateLanguageButtons() {
    const pairs = [{ de: 'lang-de-header', en: 'lang-en-header' }];
    const params = getURLParams();
    pairs.forEach(pair => {
        const deEl = document.getElementById(pair.de) as HTMLAnchorElement;
        const enEl = document.getElementById(pair.en) as HTMLAnchorElement;

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

function switchLanguage(newLang: string) {
    if (newLang === lang) return;
    trackEvent('switch_language', { from: lang, to: newLang });
    setPreferredLanguage(newLang);
    setLang(newLang);
    setT((TRANSLATIONS as any)[lang]);
    const root = document.getElementById('htmlRoot');
    if (root) (root as HTMLElement).lang = lang;
    applyTranslations();
    updateGradeTopics();
    (window as any).updateTopicSelector();
    generateSheet(true);
    const params = getURLParams();
    params.set('lang', lang);
    const newUrl = `${window.location.pathname}#${getPageFromHash()}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    updateLanguageButtons();
    updateNavigationLinks();
}

function checkURLForBuilderState() {
    const params = getURLParams();
    const buildState = params.get('build');
    if (buildState) {
        loadBuilderState(buildState);
    }
}

document.addEventListener('DOMContentLoaded', checkURLForBuilderState);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
