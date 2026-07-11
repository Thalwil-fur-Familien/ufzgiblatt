const fs = require('fs');

const svgPath = 'images/europeHigh.svg';
const svgContent = fs.readFileSync(svgPath, 'utf8');

const microstates = ['SJ', 'GG', 'FO', 'AX'];

microstates.forEach(id => {
    // Search for id="ID"
    const index = svgContent.indexOf(`id="${id}"`);
    if (index !== -1) {
        // Checking if it's the comment line (approx check, comment is early in file)
        const commentLimit = 1000;
        if (index < commentLimit) {
            console.log(`${id}: Found in first ${commentLimit} chars (likely comment). Searching further...`);
            const nextIndex = svgContent.indexOf(`id="${id}"`, index + 1);
            if (nextIndex !== -1) {
                const start = Math.max(0, nextIndex - 50);
                const end = Math.min(svgContent.length, nextIndex + 150);
                console.log(`${id}: Found at ${nextIndex}: ...${svgContent.substring(start, end)}...`);
            } else {
                console.log(`${id}: Only found in comment/header.`);
            }
        } else {
            const start = Math.max(0, index - 50);
            const end = Math.min(svgContent.length, index + 150);
            console.log(`${id}: Found at ${index}: ...${svgContent.substring(start, end)}...`);
        }
    } else {
        console.log(`${id}: Not found at all.`);
    }
});
