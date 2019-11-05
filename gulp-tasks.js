const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const filter = require('gulp-filter');
const clone = require('gulp-clone');
const es = require('event-stream');
const ts = require('gulp-typescript');
const del = require('del');
const componentPackage = require('./gulp/component-package');
const componentTypings = require('./gulp/component-typings');
const componentDocs = require('./gulp/component-docs');
const libraryDoc = require('./gulp/library-doc');

const defaultOptions = {
    publishDir: '.publish',
    docsDir: 'docs',
    tsConfigFilename: 'tsconfig.json',
    componentsGlob: ['src/*/*.jsx', '!src/*/*-test.jsx', '!src/*/*-benchmark.jsx'],
    tsComponentsGlob: ['src/*/*.tsx'],
    jsGlob: ['src/**/*.{js,jsx}', '!src/**/*-test.{js,jsx}', '!src/**/*-benchmark.{js,jsx}'],
    autoDtsGlob: [
        'src/**/*.{js,jsx}', '!src/**/index.{js,jsx}', '!src/**/*-test.{js,jsx}', '!src/**/*-benchmark.{js,jsx}'
    ],
    tsGlob: ['src/**/*.{ts,tsx}', '!src/**/*-test.{ts,tsx}', '!src/**/*-benchmark.{ts,tsx}'],
    cssGlob: ['src/**/*.css', '!src/vars/**/*.css', '!src/vars*.css'],
    cssCopyGlob: ['src/**/vars/**/*.css', 'src/vars*.css'],
    resourcesGlob: ['src/**/*.{png,gif,jpg,svg,ttf,woff,json}'],
    publishFilesGlob: ['package.json', '*.md', 'LICENSE']
};

const errors = [];

function handleError(error) {
    errors.push(error);
}

function checkErrors() {
    if (errors.length > 0) {
        process.exit(1);
    }
}

function createTasks(packageName, options = {}) {
    options = Object.assign({}, defaultOptions, options);
    const tsConfigPath = path.resolve(process.cwd(), options.tsConfigFilename);
    const isTsEnabled = fs.existsSync(tsConfigPath);

    gulp.task('clean', () => del([options.publishDir]));
    gulp.task('clean:docs', () => del([options.publishDir]));

    gulp.task(
        'js', ['clean'],
        () => gulp.src(options.jsGlob)
            .pipe(sourcemaps.init())
            .pipe(babel())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(options.publishDir))
    );

    gulp.task('ts:compile', ['clean'], () => {
        const tsProject = ts.createProject(options.tsConfigFilename, { declaration: true });
        const tsResult = gulp.src(options.tsGlob)
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .on('error', handleError);

        return es
            .merge(tsResult.js, tsResult.dts)
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError);
    });

    gulp.task(
        'ts:packages', ['clean'],
        () => gulp.src(options.tsComponentsGlob)
            .pipe(componentPackage())
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError)
    );

    gulp.task('ts', ['ts:compile', 'ts:packages']);

    gulp.task('typings', ['clean'], () => {
        const components = gulp.src(options.componentsGlob);
        const packages = components
            .pipe(clone())
            .pipe(componentPackage())
            .on('error', handleError);

        const typingFiles = components
            .pipe(clone())
            .pipe(componentTypings())
            .on('error', handleError);

        return es
            .merge(packages, typingFiles)
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError);
    });

    gulp.task(
        'css:compile', ['clean'],
        () => gulp.src(options.cssGlob)
            .pipe(sourcemaps.init())
            .pipe(postcss())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError)
    );

    gulp.task(
        'css:copy', ['clean'],
        () => gulp.src(options.cssCopyGlob)
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError)
    );

    gulp.task('css', ['css:copy', 'css:compile']);

    gulp.task(
        'resources', ['clean'],
        () => gulp.src(options.resourcesGlob)
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError)
    );

    gulp.task(
        'publish-files', ['clean'],
        () => gulp.src(options.publishFilesGlob)
            .pipe(gulp.dest(options.publishDir))
            .on('error', handleError)
    );

    gulp.task('docs', ['clean:docs'], () => {
        let tsToJs;
        let tsDocs;

        if (isTsEnabled) {
            const tsDocsProject = ts.createProject(options.tsConfigFilename, { jsx: 'preserve', target: 'es6' });

            tsToJs = gulp.src(['src/*/*.tsx'])
                .pipe(tsDocsProject(ts.reporter.nullReporter())).js;
            tsDocs = tsToJs.pipe(clone())
                .pipe(componentDocs(packageName));
        }

        const jsDocs = gulp.src(options.componentsGlob)
            .pipe(componentDocs(packageName));

        const indexFile = es.merge([gulp.src(options.componentsGlob)].concat(isTsEnabled ? [tsToJs] : []))
            .pipe(libraryDoc(packageName))
            .pipe(rename((filePath) => {
                filePath.dirname = '';
                filePath.basename = 'README';
                filePath.extname = '.md';
            }));

        return es
            .merge([jsDocs, indexFile].concat(isTsEnabled ? [tsDocs] : []))
            .pipe(gulp.dest(options.docsDir));
    });

    gulp.task('dts', ['js', 'publish-files', 'typings'], () => {
        const tsOptions = {
            declaration: true,
            allowSyntheticDefaultImports: true,
            lib: ['dom', 'es2015', 'es2016']
        };

        return gulp.src(options.autoDtsGlob)
            .pipe(rename((path) => {
                // typescript compiler won't compile files with non-ts extensions
                path.extname = path.extname === '.jsx' ? '.tsx' : '.ts';
            }))
            .pipe(filter(file => !fs.existsSync(
                // ignore all files, that already emit d.ts file
                path.join(process.cwd(), options.publishDir, file.relative)
                    .replace(/\.tsx?$/, '.d.ts')
            )))
            .pipe(ts(tsOptions, ts.reporter.nullReporter())) // ignore all errors at compile time
            .dts.pipe(gulp.dest(options.publishDir));
    });

    gulp.task(
        'compile',
        ['js', 'css', 'resources', 'typings', 'publish-files', 'dts'].concat(isTsEnabled ? ['ts'] : []),
        checkErrors
    );
}

module.exports = createTasks;
