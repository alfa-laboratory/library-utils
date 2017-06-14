const path = require('path');
const through = require('through2');
const Vinyl = require('vinyl');

/**
 * Gulp plugin, that will generate package.json for every file.
 *
 * @returns {Function}
 */
function fantasyComponentPackage() {
    function transform(file, encoding, callback) {
        if (file.isStream()) {
            callback();
            return;
        }
        const dirname = path.dirname(file.path);
        const componentName = path.parse(path.resolve(file.path, '../..')).name;

        callback(null, new Vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.join(dirname, 'package.json'),
            contents: new Buffer(JSON.stringify({
                main: 'index.js',
                types: `../${componentName}.d.ts`
            }))
        }));
    }

    return through.obj(transform);
}

module.exports = fantasyComponentPackage;
