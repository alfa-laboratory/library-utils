const fs = require('fs');
const path = require('path');

function getSourceFileContent(filePath, parentPath) {
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
    if (parentPath && fs.existsSync(path.resolve(parentPath, `${filePath}.jsx`))) { // relative path
        filePath = path.resolve(parentPath, `${filePath}.jsx`);
        return {
            filePath,
            content: fs.readFileSync(filePath, 'utf8')
        };
    }
    try {
        filePath = require.resolve(path.resolve(path.dirname(parentPath), filePath));
        return getSourceFileContent(filePath);
    } catch (e) {} // eslint-disable-line no-empty
    try {
        filePath = require.resolve(filePath);
        return getSourceFileContent(filePath);
    } catch (e) {} // eslint-disable-line no-empty

    throw new Error(`Unable to locate file ${filePath}`);
}

module.exports = getSourceFileContent;
