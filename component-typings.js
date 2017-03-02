const path = require('path');
const tsGenerator = require('react-to-typescript-definitions');
const through = require('through2');
const Vinyl = require('vinyl');

/**
 * Transforms react-to-typescript-definitions output, add missing react import if needed.
 *
 * @param {String} definitions react-to-typescript-definitions output.
 * @returns {String}
 */
function transformGenerated(definitions) {
    definitions = definitions.replace(/\r/g, '');
    if (definitions.indexOf('import * as React from \'react\';') === -1) { // this generator don't understand extending custom components
        definitions = definitions.replace(
            /declare module '([\S]*?)' \{\n/,
            'declare module \'$1\' {\n    import * as React from \'react\';\n'
        );
    }
    return definitions;
}

/**
 * Gulp plugin to generate react typings and root package.json for each component.
 *
 * @param {String} libraryName Library name, will be used in typescript declarations.
 * @returns {Function}
 */
function componentTypings(libraryName) {
    function transform(file, encoding, callback) {
        if (file.isStream()) {
            callback();
            return;
        }
        let content = file.contents.toString('utf8');
        let componentName = path.parse(file.path).name;
        const ts = tsGenerator.generateFromSource(libraryName + '/' + componentName, content);

        callback(null, new Vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.join(path.dirname(file.path), componentName + '.d.ts'),
            contents: new Buffer(transformGenerated(ts))
        }));
    }

    return through.obj(transform);
}

module.exports = componentTypings;
