/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component description.
 */
export default class A extends React.Component {
    static propTypes = {
        optionalArray: PropTypes.array,
        requiredArray: PropTypes.array.isRequired,
        /**
         * Prop documentation
         */
        optionalBool: PropTypes.bool,
        requiredBool: PropTypes.bool.isRequired,
        optionalFunc: PropTypes.func,
        requiredFunc: PropTypes.func.isRequired,
        optionalNumber: PropTypes.number,
        requiredNumber: PropTypes.number.isRequired,
        optionalObject: PropTypes.object,
        requiredObject: PropTypes.object.isRequired,
        optionalString: PropTypes.string,
        requiredString: PropTypes.string.isRequired,
        optionalSymbol: PropTypes.symbol,
        requiredSymbol: PropTypes.symbol.isRequired,
        optionalNode: PropTypes.node,
        requiredNode: PropTypes.node.isRequired,
        optionalElement: PropTypes.element,
        requiredElement: PropTypes.element.isRequired,
        optionalMessage: PropTypes.instanceOf(Message),
        requiredMessage: PropTypes.instanceOf(Message).isRequired,
        optionalEnum: PropTypes.oneOf(['News', 'Photos']),
        requiredEnum: PropTypes.oneOf(['News', 'Photos']).isRequired,
        optionalUnion: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        requiredUnion: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        optionalArrayOf: PropTypes.arrayOf(PropTypes.number),
        requiredArrayOf: PropTypes.arrayOf(PropTypes.number).isRequired,
        optionalObjectOf: PropTypes.objectOf(PropTypes.number),
        requiredObjectOf: PropTypes.objectOf(PropTypes.number).isRequired,
        optionalAny: PropTypes.any,
        requiredAny: PropTypes.any.isRequired,
        optionalObjectWithShape: PropTypes.shape({
            color: PropTypes.string,
            /**
             * Sub prop documentation
             */
            fontSize: PropTypes.number.isRequired,
            /**
             * @param {string} value
             */
            onChange: PropTypes.func,
            subShape: PropTypes.shape({
                /**
                 * Even deeper documentation
                 */
                name: PropTypes.string,
                size: PropTypes.number
            })
        }),
        /**
         * Callback with documentation
         *
         * @param {String} stringParam
         * @param {number} count
         * @param {React.MouseEvent} event
         * @param {React.KeyboardEvent} anotherEvent
         * @param {HTMLDivElement} element some html element
         *
         * @returns {string|number}
         */
        onClick: PropTypes.func,
        onChange: PropTypes.func
    };

    render() {
        return null;
    }

    privateMethod(name) {
    }

    /**
     * Some description.
     *
     * @public
     */
    publicMethod1() {

    }

    /**
     * Maybe we just forgot to add params?
     *
     * @public
     */
    publicMethodWithouParams() {

    }

    /**
     * Some description.
     *
     * @public
     * @param {string} str1 Some description.
     * @param {String} str2 Some description.
     * @param {number} num1 Some description.
     * @param {Number} num2 Some description.
     * @param {Boolean} bool1 Some description.
     * @param {bool} bool2 Some description.
     * @param {boolean} bool3 Some description.
     * @param {string|number} union Some description.
     */
    publicWithParams(str1, str2, num1, num2, bool1, bool2, bool3, union) {
    }
}
