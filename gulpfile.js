const findPackageName = require('./utils/find-package-name');
const createTasks = require('./gulp-tasks');

createTasks(findPackageName());
