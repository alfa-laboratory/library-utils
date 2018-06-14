/* eslint no-use-before-define: ["error", "nofunc"] */
const upperCamelCase = require('uppercamelcase');
const parseJsDoc = require('react-docgen/dist/utils/parseJsDoc').default;

function stringifyType(type, componentName, propName, description, typeRefs) {
    const typeName = `${componentName}${upperCamelCase(propName)}FieldType`;
    switch (type.name) {
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'array':
            return 'ReadonlyArray<any>';
        case 'node':
            return 'ReactNode';
        case 'union':
            typeRefs.push(`export type ${typeName} = ${stringifyUnion(type, componentName, propName, typeRefs)};`);
            return typeName;
        case 'func':
            return stringifyFunc(type, componentName, propName, description);
        case 'enum':
            typeRefs.push(`export type ${typeName} = ${stringifyEnum(type)};`);
            return typeName;
        case 'arrayOf':
            return stringifyArray(type, componentName, propName, typeRefs);
        case 'shape':
            typeRefs.push(`export type ${typeName} = ${stringifyShape(type, componentName, propName, typeRefs)};`);
            return typeName;
        case 'objectOf':
            typeRefs.push(`export type ${typeName} = ${stringifyObjectOf(
                type,
                componentName,
                `${propName}Value`,
                typeRefs
            )};`);
            return typeName;
        case 'object':
            return 'object';
        case 'any':
            return 'any';
        default:
            return 'any' +
                `/* Не нашёлся встроенный тип для типа ${JSON.stringify(type)}
                  * https://github.com/alfa-laboratory/library-utils/issues/new
                  */`;
    }
}

function stringifyArray(type, componentName, propName, typeRefs) {
    return `ReadonlyArray<${stringifyType(type.value, componentName, propName, null, typeRefs)}>`;
}

function stringifyEnum(type) {
    return `${type.value.map(({ value }) => value).join(' | ')}`;
}

function stringifyUnion(type, componentName, propName, typeRefs) {
    return `${type.value.map(type => stringifyType(type, componentName, propName, null, typeRefs)).join(' | ')}`;
}

function stringifyDescription(description, docblock) {
    return !description ? '' : `
    /**
     * ${description || docblock}
     */\n`;
}

function stringifyFunc(type, componentName, propName, description) {
    try {
        if (!description) {
            return 'Function';
        }
        const parsedDoc = parseJsDoc(description);
        if (!parsedDoc || (parsedDoc.params.length === 0 && parsedDoc.returns === null)) {
            return 'Function';
        }

        const paramsTypes = parsedDoc.params
            .map(p => `${p.name}?: any /*${p.type ? p.type.name : 'any'}*/`);

        const returnType = parsedDoc.returns
            ? parsedDoc.returns.type.name
            : 'void';

        return `(${paramsTypes.join(', ')}) => any /*${returnType}*/`;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to parse doc block for ${componentName}.${propName}`);
        return 'Function';
    }
}

function stringifyField(fieldName, type, componentName, propName, typeRefs) {
    const typeDescription = stringifyType(
        type, componentName, `${propName}${upperCamelCase(fieldName)}`, type.description, typeRefs
    );
    return (
        stringifyDescription(type.description, type.docblock) + // eslint-disable-line prefer-template
        `readonly ${fieldName}${type.required ? '' : '?'}: ${typeDescription}`
    );
}

function stringifyShape(type, componentName, propName, typeRefs) {
    const fields = type.value;
    /* eslint-disable indent */
    return `{
        ${Object
        .keys(fields)
        .map(fieldName => stringifyField(fieldName, fields[fieldName], componentName, propName, typeRefs))
        .join(';\n')}
    }`;
    /* eslint-enable indent */
}

function stringifyObjectOf(type, componentName, propName, typeRefs) {
    const fieldType = type.value;
    return `{
        readonly [key: string]: ${stringifyType(fieldType, componentName, propName, null, typeRefs)};
    }`;
}

function stringifyMethod({ name, docblock, params, description }) { // eslint-disable-line object-curly-newline
    return stringifyDescription(description, docblock) + // eslint-disable-line prefer-template
        `${name}(${params.map(({ name }) => `${name}?: any`).join(',')}): any;`;
}

function stringifyComponentDefinition(info) {
    const typeRefs = []; // PropType fields typedefs
    const propsInterfaceName = `${info.displayName}Props`;
    const propTypesTypeName = `${info.displayName}PropTypes`;
    const propsDef = (
        /* eslint-disable indent, object-curly-newline */
        `
        export interface ${propsInterfaceName} {
            ${Object.keys(info.props).map((propName) => {
            const { required, type, description, docblock } = info.props[propName];
            const typeDef = stringifyType(type, info.displayName, propName, description || docblock, typeRefs);
            const descriptionString = stringifyDescription(description, docblock);

            return `${descriptionString}readonly ${propName}${required ? '' : '?'}: ${typeDef};`;
        }).join('')}
        }
        `
        /* eslint-enable indent, object-curly-newline */
    );
    return (
        `
        import { Component, ReactNode } from 'react';
        import * as Type from 'prop-types';

        ${typeRefs.join('\n')}

        ${propsDef}
        
        export type ${propTypesTypeName} = Record<keyof ${propsInterfaceName}, Type.Validator<${propsInterfaceName}>>;

        ${stringifyDescription(info.description, info.docblock)}
        export default class ${info.displayName} extends Component<${propsInterfaceName}> {
            static propTypes: ${propTypesTypeName};
            ${info.methods.map(stringifyMethod).join('')}
        }
        `
    );
}

module.exports = stringifyComponentDefinition;
