const path = require('path');
const fs = require('fs');
const through = require('through2');
const Vinyl = require('vinyl');

/**
 * Generate package.json content for component.
 *
 * @param {*} file Gulp stream file instance
 * @returns {String}
 */
function getComponentPackage(file) {
    const dirname = path.dirname(file.path);
    const componentName = path.parse(file.path).name;
    const isIndexFileExist = fs.existsSync(path.join(dirname, 'index.js'))
        || fs.existsSync(path.join(dirname, 'index.ts'));
    return JSON.stringify({
        main: isIndexFileExist ? 'index.js' : `${componentName}.js`,
        types: isIndexFileExist ? 'index.d.ts' : `${componentName}.d.ts`
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
        const dirname = path.dirname(file.path);

        callback(null, new Vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.join(dirname, 'package.json'),
            contents: Buffer.from(getComponentPackage(file))
        }));
    }

    return through.obj(transform);
}

module.exports = componentPackage;
