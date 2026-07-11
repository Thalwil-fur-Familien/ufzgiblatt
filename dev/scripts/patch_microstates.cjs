const fs = require('fs');

const svgPath = 'images/europeHigh.svg';
let svgContent = fs.readFileSync(svgPath, 'utf8');

const microstates = [
    { id: 'MC', name: 'Monaco', cx: 261.3, cy: 631.1, r: 3 },
    { id: 'LI', name: 'Liechtenstein', cx: 275.5, cy: 598.5, r: 3 }, // Approx center from path dump
    { id: 'MT', name: 'Malta', cx: 307.4, cy: 698.6, r: 3 },
    { id: 'AD', name: 'Andorra', cx: 222.0, cy: 642.9, r: 3 },
    { id: 'IM', name: 'Isle of Man', cx: 180.5, cy: 524.5, r: 3 },
    { id: 'SJ', name: 'Svalbard and Jan Mayen', cx: 155.0, cy: 270.0, r: 3 },
    { id: 'GG', name: 'Guernsey', cx: 194.5, cy: 575.0, r: 3 },
    { id: 'FO', name: 'Faroe Islands', cx: 168.0, cy: 420.0, r: 3 },
    { id: 'AX', name: 'Aland Islands', cx: 346.0, cy: 447.0, r: 3 }
];

microstates.forEach(ms => {
    // 1. Rename existing path ID to ID-path and remove title to avoid tooltip conflict
    // Regex for: <path ... id="ID" ... > or <path id="ID" ... >
    // We also want to remove the title="Name" attribute from the path so it doesn't show up.

    const idRegex = new RegExp(`(<path[^>]*)(id="${ms.id}")([^>]*)>`, 'i');

    if (idRegex.test(svgContent)) {
        // Replace id="ID" with id="ID-path"
        // And identify title="Name" to remove it

        svgContent = svgContent.replace(idRegex, (match, before, idAttr, after) => {
            let newTag = `${before}id="${ms.id}-path"${after}>`;
            // Remove title attribute
            newTag = newTag.replace(/title="[^"]*"/, '');
            return newTag;
        });

        // 2. Inject circle
        // We can append it to the end of the <g> group or just after the modified path.
        // Appending to end of the group (before </g>) ensures it's on top z-index.

        const circle = `<circle id="${ms.id}" title="${ms.name}" cx="${ms.cx}" cy="${ms.cy}" r="${ms.r}" class="land" fill="#CCCCCC" stroke="white" stroke-width="0.5"/>`;

        // Check if circle already exists to avoid dupes
        if (!svgContent.includes(`<circle id="${ms.id}"`)) {
            svgContent = svgContent.replace('</g>', `${circle}</g>`);
            console.log(`Patched ${ms.name} (${ms.id})`);
        } else {
            console.log(`Circle for ${ms.name} (${ms.id}) already exists, skipping injection.`);
        }

    } else {
        console.log(`Path for ${ms.name} (${ms.id}) not found, cannot patch.`);
    }
});

fs.writeFileSync(svgPath, svgContent);
console.log('Finished patching microstates.');
