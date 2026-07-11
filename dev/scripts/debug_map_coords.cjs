const fs = require('fs');

const svgContent = fs.readFileSync('images/continentsHigh.svg', 'utf8');

// Parse bounds from amCharts tag
const ammapMatch = svgContent.match(/<amcharts:ammap([^>]*)>/);
let leftLong, topLat, rightLong, bottomLat;

if (ammapMatch) {
    const attrs = ammapMatch[1];
    const leftMatch = attrs.match(/leftLongitude="([^"]*)"/);
    const topMatch = attrs.match(/topLatitude="([^"]*)"/);
    const rightMatch = attrs.match(/rightLongitude="([^"]*)"/);
    const bottomMatch = attrs.match(/bottomLatitude="([^"]*)"/);

    if (leftMatch) leftLong = parseFloat(leftMatch[1]);
    if (topMatch) topLat = parseFloat(topMatch[1]);
    if (rightMatch) rightLong = parseFloat(rightMatch[1]);
    if (bottomMatch) bottomLat = parseFloat(bottomMatch[1]);
}

console.log('Bounds:', { leftLong, topLat, rightLong, bottomLat });

// Parse paths
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

const pathRegex = /d="([^"]*)"/g;
let match;

while ((match = pathRegex.exec(svgContent)) !== null) {
    const d = match[1];
    // Find ALL coordinates. M and L commands are absolute.
    // Simplified: Find all "number,number" pairs.
    const coordPairs = d.matchAll(/(-?[\d\.]+)[,\s](-?[\d\.]+)/g);
    for (const pair of coordPairs) {
        const x = parseFloat(pair[1]);
        const y = parseFloat(pair[2]);
        // Simple sanity check: amCharts typically uses positive coords for screen space.
        // Ignore extremely large relative jumps or logic errors?
        // amMap uses absolute M and relative l.
        // It's safer to just check the M command which is definitely absolute.
        // But checking *all* numbers might give false positives if they are relative offsets.
        // We really only trust the "M".
    }

    // Just finding the M command coords
    const mMatches = d.matchAll(/M(-?[\d\.]+)[,\s](-?[\d\.]+)/g);
    for (const m of mMatches) {
        const x = parseFloat(m[1]);
        const y = parseFloat(m[2]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
}

console.log('Sampled Extents (M-commands only):', { minX, maxX, minY, maxY });
