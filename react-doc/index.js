const path = require('path');
const reactDocGen = require('react-docgen');
const { createDisplayNameHandler } = require('react-docgen-displayname-handler');
const getSourceFileContent = require('./get-source-file-content');
const createResolver = require('./create-resolver');
const componentPropTypesJsDocHandler = require('./component-prop-types-js-doc-handler');

const documentation = {};
const defaultHandlers = [
    reactDocGen.handlers.propTypeHandler,
    reactDocGen.handlers.propTypeCompositionHandler,
    reactDocGen.handlers.propDocBlockHandler,
    reactDocGen.handlers.flowTypeHandler,
    reactDocGen.handlers.flowTypeDocBlockHandler,
    reactDocGen.handlers.defaultPropsHandler,
    reactDocGen.handlers.componentDocblockHandler,
    reactDocGen.handlers.displayNameHandler,
    reactDocGen.handlers.componentMethodsHandler,
    reactDocGen.handlers.componentMethodsJsDocHandler,
    componentPropTypesJsDocHandler
];

function getReactComponentInfo(filePath, parentPath) {
    if (documentation[filePath]) {
        return documentation[filePath];
    }

    const src = getSourceFileContent(filePath, parentPath);
    const { content } = src;
    filePath = src.filePath;
    const info = reactDocGen.parse(
        content,
        createResolver(filePath),
        defaultHandlers.concat(createDisplayNameHandler(filePath))
    );
    info.filePath = filePath;
    if (info.composes) {
        info.composes = info.composes
            .map(relativePath => getReactComponentInfo(relativePath, path.dirname(filePath)));
    } else {
        info.composes = [];
    }
    // extends props for composed components
    const composeProps = info.composes.reduce((prev, item) => Object.assign({}, prev, item.props), {});
    info.props = Object.assign(composeProps || {}, info.props || {}); // own props should have higher priority
    documentation[filePath] = info;
    return info;
}


module.exports = getReactComponentInfo;
