import { globalSeed, setSeed, T, GRADE_TOPICS_STRUCTURE, createSheetElement, updateURLState } from '../script.js?v=final';
import { generateProblem, PAGE_CAPACITY } from './problemGenerators.js';
import { LAYOUT_CONFIG } from './problemConfig.js';
import LZString from './vendor/lz-string.js';

var builderProblems = []; // Array of { id, type, problemData, weight, gridX, gridY, page }

let dragSrcEl = null;
let builderTitleText = '';

let builderCurrentGrade = '1';
let builderCurrentTopic = '';

const TOPIC_OPTIONS = {
    'married_100': [
        { key: 'marriedMultiplesOf10', type: 'checkbox', labelKey: 'marriedMultiplesOf10' }
    ],
    'money_10': [
        { key: 'currency', type: 'select', options: ['CHF', 'EUR'], labelKey: 'currency' }
    ],
    'money_100': [
        { key: 'currency', type: 'select', options: ['CHF', 'EUR'], labelKey: 'currency' }
    ]
};

export function initBuilder() {
    loadFromStorage();
    setupControls();
    renderBuilderSheet();
}

function saveToStorage() {
    localStorage.setItem('ufzgiblatt_builder_problems', JSON.stringify(builderProblems));
    localStorage.setItem('ufzgiblatt_builder_title', builderTitleText);
    updateURLState();
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem('ufzgiblatt_builder_problems');
        if (stored) {
            builderProblems = JSON.parse(stored);
            // Migration: ensure all problems have options and currency
            builderProblems.forEach(p => {
                if (!p.params) {
                    p.params = {
                        options: p.problemData.options || {},
                        currency: p.problemData.currency || 'CHF'
                    };
                }
            });
        }

        builderTitleText = localStorage.getItem('ufzgiblatt_builder_title') || '';
    } catch (e) {
        console.warn('Failed to load builder state:', e);
    }
}

function setupControls() {
    renderBuilderTabs();

    // Initial Topic Default if none
    if (!builderCurrentTopic) {
        const topics = GRADE_TOPICS_STRUCTURE[builderCurrentGrade];
        if (topics && topics.length > 0) builderCurrentTopic = topics[0];
    }

    renderBuilderChips();

    renderBuilderChips();
}

// Global function to update title from the sheet directly
window.updateBuilderTitle = function (newTitle) {
    builderTitleText = newTitle;
    saveToStorage();
    // No need to re-render sheet, as the input IS the sheet
};

// --- BUILDER UI RENDERING ---

function renderBuilderTabs() {
    const container = document.getElementById('builderGradeTabs');
    if (!container) return;
    container.innerHTML = '';

    const uiT = (window.T && window.T.ui && window.T.ui.grades) ? window.T : (typeof T !== 'undefined' ? T : null);
    if (!uiT) return; // Wait for initialization

    Object.keys(GRADE_TOPICS_STRUCTURE).forEach(g => {
        const tab = document.createElement('div');
        tab.className = `grade-tab ${g === builderCurrentGrade ? 'active' : ''}`;
        tab.textContent = uiT.ui.grades[g];
        tab.onclick = () => handleBuilderGradeSelect(g);
        container.appendChild(tab);
    });
}

function handleBuilderGradeSelect(grade) {
    if (builderCurrentGrade === grade) return;
    builderCurrentGrade = grade;

    // Reset Topic to first available
    const topics = GRADE_TOPICS_STRUCTURE[grade] || [];
    builderCurrentTopic = topics.length > 0 ? topics[0] : '';

    renderBuilderTabs();
    renderBuilderChips();
    updateURLState();
}

