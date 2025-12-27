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
    currentRoundFirstTry: true
};

export async function initGeoGame(config) {
    lang = config.lang;
    basePath = config.basePath;

    const mapSelector = document.getElementById('map-selector');
    if (mapSelector) {
        mapSelector.onchange = (e) => loadMap(e.target.value);
    }

    try {
        T = TRANSLATIONS[lang].ui.geoGame;
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
            geoState.regionData.push({ id, name: title });
            path.classList.add('region-path');
            // Remove existing listeners to avoid duplicates if re-running
            const newPath = path.cloneNode(true);
            path.parentNode.replaceChild(newPath, path);
            newPath.addEventListener('click', () => handleGeoRegionClick(id));
        }
    });

    // Re-select labels after potential DOM churn (though typical extract doesn't churn)
    const labels = svg.querySelectorAll('text, g[id*="Abbr"], g[id*="Name"]');
    labels.forEach(l => {
        l.style.display = geoState.labelsVisible ? '' : 'none';
        l.style.pointerEvents = 'none';
    });
}

function resetGeoGameState() {
    geoState.solvedRegions = [];
    geoState.score = 0;
    geoState.currentRegion = null;
    geoState.wrongGuesses = 0;
    geoState.currentRoundFirstTry = true;
    geoState.totalRounds = geoState.regionData.length;

    const paths = document.querySelectorAll('.region-path');
    paths.forEach(path => {
        path.classList.remove('correct', 'incorrect', 'hint', 'not-found');
    });

    // Remove all added labels and arrows
    const labels = document.querySelectorAll('.region-label, .temp-label, .hint-arrow-group, .hint-arrow');
    labels.forEach(l => l.remove());

    updateGeoScore();
}

function setupGeoGame() {
    startNewGeoRound();
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

function updateGeoInstruction(text) {
    const el = document.getElementById('game-instruction');
    if (el) el.textContent = text;
}

function updateGeoScore() {
    // Show score out of TOTAL rounds (max)
    const el = document.getElementById('score-display');
    if (el) el.textContent = T.score.replace('{score}', geoState.score).replace('{total}', geoState.totalRounds);
}

function endGeoGame() {
    updateGeoInstruction(T.win);
    geoState.currentRegion = null;
}

function toggleGeoLabels() {
    geoState.labelsVisible = !geoState.labelsVisible;
    const svg = document.querySelector('#map-container svg');
    if (!svg) return;
    const labels = svg.querySelectorAll('text, g[id*="Abbr"], g[id*="Name"]');
    labels.forEach(l => {
        l.style.display = geoState.labelsVisible ? '' : 'none';
    });
}

function restartGame() {
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
