import { globalSeed, setSeed, T, GRADE_TOPICS_STRUCTURE, createSheetElement, updateURLState } from '../script.js';
import { generateProblem, PAGE_CAPACITY } from './problemGenerators.js';
import { LAYOUT_CONFIG } from './problemConfig.js';

let builderProblems = []; // Array of { id, type, problemData, weight, gridX, gridY, page }
let dragSrcEl = null;
let builderTitleText = '';

const TOPIC_OPTIONS = {
    'married_100': [
        { key: 'marriedMultiplesOf10', type: 'checkbox', labelKey: 'marriedMultiplesOf10' }
    ],
    'money_10': [
        { key: 'currency', type: 'select', options: ['CHF', 'EUR', 'USD', 'GBP'], labelKey: 'currency' }
    ],
    'money_100': [
        { key: 'currency', type: 'select', options: ['CHF', 'EUR', 'USD', 'GBP'], labelKey: 'currency' }
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

        const titleInput = document.getElementById('builderTitleInput');
        if (titleInput) titleInput.value = builderTitleText;
    } catch (e) {
        console.warn('Failed to load builder state:', e);
    }
}

function setupControls() {
    const gradeSelect = document.getElementById('builderGradeSelector');
    const topicSelect = document.getElementById('builderTopicSelector');
    if (!gradeSelect || !topicSelect) return;

    // Fill Grades
    gradeSelect.innerHTML = '';
    Object.keys(GRADE_TOPICS_STRUCTURE).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = T.ui.grades[g];
        gradeSelect.appendChild(opt);
    });

    window.updateBuilderTopics = () => {
        const grade = gradeSelect.value;
        const topics = GRADE_TOPICS_STRUCTURE[grade] || [];
        topicSelect.innerHTML = '';
        topics.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = T.topics[t];
            topicSelect.appendChild(opt);
        });
        window.updateBuilderTopicOptions();
    };

    window.updateBuilderTopicOptions = () => {
        const topic = topicSelect.value;
        const optionsContainer = document.getElementById('builderTopicOptions');
        optionsContainer.innerHTML = '';

        const optionsDef = TOPIC_OPTIONS[topic];
        if (optionsDef) {
            optionsDef.forEach(opt => {
                const group = document.createElement('div');
                group.className = 'option-group';

                const label = document.createElement('label');
                label.textContent = T.ui.builder.options?.[opt.labelKey] || opt.labelKey;

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
        }
    };

    // Event Listeners for sync
    gradeSelect.addEventListener('change', () => {
        window.updateBuilderTopics();
        updateURLState();
    });
    topicSelect.addEventListener('change', () => {
        window.updateBuilderTopicOptions();
        updateURLState();
    });

    // Initial fill
    window.updateBuilderTopics();

    // Title Input Listener
    const titleInput = document.getElementById('builderTitleInput');
    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            builderTitleText = e.target.value;
            saveToStorage();
            renderBuilderSheet();
        });
    }
}

function collectBuilderOptions() {
    const topic = document.getElementById('builderTopicSelector')?.value;
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
    const topic = document.getElementById('builderTopicSelector').value;
    const options = collectBuilderOptions();


    const currency = options.currency || 'CHF';
    const problemData = generateProblem(topic, currency, options, -1, window.lang || 'de');
    const weight = problemData.weight;

    builderProblems.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        type: topic,
        problemData,
        weight,
        params: { options, currency }
        // gridX, gridY, page will be assigned on first drag or by auto-layout
    });

    saveToStorage();
    renderBuilderSheet();
};

window.copyBuilderLink = function () {
    const state = serializeBuilderState();
    const url = new URL(window.location.href);
    url.hash = `build=${state}`;
    navigator.clipboard.writeText(url.toString()).then(() => {
        alert(T.ui.builder.linkCopied || 'Link kopiert!');
    });
};

function serializeBuilderState() {
    const data = builderProblems.map(p => {
        // Create a copy of problemData and remove redundant fields to save space
        const cleanData = { ...p.problemData };
        delete cleanData.weight;
        delete cleanData.span;
        delete cleanData.moduleType;
        delete cleanData.type; // Usually 'standard', but redundant if we have p.type

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
        g: gradeSelect ? gradeSelect.value : undefined,
        tp: topicSelect ? topicSelect.value : undefined,
        o: collectBuilderOptions()
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(stateObj))));
}

export function getBuilderState() {
    return serializeBuilderState();
}

export function hasBuilderContent() {
    return builderProblems.length > 0 || (builderTitleText && builderTitleText.trim() !== '');
}

