import { TRANSLATIONS, getPreferredLanguage, setPreferredLanguage } from './translations.js';
import { globalSeed, setSeed, seededRandom } from './mathUtils.js';
import { getURLParams, getPageFromHash } from './urlUtils.js';

let T: any;
let lang: string;
let basePath: string;

const MAPS: Record<string, string> = {
    'switzerland': 'images/switzerlandHigh-amcharts.com.svg',
    'europe': 'images/europeHigh.svg',
    'world': 'images/continentsHigh.svg'
};

// Game state
interface GeoState {
    regionData: Array<{ id: string, name: string }>;
    solvedRegions: string[];
    currentRegion: { id: string, name: string } | null;
    score: number;
    totalRounds: number;
    wrongGuesses: number;
    currentMap: string;
    currentRoundFirstTry: boolean;
    gameMode: string;
    dragItems: any[];
    dragFailures: Record<string, number>;
    selectedItemId: string | null;
}

let geoState: GeoState = {
    regionData: [],
    solvedRegions: [],
    currentRegion: null,
    score: 0,
    totalRounds: 0,
    wrongGuesses: 0,
    currentMap: 'switzerland',
    currentRoundFirstTry: true,
    gameMode: 'find',
    dragItems: [],
    dragFailures: {},
    selectedItemId: null
};

function trackEvent(name: string, props: any = {}) {
    if ((window as any).posthog) {
        (window as any).posthog.capture(name, props);
    }
}

export async function initGeoGame(config: { basePath: string }) {
    lang = getPreferredLanguage();
    setPreferredLanguage(lang);
    basePath = config.basePath;

    const mapSelector = document.getElementById('map-selector') as HTMLSelectElement;
    if (mapSelector) {
        mapSelector.onchange = (e) => loadMap((e.target as HTMLSelectElement).value);
    }

    const modeSelector = document.getElementById('mode-selector') as HTMLSelectElement;
    if (modeSelector) {
        modeSelector.onchange = (e) => setGameMode((e.target as HTMLSelectElement).value);
    }

    try {
        const UI = (TRANSLATIONS as any)[lang].ui;
        T = UI.geoGame;

        const btnBack = document.getElementById('btnBack');
        if (btnBack && UI.btnBack) btnBack.textContent = UI.btnBack;

        if (UI.gameTitle) document.title = UI.gameTitle;

        const ids = ['navGenerator', 'navGames', 'navGameGeo', 'labelFeedback', 'buildInfo'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && UI[id]) el.textContent = UI[id];
        });

        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';

    } catch (e) {
        console.error('Translation error:', e);
        return;
    }

    const params = getURLParams();
    if (params.has('seed')) {
        const seedValue = parseInt(params.get('seed')!);
        if (!isNaN(seedValue)) {
            setSeed(seedValue);
        }
    }

    const initialMap = params.get('map') || 'switzerland';
    const initialMode = params.get('mode') || 'find';

    if (mapSelector) mapSelector.value = initialMap;
    if (modeSelector) modeSelector.value = initialMode;

    geoState.gameMode = initialMode;
    await loadMap(initialMap);

    const restartBtn = document.getElementById('restart-game');
    if (restartBtn) restartBtn.onclick = restartGame;

    const deLink = document.getElementById('lang-de') as HTMLAnchorElement;
    const enLink = document.getElementById('lang-en') as HTMLAnchorElement;

    if (deLink && enLink) {
        const params = getURLParams();

        if (lang === 'de') {
            deLink.classList.add('active');
            deLink.href = 'javascript:void(0)';
            enLink.classList.remove('active');

            params.set('lang', 'en');
            enLink.href = '?' + params.toString();
        } else {
            enLink.classList.add('active');
            enLink.href = 'javascript:void(0)';
            deLink.classList.remove('active');

            params.set('lang', 'de');
            deLink.href = '?' + params.toString();
        }
    }

    updateNavigationLinks();
}

