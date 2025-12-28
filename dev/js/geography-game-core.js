import { TRANSLATIONS } from './translations.js';

let T;
let lang;
let basePath;

const MAPS = {
    'switzerland': 'images/switzerlandHigh-amcharts.com.svg',
    'europe': 'images/europeHigh.svg',
    'world': 'images/continentsHigh.svg'
};

// Game state
let geoState = {
    regionData: [],
    solvedRegions: [],
    currentRegion: null,
    score: 0,
    totalRounds: 0,
    labelsVisible: false,
    wrongGuesses: 0,
    currentMap: 'switzerland',
    currentRoundFirstTry: true,
    gameMode: 'find', // 'find' or 'drag'
    dragItems: [], // Items currently in the drag pool
    dragFailures: {} // Track wrong drops per region ID
};

function trackEvent(name, props = {}) {
    if (window.posthog) {
        window.posthog.capture(name, props);
    }
}

export async function initGeoGame(config) {
    lang = config.lang;
    basePath = config.basePath;

    const mapSelector = document.getElementById('map-selector');
    if (mapSelector) {
        mapSelector.onchange = (e) => loadMap(e.target.value);
    }

    const modeSelector = document.getElementById('mode-selector');
    if (modeSelector) {
        modeSelector.onchange = (e) => setGameMode(e.target.value);
    }

    try {
        T = TRANSLATIONS[lang].ui.geoGame;
        // Translations might be missing the mode keys if not reloaded, but we assume file is updated.
    } catch (e) {
        console.error('Translation error:', e);
        return;
    }

    await loadMap('switzerland');

    // Bind global controls here to confirm they exist
    const toggleBtn = document.getElementById('toggle-labels');
    if (toggleBtn) toggleBtn.onclick = toggleGeoLabels;

    const restartBtn = document.getElementById('restart-game');
    if (restartBtn) restartBtn.onclick = restartGame;
}

function setGameMode(mode) {
    geoState.gameMode = mode;
    restartGame();
}

