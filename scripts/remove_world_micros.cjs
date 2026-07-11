const fs = require('fs');

const svgPath = 'images/continentsHigh.svg';
let svgContent = fs.readFileSync(svgPath, 'utf8');

// Regex to find and remove the San Marino circle (id="SM")
// The original injection was: <circle id="SM" title="San Marino" cx="${smX}" cy="${smY}" r="${radius}" class="land" fill="#CCCCCC" stroke="white" stroke-width="0.5"/>
// We should look for something matching `id="SM"` and remove the whole tag.

if (svgContent.includes('id="SM"')) {
    // This regex is slightly broad to catch different attribute orders, but specific enough to the tag we added.
    // It looks for <circle ... id="SM" ... /> or <circle ... id="SM" ... ></circle>
    // Since we injected a self-closing tag (or one without closing tag if HTML5 allows, but SVG usually needs closing / or explicit tag),
    // let's rely on the specific string we likely injected or a robust regex.

    // Safer approach: string replacement of the specific ID part if we are sure of the structure, 
    // or regex to remove the whole element.

    const regex = /<circle[^>]*id="SM"[^>]*>/g;
    svgContent = svgContent.replace(regex, '');

    // Cleanup any double spaces or empty lines effectively? 
    // The previous injection was `replace('</g>', `${smCircle}</g>`)`, so it might be right next to </g> or other tags.
    // Basic removal should be fine.

    fs.writeFileSync(svgPath, svgContent);
    console.log('Successfully removed San Marino from continentsHigh.svg');
} else {
    console.log('San Marino (id="SM") not found in continentsHigh.svg');
}
