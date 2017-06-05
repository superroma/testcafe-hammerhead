const DEFINED_PROPERTIES_COUNT = 10000;

export class NodeListPropertiesDecorator {
    constructor () {
        var defineProperty = function (index, isEnumerable) {
            Object.defineProperty(this, index, {
                enumerable:   isEnumerable,
                configurable: true,
                get:          function () {
                    this._refreshNodeList();

                    return this._filteredNodeList[index];
                }
            });
        };

        for (var i = 0; i < DEFINED_PROPERTIES_COUNT; i++)
            defineProperty.call(this, i, false);

        Object.defineProperty(this, '_defineProperty', { value: defineProperty });
        Object.defineProperty(this, '_refreshNodeList', {
            value: () => {
                throw new Error('Not implemented');
            }
        });
    }
}

NodeListPropertiesDecorator.prototype = NodeList.prototype;

export const NODE_LIST_PROPERTIES_DECORATOR = new NodeListPropertiesDecorator();

NodeListPropertiesDecorator.prototype = HTMLCollection.prototype;

export const HTML_COLLECTION_PROPERTIES_DECORATOR = new NodeListPropertiesDecorator();