async function loadMap(mapKey) {
    geoState.currentMap = mapKey;
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

            // Auto-fit SVG if viewBox is missing
            if (!svg.hasAttribute('viewBox')) {
                try {
                    const bbox = svg.getBBox();
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

function extractRegionsFromSVG(svg) {
    geoState.regionData = [];
    const paths = svg.querySelectorAll('path, circle');
    paths.forEach(path => {
        const id = path.getAttribute('id');
        let title = path.getAttribute('title')?.trim();

        // Translate title if available
        if (TRANSLATIONS[lang].ui.geoNames && TRANSLATIONS[lang].ui.geoNames[title]) {
            title = TRANSLATIONS[lang].ui.geoNames[title];
            path.setAttribute('title', title);
        }

        // For Switzerland map, only include CH-* IDs (excludes Campione d'Italia 'IT')
        if (geoState.currentMap === 'switzerland' && id && !id.startsWith('CH-')) {
            return;
        }

        if (id && title) {
            // Add abbreviation to title
            let abbr = id;
            if (id.startsWith('CH-')) {
                abbr = id.substring(3);
            }
            // Only add if it looks like a short code (2-3 chars)
            if (abbr.length <= 3) {
                title = `${title} (${abbr})`;
                path.setAttribute('title', title);
            }

            geoState.regionData.push({ id, name: title });
            path.classList.add('region-path');

            // Clone to clear listeners
            const newPath = path.cloneNode(true);
            path.parentNode.replaceChild(newPath, path);

            // Add listeners based on game mode
            setupPathListeners(newPath, id);
        }
    });

    // Re-select labels after potential DOM churn (though typical extract doesn't churn)
    const labels = svg.querySelectorAll('text, g[id*="Abbr"], g[id*="Name"]');
    labels.forEach(l => {
        l.style.display = geoState.labelsVisible ? '' : 'none';
        l.style.pointerEvents = 'none';
    });
}

function setupPathListeners(pathElement, id) {
    // Click listener for Find mode
    pathElement.addEventListener('click', () => {
        if (geoState.gameMode === 'find') {
            handleGeoRegionClick(id);
        }
    });

    // Drag listeners for Allocate/Flag (and legacy Drag) modes
    const dragModes = ['drag', 'allocate', 'flag'];

    pathElement.addEventListener('dragover', (e) => {
        if (dragModes.includes(geoState.gameMode)) {
            e.preventDefault(); // Allow drop
            pathElement.classList.add('drag-over');
        }
    });

    pathElement.addEventListener('dragleave', () => {
        if (dragModes.includes(geoState.gameMode)) {
            pathElement.classList.remove('drag-over');
        }
    });

    pathElement.addEventListener('drop', (e) => {
        if (dragModes.includes(geoState.gameMode)) {
            e.preventDefault();
            pathElement.classList.remove('drag-over');
            const droppedId = e.dataTransfer.getData('text/plain');
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

    const paths = document.querySelectorAll('.region-path');
    paths.forEach(path => {
        path.classList.remove('correct', 'incorrect', 'hint', 'not-found', 'drag-over');
        // Re-setup listeners just in case state changed
        // Actually listeners check 'gameMode' dynamically, so no need to re-bind
    });

    // Remove all added labels and arrows
    const labels = document.querySelectorAll('.region-label, .temp-label, .hint-arrow-group, .hint-arrow');
    labels.forEach(l => l.remove());

    // Clear drag container
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

    // Ensure map is visible by default (unless mode hides it later)
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) mapContainer.style.display = 'block';

    updateGeoScore();
}

function setupGeoGame() {
    if (geoState.gameMode === 'find') {
        updateGeoInstruction(T.instruction); // "Where is..." default? Will be overwritten by startNewGeoRound
        startNewGeoRound();
    } else if (geoState.gameMode === 'drag') { // Legacy 'drag' value kept for compatibility or if used
        setupDragMode();
    } else if (geoState.gameMode === 'allocate') {
        setupDragMode();
    } else if (geoState.gameMode === 'flag') {
        setupFlagMode();
    }
}

// --- FIND MODE LOGIC ---

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
    const randomIndex = Math.floor(Math.random() * available.length);
    geoState.currentRegion = available[randomIndex];
    geoState.wrongGuesses = 0;
    geoState.currentRoundFirstTry = true;
    updateGeoInstruction(T.instructionStart.replace('{region}', geoState.currentRegion.name));
    updateGeoScore();
}

function handleGeoRegionClick(regionId) {
    if (!geoState.currentRegion) return;
    const targetPath = document.getElementById(regionId);

    if (regionId === geoState.currentRegion.id) {
        // Correct answer
        if (geoState.currentRoundFirstTry) {
            geoState.score++;
        }
        geoState.solvedRegions.push(regionId);

        // Clear hints
        const arrowGroups = document.querySelectorAll('.hint-arrow-group, .hint-arrow');
        arrowGroups.forEach(g => g.remove());

        if (targetPath) {
            targetPath.classList.remove('not-found', 'hint');
            targetPath.classList.add('correct');
        }
        showRegionName(targetPath, true);
        updateGeoInstruction('✅ ' + geoState.currentRegion.name);
        setTimeout(() => { startNewGeoRound(); }, 1000);
    } else {
        // Incorrect answer
        geoState.wrongGuesses++;
        geoState.currentRoundFirstTry = false;

        if (targetPath) {
            targetPath.classList.add('incorrect');
            setTimeout(() => { targetPath.classList.remove('incorrect'); }, 500);
            showRegionName(targetPath, false);

            // Show "That is [Name]" feedback
            const wrongName = targetPath.getAttribute('title');
            if (wrongName) {
                updateGeoInstruction(T.feedbackWrong.replace('{region}', wrongName));
                // Revert to question after 1.5s
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
                showHintArrow(correctPath);
                // Hint stays until clicked correct
            }
        }
    }
    updateGeoScore();
}

// --- FLAG MODE LOGIC ---

function setupFlagMode() {
    updateGeoInstruction(T.instructionAllocate || "Ziehe die Namen auf das richtige Gebiet!");

    // Clear previous
    const flagContainer = document.getElementById('flag-container');
    if (!flagContainer) return;
    flagContainer.innerHTML = '';
    flagContainer.style.display = 'flex';

    // Hide map
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) mapContainer.style.display = 'none';

    // Prepare batch (6 flags + 6 names)
    const batchSize = 6;
    let available = geoState.regionData.filter(r => !geoState.solvedRegions.includes(r.id));

    if (available.length === 0) {
        endGeoGame();
        return;
    }

    // Shuffle and pick batch
    available.sort(() => Math.random() - 0.5);
    let batch = available.slice(0, batchSize);

    // Create Flag Items
    batch.forEach(item => {
        const flagDiv = document.createElement('div');
        flagDiv.className = 'flag-item';
        flagDiv.id = item.id; // Target ID for drop

        const flagFile = getFlagFilename(item.id, item.name);

        const img = document.createElement('img');
        img.src = basePath + 'images/flags/' + flagFile;
        img.alt = item.name;
        img.draggable = false;

        flagDiv.appendChild(img);
        flagContainer.appendChild(flagDiv);

        // Add drop listeners
        setupPathListeners(flagDiv, item.id);
    });

    // Create Draggable Names logic - populate drag container
    const dragContainer = document.getElementById('drag-container');
    if (dragContainer) {
        dragContainer.innerHTML = '';
        dragContainer.style.display = 'flex';

        // Shuffle names for display
        const nameBatch = [...batch].sort(() => Math.random() - 0.5);

        nameBatch.forEach(item => {
            const el = document.createElement('div');
            el.className = 'draggable-item';
            el.textContent = item.name;
            el.draggable = true;
            el.setAttribute('data-id', item.id);

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.id);
                el.classList.add('dragging');
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
            });

            dragContainer.appendChild(el);
        });
    }

    updateGeoScore();
}

