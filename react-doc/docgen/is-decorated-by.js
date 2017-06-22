function isDecoratedBy(path, decoratorName = 'cn') {
    const decorators = path.get('decorators');
    if (decorators && decorators.value) {
        return decorators.value
            .some(decorator => decorator.expression.callee && decorator.expression.callee.name === decoratorName);
    }
    return false;
}

module.exports = isDecoratedBy;
