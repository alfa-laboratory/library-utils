const path = require('path');
const fs = require('fs');

function findPackageName() {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).name;
}

module.exports = findPackageName;
