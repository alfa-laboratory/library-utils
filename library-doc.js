const path = require('path');
const fs = require('fs');
const structureForFile = require('react-component-info');
const through = require('through2');
const Vinyl = require('vinyl');
const ejs = require('ejs');

const TEMPLATE_INDEX = fs.readFileSync(path.join(__dirname, '/docs-templates/index.md.ejs'), 'utf8');

/**
 * Gulp plugin to get index README file for all components.
 *
 * @returns {Function}
 */
function libraryDoc(libraryName) {
    let latestFile;
    const components = [];

    function transform(file, encoding, callback) {
        if (file.isStream()) {
            return callback();
        }
        latestFile = file;
        const componentName = path.parse(file.path).name;
        const content = file.contents.toString('utf8');
        components.push(structureForFile(content, componentName));

        return callback();
    }

    function endStream(callback) {
        components.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });

        const content = ejs.render(TEMPLATE_INDEX, { components: components, libraryName });
        this.push(new Vinyl({
            path: latestFile.path,
            contents: new Buffer(content)
        }));

        callback();
    }

    return through.obj(transform, endStream);
}

module.exports = libraryDoc;
