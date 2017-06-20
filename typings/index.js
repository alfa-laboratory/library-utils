const getReactComponentInfo = require('../react-doc');
const getReactComponentDefinitionsContent = require('./stringify-component-definition');
const formatTs = require('./format-ts');


function getFormattedReactComponentDefinitionsContent(filePath) {
    return new Promise((resolve) => {
        try {
            const componentInfo = getReactComponentInfo(filePath);
            // filter public methods
            componentInfo.methods = componentInfo.methods
                .filter(({ docblock }) => docblock && docblock.indexOf('@public') !== -1);
            const definitionsContent = getReactComponentDefinitionsContent(componentInfo);
            formatTs(definitionsContent)
                .then(resolve);
        } catch (e) {
            resolve(null);
        }
    });
}

module.exports = getFormattedReactComponentDefinitionsContent;
