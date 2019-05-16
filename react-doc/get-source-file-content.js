const fs = require('fs');
const path = require('path');
const resolve = require('resolve').sync;

function getSourceFileContent(filePath, parentPath) {
    if (parentPath) {
        if (path.extname(parentPath)) {
            parentPath = path.dirname(parentPath);
        }
        filePath = resolve(filePath, { basedir: parentPath, extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    }
    if (fs.existsSync(`${filePath}.map`)) { // if we have file with source map, read it
        return {
            filePath,
            content: JSON.parse(fs.readFileSync(`${filePath}.map`, 'utf8')).sourcesContent.join('\n')
        };
    }
    if (fs.existsSync(filePath)) { // file without source map
        return {
            filePath,
            content: fs.readFileSync(filePath, 'utf8')
        };
    }

    throw new Error(`Unable to locate file ${filePath}`);
}

module.exports = getSourceFileContent;
