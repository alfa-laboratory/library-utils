/* eslint no-use-before-define: ["error", "nofunc"] */
const upperCamelCase = require('uppercamelcase');

function stringifyType(type, componentName, propName, typeRefs) {
    const typeName = `${componentName}${upperCamelCase(propName)}FieldType`;
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
            typeRefs.push(`export type ${typeName} = ${stringifyUnion(type, componentName, propName, typeRefs)};`);
            return typeName;
        case 'func':
            return 'Function';
        case 'enum':
            typeRefs.push(`export type ${typeName} = ${stringifyEnum(type)};`);
            return typeName;
        case 'arrayOf':
            return stringifyArray(type, componentName, propName, typeRefs);
        case 'shape':
            typeRefs.push(`export type ${typeName} = ${stringifyShape(type, componentName, propName, typeRefs)};`);
            return typeName;
        case 'objectOf':
            typeRefs.push(`export type ${typeName} = ${stringifyObjectOf(type, componentName, propName, typeRefs)};`);
            return typeName;
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

function stringifyArray(type, componentName, propName, typeRefs) {
    return `Array<${stringifyType(type.value, componentName, propName, typeRefs)}>`;
}

function stringifyEnum(type) {
    return `${type.value.map(({ value }) => value).join(' | ')}`;
}

function stringifyUnion(type, componentName, propName, typeRefs) {
    return `${type.value.map(type => stringifyType(type, componentName, propName, typeRefs)).join(' | ')}`;
}

function stringifyDescription(description, docblock) {
    return !description ? '' : `
    /**
     * ${description || docblock}
     */\n`;
}

function stringifyField(fieldName, type, componentName, propName, typeRefs) {
    return (
        stringifyDescription(type.description, type.docblock) + // eslint-disable-line prefer-template
        `${fieldName}${type.required ? '' : '?'}: ${stringifyType(type, componentName, propName, typeRefs)}`
    );
}

function stringifyShape(type, componentName, propName, typeRefs) {
    const fields = type.value;
    return `{
        ${Object
            .keys(fields)
            .map(fieldName => stringifyField(fieldName, fields[fieldName], componentName, propName, typeRefs))
            .join(';\n')}
    }`;
}

function stringifyObjectOf(type, componentName, propName, typeRefs) {
    const fieldType = type.value;
    return `{
        [key: string]: ${stringifyType(fieldType, componentName, propName, typeRefs)};
    }`;
}

function stringifyMethod({ name, docblock, params, description }) {
    return stringifyDescription(description, docblock) + // eslint-disable-line prefer-template
        `${name}(${params.map(({ name }) => `${name}: any`).join(',')}): any;`;
}

function stringifyComponentDefinition(info) {
    const typeRefs = []; // PropType fields typedefs
    const propsInterfaceName = `${info.displayName}Props`;
    const propsDef = (
        `
        export interface ${propsInterfaceName} {
            ${Object.keys(info.props).map((propName) => {
                const { required, type, description, docblock } = info.props[propName];
                const typeDef = stringifyType(type, info.displayName, propName, typeRefs);
                return (
                    `${stringifyDescription(description, docblock)}${propName}${required ? '' : '?'}: ${typeDef};`
                );
            }).join('')}
        }
        `
    );
    return (
        `
        import { Component, ReactNode } from 'react';
        
        ${typeRefs.join('\n')}
        
        ${propsDef}

        ${stringifyDescription(info.description, info.docblock)}
        export default class ${info.displayName} extends Component<${propsInterfaceName}, any> {
            ${info.methods.map(stringifyMethod).join('')}
        }
        `
    );
}

module.exports = stringifyComponentDefinition;