function getFlagFilename(id, name) {
    const map = {
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

// --- DRAG MODE LOGIC ---

function setupDragMode() {
    updateGeoInstruction(T.instructionDrag || "Ziehe die Namen auf das richtige Gebiet!");

    // Prepare drag items
    // We can do batches or all. Let's do batches of 6 to fit nicely.
    const batchSize = 6;
    let available = geoState.regionData.filter(r => !geoState.solvedRegions.includes(r.id));

    if (available.length === 0) {
        endGeoGame();
        return;
    }

    // Pick top N or random N
    // Random N is better for variety
    // Shuffle array
    available.sort(() => Math.random() - 0.5);
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
                e.dataTransfer.setData('text/plain', item.id);
                el.classList.add('dragging');
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
            });

            dragContainer.appendChild(el);
        });
    }

    updateGeoScore();
}

function handleDragDrop(draggedId, targetId) {
    const targetPath = document.getElementById(targetId);

    if (draggedId === targetId) {
        // Correct
        geoState.score++;
        geoState.solvedRegions.push(targetId);

        // Visuals
        // Visuals
        if (targetPath) {
            targetPath.classList.add('correct');
            targetPath.classList.remove('hint');

            // If it's a map path, show name. If it's a flag item, maybe just mark green?
            if (targetPath.tagName === 'path' || targetPath.classList.contains('region-path')) {
                showRegionName(targetPath, true);
            } else if (targetPath.classList.contains('flag-item')) {
                // For flags, maybe we append the name label permanently?
                // Or just keep the green border.
                // Let's append a small text label or just leave it green.
                const nameLabel = document.createElement('div');
                nameLabel.textContent = geoState.regionData.find(r => r.id === targetId)?.name || '';
                nameLabel.style.fontSize = '12px';
                nameLabel.style.textAlign = 'center';
                nameLabel.style.marginTop = '5px';
                targetPath.appendChild(nameLabel);
            }
        }

        // Remove hints for this region if active
        // Logic: if we solved it, we don't need hints anymore.
        const arrowGroups = document.querySelectorAll('.hint-arrow-group, .hint-arrow');
        // Only remove IF the hint was for THIS region?
        // Actually, in Drag mode, multiple hints *could* theoretically exist if we tracked multiple failures simultaneously,
        // but let's assume one active hint or just clear all like in Find mode.
        // For now, let's clear all hints on a success to keep board clean.
        arrowGroups.forEach(g => g.remove());
        const hintedPaths = document.querySelectorAll('.region-path.hint');
        hintedPaths.forEach(p => p.classList.remove('hint'));

        // Reset failure count for this item (cleanup)
        if (geoState.dragFailures) {
            delete geoState.dragFailures[draggedId];
        }

        // Remove from drag container
        const dragItem = document.querySelector(`.draggable-item[data-id="${draggedId}"]`);
        if (dragItem) {
            dragItem.remove();
        }

        // Check if batch is empty, if so, reload new batch
        const dragContainer = document.getElementById('drag-container');
        if (dragContainer && dragContainer.children.length === 0) {
            if (geoState.gameMode === 'flag') {
                setupFlagMode();
            } else {
                setupDragMode(); // Loads next batch
            }
        }

    } else {
        // Incorrect
        // Increment failure count for the DRAGGED item (the one the user is trying to place)
        if (!geoState.dragFailures) geoState.dragFailures = {};
        geoState.dragFailures[draggedId] = (geoState.dragFailures[draggedId] || 0) + 1;

        if (targetPath) {
            targetPath.classList.add('incorrect');
            setTimeout(() => { targetPath.classList.remove('incorrect'); }, 500);

            // Show name on wrong drop for learning
            showRegionName(targetPath, false);
        }

        // Check for hint condition
        if (geoState.dragFailures[draggedId] >= 3) {
            // Show hint for the CORRECT destination of the dragged item
            const correctId = draggedId;
            const correctPath = document.getElementById(correctId);
            if (correctPath) {
                correctPath.classList.add('hint');
                showHintArrow(correctPath);
            }
        }
    }
    updateGeoScore();
}


