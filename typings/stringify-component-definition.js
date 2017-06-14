/* eslint no-use-before-define: ["error", "nofunc"] */
const upperCamelCase = require('uppercamelcase');

function stringifyType(type) {
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
    return `${type.value.map(({ value }) => value).join(' | ')}`;
}

function stringifyUnion(type) {
    return `${type.value.map(type => stringifyType(type)).join(' | ')}`;
}

function stringifyDescription(description, docblock) {
    return !description ? '' : `
    /**
     * ${description || docblock}
     */`;
}

function stringifyField(name, type) {
    return (
        `${stringifyDescription(type.description, type.docblock)}
         ${name}${type.required ? '' : '?'}: ${stringifyType(type)}`
    );
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
        [key: string]: ${stringifyType(fieldType)};
    }`;
}

function stringifyComponentDefinition(info, componentModuleName, projectName) {
    const moduleName = `${projectName}/${componentModuleName}`;
    const componentName = upperCamelCase(componentModuleName);
    return (
        `declare module '${moduleName}' {
            import { Component, ReactNode } from 'react';
            
            export interface ${componentName}Props {
                ${Object.keys(info.props).map((propName) => {
                    const { required, type, description, docblock } = info.props[propName];
                    return (
                        `${stringifyDescription(description, docblock)}
                                        ${propName}${required ? '' : '?'}: ${stringifyType(type)};`
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
}

module.exports = stringifyComponentDefinition;
