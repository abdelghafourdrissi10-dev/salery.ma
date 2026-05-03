const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const outputFile = path.join(projectRoot, 'backend_export.txt');

// Directories to include as 'backend'
const backendDirs = ['db', 'src/services', 'src/types.ts', 'src/store'];

function getFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;

    // If it's a file, just add it
    if (fs.statSync(dir).isFile()) {
        fileList.push(dir);
        return fileList;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.sql')) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

let allFiles = [];
for (const dir of backendDirs) {
    allFiles = allFiles.concat(getFiles(path.join(projectRoot, dir)));
}

// Generate tree string (simplified)
let treeStr = "BACKEND_STRUCTURE:\n\n";
const treeSet = new Set();
allFiles.forEach(f => {
    const rel = path.relative(projectRoot, f).replace(/\\/g, '/');
    const parts = rel.split('/');
    let current = '';
    for (let i = 0; i < parts.length; i++) {
        current = current ? current + '/' + parts[i] : parts[i];
        if (!treeSet.has(current)) {
            treeSet.add(current);
            const indent = '  '.repeat(i);
            const isDir = i < parts.length - 1;
            treeStr += `${indent}${parts[i]}${isDir ? '/' : ''}\n`;
        }
    }
});

let outStr = treeStr + "\n";

// Append all files
for (const file of allFiles) {
    const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    outStr += `FILE: ${relPath}\n\n${content}\n\n`;
}

fs.writeFileSync(outputFile, outStr);
console.log(`Exported ${allFiles.length} files to ${outputFile}`);
