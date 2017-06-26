/* eslint strict: [0, "global"] */
/* eslint import/no-extraneous-dependencies: [2, {"devDependencies": true}] */

'use strict';

const path = require('path');
const merge = require('webpack-merge');
const findPackageName = require('../utils/find-package-name');
const reactDoc = require('../react-doc');
const upperCamelCase = require('uppercamelcase');
const ARUI_TEMPLATE = require('arui-presets/webpack.base');

const packageName = findPackageName();

module.exports = {
    styles: {
        SectionHeading: {
            heading: {
                fontSize: '48px',
                fontWeight: 'bold'
            }
        },
        ToolbarButton: {
            button: {
                display: 'none'
            }
        },
        Playground: {
            preview: {
                borderRadius: 0,
                padding: 0
            }
        },
        StyleGuide: {
            content: {
                maxWidth: 'none'
            }
        }
    },
    skipComponentsWithoutExample: true,
    propsParser(filePath) {
        return reactDoc(filePath);
    },
    getComponentPathLine(filePath) {
        const componentDirName = path.dirname(filePath);
        const componentSourcesFileName = componentDirName.split(path.sep).pop();
        const componentName = upperCamelCase(componentSourcesFileName);
        return `import ${componentName} from '${packageName}/${componentSourcesFileName}';`;
    },
    getExampleFilename(componentPath) {
        return path.resolve(path.dirname(componentPath), './README.md');
    },
    ignore: ['**/*-test.jsx'],
    webpackConfig: merge.smart(ARUI_TEMPLATE, {
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    loader: 'babel-loader',
                    include: /node_modules\/library-utils/
                }
            ]
        },
        resolve: {
            alias: {
                // Переопределяем компоненты styleguidist
                'rsg-components/Wrapper': path.resolve(__dirname, './components/preview-with-theme-switcher'),
                'rsg-components/Logo': path.resolve(__dirname, './components/logo.jsx'),
                'rsg-components/Playground/PlaygroundRenderer': path.resolve(__dirname,
                    './components/playground-with-share-example-button'
                ),
                'rsg-components/StyleGuide/StyleGuideRenderer': require.resolve(
                    'react-styleguidist/lib/rsg-components/StyleGuide/StyleGuideRenderer'
                ),
                'rsg-components/StyleGuide/index': require.resolve(
                    'react-styleguidist/lib/rsg-components/StyleGuide/index'
                ),
                'rsg-components/StyleGuide': path.resolve(__dirname, './components/styleguide')
            }
        }
    })
};
