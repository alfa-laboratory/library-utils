const path = require('path');
const getReactComponentInfo = require('./get-react-component-info');
const getReactComponentDefinitionsContent = require('./stringify-component-definition');
const formatTs = require('./format-ts');


function getFormattedReactComponentDefinitionsContent(filePath, projectName) {
    return new Promise((resolve) => {
        const componentName = path.parse(filePath).name;
        try {
            const componentInfo = getReactComponentInfo(filePath, undefined);
            const definitionsContent = getReactComponentDefinitionsContent(componentInfo, componentName, projectName);
            formatTs(definitionsContent)
                .then(resolve);
        } catch (e) {
            resolve(null);
        }
    });
}

module.exports = getFormattedReactComponentDefinitionsContent;
