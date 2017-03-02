const path = require('path');
const through = require('through2');
const Vinyl = require('vinyl');

/**
 * Generate package.json content for component.
 *
 * @param {String} componentName Filename of component.
 * @returns {String}
 */
function getComponentPackage(componentName) {
    return JSON.stringify({
        main: componentName + '.js',
        types: componentName + '.d.ts',
    });
}

/**
 * Gulp plugin, that will generate package.json for every file.
 *
 * @returns {Function}
 */
function componentPackage() {
    function transform(file, encoding, callback) {
        if (file.isStream()) {
            callback();
            return;
        }
        let componentName = path.parse(file.path).name;

        callback(null, new Vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.dirname(file.path) + '/package.json',
            contents: new Buffer(getComponentPackage(componentName))
        }));
    }

    return through.obj(transform);
}

module.exports = componentPackage;
