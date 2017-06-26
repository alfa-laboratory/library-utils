const path = require('path');
const fs = require('fs');
const structureForFile = require('react-component-info');
const through = require('through2');
const Vinyl = require('vinyl');
const ejs = require('ejs');

const TEMPLATE_COMPONENT = fs.readFileSync(path.join(__dirname, '../docs-templates/component.md.ejs'), 'utf8');

/**
 * Gulp plugin to render doc file from react component.
 *
 * @param {String} libraryName Name of the library, will be used for js import examples
 * @returns {Function}
 */
function componentDocs(libraryName) {
    function transform(file, encoding, callback) {
        if (file.isStream()) {
            callback();
            return;
        }
        try {
            const content = file.contents.toString('utf8');
            const componentName = path.parse(file.path).name;
            const description = structureForFile(content, componentName);
            const doc = ejs.render(TEMPLATE_COMPONENT, { component: description, libraryName });

            callback(null, new Vinyl({
                cwd: file.cwd,
                base: file.base,
                path: `${path.dirname(file.path)}/README.md`,
                contents: new Buffer(doc)
            }));
        } catch (e) {
            console.warn(`unable to build docs for ${file.path}`); // eslint-disable-line no-console
            callback(null);
        }
    }

    return through.obj(transform);
}

module.exports = componentDocs;
