const fs = require('fs');

const svgPath = 'images/europeHigh.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

// 1. Find all potential countries (Paths with ID and Title)
// Regex to capture id and title. They might be in any order.
// We'll iterate through all <path> tags.

const countries = [];
const circleIds = new Set();

// Extract circles first
const circleRegex = /<circle[^>]*id="([^"]+)"[^>]*>/g;
let cMatch;
while ((cMatch = circleRegex.exec(svgContent)) !== null) {
    circleIds.add(cMatch[1]);
}

// Extract paths
// Naive parsing: find <path ... > then extract id and title
const pathTagRegex = /<path([^>]+)>/g;
let pMatch;
while ((pMatch = pathTagRegex.exec(svgContent)) !== null) {
    const attrs = pMatch[1];
    const idMatch = attrs.match(/id="([^"]+)"/);
    const titleMatch = attrs.match(/title="([^"]+)"/);

    // Some paths might be the "-path" renamed ones.
    // We want the logical countries.
    // If we renamed 'VA' to 'VA-path' and removed title, we might miss it if we only look for title.
    // However, the circles have the IDs 'VA', 'SM', etc.
    // The user wants a list of "all countries".
    // If I removed the title from the path, I can't easily find the name unless I look at the patch script or if the circle has the title.

    // Let's check if the circle has the title.

    if (idMatch && titleMatch) {
        countries.push({
            id: idMatch[1],
            name: titleMatch[1],
            hasCircle: circleIds.has(idMatch[1])
        });
    } else if (idMatch) {
        // ID found but no title. Check if it's one of our patched "-path" ones or if the ID exists as a circle with a title.
        const id = idMatch[1];
        if (id.endsWith('-path')) {
            const originalId = id.replace('-path', '');
            // Check if there is a circle for originalId
            if (circleIds.has(originalId)) {
                // We need to find the name. In our patch script, we put title on the circle.
                // Let's scan circles more thoroughly to get titles key.
            }
        }
    }
}

// Re-scan circles to get titles for patched microstates (since we removed titles from their paths)
const circleFullRegex = /<circle[^>]*id="([^"]+)"[^>]*title="([^"]+)"[^>]*>/g;
let cfMatch;
while ((cfMatch = circleFullRegex.exec(svgContent)) !== null) {
    const id = cfMatch[1];
    const name = cfMatch[2];

    // Check if this country is already in our list (it shouldn't be if we removed title from path)
    const existing = countries.find(c => c.id === id);
    if (!existing) {
        countries.push({
            id: id,
            name: name,
            hasCircle: true
        });
    } else {
        existing.hasCircle = true;
    }
}

// Sort by name
countries.sort((a, b) => a.name.localeCompare(b.name));

console.log("Country List (Total: " + countries.length + ")");
console.log("------------------------------------------------");
countries.forEach(c => {
    const mark = c.hasCircle ? "[x] (Circle)" : "[ ]";
    console.log(`${mark} ${c.name} (${c.id})`);
});
