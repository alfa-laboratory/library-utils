const fs = require('fs');
const path = require('path');
const reactDockGen = require('react-docgen');
const upperCamelCase = require('uppercamelcase');
const tsfmt = require("typescript-formatter");


const documentation = { };
function getReactComponentInfo(filePath, resolver, handlers) {
    if (documentation[filePath]) {
        return documentation[filePath];
    }
    const content = fs.readFileSync(filePath);
    const info = reactDockGen.parse(content, resolver, handlers);
    info.filePath = filePath;
    if (info.composes) {
        info.composes = info.composes.map((relativePath) => {
            const composeComponentPath = path.resolve(path.dirname(filePath), `${relativePath}.jsx`);
            return getReactComponentInfo(composeComponentPath, resolver, handlers);
        });
    } else {
        info.composes = [];
    }
    // filter public methods
    info.methods = info.methods.filter(({docblock}) => docblock && docblock.indexOf('@public') !== -1);
    // extends props for composed components
    info.props = info.composes.reduce((prev, item) => Object.assign({}, prev, item.props), info.props || {});
    documentation[filePath] = info;
    return info;
}

function getReactComponentDefinitionsContent(info, componentModuleName, projectName) {
    const moduleName = `${projectName}/${componentModuleName}`;
    const componentName = upperCamelCase(componentModuleName);
    /* TODO: сделать полноценное наследование
        doc.composes.length > 0? `extends ${doc.composes.map(({componentName}) => `${componentName}Props`).join(' & ')}`: ''
    */
    /* TODO: сделать полноценное наследование doc.composes.map(({ componentName, filePath }) =>
        `import { ${componentName}Props } from './${path.relative(path.dirname(doc.filePath), filePath )}'`
    )*/
    /* TODO: сделать генерацию примитивов
        Сейчас генерятся any, как и в предыдущем случае
        добавить сначала для примитивов, потом для shape etc
    )*/
    const content = (`
    declare module '${moduleName}' {
        import { Component } from 'react';
        
        export interface ${componentName}Props {
            ${Object.keys(info.props).map(propName => {
                const { required, type, description } = info.props[propName];
                return `
                    /**
                     * ${ description }
                     */
                    ${propName}${required? '': '?'}: ${'any' /* type.name */};
                `;
            }).join('')}
        }

        export default class ${componentName} extends Component<${componentName}Props, any>{
            ${info.methods.map(({ name, docblock, params, description }) => `
                /**
                 * ${description}
                 */
                ${name}(
                    ${params.map(({ name }) => `${name}: any`).join(',')}
                ): any;
            `).join('')}
        }
     }
    `);
    return content;
}


function getFormattedReactComponentDefinitionsContent(filePath, projectName) {
    return new Promise((resolve, reject) => {
        const componentName = path.parse(filePath).name;
        const componentInfo = getReactComponentInfo(filePath, undefined, undefined);
        const definitionsContent = getReactComponentDefinitionsContent(componentInfo, componentName, projectName);
        tsfmt.processString("", definitionsContent, {
            dryRun: true,
            replace: false,
            verify: false,
            tsconfig: false,
            tslint: false,
            editorconfig: false,
            tsfmt: true
        }).then(result => {
            const formattedDefinitionsContent = result.dest
            resolve(formattedDefinitionsContent);
        });
    });
}

module.exports = getFormattedReactComponentDefinitionsContent;