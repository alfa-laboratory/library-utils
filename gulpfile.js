const path = require('path');
const fs = require('fs');
const createTasks = require('./gulp-tasks');

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const appPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

createTasks(appPackage.name, appPackage['library-utils']);