function renderBuilderChips() {
    const container = document.getElementById('builderTopicChips');
    if (!container) return;
    container.innerHTML = '';

    const topics = GRADE_TOPICS_STRUCTURE[builderCurrentGrade] || [];
    const uiT = (window.T && window.T.topics) ? window.T : (typeof T !== 'undefined' ? T : null);

    if (!uiT) {
        // Retry logic or safe fallback could go here, but usually T is ready.
        // If not ready, we just don't render labels effectively or defer.
        return;
    }

    topics.forEach(topicKey => {
        const chip = document.createElement('div');
        chip.className = `topic-chip ${topicKey === builderCurrentTopic ? 'active' : ''}`;
        chip.textContent = uiT.topics[topicKey] || topicKey;
        chip.dataset.topic = topicKey; // Store key for soft updates
        chip.draggable = true;
        chip.ondragstart = (e) => {
            console.log('Chip Drag Start:', topicKey);
            e.dataTransfer.effectAllowed = 'copyMove'; // Allow both to be safe
            e.dataTransfer.setData('application/x-ufzgiblatt-topic', topicKey);
            // Also select it on drag start so options update
            handleBuilderTopicClick(topicKey);
            // Set dragSrcEl to this chip so handleDragOver knows what we are dragging
            dragSrcEl = chip;
            // Add a marker to distinguishing new items from existing ones
            dragSrcEl.dataset.isNewTopic = 'true';
            dragSrcEl.dataset.topicKey = topicKey;
        };
        chip.ondragend = () => {
            console.log('Chip Drag End');
            dragSrcEl = null;
            document.querySelectorAll('.drop-indicator').forEach(el => el.style.display = 'none');
        };
        chip.onclick = () => handleBuilderTopicClick(topicKey);
        chip.ondblclick = () => {
            handleBuilderTopicClick(topicKey);
            window.addProblemToBuilder();
        };
        container.appendChild(chip);
    });

    // Update options panel immediately
    renderBuilderTopicOptions();
}

