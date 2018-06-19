const getMemberValuePath = require('react-docgen/dist/utils/getMemberValuePath').default;
const resolveToValue = require('react-docgen/dist/utils/resolveToValue').default;
const getPropertyName = require('react-docgen/dist/utils/getPropertyName').default;
const parseJsDoc = require('react-docgen/dist/utils/parseJsDoc').default;
const recast = require('recast');

const { types: { namedTypes: types } } = recast;
// component-prop-types-js-doc-handler
function componentPropTypesJsDocHandler(documentation, path) {
    let propTypesPath = getMemberValuePath(path, 'propTypes');

    if (!propTypesPath) {
        return;
    }
    propTypesPath = resolveToValue(propTypesPath);
    if (!propTypesPath || !types.ObjectExpression.check(propTypesPath.node)) {
        return;
    }

    propTypesPath.get('properties').each((propertyPath) => {
        // we only support documentation of actual properties, not spread
        if (types.Property.check(propertyPath.node)) {
            const propName = getPropertyName(propertyPath);
            const propDescriptor = documentation.getPropDescriptor(propName);
            if (!propDescriptor.description || !propDescriptor.type) {
                return;
            }
            const jsDoc = parseJsDoc(propDescriptor.description);
            propDescriptor.description = jsDoc.description || propDescriptor.description;
            propDescriptor.type.params = jsDoc.params || [];
            propDescriptor.type.returns = jsDoc.returns;
        }
    });
}

module.exports = componentPropTypesJsDocHandler;