function updateNavigationLinks() {
    const params = getURLParams();
    const lang = params.get('lang') || 'de';
    const seed = params.get('seed') || '';

    const logoLink = document.querySelector('.site-logo a') as HTMLAnchorElement;
    const generatorLink = document.getElementById('navGenerator') as HTMLAnchorElement;

    const savedStateStr = sessionStorage.getItem('worksheetState');
    let backParams: URLSearchParams;

    if (savedStateStr) {
        const state = JSON.parse(savedStateStr);
        backParams = new URLSearchParams();
        backParams.set('lang', state.lang);
        backParams.set('grade', state.grade);
        backParams.set('topic', state.topic);
        backParams.set('count', state.count);
        backParams.set('seed', state.seed);
    } else {
        backParams = new URLSearchParams();
        if (lang) backParams.set('lang', lang);
        if (seed) backParams.set('seed', seed);
    }

    if (logoLink) {
        const href = logoLink.getAttribute('href')!;
        const base = href.split(/[?#]/)[0];
        const hash = getPageFromHash() || 'generator';
        logoLink.href = `${base}#${hash}?${backParams.toString()}`;
    }

    if (generatorLink) {
        const href = generatorLink.getAttribute('href')!;
        const base = href.split(/[?#]/)[0];
        const hash = 'generator';
        generatorLink.href = `${base}#${hash}?${backParams.toString()}`;
    }
}

function setGameMode(mode: string) {
    geoState.gameMode = mode;
    updateURLState();
    restartGame();
}

function updateURLState() {
    const url = new URL(window.location.href);
    url.searchParams.set('map', geoState.currentMap);
    url.searchParams.set('mode', geoState.gameMode);
    url.searchParams.set('seed', globalSeed.toString());
    window.history.replaceState({}, '', url.toString());
}

async function loadMap(mapKey: string) {
    geoState.currentMap = mapKey;

    const modeSelector = document.getElementById('mode-selector') as HTMLSelectElement;
    if (modeSelector) {
        const flagOption = modeSelector.querySelector('option[value="flag"]') as HTMLElement;
        if (flagOption) {
            if (mapKey !== 'switzerland') {
                flagOption.style.display = 'none';
                if (geoState.gameMode === 'flag') {
                    geoState.gameMode = 'find';
                    modeSelector.value = 'find';
                }
            } else {
                flagOption.style.display = 'block';
            }
        }
    }

    updateURLState();
    const mapContainer = document.getElementById('map-container');
    const instructionEl = document.getElementById('game-instruction');

    if (instructionEl) instructionEl.textContent = T.loading;
    if (mapContainer) mapContainer.innerHTML = '<p>' + T.loading + '</p>';

    try {
        const svgPath = basePath + MAPS[mapKey];
        const response = await fetch(svgPath);
        if (!response.ok) throw new Error('Failed to load map: ' + response.status);

        let svgText = await response.text();
        if (mapContainer) {
            mapContainer.innerHTML = svgText;

            const svg = mapContainer.querySelector('svg');
            if (!svg) throw new Error('No SVG found');

            if (!svg.hasAttribute('viewBox')) {
                try {
                    const bbox = (svg as any).getBBox();
                    if (bbox && (bbox.width > 0 || bbox.height > 0)) {
                        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                        svg.style.width = '100%';
                        svg.style.height = 'auto';
                    }
                } catch (e) {
                    console.warn('Could not auto-fit map:', e);
                    svg.setAttribute('viewBox', '0 0 800 600');
                }
            }

            extractRegionsFromSVG(svg);
        }

        resetGeoGameState();
        setupGeoGame();

    } catch (error) {
        console.error('Error loading map:', error);
        if (mapContainer) mapContainer.innerHTML = `<p>${T.error}</p>`;
    }
}

function extractRegionsFromSVG(svg: SVGSVGElement) {
    geoState.regionData = [];
    const paths = svg.querySelectorAll<SVGPathElement | SVGCircleElement>('path, circle');
    paths.forEach(path => {
        const id = path.getAttribute('id');
        let title = path.getAttribute('title')?.trim() || '';

        if ((TRANSLATIONS as any)[lang].ui.geoNames && (TRANSLATIONS as any)[lang].ui.geoNames[title]) {
            title = (TRANSLATIONS as any)[lang].ui.geoNames[title];
            path.setAttribute('title', title);
        }

        if (geoState.currentMap === 'switzerland' && id && !id.startsWith('CH-')) {
            return;
        }

        if (id && title) {
            let abbr = id;
            if (id.startsWith('CH-')) {
                abbr = id.substring(3);
            }
            if (abbr.length <= 3) {
                title = `${title} (${abbr})`;
                path.setAttribute('title', title);
            }

            geoState.regionData.push({ id, name: title });
            path.classList.add('region-path');

            const newPath = path.cloneNode(true) as SVGPathElement;
            path.parentNode?.replaceChild(newPath, path);

            setupPathListeners(newPath, id);
        }
    });

    const labels = svg.querySelectorAll<SVGElement>('text, g[id*="Abbr"], g[id*="Name"]');
    labels.forEach(l => {
        l.style.display = 'none';
        l.style.pointerEvents = 'none';
    });
}

function setupPathListeners(pathElement: SVGElement | HTMLElement, id: string) {
    pathElement.addEventListener('click', () => {
        if (geoState.gameMode === 'find') {
            handleGeoRegionClick(id);
        } else if (geoState.selectedItemId) {
            handleDragDrop(geoState.selectedItemId, id);
        }
    });

    const dragModes = ['drag', 'allocate', 'flag'];

    pathElement.addEventListener('dragover', (e) => {
        if (dragModes.includes(geoState.gameMode)) {
            e.preventDefault();
            pathElement.classList.add('drag-over');
        }
    });

    pathElement.addEventListener('dragleave', () => {
        if (dragModes.includes(geoState.gameMode)) {
            pathElement.classList.remove('drag-over');
        }
    });

    pathElement.addEventListener('drop', (e: Event) => {
        if (dragModes.includes(geoState.gameMode) && (e as DragEvent).dataTransfer) {
            e.preventDefault();
            pathElement.classList.remove('drag-over');
            const droppedId = (e as DragEvent).dataTransfer!.getData('text/plain');
            handleDragDrop(droppedId, id);
        }
    });
}

function resetGeoGameState() {
    geoState.solvedRegions = [];
    geoState.score = 0;
    geoState.currentRegion = null;
    geoState.wrongGuesses = 0;
    geoState.currentRoundFirstTry = true;
    geoState.totalRounds = geoState.regionData.length;
    geoState.dragFailures = {};
    geoState.selectedItemId = null;

    const paths = document.querySelectorAll('.region-path');
    paths.forEach(path => {
        path.classList.remove('correct', 'incorrect', 'hint', 'not-found', 'drag-over');
    });

    const labels = document.querySelectorAll('.region-label, .temp-label, .hint-arrow-group, .hint-arrow');
    labels.forEach(l => l.remove());

    const dragContainer = document.getElementById('drag-container');
    if (dragContainer) {
        dragContainer.innerHTML = '';
        dragContainer.style.display = 'none';
    }

    const flagContainer = document.getElementById('flag-container');
    if (flagContainer) {
        flagContainer.innerHTML = '';
        flagContainer.style.display = 'none';
    }

    const mapContainer = document.getElementById('map-container');
    if (mapContainer) mapContainer.style.display = 'block';

    updateGeoScore();
}

function setupGeoGame() {
    if (geoState.gameMode === 'find') {
        updateGeoInstruction(T.instruction);
        startNewGeoRound();
    } else if (geoState.gameMode === 'drag' || geoState.gameMode === 'allocate') {
        setupDragMode();
    } else if (geoState.gameMode === 'flag') {
        setupFlagMode();
    }
}

function startNewGeoRound() {
    if (geoState.solvedRegions.length >= geoState.totalRounds && geoState.totalRounds > 0) {
        endGeoGame();
        return;
    }
    let available = geoState.regionData.filter(r => !geoState.solvedRegions.includes(r.id));
    if (available.length === 0) {
        endGeoGame();
        return;
    }
    const randomIndex = Math.floor(seededRandom() * available.length);
    geoState.currentRegion = available[randomIndex];
    geoState.wrongGuesses = 0;
    geoState.currentRoundFirstTry = true;
    updateGeoInstruction(T.instructionStart.replace('{region}', geoState.currentRegion.name));
    updateGeoScore();
}

function handleGeoRegionClick(regionId: string) {
    if (!geoState.currentRegion) return;
    const targetPath = document.getElementById(regionId);

    if (regionId === geoState.currentRegion.id) {
        if (geoState.currentRoundFirstTry) {
            geoState.score++;
        }
        geoState.solvedRegions.push(regionId);

        const arrowGroups = document.querySelectorAll('.hint-arrow-group, .hint-arrow');
        arrowGroups.forEach(g => g.remove());

        if (targetPath) {
            targetPath.classList.remove('not-found', 'hint');
            targetPath.classList.add('correct');
        }
        showRegionName(targetPath as any as SVGElement, true);
        updateGeoInstruction('✅ ' + geoState.currentRegion.name);
        setTimeout(() => { startNewGeoRound(); }, 1000);
    } else {
        geoState.wrongGuesses++;
        geoState.currentRoundFirstTry = false;

        if (targetPath) {
            targetPath.classList.add('incorrect');
            setTimeout(() => { targetPath.classList.remove('incorrect'); }, 500);
            showRegionName(targetPath as any as SVGElement, false);

            const wrongName = targetPath.getAttribute('title');
            if (wrongName) {
                updateGeoInstruction(T.feedbackWrong.replace('{region}', wrongName));
                setTimeout(() => {
                    if (geoState.currentRegion) {
                        updateGeoInstruction(T.instructionStart.replace('{region}', geoState.currentRegion.name));
                    }
                }, 1500);
            }
        }
        if (geoState.wrongGuesses >= 3) {
            const correctPath = document.getElementById(geoState.currentRegion.id);
            if (correctPath) {
                correctPath.classList.add('hint');
                showHintArrow(correctPath as any as SVGElement);
            }
        }
    }
    updateGeoScore();
}

function setupFlagMode() {
    updateGeoInstruction(T.instructionAllocate || "Ziehe die Namen auf das richtige Gebiet!");

    const flagContainer = document.getElementById('flag-container');
    if (!flagContainer) return;
    flagContainer.innerHTML = '';
    flagContainer.style.display = 'flex';

    const mapContainer = document.getElementById('map-container');
    if (mapContainer) mapContainer.style.display = 'none';

    const batchSize = 6;
    let available = geoState.regionData.filter(r => !geoState.solvedRegions.includes(r.id));

    if (available.length === 0) {
        endGeoGame();
        return;
    }

    available.sort(() => seededRandom() - 0.5);
    let batch = available.slice(0, batchSize);

    batch.forEach(item => {
        const flagDiv = document.createElement('div');
        flagDiv.className = 'flag-item';
        flagDiv.id = item.id;

        const flagFile = getFlagFilename(item.id);

        const img = document.createElement('img');
        img.src = basePath + 'images/flags/' + flagFile;
        img.alt = item.name;
        img.draggable = false;

        flagDiv.appendChild(img);
        flagContainer.appendChild(flagDiv);

        setupPathListeners(flagDiv, item.id);
    });

    const dragContainer = document.getElementById('drag-container');
    if (dragContainer) {
        dragContainer.innerHTML = '';
        dragContainer.style.display = 'flex';

        const nameBatch = [...batch].sort(() => seededRandom() - 0.5);

        nameBatch.forEach(item => {
            const el = document.createElement('div');
            el.className = 'draggable-item';
            el.textContent = item.name;
            el.draggable = true;
            el.setAttribute('data-id', item.id);

            el.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', item.id);
                    el.classList.add('dragging');
                }
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
            });

            el.addEventListener('click', () => {
                if (geoState.selectedItemId === item.id) {
                    geoState.selectedItemId = null;
                    el.classList.remove('selected');
                } else {
                    const prev = document.querySelector('.draggable-item.selected');
                    if (prev) prev.classList.remove('selected');

                    geoState.selectedItemId = item.id;
                    el.classList.add('selected');
                }
            });

            dragContainer.appendChild(el);
        });
    }

    updateGeoScore();
}

function getFlagFilename(id: string) {
    const map: Record<string, string> = {
        'CH-ZH': 'Zuerich.svg',
        'CH-BE': 'Bern.svg',
        'CH-LU': 'Luzern.svg',
        'CH-UR': 'Uri.svg',
        'CH-SZ': 'Schwyz.svg',
        'CH-OW': 'Obwalden.svg',
        'CH-NW': 'Nidwalden.svg',
        'CH-GL': 'Glarus.svg',
        'CH-ZG': 'Zug.svg',
        'CH-FR': 'Freiburg.svg',
        'CH-SO': 'Solothurn.svg',
        'CH-BS': 'Basel-Stadt.svg',
        'CH-BL': 'Basel-Landschaft.svg',
        'CH-SH': 'Schaffhausen.svg',
        'CH-AR': 'Appenzell_Ausserrhoden.svg',
        'CH-AI': 'Appenzell_Innerrhoden.svg',
        'CH-SG': 'St_Gallen.svg',
        'CH-GR': 'Graubuenden.svg',
        'CH-AG': 'Aargau.svg',
        'CH-TG': 'Thurgau.svg',
        'CH-TI': 'Tessin.svg',
        'CH-VD': 'Waadt.svg',
        'CH-VS': 'Wallis.svg',
        'CH-NE': 'Neuenburg.svg',
        'CH-GE': 'Genf.svg',
        'CH-JU': 'Jura.svg'
    };
    return map[id] || 'Bern.svg';
}

function setupDragMode() {
    updateGeoInstruction(T.instructionDrag || "Ziehe die Namen auf das richtige Gebiet!");

    const batchSize = 6;
    let available = geoState.regionData.filter(r => !geoState.solvedRegions.includes(r.id));

    if (available.length === 0) {
        endGeoGame();
        return;
    }

    available.sort(() => seededRandom() - 0.5);
    const batch = available.slice(0, batchSize);

    const dragContainer = document.getElementById('drag-container');
    if (dragContainer) {
        dragContainer.innerHTML = '';
        dragContainer.style.display = 'flex';

        batch.forEach(item => {
            const el = document.createElement('div');
            el.className = 'draggable-item';
            el.textContent = item.name;
            el.draggable = true;
            el.setAttribute('data-id', item.id);

            el.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', item.id);
                    el.classList.add('dragging');
                }
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
            });

            el.addEventListener('click', () => {
                if (geoState.selectedItemId === item.id) {
                    geoState.selectedItemId = null;
                    el.classList.remove('selected');
                } else {
                    const prev = document.querySelector('.draggable-item.selected');
                    if (prev) prev.classList.remove('selected');

                    geoState.selectedItemId = item.id;
                    el.classList.add('selected');
                }
            });

            dragContainer.appendChild(el);
        });
    }

    updateGeoScore();
}

