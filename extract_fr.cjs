const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let extracts = {};

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const match = content.match(/fr:\s*\{([\s\S]*?)\}/);
    if (match) {
        extracts[file] = match[1].trim();
    }
});

fs.writeFileSync('fr_extracts.txt', JSON.stringify(extracts, null, 2));
console.log('Extracted fr translations');