export function loadBuilderState(base64) {
    try {
        const json = decodeURIComponent(escape(atob(base64)));
        const loaded = JSON.parse(json);

        let problems = [];
        // Support old format (array) and new format (object)
        if (Array.isArray(loaded)) {
            problems = loaded;
        } else {
            problems = loaded.d || [];
            builderTitleText = loaded.t || '';

            // Restore UI state for Grade and Topic
            const gradeSelect = document.getElementById('builderGradeSelector');
            const topicSelect = document.getElementById('builderTopicSelector');
            if (gradeSelect && loaded.g) {
                gradeSelect.value = loaded.g;
                if (window.updateBuilderTopics) window.updateBuilderTopics();
            }
            if (topicSelect && loaded.tp) {
                topicSelect.value = loaded.tp;
                if (window.updateBuilderTopicOptions) window.updateBuilderTopicOptions();

                // Restore options
                if (loaded.o) {
                    Object.entries(loaded.o).forEach(([key, val]) => {
                        const el = document.getElementById(`opt_${key}`);
                        if (el) {
                            if (el.type === 'checkbox') el.checked = val;
                            else el.value = val;
                        }
                    });
                }
            }
        }

        // Update Title Input if it exists
        const titleInput = document.getElementById('builderTitleInput');
        if (titleInput) titleInput.value = builderTitleText;

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
    if (confirm(T.ui.confirmDelete || 'Are you sure?')) {
        builderProblems = [];
        builderTitleText = ''; // Optional: clear title too? Yes, usually clear means clear everything.
        const titleInput = document.getElementById('builderTitleInput');
        if (titleInput) titleInput.value = '';
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



function renderBuilderSheet() {
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

        pages.forEach((pageItems, pageIdx) => {
            const problems = pageItems.map(p => p.problemData);
            const pageInfo = { current: pageIdx + 1, total: pages.length };

            // Use window.T if T is undefined
            let title = (window.T && window.T.ui && window.T.ui.builder) ? window.T.ui.builder.title : 'Arbeitsblatt (Baukasten)';
            if (builderTitleText && builderTitleText.trim() !== '') {
                title = builderTitleText;
            }

            // Use the existing createSheetElement but we'll wrap the problems to make them draggable
            const sheet = createSheetElement(title, problems, false, pageInfo);
            const gridEl = sheet.querySelector('.problem-grid');

            // Auto-Packer State
            const gridMap = Array(20).fill().map(() => Array(4).fill(false));
            const checkFit = (r, c, w, h) => {
                if (r < 1 || c < 1 || r + h - 1 > 20 || c + w - 1 > 4) return false;
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
                        if (r + i - 1 < 20 && c + j - 1 < 4) gridMap[r + i - 1][c + j - 1] = true;
                    }
                }
            };

            // 1. Mark explicit items first
            pageItems.forEach(p => {
                if (p.gridX !== undefined && p.gridY !== undefined) {
                    const w = p.problemData.span || 4;
                    const h = Math.max(1, Math.round(p.weight / (w || 1)));
                    markGrid(p.gridY, p.gridX, w, h);
                }
            });

            // Find all .problem elements and wrap/enhance them
            const problemElements = sheet.querySelectorAll('.problem');
            problemElements.forEach((el, idx) => {
                const pData = pageItems[idx];
                const w = pData.problemData.span || 4;
                const h = Math.max(1, Math.round(pData.weight / (w || 1)));

                // Resolve Position
                let gridX = pData.gridX;
                let gridY = pData.gridY;

                if (gridX === undefined || gridY === undefined) {
                    // Auto-Place: Find first available spot
                    let placed = false;
                    for (let r = 1; r <= 20; r++) {
                        for (let c = 1; c <= 4; c++) {
                            if (checkFit(r, c, w, h)) {
                                gridX = c;
                                gridY = r;
                                markGrid(r, c, w, h);
                                placed = true;

                                // PERSIST: Save these coordinates to the item state immediately
                                pData.gridX = gridX;
                                pData.gridY = gridY;

                                break;
                            }
                        }
                        if (placed) break;
                    }
                }

                // Wrap in a draggable container
                const dragContainer = document.createElement('div');
                dragContainer.className = 'builder-problem-wrapper';
                dragContainer.draggable = true;
                dragContainer.dataset.id = pData.id;

                // Transfer span/row from problem to wrapper (backup)
                dragContainer.style.gridColumn = el.style.gridColumn;
                dragContainer.style.gridRow = el.style.gridRow;

                // Set explicit grid area (ALWAYS, if we found a spot)
                if (gridX !== undefined && gridY !== undefined) {
                    dragContainer.style.gridArea = `${gridY} / ${gridX} / span ${h} / span ${w}`;
                    // Important: Store transient position on DOM for freezePlacement to find if needed?
                    // actually freezePlacement uses getBoundingClientRect so it respects this style.
                }

                // Add Remove Button
                const remBtn = document.createElement('button');
                remBtn.className = 'btn-remove-problem';
                remBtn.innerHTML = '✖';
                remBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.removeProblem(pData.id);
                };
                dragContainer.appendChild(remBtn);

                // Add Duplicate Button
                const dupBtn = document.createElement('button');
                dupBtn.className = 'btn-duplicate-problem';
                dupBtn.innerHTML = '📑'; // Icon for copy/duplicate
                dupBtn.title = 'Duplizieren';
                dupBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.duplicateProblem(pData.id);
                };
                dragContainer.appendChild(dupBtn);

                // Move problem element into drag container
                el.parentNode.insertBefore(dragContainer, el);
                dragContainer.appendChild(el);

                // Drag Events
                dragContainer.addEventListener('dragstart', handleDragStart);
                dragContainer.addEventListener('dragenter', handleDragEnter);
                dragContainer.addEventListener('dragover', handleDragOver);
                dragContainer.addEventListener('dragleave', handleDragLeave);
                dragContainer.addEventListener('drop', handleDrop);
                dragContainer.addEventListener('dragend', handleDragEnd);
            });



            if (gridEl) {
                gridEl.dataset.pageIdx = pageIdx;
                gridEl.addEventListener('dragover', handleDragOver);
                gridEl.addEventListener('drop', handleDrop);
                gridEl.addEventListener('dragleave', handleDragLeaveGrid);

                // Add drop indicator
                if (!gridEl.querySelector('.drop-indicator')) {
                    const indicator = document.createElement('div');
                    indicator.className = 'drop-indicator';
                    gridEl.appendChild(indicator);
                }
            }
            wrapper.appendChild(sheet);
        });
        updateURLState();
    } catch (err) {
        console.error('Render Error:', err);
        alert('Render Error: ' + err.message);
    }
}