function handleDragDrop(draggedId: string, targetId: string) {
    const targetPath = document.getElementById(targetId);

    geoState.selectedItemId = null;
    const selectedEl = document.querySelector('.draggable-item.selected');
    if (selectedEl) selectedEl.classList.remove('selected');

    if (draggedId === targetId) {
        geoState.score++;
        geoState.solvedRegions.push(targetId);

        if (targetPath) {
            targetPath.classList.add('correct');
            targetPath.classList.remove('hint');

            if (targetPath.tagName === 'path' || targetPath.classList.contains('region-path')) {
                showRegionName(targetPath as any as SVGElement, true);
            } else if (targetPath.classList.contains('flag-item')) {
                const nameLabel = document.createElement('div');
                nameLabel.textContent = geoState.regionData.find(r => r.id === targetId)?.name || '';
                nameLabel.style.fontSize = '12px';
                nameLabel.style.textAlign = 'center';
                nameLabel.style.marginTop = '5px';
                targetPath.appendChild(nameLabel);
            }
        }

        const arrowGroups = document.querySelectorAll('.hint-arrow-group, .hint-arrow');
        arrowGroups.forEach(g => g.remove());
        const hintedPaths = document.querySelectorAll('.region-path.hint');
        hintedPaths.forEach(p => p.classList.remove('hint'));

        if (geoState.dragFailures) {
            delete geoState.dragFailures[draggedId];
        }

        const dragItem = document.querySelector(`.draggable-item[data-id="${draggedId}"]`);
        if (dragItem) {
            dragItem.remove();
        }

        const dragContainer = document.getElementById('drag-container');
        if (dragContainer && dragContainer.children.length === 0) {
            if (geoState.gameMode === 'flag') {
                setupFlagMode();
            } else {
                setupDragMode();
            }
        }

    } else {
        if (!geoState.dragFailures) geoState.dragFailures = {};
        geoState.dragFailures[draggedId] = (geoState.dragFailures[draggedId] || 0) + 1;

        if (targetPath) {
            targetPath.classList.add('incorrect');
            setTimeout(() => { targetPath.classList.remove('incorrect'); }, 500);
            showRegionName(targetPath as any as SVGElement, false);
        }

        if (geoState.dragFailures[draggedId] >= 3) {
            const correctId = draggedId;
            const correctPath = document.getElementById(correctId);
            if (correctPath) {
                correctPath.classList.add('hint');
                showHintArrow(correctPath as any as SVGElement);
            }
        }
    }
    updateGeoScore();
}

