import { TRANSLATIONS } from './translations.js';

// Detect language from URL path
const lang = window.location.pathname.includes('/en/') ? 'en' : 'de';
const basePath = lang === 'en' ? '../' : './';
let T;

// Debug indicator
const debugEl = document.getElementById('error-console');
if (debugEl) {
    debugEl.style.display = 'block';
    debugEl.style.color = 'blue';
    debugEl.innerText += '\nScript loaded. Lang: ' + lang;
}

// Game state
let geoState = {
    regionData: [],
    solvedRegions: [],
    currentRegion: null,
    score: 0,
    totalRounds: 26,
    selectedItemId: null
};

// Initialize game on page load
async function initGame() {
    const mapContainer = document.getElementById('map-container');
    const instructionEl = document.getElementById('game-instruction');
    const scoreEl = document.getElementById('score-display');

    // OUTPUT DEBUG
    if (debugEl) debugEl.innerText += '\nInitGame started.';

    try {
        T = TRANSLATIONS[lang].ui.geoGame;
        if (debugEl) debugEl.innerText += '\nTranslations loaded.';
    } catch (e) {
        if (debugEl) debugEl.innerText += '\nTranslation Error: ' + e.message;
        console.error(e);
        return;
    }

    instructionEl.textContent = T.loading;
    scoreEl.textContent = T.score.replace('{score}', 0).replace('{total}', 0);
    mapContainer.innerHTML = '<p>' + T.loading + '</p>';

    try {
        const svgPath = basePath + 'images/switzerlandHigh-amcharts.com.svg';
        if (debugEl) debugEl.innerText += '\nFetching SVG: ' + svgPath;

        const response = await fetch(svgPath);
        if (!response.ok) throw new Error('Failed to load map');

        let svgText = await response.text();
        mapContainer.innerHTML = svgText;
        if (debugEl) debugEl.innerText += '\nSVG Injected.';

        const svg = mapContainer.querySelector('svg');
        if (!svg) throw new Error('No SVG found');

        // Initial setup of SVG paths
        extractRegionsFromSVG(svg);
        resetGeoGameState();
        setupGeoGame();

        // Setup restart button
        const restartBtn = document.getElementById('restart-game');
        restartBtn.onclick = restartGame;

    } catch (error) {
        console.error('Error loading map:', error);
        mapContainer.innerHTML = `<p>${T.error}</p>`;
    }
}

function extractRegionsFromSVG(svg) {
    geoState.regionData = [];
    const paths = svg.querySelectorAll('path');

    paths.forEach(path => {
        const id = path.getAttribute('id');
        const title = path.getAttribute('title');

        // Only add paths that have both id and title (these are the cantons)
        if (id && title) {
            geoState.regionData.push({ id, name: title });
            path.classList.add('region-path');
            path.addEventListener('click', () => handleGeoRegionClick(id));
        }
    });

    // Handle labels if they exist in SVG
    const labels = svg.querySelectorAll('text, g[id*="Abbr"], g[id*="Name"]');
    labels.forEach(l => {
        l.style.display = 'none';
        l.style.pointerEvents = 'none'; // Ensure they don't block clicks
    });
}

function resetGeoGameState() {
    geoState.solvedRegions = [];
    geoState.score = 0;
    geoState.currentRegion = null;
    geoState.totalRounds = geoState.regionData.length;

    // Reset all path colors
    const paths = document.querySelectorAll('.region-path');
    paths.forEach(path => {
        path.classList.remove('correct', 'incorrect');
    });
    geoState.selectedItemId = null;
}

function setupGeoGame() {
    startNewGeoRound();
}

function startNewGeoRound() {
    if (geoState.solvedRegions.length >= geoState.totalRounds) {
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

    updateGeoInstruction(T.instructionStart.replace('{region}', geoState.currentRegion.name));
    updateGeoScore();
}

function handleGeoRegionClick(regionId) {
    // In this game mode (Find), click usually means checking if it's the currentRegion.
    // However, if we wanted to support "select name then tap map", we'd need a names list here too.
    // Since canton-game.js doesn't seem to have a draggable names list (it's "Find" mode only),
    // we don't need tap-to-select logic here unless it has other modes.
    // Based on the code, it's strictly a "Where is...?" game.

    if (!geoState.currentRegion) return;

    const targetPath = document.getElementById(regionId);

    if (regionId === geoState.currentRegion.id) {
        // Correct answer
        geoState.score++;
        geoState.solvedRegions.push(regionId);

        if (targetPath) {
            targetPath.classList.add('correct');
        }

        updateGeoInstruction('✅ ' + geoState.currentRegion.name);

        setTimeout(() => {
            startNewGeoRound();
        }, 1000);
    } else {
        // Incorrect answer
        if (targetPath) {
            targetPath.classList.add('incorrect');
            setTimeout(() => {
                targetPath.classList.remove('incorrect');
            }, 500);
        }
    }

    updateGeoScore();
}

function updateGeoInstruction(text) {
    document.getElementById('game-instruction').textContent = text;
}

function updateGeoScore() {
    const currentTotal = geoState.solvedRegions.length + (geoState.currentRegion ? 1 : 0);
    document.getElementById('score-display').textContent =
        T.score.replace('{score}', geoState.score).replace('{total}', currentTotal);
}

function endGeoGame() {
    updateGeoInstruction(T.win);
    geoState.currentRegion = null;
}

function restartGame() {
    resetGeoGameState();
    setupGeoGame();
}

// Start the game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
