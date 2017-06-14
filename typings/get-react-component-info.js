const path = require('path');
const reactDocGen = require('react-docgen');
const getSourceFileContent = require('./get-source-file-content');
const createResolver = require('./create-resolver');

const documentation = {};

function getReactComponentInfo(filePath, parentPath) {
    if (documentation[filePath]) {
        return documentation[filePath];
    }

    const src = getSourceFileContent(filePath, parentPath);
    const content = src.content;
    filePath = src.filePath;
    const info = reactDocGen.parse(content, createResolver(filePath), undefined);
    info.filePath = filePath;
    if (info.composes) {
        info.composes = info.composes
            .map(relativePath => getReactComponentInfo(relativePath, path.dirname(filePath)));
    } else {
        info.composes = [];
    }
    // filter public methods
    info.methods = info.methods.filter(({ docblock }) => docblock && docblock.indexOf('@public') !== -1);
    // extends props for composed components
    info.props = info.composes.reduce((prev, item) => Object.assign({}, prev, item.props), info.props || {});
    documentation[filePath] = info;
    return info;
}

module.exports = getReactComponentInfo;
