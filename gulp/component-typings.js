const Vinyl = require('vinyl');
const through = require('through2');
const path = require('path');
const getReactComponentDefinitionsContent = require('../typings/index');

/**
 * Gulp plugin to generate react typings and root package.json for each component.
 *
 * @param {String} libraryName Library name, will be used in typescript declarations.
 * @returns {Function}
 */
function componentTypings() {
    function transform(file, encoding, callback) {
        if (file.isStream()) {
            callback();
            return;
        }
        const componentName = path.parse(file.path).name;
        getReactComponentDefinitionsContent(file.path).then((definitionsContent) => {
            if (!definitionsContent) {
                console.warn(`Unable to create typings for ${file.path}`); // eslint-disable-line no-console
                return callback(null);
            }
            return callback(null, new Vinyl({
                cwd: file.cwd,
                base: file.base,
                path: path.join(path.dirname(file.path), `${componentName}.d.ts`),
                contents: new Buffer(definitionsContent)
            }));
        }).catch((e) => {
            console.error(e); // eslint-disable-line no-console
        });
    }

    return through.obj(transform);
}

module.exports = componentTypings;
