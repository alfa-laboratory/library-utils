const babylon = require('react-docgen/dist/babylon').default;
const isExportsOrModuleAssignment = require('react-docgen/dist/utils/isExportsOrModuleAssignment').default;
const isReactComponentClass = require('react-docgen/dist/utils/isReactComponentClass').default;
const isReactCreateClassCall = require('react-docgen/dist/utils/isReactCreateClassCall').default;
const isStatelessComponent = require('react-docgen/dist/utils/isStatelessComponent').default;
const normalizeClassDefinition = require('react-docgen/dist/utils/normalizeClassDefinition').default;
const resolveExportDeclaration = require('./resolve-export-declaration');
const resolveToValue = require('react-docgen/dist/utils/resolveToValue').default;
const resolveHOC = require('react-docgen/dist/utils/resolveHOC').default;
const getSourceFileContent = require('./get-source-file-content');

const ERROR_MULTIPLE_DEFINITIONS = 'Multiple exported component definitions found.';

function ignore() {
    return false;
}

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
    } else if (isReactComponentClass(definition)) {
        normalizeClassDefinition(definition);
        return definition;
    } else if (isStatelessComponent(definition)) {
        return definition;
    }
    return null;
}

function findExportedComponentDefinition(
    ast,
    recast,
    filePath
) {
    const types = recast.types.namedTypes;
    let definition;

    function exportDeclaration(nodePath) {
        let linkedFile;
        const definitions = resolveExportDeclaration(nodePath, types)
            .reduce((acc, def) => {
                if (isComponentDefinition(def)) {
                    acc.push(def);
                } else {
                    const resolved = resolveToValue(resolveHOC(def));
                    if (isComponentDefinition(resolved)) {
                        acc.push(resolved);
                        return acc;
                    }
                }
                if (def.get('value') && def.get('value').value) {
                    // if we found reexported file - parse it with recast and return
                    const src = getSourceFileContent(def.get('value').value, filePath);
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
        visitFunctionDeclaration: ignore,
        visitFunctionExpression: ignore,
        visitClassDeclaration: ignore,
        visitClassExpression: ignore,
        visitIfStatement: ignore,
        visitWithStatement: ignore,
        visitSwitchStatement: ignore,
        visitCatchCause: ignore,
        visitWhileStatement: ignore,
        visitDoWhileStatement: ignore,
        visitForStatement: ignore,
        visitForInStatement: ignore,

        visitExportDeclaration: exportDeclaration,
        visitExportNamedDeclaration: exportDeclaration,
        visitExportDefaultDeclaration: exportDeclaration,

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
