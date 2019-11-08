const tsfmt = require('typescript-formatter');

function formatTs(definition) {
    return tsfmt.processString('', definition, {
        dryRun: true,
        replace: false,
        verify: false,
        tsconfig: false,
        tslint: false,
        editorconfig: false,
        tsfmt: true
    }).then((result) => result.dest);
}

module.exports = formatTs;