// --- SHARED HELPERS ---

function updateGeoInstruction(text) {
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

function toggleGeoLabels() {
    geoState.labelsVisible = !geoState.labelsVisible;
    const svg = document.querySelector('#map-container svg');
    if (!svg) return;
    const labels = svg.querySelectorAll('text, g[id*="Abbr"], g[id*="Name"]');
    labels.forEach(l => {
        l.style.display = geoState.labelsVisible ? '' : 'none';

        // Also toggle our permanent labels
        // But maybe we want them to stay visible if solved?
        // Logic below hides ALL text elements.
        // If we want solved labels to always show, we need specific class checks.
        // For now, simple standard behavior.
    });

    const regionLabels = document.querySelectorAll('.region-label');
    regionLabels.forEach(l => {
        l.style.display = geoState.labelsVisible ? '' : 'none';
    });
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

function showRegionName(pathElement, isPermanent) {
    if (!pathElement) return;
    const svg = document.querySelector('#map-container svg');
    if (!svg) return;

    // Get bounding box directly from path
    let bbox;
    try {
        bbox = pathElement.getBBox();
    } catch (e) {
        return;
    }

    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;
    const name = pathElement.getAttribute('title');

    if (!name) return;

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.textContent = name;
    text.classList.add(isPermanent ? 'region-label' : 'temp-label');

    svg.appendChild(text);

    if (!isPermanent) {
        setTimeout(() => {
            text.remove();
        }, 1500);
    }
}

function showHintArrow(pathElement) {
    if (!pathElement) return;
    const svg = document.querySelector('#map-container svg');
    if (!svg) return;

    // Remove existing arrows
    const existing = svg.querySelectorAll('.hint-arrow-group');
    existing.forEach(e => e.remove());

    let bbox;
    try {
        bbox = pathElement.getBBox();
    } catch (e) {
        return;
    }

    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    // Create arrow group
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('hint-arrow-group');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Complex Arrow geometry from German version
    const d = `M 0,0 L -20,-30 L -10,-30 L -10,-80 L 10,-80 L 10,-30 L 20,-30 Z`;
    path.setAttribute('d', d);
    path.classList.add('hint-arrow');

    group.setAttribute('transform', `translate(${cx}, ${cy})`);
    group.appendChild(path);

    path.style.transformOrigin = "0 0";
    path.style.animation = "arrow-fly-in 0.5s ease-out forwards, arrow-bounce 1s ease-in-out 0.5s infinite";

    svg.appendChild(group);
}
