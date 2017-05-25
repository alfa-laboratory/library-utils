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
    const content = (
        `declare module '${moduleName}' {
            import { Component, ReactNode } from 'react';
            
            export interface ${componentName}Props {
                ${Object.keys(info.props).map(propName => {
                    const { required, type, description, docblock } = info.props[propName];
                    return (
                        `${stringifyDescription(description, docblock)}
                        ${propName}${required? '': '?'}: ${stringifyType(type)};`
                    );
                }).join('')}
            }

            ${stringifyDescription(info.description, info.docblock)}
            export default class ${componentName} extends Component<${componentName}Props, any> {
                ${info.methods.map(({ name, docblock, params, description }) => (
                    `${stringifyDescription(description, docblock)}
                    ${name}(${params.map(({ name }) => `${name}: any`).join(',')}): any;`
                )).join('')}
            }
        }`
    );
    return content;
}

function stringifyType(type){
    switch (type.name) {
        case 'string': 
            return 'string';
        case 'number':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'array':
            return 'Array<any>';
        case 'node':
            return 'ReactNode';
        case 'union': 
            return stringifyUnion(type);
        case 'func':
            return 'Function';
        case 'enum':
            return stringifyEnum(type);  
        case 'arrayOf':
            return stringifyArray(type);  
        case 'shape':
            return stringifyShape(type);
        case 'objectOf':
            return stringifyObjectOf(type);
        case 'object':
            return 'object';
        case 'any':
            return 'any';    
        default:
            return 'any' + 
                `/* Не нашелся встроенный тип для типа ${JSON.stringify(type)}
                 * https://github.com/alfa-laboratory/library-utils/issues/new 
                 */`;
    }
}

function stringifyArray(type) {
    return `Array<${stringifyType(type.value)}>`;
}

function stringifyEnum(type) {
    return `${type.value.map(({value})=> value).join(' | ')}`;
}

function stringifyUnion(type) {
    return `${type.value.map(type => stringifyType(type)).join(' | ')}`
}

function stringifyShape(type) {
    const fields = type.value;
    return `{
        ${Object.keys(fields).map(fieldName => stringifyField(fieldName, fields[fieldName])).join(';\n')}
    }`;
}

function stringifyObjectOf(type) {
    const fieldType = type.value;
    return `{
        [key: any]: ${stringifyType(fieldType)};
    }`;
}

function stringifyField(name, type) {
    return (
        `${stringifyDescription(type.description, type.docblock)}
        ${name}${type.required? '': '?'}: ${stringifyType(type)}`
    );
}

function stringifyDescription(description, docblock) {
    return !description? '':`
    /**
     * ${description}
     */`;
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