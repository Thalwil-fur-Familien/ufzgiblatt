import { setSeed } from './mathUtils.js';
import { T, GRADE_TOPICS_STRUCTURE } from './state.js';
import { createSheetElement } from './sheet-renderer.js';
import { updateURLState } from '../script.js';
import { generateProblem, PAGE_CAPACITY } from './problemGenerators.js';
import { LAYOUT_CONFIG } from './problemConfig.js';
import LZString from './vendor/lz-string.js';

interface BuilderProblem {
    id: string;
    type: string;
    problemData: any;
    weight: number;
    params?: {
        options: any;
        currency: string;
    };
    gridX?: number;
    gridY?: number;
    page?: number;
}

let builderProblems: BuilderProblem[] = [];

let dragSrcEl: HTMLElement | null = null;
let builderTitleText: string = '';

let builderCurrentGrade: string = '1';
let builderCurrentTopic: string = '';

const TOPIC_OPTIONS: Record<string, any[]> = {
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

export function initBuilder(): void {
    loadFromStorage();
    setupControls();
    renderBuilderSheet();
}

function saveToStorage(): void {
    localStorage.setItem('ufzgiblatt_builder_problems', JSON.stringify(builderProblems));
    localStorage.setItem('ufzgiblatt_builder_title', builderTitleText);
    updateURLState();
}

function loadFromStorage(): void {
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

function setupControls(): void {
    renderBuilderTabs();

    // Initial Topic Default if none
    if (!builderCurrentTopic) {
        const topics = (GRADE_TOPICS_STRUCTURE as any)[builderCurrentGrade];
        if (topics && topics.length > 0) builderCurrentTopic = topics[0];
    }

    renderBuilderChips();
}

// Global function to update title from the sheet directly
(window as any).updateBuilderTitle = function (newTitle: string) {
    builderTitleText = newTitle;
    saveToStorage();
};

// --- BUILDER UI RENDERING ---

function renderBuilderTabs(): void {
    const container = document.getElementById('builderGradeTabs');
    if (!container) return;
    container.innerHTML = '';

    const uiT = ((window as any).T && (window as any).T.ui && (window as any).T.ui.grades) ? (window as any).T : (typeof T !== 'undefined' ? T : null);
    if (!uiT) return;

    Object.keys(GRADE_TOPICS_STRUCTURE).forEach(g => {
        const tab = document.createElement('div');
        tab.className = `grade-tab ${g === builderCurrentGrade ? 'active' : ''}`;
        tab.textContent = uiT.ui.grades[g];
        tab.onclick = () => handleBuilderGradeSelect(g);
        container.appendChild(tab);
    });
}

function handleBuilderGradeSelect(grade: string): void {
    if (builderCurrentGrade === grade) return;
    builderCurrentGrade = grade;

    // Reset Topic to first available
    const topics = (GRADE_TOPICS_STRUCTURE as any)[grade] || [];
    builderCurrentTopic = topics.length > 0 ? topics[0] : '';

    renderBuilderTabs();
    renderBuilderChips();
    updateURLState();
}

function renderBuilderChips(): void {
    const container = document.getElementById('builderTopicChips');
    if (!container) return;
    container.innerHTML = '';

    const topics = (GRADE_TOPICS_STRUCTURE as any)[builderCurrentGrade] || [];
    const uiT = ((window as any).T && (window as any).T.topics) ? (window as any).T : (typeof T !== 'undefined' ? T : null);

    if (!uiT) return;

    topics.forEach((topicKey: string) => {
        const chip = document.createElement('div');
        chip.className = `topic-chip ${topicKey === builderCurrentTopic ? 'active' : ''}`;
        chip.textContent = uiT.topics[topicKey] || topicKey;
        chip.dataset.topic = topicKey;
        chip.draggable = true;
        chip.ondragstart = (e: DragEvent) => {
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'copyMove';
                e.dataTransfer.setData('application/x-ufzgiblatt-topic', topicKey);
            }
            handleBuilderTopicClick(topicKey);
            dragSrcEl = chip;
            dragSrcEl.dataset.isNewTopic = 'true';
            dragSrcEl.dataset.topicKey = topicKey;
        };
        chip.ondragend = () => {
            dragSrcEl = null;
            document.querySelectorAll<HTMLElement>('.drop-indicator').forEach(el => el.style.display = 'none');
        };
        chip.onclick = () => handleBuilderTopicClick(topicKey);
        chip.ondblclick = () => {
            handleBuilderTopicClick(topicKey);
            (window as any).addProblemToBuilder();
        };
        container.appendChild(chip);
    });

    renderBuilderTopicOptions();
}

function updateTopicChipsVisuals(): void {
    const container = document.getElementById('builderTopicChips');
    if (!container) return;
    const chips = container.querySelectorAll<HTMLElement>('.topic-chip');
    chips.forEach(chip => {
        if (chip.dataset.topic === builderCurrentTopic) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

function handleBuilderTopicClick(topic: string): void {
    if (builderCurrentTopic === topic) return;
    builderCurrentTopic = topic;

    updateTopicChipsVisuals();
    renderBuilderTopicOptions();

    updateURLState();
}

function renderBuilderTopicOptions(): void {
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
            const uiT = (window as any).T || T;
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
                opt.options.forEach((o: string) => {
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

function collectBuilderOptions(): any {
    const topic = builderCurrentTopic;
    if (!topic) return {};
    const options: any = {};
    const optionsDef = TOPIC_OPTIONS[topic];
    if (optionsDef) {
        optionsDef.forEach(opt => {
            const el = document.getElementById(`opt_${opt.key}`) as HTMLInputElement | HTMLSelectElement;
            if (el) {
                options[opt.key] = el.type === 'checkbox' ? (el as HTMLInputElement).checked : el.value;
            }
        });
    }
    return options;
}

(window as any).addProblemToBuilder = function () {
    const topic = builderCurrentTopic;
    if (!topic) return;
    const options = collectBuilderOptions();

    const problem = createProblemObject(topic, options);
    builderProblems.push(problem);

    saveToStorage();
    renderBuilderSheet();
};

function createProblemObject(topic: string, options: any, gridX?: number, gridY?: number, page?: number): BuilderProblem {
    const currency = options.currency || 'CHF';
    const problemData = generateProblem(topic, currency, options, -1, (window as any).lang || 'de');
    const weight = problemData?.weight || 36;

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

(window as any).copyBuilderLink = function () {
    const state = serializeBuilderState();
    const url = new URL(window.location.href);
    url.hash = `build=${state}`;
    navigator.clipboard.writeText(url.toString()).then(() => {
        const uiT = (window as any).T || T;
        alert(uiT.ui.builder.linkCopied || 'Link kopiert!');
    });
};

function serializeBuilderState(): string {
    const data = builderProblems.map(p => {
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

    const stateObj = {
        d: data,
        t: builderTitleText,
        g: builderCurrentGrade,
        tp: builderCurrentTopic,
        o: collectBuilderOptions(),
        s: (document.getElementById('builderSolutionToggle') as HTMLInputElement)?.checked ? 1 : 0,
        q: (document.getElementById('builderShowQR') as HTMLInputElement)?.checked ?? 1 ? 1 : 0
    };

    const json = JSON.stringify(stateObj);
    return LZString.compressToEncodedURIComponent(json);
}

export function getBuilderState(): string {
    return serializeBuilderState();
}

export function hasBuilderContent(): boolean {
    if (!builderProblems) return false;
    return builderProblems.length > 0 || (!!builderTitleText && builderTitleText.trim() !== '');
}

export function loadBuilderState(hash: string): void {
    try {
        let json = LZString.decompressFromEncodedURIComponent(hash);

        // Fallback for legacy Base64 links
        if (!json || (!json.startsWith('{') && !json.startsWith('['))) {
            try {
                json = decodeURIComponent(escape(atob(hash)));
            } catch (e) {
                console.warn('Failed to decode legacy hash.');
            }
        }

        if (!json) return;

        const loaded = JSON.parse(json);

        let problems: any[] = [];
        if (Array.isArray(loaded)) {
            problems = loaded;
        } else {
            problems = loaded.d || [];
            builderTitleText = loaded.t || '';

            if (loaded.g) builderCurrentGrade = loaded.g;
            if (loaded.tp) {
                builderCurrentTopic = loaded.tp;
                renderBuilderTabs();
                renderBuilderChips();

                if (loaded.s !== undefined) {
                    const sol = document.getElementById('builderSolutionToggle') as HTMLInputElement;
                    if (sol) sol.checked = !!loaded.s;
                }
                if (loaded.q !== undefined) {
                    const qr = document.getElementById('builderShowQR') as HTMLInputElement;
                    if (qr) qr.checked = !!loaded.q;
                }

                if (loaded.o) {
                    setTimeout(() => {
                        Object.entries(loaded.o).forEach(([key, val]: [string, any]) => {
                            const el = document.getElementById(`opt_${key}`) as HTMLInputElement | HTMLSelectElement;
                            if (el) {
                                if (el.type === 'checkbox') (el as HTMLInputElement).checked = !!val;
                                else el.value = val;
                            }
                        });
                    }, 0);
                }
            }
        }

        builderProblems = problems.map(item => {
            const config = (LAYOUT_CONFIG as any)[item.t] || (LAYOUT_CONFIG as any)['default'];
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
        console.error('Failed to load builder state:', e);
    }
}

(window as any).duplicateProblem = function (id: string) {
    const original = builderProblems.find(p => p.id === id);
    if (!original) return;

    const clone = JSON.parse(JSON.stringify(original));
    clone.id = Date.now() + Math.random().toString(36).substr(2, 9);
    delete clone.gridX;
    delete clone.gridY;
    delete clone.page;

    builderProblems.push(clone);
    saveToStorage();
    renderBuilderSheet();
};

(window as any).clearBuilder = function () {
    const uiT = (window as any).T || T;
    if (confirm(uiT.ui.confirmDelete || 'Are you sure?')) {
        builderProblems = [];
        builderTitleText = '';
        saveToStorage();
        renderBuilderSheet();
    }
};

(window as any).refreshBuilderSeed = function () {
    const newSeed = Math.floor(Math.random() * 0xFFFFFFFF);
    setSeed(newSeed);

    builderProblems.forEach(p => {
        const params = p.params || { options: {}, currency: 'CHF' };
        const options = params.options || {};
        const currency = params.currency || 'CHF';
        p.problemData = generateProblem(p.type, currency, options, -1, (window as any).lang || 'de');
    });

    saveToStorage();
    renderBuilderSheet();
};

(window as any).removeProblem = function (id: string) {
    builderProblems = builderProblems.filter(p => p.id !== id);
    saveToStorage();
    renderBuilderSheet();
};

export function renderBuilderSheet(): void {
    (window as any).renderBuilderSheet = renderBuilderSheet;
    try {
        const wrapper = document.getElementById('builderSheetsWrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';

        let pages: BuilderProblem[][] = [[]];

        const placed = builderProblems.filter(p => p.page !== undefined);
        const unplaced = builderProblems.filter(p => p.page === undefined);

        const maxPage = placed.reduce((max, p) => Math.max(max, p.page || 0), 0);
        for (let i = 0; i <= maxPage; i++) {
            pages[i] = placed.filter(p => p.page === i);
        }
        if (pages.length === 0) pages = [[]];

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

        const showSolutions = (document.getElementById('builderSolutionToggle') as HTMLInputElement)?.checked || false;
        const showQR = (document.getElementById('builderShowQR') as HTMLInputElement)?.checked ?? true;

        const renderSingleSheet = (pageItems: BuilderProblem[], pageIdx: number, isSolution: boolean) => {
            const problems = pageItems.map(p => p.problemData);
            const pageInfo = { current: pageIdx + 1, total: pages.length };

            let title = ((window as any).T && (window as any).T.ui && (window as any).T.ui.builder) ? (window as any).T.ui.builder.title : 'Arbeitsblatt (Baukasten)';
            if (builderTitleText && builderTitleText.trim() !== '') {
                title = builderTitleText;
            }

            const sheet = createSheetElement(title, problems, isSolution, pageInfo, !isSolution);

            const qr = sheet.querySelector('.qr-code-container');
            if (qr) {
                if (showQR) qr.classList.remove('qr-hidden');
                else qr.classList.add('qr-hidden');
            }

            const gridEl = sheet.querySelector('.problem-grid') as HTMLElement;

            const gridMap = Array(45).fill(null).map(() => Array(12).fill(false));
            const checkFit = (r: number, c: number, w: number, h: number) => {
                if (r < 1 || c < 1 || r + h - 1 > 45 || c + w - 1 > 12) return false;
                for (let i = 0; i < h; i++) {
                    for (let j = 0; j < w; j++) {
                        if (gridMap[r + i - 1][c + j - 1]) return false;
                    }
                }
                return true;
            };
            const markGrid = (r: number, c: number, w: number, h: number) => {
                for (let i = 0; i < h; i++) {
                    for (let j = 0; j < w; j++) {
                        if (r + i - 1 < 45 && c + j - 1 < 12) gridMap[r + i - 1][c + j - 1] = true;
                    }
                }
            };

            pageItems.forEach(p => {
                if (p.gridX !== undefined && p.gridY !== undefined) {
                    const w = p.problemData.span || 12;
                    const h = Math.max(1, Math.round(p.weight / (w || 1)));
                    markGrid(p.gridY, p.gridX, w, h);
                }
            });

            const problemElements = sheet.querySelectorAll('.problem');
            problemElements.forEach((el, idx) => {
                const pData = pageItems[idx];
                const w = pData.problemData.span || 12;
                const h = Math.max(1, Math.round(pData.weight / (w || 1)));

                let gridX = pData.gridX;
                let gridY = pData.gridY;

                if (gridX === undefined || gridY === undefined) {
                    let placed = false;
                    for (let r = 1; r <= 45; r++) {
                        for (let c = 1; c <= 12; c++) {
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
                    const remBtn = document.createElement('button');
                    remBtn.className = 'btn-remove-problem';
                    remBtn.innerHTML = '✖';
                    remBtn.onclick = (e) => {
                        e.stopPropagation();
                        (window as any).removeProblem(pData.id);
                    };
                    wrapper.appendChild(remBtn);

                    const dupBtn = document.createElement('button');
                    dupBtn.className = 'btn-duplicate-problem';
                    dupBtn.innerHTML = '📑';
                    dupBtn.title = 'Duplizieren';
                    dupBtn.onclick = (e) => {
                        e.stopPropagation();
                        (window as any).duplicateProblem(pData.id);
                    };
                    wrapper.appendChild(dupBtn);

                    const handle = document.createElement('div');
                    handle.className = 'resize-handle no-print';
                    handle.onmousedown = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        (window as any).initResize(e, pData.id);
                    };
                    wrapper.appendChild(handle);

                    wrapper.addEventListener('dragstart', handleDragStart);
                    wrapper.addEventListener('dragenter', handleDragEnter);
                    wrapper.addEventListener('dragover', handleDragOver);
                    wrapper.addEventListener('dragleave', handleDragLeave);
                    wrapper.addEventListener('drop', handleDrop);
                    wrapper.addEventListener('dragend', handleDragEnd);
                }

                el.parentNode?.insertBefore(wrapper, el);
                wrapper.appendChild(el);
            });

            if (gridEl && !isSolution) {
                gridEl.dataset.pageIdx = pageIdx.toString();
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

        pages.forEach((pageItems, pageIdx) => {
            wrapper.appendChild(renderSingleSheet(pageItems, pageIdx, false));
        });

        if (showSolutions) {
            pages.forEach((pageItems, pageIdx) => {
                wrapper.appendChild(renderSingleSheet(pageItems, pageIdx, true));
            });
        }
        updateURLState();
        if (typeof (window as any).autoScaleSheet === 'function') (window as any).autoScaleSheet();
    } catch (err: any) {
        console.error('Render Error:', err);
    }
}

function handleDragStart(this: HTMLElement, e: DragEvent): void {
    this.classList.add('dragging');
    dragSrcEl = this;
    dragSrcEl.dataset.isNewTopic = 'false';
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.id || '');
    }
}

function handleDragOver(e: DragEvent): boolean {
    if (e.preventDefault) e.preventDefault();

    if (e.dataTransfer) {
        if (dragSrcEl && dragSrcEl.dataset.isNewTopic === 'true') {
            e.dataTransfer.dropEffect = 'copy';
        } else {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    let gridEl = (e.target as HTMLElement).closest('.problem-grid') as HTMLElement;
    if (!gridEl) {
        const grids = document.querySelectorAll<HTMLElement>('.problem-grid');
        for (const grid of grids) {
            const rect = grid.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                gridEl = grid;
                break;
            }
        }
    }

    if (!gridEl || !dragSrcEl) return false;

    const rect = gridEl.getBoundingClientRect();
    const cellWidth = rect.width / 12;
    const cellHeight = rect.height / 45;

    const x = Math.min(12, Math.max(1, Math.floor((e.clientX - rect.left) / cellWidth) + 1));
    const y = Math.min(45, Math.max(1, Math.floor((e.clientY - rect.top) / cellHeight) + 1));

    const indicator = gridEl.querySelector('.drop-indicator') as HTMLElement;
    if (indicator) {
        let w: number = 0, h: number = 0, srcId: string = '';

        if (dragSrcEl && dragSrcEl.dataset.isNewTopic === 'false') {
            srcId = dragSrcEl.dataset.id || '';
            const problem = builderProblems.find(p => p.id === srcId);
            if (problem) {
                w = problem.problemData.span || 12;
                h = Math.max(1, Math.round(problem.weight / (w || 1)));
            }
        }
        else if (dragSrcEl && dragSrcEl.dataset.isNewTopic === 'true') {
            srcId = 'new_' + dragSrcEl.dataset.topicKey;
            const options = collectBuilderOptions();
            const topic = dragSrcEl.dataset.topicKey || '';
            const tempObj = createProblemObject(topic, options);
            w = tempObj.problemData.span || 12;
            h = Math.max(1, Math.round(tempObj.weight / (w || 1)));
        }

        if (w && h) {
            const clampedX = Math.min(x, 12 - w + 1);
            const clampedY = Math.min(y, 45 - h + 1);

            indicator.style.display = 'flex';
            indicator.style.left = `${(clampedX - 1) * (100 / 12)}%`;
            indicator.style.top = `${(clampedY - 1) * cellHeight}px`;
            indicator.style.width = `${w * (100 / 12)}%`;
            indicator.style.height = `${h * cellHeight}px`;

            if (indicator.dataset.previewId !== srcId) {
                indicator.innerHTML = '';
                if (srcId.startsWith('new_')) {
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
                    const originalProblem = dragSrcEl.querySelector('.problem');
                    if (originalProblem) {
                        const clone = originalProblem.cloneNode(true) as HTMLElement;
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

            const pageIdx = parseInt(gridEl.dataset.pageIdx || '0');
            const r1 = { x: clampedX, y: clampedY, w: w, h: h };
            let hasOverlap = false;

            builderProblems.forEach(p => {
                if (dragSrcEl?.dataset.isNewTopic === 'false' && p.id === dragSrcEl?.dataset.id) return;
                if (p.page === pageIdx && p.gridX !== undefined && p.gridY !== undefined) {
                    const pW = p.problemData.span || 12;
                    const pH = Math.max(1, Math.round(p.weight / (pW || 1)));
                    const r2 = { x: p.gridX, y: p.gridY, w: pW, h: pH };
                    if (!(r1.x + r1.w - 1 < r2.x || r1.x > r2.x + r2.w - 1 || r1.y + r1.h - 1 < r2.y || r1.y > r2.y + r2.h - 1)) {
                        hasOverlap = true;
                    }
                }
            });

            if (hasOverlap) indicator.classList.add('overlap');
            else indicator.classList.remove('overlap');
        }
    }

    return false;
}

function handleDragEnter(this: HTMLElement, _e: DragEvent): void {
    this.classList.add('drag-over');
}

function handleDragLeave(this: HTMLElement, _e: DragEvent): void {
    this.classList.remove('drag-over');
}

function handleDragLeaveGrid(this: HTMLElement, e: DragEvent): void {
    if (e.relatedTarget && this.contains(e.relatedTarget as Node)) return;
    const indicator = this.querySelector('.drop-indicator') as HTMLElement;
    if (indicator) indicator.style.display = 'none';
}

function freezePlacement(): void {
    const grids = document.querySelectorAll<HTMLElement>('.problem-grid');
    grids.forEach(grid => {
        const pageIdx = parseInt(grid.dataset.pageIdx || '0');
        if (isNaN(pageIdx)) return;

        const rect = grid.getBoundingClientRect();
        const cellWidth = rect.width / 12;
        const cellHeight = rect.height / 45;

        const items = grid.querySelectorAll<HTMLElement>('.builder-problem-wrapper');
        items.forEach(item => {
            const id = item.dataset.id;
            const p = builderProblems.find(prob => prob.id === id);
            if (!p) return;

            if (p.gridX !== undefined && p.gridY !== undefined && p.page !== undefined) return;

            const itemRect = item.getBoundingClientRect();
            const relX = itemRect.left - rect.left;
            const relY = itemRect.top - rect.top;

            let col = Math.round(relX / cellWidth) + 1;
            let row = Math.round(relY / cellHeight) + 1;

            col = Math.max(1, Math.min(12, col));
            row = Math.max(1, Math.min(45, row));

            p.gridX = col;
            p.gridY = row;
            p.page = pageIdx;
        });
    });
}

function handleDrop(e: DragEvent): boolean {
    try {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();

        freezePlacement();

        let gridEl = (e.target as HTMLElement).closest('.problem-grid') as HTMLElement;
        if (!gridEl) {
            const sheetEl = (e.target as HTMLElement).closest('.sheet');
            if (sheetEl) gridEl = sheetEl.querySelector('.problem-grid') as HTMLElement;
        }

        if (!gridEl) return false;

        const pageIdx = parseInt(gridEl.dataset.pageIdx || '0');
        const rect = gridEl.getBoundingClientRect();
        const cellWidth = rect.width / 12;
        const cellHeight = rect.height / 45;

        const mouseX = Math.min(12, Math.max(1, Math.floor((e.clientX - rect.left) / cellWidth) + 1));
        const mouseY = Math.min(45, Math.max(1, Math.floor((e.clientY - rect.top) / cellHeight) + 1));

        let newTopic = e.dataTransfer?.getData('application/x-ufzgiblatt-topic');
        if (!newTopic && dragSrcEl && dragSrcEl.dataset.isNewTopic === 'true') {
            newTopic = dragSrcEl.dataset.topicKey;
        }

        if (newTopic) {
            const options = collectBuilderOptions();
            const tempObj = createProblemObject(newTopic, options);
            const w = tempObj.problemData.span || 12;
            const h = Math.max(1, Math.round(tempObj.weight / (w || 1)));

            tempObj.gridX = Math.min(mouseX, 12 - w + 1);
            tempObj.gridY = Math.min(mouseY, 45 - h + 1);
            tempObj.page = pageIdx;

            builderProblems.push(tempObj);
            saveToStorage();
            renderBuilderSheet();
            return false;
        }

        const srcId = e.dataTransfer?.getData('text/plain') || (dragSrcEl ? dragSrcEl.dataset.id : null);
        const problem = builderProblems.find(p => p.id === srcId);
        if (!problem) return false;

        const w = problem.problemData.span || 12;
        const h = Math.max(1, Math.round(problem.weight / (w || 1)));

        problem.gridX = Math.min(mouseX, 12 - w + 1);
        problem.gridY = Math.min(mouseY, 45 - h + 1);
        problem.page = pageIdx;

        saveToStorage();
        renderBuilderSheet();

    } catch (err) {
        console.error('Builder Drop Error:', err);
    }
    return false;
}

function handleDragEnd(this: HTMLElement, _e: DragEvent): void {
    this.classList.remove('dragging');
    document.querySelectorAll<HTMLElement>('.drop-indicator').forEach(el => el.style.display = 'none');
    document.querySelectorAll<HTMLElement>('.builder-problem-wrapper').forEach(item => item.classList.remove('drag-over'));
}

(window as any).initResize = function (e: MouseEvent, id: string) {
    const p = builderProblems.find(item => item.id === id);
    if (!p) return;

    const startX = e.clientX;
    const startSpan = p.problemData.span || 12;
    const startWeight = p.weight;
    const ratio = startSpan / startWeight;

    const gridEl = document.querySelector(`.problem-grid[data-page-idx="${p.page}"]`) as HTMLElement;
    if (!gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const cellWidth = rect.width / 12;

    const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const cellDeltaX = Math.round(deltaX / cellWidth);

        let newSpan = startSpan + cellDeltaX;
        if (newSpan < 1) newSpan = 1;
        if (newSpan > (12 - (p.gridX || 1) + 1)) newSpan = 12 - (p.gridX || 1) + 1;

        const wrapper = document.querySelector(`.builder-problem-wrapper[data-id="${id}"]`) as HTMLElement;
        if (wrapper) {
            const newWeight = Math.round(newSpan / ratio);
            const newRows = Math.max(1, Math.round(newWeight / newSpan));
            wrapper.style.gridArea = `${p.gridY} / ${p.gridX} / span ${newRows} / span ${newSpan}`;
        }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const deltaX = upEvent.clientX - startX;
        const cellDeltaX = Math.round(deltaX / cellWidth);

        let newSpan = startSpan + cellDeltaX;
        if (newSpan < 1) newSpan = 1;
        if (newSpan > (12 - (p.gridX || 1) + 1)) newSpan = 12 - (p.gridX || 1) + 1;

        p.problemData.span = newSpan;
        p.weight = Math.round(newSpan / ratio);
        if (p.problemData.weight !== undefined) p.problemData.weight = p.weight;

        saveToStorage();
        renderBuilderSheet();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
};