// DRAG AND DROP HANDLERS
function handleDragStart(e) {
    this.classList.add('dragging');
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // console.log('Builder: Drag Over'); // Too noisy, but good to know it works

    const gridEl = e.target.closest('.problem-grid');
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
        const srcId = dragSrcEl.dataset.id;
        const index = builderProblems.findIndex(p => p.id === srcId);
        const problem = builderProblems[index];

        if (problem) {
            const w = problem.problemData.span || 4;
            const h = Math.max(1, Math.round(problem.weight / (w || 1)));

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
                const originalProblem = dragSrcEl.querySelector('.problem');
                if (originalProblem) {
                    const clone = originalProblem.cloneNode(true);
                    // Remove removal button if it was inside .problem? No, it's in wrapper.
                    // But .problem might have inputs. Make them readonly?
                    clone.querySelectorAll('input').forEach(input => {
                        input.readOnly = true;
                        input.removeAttribute('name');
                        input.removeAttribute('id'); // Avoid ID dupes
                    });
                    indicator.appendChild(clone);
                }
                indicator.dataset.previewId = srcId;
            }

            // Check Collision
            const pageIdx = parseInt(gridEl.dataset.pageIdx);
            const r1 = { x: clampedX, y: clampedY, w: w, h: h };

            let hasOverlap = false;

            // Filter other problems on this page (excluding self)
            // Note: builderProblems contains all problems. We need to check only those on this page.
            // Items not yet placed on this page might have old coordinates, but 
            // the render loop assigns them correctly. Wait, builderProblems stores gridX/gridY.

            builderProblems.forEach(p => {
                if (p.id !== srcId && p.page === pageIdx && p.gridX !== undefined && p.gridY !== undefined) {
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
    try {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();

        // Freeze all other items in their current positions to prevent jumping
        freezePlacement();

        const srcId = e.dataTransfer.getData('text/plain') || (dragSrcEl ? dragSrcEl.dataset.id : null);
        const problem = builderProblems.find(p => p.id === srcId);
        if (!problem) return false;

        // Find the target grid
        const gridEl = e.target.closest('.problem-grid');
        if (!gridEl) return false;

        const pageIdx = parseInt(gridEl.dataset.pageIdx);
        const rect = gridEl.getBoundingClientRect();

        const cellWidth = rect.width / 4;
        const cellHeight = rect.height / 20;

        const x = Math.min(4, Math.max(1, Math.floor((e.clientX - rect.left) / cellWidth) + 1));
        const y = Math.min(20, Math.max(1, Math.floor((e.clientY - rect.top) / cellHeight) + 1));

        const w = problem.problemData.span || 4;
        const h = Math.max(1, Math.round(problem.weight / (w || 1)));

        // Clamp values to grid bounds using the same logic as handleDragOver
        problem.gridX = Math.min(x, 4 - w + 1);
        problem.gridY = Math.min(y, 20 - h + 1);
        problem.page = pageIdx;

        saveToStorage();
        renderBuilderSheet();

    } catch (err) {
        console.error('Builder: Error in handleDrop:', err);
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drop-indicator').forEach(el => el.style.display = 'none');
    const items = document.querySelectorAll('.builder-problem-wrapper');
    items.forEach(item => item.classList.remove('drag-over'));
}

// Auto-init removed. Controlled by script.js to avoid circular dependency race conditions.
