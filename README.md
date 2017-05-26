Набор утилит для компиляции и генерации доков для react компонентов
===================================================================

gulpfile
--------
Готовый gulpfile со всеми настройками, необходимыми для сборки библиотеки

Ваш `package.json`:
```
"docs": "gulp --cwd . --gulpfile ./node_modules/library-utils/gulpfile.js docs",
"compile": "gulp --cwd . --gulpfile ./node_modules/library-utils/gulpfile.js compile",
```

Для более тонкой настройки используйте gulp-tasks.

gulp-tasks
----------

Вы можете использовать готовый набор gulp-задач.

Пример `gulpfile` вашего проекта:
```
const createTasks = require('library-utils/gulp-tasks');
createTasks('arui-feather');
```

Таким образом будет создано две задачи:

* `gulp docs` - построение документации по компонентам
* `gulp compile` - компиляция css/js/ts файлов библиотеки, подготовка к публикации.

Параметры createTask

* `packageName` - обязательный. Имя пакета. Будет использоваться для генерации документации и тайпингов.
* `options` - не обязательный. Настройки путей.
  * `publishDir` - имя папки для публикации, туда будут записываться скомпилированные файлы
  * `docsDir` - имя папки для документации
  * `tsConfigFilename` - путь до файла с конфигурацией typescript.
  * `componentsGlob` - glob для файлов js компонентов
  * `tsComponentsGlob` - glob для файлов ts компонентов
  * `jsGlob` - glob для всех публикуемых js файлов пакета
  * `tsGlob` - glob для всех публикуемых ts файлов пакета
  * `cssGlob` - glob для всех публикуемых css файлов пакета
  * `cssCopyGlob` - glob для всех копируемых css фалов пакета
  * `resourcesGlob` - glob для всех ресурсных файлов пакета (картинки, шрифты)
  * `publishFilesGlob` - glob для всех дополнительных файлов, которые должны попасть в публикацию

componentPackage
----------------

Плагин для создания package.json из всех файлов. Нужен для упрощения импортов. В случае, если ваша библиотека имеет
структуру типа

```
component-name/
    component-name.js
```

создание `package.json` поможет использовать этот компонент как `require('library-name/component-name')`.

Пример использования:

```js
const componentPackage = require('library-utils/component-package');

gulp.src('file.js')
    .pipe(componentPackage())
    .pipe(gulp.dest('dist');
```

В результате в папке `dist` будет создан файл `package.json`:

```json
{ "main": "file.js", "typings": "file.d.ts" }
```

componentTypings
----------------

Плагин для создания `d.ts` файлов для react компонентов. Внутри использует библиотеку
[react-docgen](https://github.com/reactjs/react-docgen).
Поддерживается генерация только из es6+ кода (не будет работать для уже скомпилированного кода).

Пример использования:

```js
const componentTypings = require('library-utils/component-typings');

gulp.src('file.js')
    .pipe(componentTypings('libraryName'))
    .pipe(gulp.dest('dist');
```

В результате в папке `dist` будет создан файл `file.d.ts`.

```ts
declare module 'libraryName/file' {
    import * as React from 'react';
    export interface FileProps {
        /**
         * Управление видимостью компонента
         */
        visible?: boolean;
    }
    export default class File extends React.Component<LoaderProps, any>{
    }
}
```

Параметры:

- `libraryName` - префикс для названия модулей. В итоговых d.ts файлах имя модуля будет создать из
`libraryName + '/' + filename`.

componentDocs
-------------

Плагин для создания документации для react компонентов.

Пример использования:

```js
const componentDocs = require('library-utils/component-docs');

gulp.src('file.js')
    .pipe(componentDocs('libraryName'))
    .pipe(gulp.dest('docs');
```

В результате в папке `docs` будет создан файл `README.md`, с описанием props и пубичных методов компонента.

libraryDoc
----------

Плагин для создания индексного файла документации.

Пример использования:

```js
const libraryDoc = require('library-utils/library-doc');

gulp.src('src/*.js')
    .pipe(libraryDoc('libraryName'))
    .pipe(gulp.dest('docs');
```

Лицензия
--------

```
The MIT License (MIT)

Copyright (c) 2017 Alfa Laboratory

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