function updateTopicChipsVisuals() {
    const container = document.getElementById('builderTopicChips');
    if (!container) return;
    const chips = container.querySelectorAll('.topic-chip');
    chips.forEach(chip => {
        if (chip.dataset.topic === builderCurrentTopic) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

function handleBuilderTopicClick(topic) {
    if (builderCurrentTopic === topic) return;
    builderCurrentTopic = topic;

    // Soft update instead of full re-render to preserve drag source element
    updateTopicChipsVisuals();
    renderBuilderTopicOptions();

    updateURLState();
}

function renderBuilderTopicOptions() {
    const optionsContainer = document.getElementById('builderTopicOptions');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';

    if (!builderCurrentTopic) {
        optionsContainer.style.display = 'none';
        return;
    }

    const optionsDef = TOPIC_OPTIONS[builderCurrentTopic];
    if (optionsDef && optionsDef.length > 0) {
        optionsContainer.style.display = 'flex';
        optionsDef.forEach(opt => {
            const group = document.createElement('div');
            group.className = 'option-group';

            const label = document.createElement('label');
            const uiT = window.T || T;
            label.textContent = uiT.ui.builder.options?.[opt.labelKey] || opt.labelKey;

            if (opt.type === 'checkbox') {
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = `opt_${opt.key}`;
                cb.addEventListener('change', () => updateURLState());
                group.appendChild(cb);
                group.appendChild(label);
            } else if (opt.type === 'select') {
                const sel = document.createElement('select');
                sel.id = `opt_${opt.key}`;
                sel.addEventListener('change', () => updateURLState());
                opt.options.forEach(o => {
                    const op = document.createElement('option');
                    op.value = o;
                    op.textContent = o;
                    sel.appendChild(op);
                });
                group.appendChild(label);
                group.appendChild(sel);
            }
            optionsContainer.appendChild(group);
        });
    } else {
        optionsContainer.style.display = 'none';
    }
}

function collectBuilderOptions() {
    const topic = builderCurrentTopic;
    if (!topic) return {};
    const options = {};
    const optionsDef = TOPIC_OPTIONS[topic];
    if (optionsDef) {
        optionsDef.forEach(opt => {
            const el = document.getElementById(`opt_${opt.key}`);
            if (el) {
                options[opt.key] = opt.type === 'checkbox' ? el.checked : el.value;
            }
        });
    }
    return options;
}

window.addProblemToBuilder = function () {
    const topic = builderCurrentTopic;
    if (!topic) return;
    const options = collectBuilderOptions();

    const problem = createProblemObject(topic, options);
    builderProblems.push(problem);

    saveToStorage();
    renderBuilderSheet();
};

function createProblemObject(topic, options, gridX, gridY, page) {
    const currency = options.currency || 'CHF';
    const problemData = generateProblem(topic, currency, options, -1, window.lang || 'de');
    const weight = problemData.weight;

    return {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        type: topic,
        problemData,
        weight,
        params: { options, currency },
        gridX,
        gridY,
        page
    };
}

window.copyBuilderLink = function () {
    const state = serializeBuilderState();
    const url = new URL(window.location.href);
    url.hash = `build=${state}`;
    navigator.clipboard.writeText(url.toString()).then(() => {
        const uiT = window.T || T;
        alert(uiT.ui.builder.linkCopied || 'Link kopiert!');
    });
};

function serializeBuilderState() {
    const data = builderProblems.map(p => {
        // Create a copy of problemData and remove redundant fields to save space
        const cleanData = { ...p.problemData };
        delete cleanData.weight;
        delete cleanData.span;
        delete cleanData.moduleType;
        if (cleanData.type === 'standard') {
            delete cleanData.type;
        }

        return {
            t: p.type,
            d: cleanData,
            p: p.params,
            x: p.gridX,
            y: p.gridY,
            pg: p.page
        };
    });
    const gradeSelect = document.getElementById('builderGradeSelector');
    const topicSelect = document.getElementById('builderTopicSelector');

    const stateObj = {
        d: data,
        t: builderTitleText,
        g: builderCurrentGrade,
        tp: builderCurrentTopic,
        o: collectBuilderOptions(),
        s: document.getElementById('builderSolutionToggle')?.checked ? 1 : 0,
        q: document.getElementById('builderShowQR')?.checked ? 1 : 0
    };

    const json = JSON.stringify(stateObj);
    return LZString.compressToEncodedURIComponent(json);
}

export function getBuilderState() {
    return serializeBuilderState();
}

export function hasBuilderContent() {
    if (!builderProblems) return false;
    return builderProblems.length > 0 || (builderTitleText && builderTitleText.trim() !== '');
}
export function loadBuilderState(hash) {
    try {
        let json = LZString.decompressFromEncodedURIComponent(hash);

        // Fallback for legacy Base64 links
        if (!json || (!json.startsWith('{') && !json.startsWith('['))) {
            try {
                json = decodeURIComponent(escape(atob(hash)));
            } catch (e) {
                // If secondary decode fails, it's likely just invalid
                console.warn('Failed to decode legacy hash, and not valid compressed data.');
            }
        }

        if (!json) return;

        const loaded = JSON.parse(json);

        let problems = [];
        // Support old format (array) and new format (object)
        if (Array.isArray(loaded)) {
            problems = loaded;
        } else {
            problems = loaded.d || [];
            builderTitleText = loaded.t || '';

            // Restore UI state for Grade and Topic
            // Restore UI state for Grade and Topic
            if (loaded.g) {
                builderCurrentGrade = loaded.g;
            }
            if (loaded.tp) {
                builderCurrentTopic = loaded.tp;

                // Render controls to ensure options exist in DOM
                renderBuilderTabs();
                renderBuilderChips();

                // Restore Global Builder Settings
                if (loaded.s !== undefined) {
                    const sol = document.getElementById('builderSolutionToggle');
                    if (sol) sol.checked = !!loaded.s;
                }
                if (loaded.q !== undefined) {
                    const qr = document.getElementById('builderShowQR');
                    if (qr) qr.checked = !!loaded.q;
                }

                // Restore options
                if (loaded.o) {
                    setTimeout(() => { // delay to allow DOM render? Actually synchronous above.
                        Object.entries(loaded.o).forEach(([key, val]) => {
                            const el = document.getElementById(`opt_${key}`);
                            if (el) {
                                if (el.type === 'checkbox') el.checked = val;
                                else el.value = val;
                            }
                        });
                    }, 0);
                }
            }
        }

        // Update Title Input if it exists
        // const titleInput = document.getElementById('builderTitleInput');
        // if (titleInput) titleInput.value = builderTitleText;

        builderProblems = problems.map(item => {
            const config = LAYOUT_CONFIG[item.t] || LAYOUT_CONFIG['default'];
            const pData = { ...item.d };
            pData.weight = config.weight;
            pData.span = config.span;
            pData.moduleType = item.t;
            if (!pData.type) pData.type = 'standard';

            return {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                type: item.t,
                problemData: pData,
                weight: config.weight,
                params: item.p,
                gridX: item.x,
                gridY: item.y,
                page: item.pg
            };
        });
        saveToStorage();
        renderBuilderSheet();
    } catch (e) {
        console.error('Failed to load builder state from URL:', e);
    }
}


window.duplicateProblem = function (id) {
    const original = builderProblems.find(p => p.id === id);
    if (!original) return;

    // Deep clone
    const clone = JSON.parse(JSON.stringify(original));

    // Assign new ID
    clone.id = Date.now() + Math.random().toString(36).substr(2, 9);

    // Remove placement info to let it auto-flow or place at end
    delete clone.gridX;
    delete clone.gridY;
    delete clone.page;

    builderProblems.push(clone);
    saveToStorage();
    renderBuilderSheet();
};

window.clearBuilder = function () {
    const uiT = window.T || T;
    if (confirm(uiT.ui.confirmDelete || 'Are you sure?')) {
        builderProblems = [];
        builderTitleText = ''; // Optional: clear title too? Yes, usually clear means clear everything.
        saveToStorage();
        renderBuilderSheet();
    }
};

window.refreshBuilderSeed = function () {
    // Generate new global seed and update mathUtils state
    const newSeed = Math.floor(Math.random() * 0xFFFFFFFF);
    setSeed(newSeed);

    builderProblems.forEach(p => {
        const params = p.params || {};
        const options = params.options || {};
        const currency = params.currency || 'CHF';
        p.problemData = generateProblem(p.type, currency, options, -1, window.lang || 'de');
    });

    saveToStorage();
    renderBuilderSheet();
};

window.removeProblem = function (id) {
    builderProblems = builderProblems.filter(p => p.id !== id);
    saveToStorage();
    renderBuilderSheet();
};



export function renderBuilderSheet() {
    window.renderBuilderSheet = renderBuilderSheet;
    try {
        const wrapper = document.getElementById('builderSheetsWrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';

        if (builderProblems.length === 0) {
            // wrapper.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Noch keine Aufgaben hinzugefügt. Nutze die Steuerung oben!</p>';
            // return;
        }

        // Split into pages
        let pages = [[]];

        // Sort problems: placed items first by page, then auto-layout items
        const placed = builderProblems.filter(p => p.page !== undefined);
        const unplaced = builderProblems.filter(p => p.page === undefined);

        const maxPage = placed.reduce((max, p) => Math.max(max, p.page), 0);
        for (let i = 0; i <= maxPage; i++) {
            pages[i] = placed.filter(p => p.page === i);
        }
        if (pages.length === 0) pages = [[]];

        // Append unplaced items using sequential logic
        let currentPageIdx = pages.length - 1;
        let currentLoad = pages[currentPageIdx].reduce((sum, p) => sum + p.weight, 0);

        unplaced.forEach(p => {
            if (currentLoad + p.weight > PAGE_CAPACITY && pages[currentPageIdx].length > 0) {
                pages.push([]);
                currentPageIdx++;
                currentLoad = 0;
            }
            pages[currentPageIdx].push(p);
            currentLoad += p.weight;
        });

        const showSolutions = document.getElementById('builderSolutionToggle')?.checked || false;
        const showQR = document.getElementById('builderShowQR')?.checked ?? true;

        const renderSingleSheet = (pageItems, pageIdx, isSolution) => {
            const problems = pageItems.map(p => p.problemData);
            const pageInfo = { current: pageIdx + 1, total: pages.length };

            // Use window.T if T is undefined
            let title = (window.T && window.T.ui && window.T.ui.builder) ? window.T.ui.builder.title : 'Arbeitsblatt (Baukasten)';
            if (builderTitleText && builderTitleText.trim() !== '') {
                title = builderTitleText;
            }

            // Create the base sheet
            const sheet = createSheetElement(title, problems, isSolution, pageInfo, !isSolution);

            // Sync QR Code visibility
            const qr = sheet.querySelector('.qr-code-container');
            if (qr) {
                if (showQR) qr.classList.remove('qr-hidden');
                else qr.classList.add('qr-hidden');
            }

            const gridEl = sheet.querySelector('.problem-grid');

            // Auto-Packer State (needed for auto-placement during task pass)
            const gridMap = Array(15).fill().map(() => Array(4).fill(false));
            const checkFit = (r, c, w, h) => {
                if (r < 1 || c < 1 || r + h - 1 > 15 || c + w - 1 > 4) return false;
                for (let i = 0; i < h; i++) {
                    for (let j = 0; j < w; j++) {
                        if (gridMap[r + i - 1][c + j - 1]) return false;
                    }
                }
                return true;
            };
            const markGrid = (r, c, w, h) => {
                for (let i = 0; i < h; i++) {
                    for (let j = 0; j < w; j++) {
                        if (r + i - 1 < 15 && c + j - 1 < 4) gridMap[r + i - 1][c + j - 1] = true;
                    }
                }
            };

            // Pre-mark explicit items
            pageItems.forEach(p => {
                if (p.gridX !== undefined && p.gridY !== undefined) {
                    const w = p.problemData.span || 4;
                    const h = Math.max(1, Math.round(p.weight / (w || 1)));
                    markGrid(p.gridY, p.gridX, w, h);
                }
            });

            // Process problems
            const problemElements = sheet.querySelectorAll('.problem');
            problemElements.forEach((el, idx) => {
                const pData = pageItems[idx];
                const w = pData.problemData.span || 4;
                const h = Math.max(1, Math.round(pData.weight / (w || 1)));

                let gridX = pData.gridX;
                let gridY = pData.gridY;

                if (gridX === undefined || gridY === undefined) {
                    let placed = false;
                    for (let r = 1; r <= 15; r++) {
                        for (let c = 1; c <= 4; c++) {
                            if (checkFit(r, c, w, h)) {
                                gridX = c;
                                gridY = r;
                                markGrid(r, c, w, h);
                                placed = true;
                                pData.gridX = gridX;
                                pData.gridY = gridY;
                                break;
                            }
                        }
                        if (placed) break;
                    }
                }

                // Wrap in a container to enforce grid position
                const wrapper = document.createElement('div');
                wrapper.className = isSolution ? 'solution-problem-wrapper' : 'builder-problem-wrapper';
                if (!isSolution) {
                    wrapper.draggable = true;
                    wrapper.dataset.id = pData.id;
                }

                if (gridX !== undefined && gridY !== undefined) {
                    wrapper.style.gridArea = `${gridY} / ${gridX} / span ${h} / span ${w}`;
                }

                if (!isSolution) {
                    // Add Control Buttons for Task Sheet
                    const remBtn = document.createElement('button');
                    remBtn.className = 'btn-remove-problem';
                    remBtn.innerHTML = '✖';
                    remBtn.onclick = (e) => {
                        e.stopPropagation();
                        window.removeProblem(pData.id);
                    };
                    wrapper.appendChild(remBtn);

                    const dupBtn = document.createElement('button');
                    dupBtn.className = 'btn-duplicate-problem';
                    dupBtn.innerHTML = '📑';
                    dupBtn.title = 'Duplizieren';
                    dupBtn.onclick = (e) => {
                        e.stopPropagation();
                        window.duplicateProblem(pData.id);
                    };
                    wrapper.appendChild(dupBtn);

                    // Add Events
                    wrapper.addEventListener('dragstart', handleDragStart);
                    wrapper.addEventListener('dragenter', handleDragEnter);
                    wrapper.addEventListener('dragover', handleDragOver);
                    wrapper.addEventListener('dragleave', handleDragLeave);
                    wrapper.addEventListener('drop', handleDrop);
                    wrapper.addEventListener('dragend', handleDragEnd);
                }

                el.parentNode.insertBefore(wrapper, el);
                wrapper.appendChild(el);
            });

            if (gridEl && !isSolution) {
                gridEl.dataset.pageIdx = pageIdx;
                gridEl.addEventListener('dragover', handleDragOver);
                gridEl.addEventListener('drop', handleDrop);
                gridEl.addEventListener('dragleave', handleDragLeaveGrid);

                if (!gridEl.querySelector('.drop-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'drop-indicator';
                    indicator.style.pointerEvents = 'none';
                    gridEl.appendChild(indicator);
                }
            }

            return sheet;
        };

        // Pass 1: Task Sheets (Interactive)
        pages.forEach((pageItems, pageIdx) => {
            wrapper.appendChild(renderSingleSheet(pageItems, pageIdx, false));
        });

        // Pass 2: Solution Sheets (Static)
        if (showSolutions) {
            pages.forEach((pageItems, pageIdx) => {
                wrapper.appendChild(renderSingleSheet(pageItems, pageIdx, true));
            });
        }
        updateURLState();
        if (typeof window.onresize === 'function') window.onresize();
    } catch (err) {
        console.error('Render Error:', err);
        alert('Render Error: ' + err.message);
    }
}

// DRAG AND DROP HANDLERS
function handleDragStart(e) {
    console.log('DragStart of Existing Item:', this.dataset.id);
    this.classList.add('dragging');
    dragSrcEl = this;
    dragSrcEl.dataset.isNewTopic = 'false'; // Existing item
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();

    // Set dropEffect based on what we are dragging
    if (dragSrcEl && dragSrcEl.dataset.isNewTopic === 'true') {
        e.dataTransfer.dropEffect = 'copy';
    } else {
        e.dataTransfer.dropEffect = 'move';
    }
    console.log('Builder: Drag Over fired. Target:', e.target.className);


    let gridEl = e.target.closest('.problem-grid');
    if (!gridEl) {
        // Fallback: Check if we are physically over a grid (e.g. if target is sheet or container)
        const grids = document.querySelectorAll('.problem-grid');
        for (const grid of grids) {
            const rect = grid.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                gridEl = grid;
                break;
            }
        }
    }

    if (!gridEl || !dragSrcEl) {
        return false;
    }

    const rect = gridEl.getBoundingClientRect();
    const cellWidth = rect.width / 4;
    const cellHeight = rect.height / 20;

    const x = Math.min(4, Math.max(1, Math.floor((e.clientX - rect.left) / cellWidth) + 1));
    const y = Math.min(20, Math.max(1, Math.floor((e.clientY - rect.top) / cellHeight) + 1));

    const indicator = gridEl.querySelector('.drop-indicator');
    if (indicator) {
        let w, h, srcId;

        // CASE A: Existing Item
        if (dragSrcEl && dragSrcEl.dataset.isNewTopic === 'false') {
            srcId = dragSrcEl.dataset.id;
            const index = builderProblems.findIndex(p => p.id === srcId);
            const problem = builderProblems[index];
            if (problem) {
                w = problem.problemData.span || 4;
                h = Math.max(1, Math.round(problem.weight / (w || 1)));
            }
        }
        // CASE B: New Topic Item
        else if (dragSrcEl && dragSrcEl.dataset.isNewTopic === 'true') {
            srcId = 'new_' + dragSrcEl.dataset.topicKey;
            // Calculate dimensions on the fly
            // We can use the current global options since selecting a chip updates them
            const options = collectBuilderOptions();
            const topic = dragSrcEl.dataset.topicKey;

            // To avoid generating a heavy problem just for size, we can check config directly if possible,
            // or just generate a lightweight dummy.
            // createProblemObject generates the full problem which is fine.
            const tempObj = createProblemObject(topic, options);
            w = tempObj.problemData.span || 4;
            h = Math.max(1, Math.round(tempObj.weight / (w || 1)));
        }

        if (w && h) {

            // Clamp x to prevent overflow
            const clampedX = Math.min(x, 4 - w + 1);
            const clampedY = Math.min(y, 20 - h + 1);

            indicator.style.display = 'flex';
            indicator.style.left = `${(clampedX - 1) * 25}%`;
            indicator.style.top = `${(clampedY - 1) * cellHeight}px`;
            indicator.style.width = `${w * 25}%`;
            indicator.style.height = `${h * cellHeight}px`;

            // Ghost Preview: Clone content if not already there for this item
            if (indicator.dataset.previewId !== srcId) {
                indicator.innerHTML = '';

                // Content for preview
                if (srcId.startsWith('new_')) {
                    // For new items, show a simple placeholder or the chip text
                    const placeholder = document.createElement('div');
                    placeholder.style.width = '100%';
                    placeholder.style.height = '100%';
                    placeholder.style.display = 'flex';
                    placeholder.style.alignItems = 'center';
                    placeholder.style.justifyContent = 'center';
                    placeholder.style.backgroundColor = 'rgba(66, 133, 244, 0.2)';
                    placeholder.style.border = '2px dashed #4285f4';
                    placeholder.style.borderRadius = '8px';
                    placeholder.style.color = '#333';
                    placeholder.style.fontWeight = 'bold';
                    placeholder.textContent = dragSrcEl.textContent;
                    indicator.appendChild(placeholder);
                } else {
                    // For existing items, clone the element
                    const originalProblem = dragSrcEl.querySelector('.problem');
                    if (originalProblem) {
                        const clone = originalProblem.cloneNode(true);
                        clone.querySelectorAll('input').forEach(input => {
                            input.readOnly = true;
                            input.removeAttribute('name');
                            input.removeAttribute('id');
                        });
                        indicator.appendChild(clone);
                    }
                }
                indicator.dataset.previewId = srcId;
            }

            // Check Collision
            const pageIdx = parseInt(gridEl.dataset.pageIdx);
            const r1 = { x: clampedX, y: clampedY, w: w, h: h };

            let hasOverlap = false;

            builderProblems.forEach(p => {
                // Skip self if it's an existing item
                if (dragSrcEl.dataset.isNewTopic === 'false' && p.id === dragSrcEl.dataset.id) return;

                if (p.page === pageIdx && p.gridX !== undefined && p.gridY !== undefined) {
                    const pW = p.problemData.span || 4;
                    const pH = Math.max(1, Math.round(p.weight / (pW || 1)));
                    const r2 = { x: p.gridX, y: p.gridY, w: pW, h: pH };

                    // Intersection Check
                    if (!(r1.x + r1.w - 1 < r2.x ||
                        r1.x > r2.x + r2.w - 1 ||
                        r1.y + r1.h - 1 < r2.y ||
                        r1.y > r2.y + r2.h - 1)) {
                        hasOverlap = true;
                    }
                }
            });

            if (hasOverlap) {
                indicator.classList.add('overlap');
            } else {
                indicator.classList.remove('overlap');
            }
        }
    }

    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDragLeaveGrid(e) {
    if (e.relatedTarget && this.contains(e.relatedTarget)) return;
    const indicator = this.querySelector('.drop-indicator');
    if (indicator) indicator.style.display = 'none';
}


function freezePlacement() {
    const grids = document.querySelectorAll('.problem-grid');
    grids.forEach(grid => {
        const pageIdx = parseInt(grid.dataset.pageIdx);
        if (isNaN(pageIdx)) return;

        const rect = grid.getBoundingClientRect();
        const cellWidth = rect.width / 4;
        const cellHeight = rect.height / 20;

        const items = grid.querySelectorAll('.builder-problem-wrapper');
        items.forEach(item => {
            const id = item.dataset.id;
            const p = builderProblems.find(prob => prob.id === id);
            if (!p) return;

            // If already explicitly placed, skip
            if (p.gridX !== undefined && p.gridY !== undefined && p.page !== undefined) return;

            // Calculate current visual position
            const itemRect = item.getBoundingClientRect();
            const relX = itemRect.left - rect.left;
            const relY = itemRect.top - rect.top;

            // Approximate grid coordinates
            let col = Math.round(relX / cellWidth) + 1;
            let row = Math.round(relY / cellHeight) + 1;

            // Constraint
            col = Math.max(1, Math.min(4, col));
            row = Math.max(1, Math.min(20, row));

            p.gridX = col;
            p.gridY = row;
            p.page = pageIdx;
        });
    });
}

function handleDrop(e) {
    console.log('Builder: Handle Drop Fired!');
    try {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();

        // Freeze all other items in their current positions to prevent jumping
        freezePlacement();

        // Find the target grid
        // Improved: If drop is on .sheet or .builder-sheet but not directly on grid, find the grid inside it
        let gridEl = e.target.closest('.problem-grid');

        if (!gridEl) {
            // Check if we dropped on the sheet container
            const sheetEl = e.target.closest('.sheet');
            if (sheetEl) {
                gridEl = sheetEl.querySelector('.problem-grid');
            }
        }

        if (!gridEl) return false;

        const pageIdx = parseInt(gridEl.dataset.pageIdx);
        const rect = gridEl.getBoundingClientRect();

        const cellWidth = rect.width / 4;
        const cellHeight = rect.height / 20;

        // Calculate based on grid rect, even if we are outside (clamp will handle it)
        const mouseX = Math.min(4, Math.max(1, Math.floor((e.clientX - rect.left) / cellWidth) + 1));
        const mouseY = Math.min(20, Math.max(1, Math.floor((e.clientY - rect.top) / cellHeight) + 1));

        // CHECK 1: New Topic Drop
        let newTopic = e.dataTransfer.getData('application/x-ufzgiblatt-topic');
        console.log('Drop Debug: initial newTopic', newTopic);
        if (!newTopic && dragSrcEl && dragSrcEl.dataset.isNewTopic === 'true') {
            console.log('Drop Debug: fallback', dragSrcEl.dataset.topicKey);
            newTopic = dragSrcEl.dataset.topicKey;
        }

        if (newTopic) {
            // It's a new item!
            // We use the currently selected options for this topic (it was auto-selected on dragstart)
            const options = collectBuilderOptions();

            // Generate temp problem to check size
            // Note: We need to know size to clamp position.
            // Ideally generateProblem returns span/weight. 
            // We can assume standard size or generate fully.
            const tempObj = createProblemObject(newTopic, options);
            const w = tempObj.problemData.span || 4;
            const h = Math.max(1, Math.round(tempObj.weight / (w || 1)));

            // Clamp position
            const gridX = Math.min(mouseX, 4 - w + 1);
            const gridY = Math.min(mouseY, 20 - h + 1);

            // Assign coords and push
            tempObj.gridX = gridX;
            tempObj.gridY = gridY;
            tempObj.page = pageIdx;

            builderProblems.push(tempObj);

            saveToStorage();
            renderBuilderSheet();
            return false;
        }

        // CHECK 2: Reordering Existing Item
        const srcId = e.dataTransfer.getData('text/plain') || (dragSrcEl ? dragSrcEl.dataset.id : null);
        const problem = builderProblems.find(p => p.id === srcId);
        if (!problem) return false;

        const w = problem.problemData.span || 4;
        const h = Math.max(1, Math.round(problem.weight / (w || 1)));

        // Clamp values to grid bounds using the same logic as handleDragOver
        problem.gridX = Math.min(mouseX, 4 - w + 1);
        problem.gridY = Math.min(mouseY, 20 - h + 1);
        problem.page = pageIdx;

        saveToStorage();
        renderBuilderSheet();

    } catch (err) {
        console.error('Builder: Error in handleDrop:', err);
    }
    return false;
}

// Ensure event listeners are attached to the grid containers when they are created
// This is already done in renderBuilderSheet loop where `gridEl` is found.
// However, if the sheet is empty, maybe the gridEl isn't reachable?
// The problem-grid class is on the .problem-grid element.
// Let's verify that the grid has a defined height/existence even when empty.
// In style.css the grid has `grid-template-rows: repeat(20, var(--unit-height))` so it should have height.


function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drop-indicator').forEach(el => el.style.display = 'none');
    const items = document.querySelectorAll('.builder-problem-wrapper');
    items.forEach(item => item.classList.remove('drag-over'));
}

// Auto-init removed. Controlled by script.js to avoid circular dependency race conditions.
