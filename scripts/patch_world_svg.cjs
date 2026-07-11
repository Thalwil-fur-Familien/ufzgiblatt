const fs = require('fs');

const svgPath = 'images/continentsHigh.svg';
let svgContent = fs.readFileSync(svgPath, 'utf8');

// San Marino Coordinates calculated: X=512.387, Y=339.476
const smX = 512.39;
const smY = 339.48;
const radius = 4; // Sufficient size for world map

const smCircle = `<circle id="SM" title="San Marino" cx="${smX}" cy="${smY}" r="${radius}" class="land" fill="#CCCCCC" stroke="white" stroke-width="0.5"/>`;

// Inject before the closing </g> tag
if (!svgContent.includes('id="SM"')) {
    svgContent = svgContent.replace('</g>', `${smCircle}</g>`);
    fs.writeFileSync(svgPath, svgContent);
    console.log('Successfully injected San Marino into continentsHigh.svg');
} else {
    console.log('San Marino already exists in continentsHigh.svg');
}
