const path = require('path');
const babylon = require('react-docgen/dist/babylon').default;
const resolve = require('resolve').sync;
const isExportsOrModuleAssignment = require('react-docgen/dist/utils/isExportsOrModuleAssignment').default;
const isReactComponentClass = require('react-docgen/dist/utils/isReactComponentClass').default;
const isReactCreateClassCall = require('react-docgen/dist/utils/isReactCreateClassCall').default;
const isStatelessComponent = require('react-docgen/dist/utils/isStatelessComponent').default;
const normalizeClassDefinition = require('react-docgen/dist/utils/normalizeClassDefinition').default;
const getMemberValuePath = require('react-docgen/dist/utils/getMemberValuePath').default;
const resolveToValue = require('react-docgen/dist/utils/resolveToValue').default;
const resolveHOC = require('react-docgen/dist/utils/resolveHOC').default;
const resolveToModule = require('react-docgen/dist/utils/resolveToModule').default;
const getSourceFileContent = require('./get-source-file-content');
const resolveExportDeclaration = require('./docgen/resolve-export-declaration');
const isDecoratedBy = require('./docgen/is-decorated-by');

const ERROR_MULTIPLE_DEFINITIONS = 'Multiple exported component definitions found.';

function isComponentDefinition(path) {
    return isReactCreateClassCall(path) || isReactComponentClass(path) || isStatelessComponent(path);
}

function resolveDefinition(definition, types) {
    if (isReactCreateClassCall(definition)) {
        // return argument
        const resolvedPath = resolveToValue(definition.get('arguments', 0));
        if (types.ObjectExpression.check(resolvedPath.node)) {
            return resolvedPath;
        }
    } else if (isReactComponentClass(definition) || isDecoratedBy(definition, 'cn')) {
        normalizeClassDefinition(definition);
        return definition;
    } else if (isStatelessComponent(definition)) {
        return definition;
    }
    return null;
}

function findExportedComponentDefinition(ast, recast, filePath) {
    const types = recast.types.namedTypes;
    const importedModules = {};
    let originalClassName;
    let definition;

    function exportDeclaration(nodePath) {
        let linkedFile;
        const definitions = resolveExportDeclaration(nodePath, types)
            .reduce((acc, def) => {
                if (isComponentDefinition(def)) {
                    acc.push(def);
                    return acc;
                }

                const resolved = resolveToValue(resolveHOC(def));
                if (isComponentDefinition(resolved)) {
                    acc.push(resolved);
                    return acc;
                }

                if (isDecoratedBy(def, 'cn') && def.get('superClass')) {
                    const superClass = def.get('superClass');
                    if (!originalClassName) { // save original component name and use it to patch parent class
                        originalClassName = def.get('id').value.name;
                    }

                    const src = getSourceFileContent(importedModules[superClass.value.name], filePath);
                    filePath = src.filePath; // update file path, so we can correctly resolve imports
                    linkedFile = recast.parse(src.content, { esprima: babylon });
                    return acc;
                }
                if (def.get('value') && def.get('value').value) {
                    // if we found reexported file - parse it with recast and return
                    const src = getSourceFileContent(def.get('value').value, filePath);
                    filePath = src.filePath; // update file path, so we can correctly resolve imports
                    linkedFile = recast.parse(src.content, { esprima: babylon });
                }
                return acc;
            }, []);

        if (linkedFile) {
            return linkedFile;
        }

        if (definitions.length === 0) {
            return false;
        }
        if (definitions.length > 1 || definition) {
            // If a file exports multiple components, ... complain!
            throw new Error(ERROR_MULTIPLE_DEFINITIONS);
        }
        definition = resolveDefinition(definitions[0], types);
        return false;
    }

    recast.visit(ast, {
        visitExportDeclaration: exportDeclaration,
        visitExportNamedDeclaration: exportDeclaration,
        visitExportDefaultDeclaration: exportDeclaration,
        visitClassDeclaration(node) {
            if (originalClassName) {
                // we inside super class, so we create `displayName` static property that handlers can read
                // and override original class display name
                let originalPath = getMemberValuePath(node, 'displayName');
                if (originalPath) { // replace existing displayName
                    originalPath.value = recast.types.builders.literal(originalClassName);
                } else { // create new property
                    const propertyDefinition = recast.types.builders.classProperty(
                        recast.types.builders.identifier('displayName'),
                        recast.types.builders.literal(originalClassName),
                        null,
                        true
                    );
                    node.get('body').value.body.push(propertyDefinition);
                }
            }
            return false;
        },
        visitImportDeclaration(node) {
            const specifiers = node.value.specifiers;
            const moduleName = resolveToModule(node);

            if (moduleName !== 'react' && moduleName !== 'prop-types') {
                // resolve path to file here, because this is the only place where we've got actual source path
                // but skip `react` and `prop-types` modules, because dockgen winn not be able to detect types otherwise
                node.value.source.value = resolve(
                    node.value.source.value,
                    { basedir: path.dirname(filePath), extensions: ['.js', '.jsx'] }
                );
            }

            if (specifiers && specifiers.length > 0) {
                importedModules[specifiers[0].local.name] = node.value.source.value;
            }
            return false;
        },
        visitAssignmentExpression(path) {
            // Ignore anything that is not `exports.X = ...;` or
            // `module.exports = ...;`
            if (!isExportsOrModuleAssignment(path)) {
                return false;
            }
            // Resolve the value of the right hand side. It should resolve to a call
            // expression, something like React.createClass
            path = resolveToValue(path.get('right'));
            if (!isComponentDefinition(path)) {
                path = resolveToValue(resolveHOC(path));
                if (!isComponentDefinition(path)) {
                    return false;
                }
            }
            if (definition) {
                // If a file exports multiple components, ... complain!
                throw new Error(ERROR_MULTIPLE_DEFINITIONS);
            }
            definition = resolveDefinition(path, types);
            return false;
        }
    });

    return definition;
}

function createResolver(filePath) {
    return (ast, recast) => findExportedComponentDefinition(ast, recast, filePath);
}

module.exports = createResolver;
