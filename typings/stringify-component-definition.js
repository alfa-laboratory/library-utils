/* eslint no-use-before-define: ["error", "nofunc"] */
const upperCamelCase = require('uppercamelcase');
const parseJsDoc = require('react-docgen/dist/utils/parseJsDoc').default;

function stringifyType(type, componentName, propName, description, typeRefs) {
    const typeName = `${componentName}${upperCamelCase(propName)}FieldType`;

    if (typeof type === 'string' || !type) {
        type = { name: type };
    }

    switch (type.name) {
        case 'string':
        case 'String':
            return 'string';
        case 'number':
        case 'Number':
            return 'number';
        case 'bool':
        case 'boolean':
        case 'Boolean':
            return 'boolean';
        case 'array':
        case 'Array':
            return 'ReadonlyArray<any>';
        case 'node':
            return 'ReactNode';
        case 'union':
            typeRefs.push(`export type ${typeName} = ${stringifyUnion(type, componentName, propName, typeRefs)};`);
            return typeName;
        case 'func':
            return stringifyFunc(type, componentName, propName, description, typeRefs);
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
        case 'Event':
        case 'Date':
        case 'File':
            return type.name;
        default:
            if (typeof type.name === 'string' && (type.name.startsWith('React.') || type.name.startsWith('HTML'))) {
                return type.name;
            }
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

function stringifyFunc(type, componentName, propName, description, typeRefs) {
    if (!description) {
        return 'Function';
    }
    try {
        const parsedDoc = parseJsDoc(description);

        return stringifyFunctionDefinition(parsedDoc, componentName, propName, description, typeRefs, true);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Unable to parse doc block for ${componentName}.${propName}`);
        return 'Function';
    }
}

function stringifyFunctionDefinition(type, componentName, propName, description, typeRefs, useArrowNotation = false) {
    if (!type || (type.params.length === 0 && type.returns === null)) {
        return useArrowNotation ? 'Function' : '(...args: any[]): any';
    }

    const paramsTypes = type.params
        .map((p) => {
            const type = p.type
                ? stringifyType(p.type, componentName, `${propName}${upperCamelCase(p.name)}Param`, null, typeRefs)
                : 'any';
            return `${p.name}?: ${type}`;
        });

    const returnType = type.returns
        ? stringifyType(type.returns.type || type.returns, componentName, `${propName}Return`, null, typeRefs)
        : 'void';

    return `(${paramsTypes.join(', ')}) ${useArrowNotation ? '=>' : ':'} ${returnType}`;
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

function stringifyClassMethod(type, componentName, typeRefs) {
    const typeDef = stringifyFunctionDefinition(type, componentName, type.name, null, typeRefs, false);
    const description = stringifyDescription(type.description, type.docblock);

    return `${description}${type.name}${typeDef};`;
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

    const methodsDefs = info.methods
        .map(type => stringifyClassMethod(type, info.displayName, typeRefs));

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
            ${methodsDefs.join('\n')}
        }
        `
    );
}

module.exports = stringifyComponentDefinition;