function updateGeoInstruction(text: string) {
    const el = document.getElementById('game-instruction');
    if (el) el.textContent = text;
}

function updateGeoScore() {
    const el = document.getElementById('score-display');
    if (el) el.textContent = T.score.replace('{score}', geoState.score).replace('{total}', geoState.totalRounds);
}

function endGeoGame() {
    updateGeoInstruction(T.win);
    trackEvent('game_complete', {
        mode: geoState.gameMode,
        map: geoState.currentMap,
        score: geoState.score,
        rounds: geoState.totalRounds,
        lang: lang
    });
    geoState.currentRegion = null;
    const dragContainer = document.getElementById('drag-container');
    if (dragContainer) dragContainer.innerHTML = '';
}

function restartGame() {
    trackEvent('game_start', {
        mode: geoState.gameMode,
        map: geoState.currentMap,
        lang: lang
    });
    resetGeoGameState();
    setupGeoGame();
}

function showRegionName(pathElement: SVGElement, isPermanent: boolean) {
    if (!pathElement) return;
    const svg = document.querySelector('#map-container svg');
    if (!svg) return;

    let bbox: SVGRect;
    try {
        bbox = (pathElement as any).getBBox();
    } catch (e) {
        return;
    }

    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    const name = pathElement.getAttribute('title');

    if (!name) return;

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x.toString());
    text.setAttribute('y', y.toString());
    text.textContent = name;
    text.classList.add(isPermanent ? 'region-label' : 'temp-label');

    svg.appendChild(text);

    if (!isPermanent) {
        setTimeout(() => {
            text.remove();
        }, 1500);
    }
}

function showHintArrow(pathElement: SVGElement) {
    if (!pathElement) return;
    const svg = document.querySelector('#map-container svg');
    if (!svg) return;

    const existing = svg.querySelectorAll('.hint-arrow-group');
    existing.forEach(e => e.remove());

    let bbox: SVGRect;
    try {
        bbox = (pathElement as any).getBBox();
    } catch (e) {
        return;
    }

    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('hint-arrow-group');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M 0,0 L -20,-30 L -10,-30 L -10,-80 L 10,-80 L 10,-30 L 20,-30 Z`;
    path.setAttribute('d', d);
    path.classList.add('hint-arrow');

    group.setAttribute('transform', `translate(${cx}, ${cy})`);
    group.appendChild(path);

    path.style.transformOrigin = "0 0";
    (path.style as any).animation = "arrow-fly-in 0.5s ease-out forwards, arrow-bounce 1s ease-in-out 0.5s infinite";

    svg.appendChild(group);
}
