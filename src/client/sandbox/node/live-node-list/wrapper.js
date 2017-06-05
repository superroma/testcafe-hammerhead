import { isShadowUIElement } from '../../../utils/dom';

const arrayFilter = Array.prototype.filter;

export default class LiveNodeListWrapper {
    constructor (nodeList, domContentLoadedEventRaised, tagName) {
        Object.defineProperty(this, 'item', {
            enumerable: true,
            value:      index => {
                this._refreshNodeList();

                return this._filteredNodeList[index];
            }
        });
        Object.defineProperty(this, 'length', {
            enumerable: true,
            get:        () => {
                this._refreshNodeList();

                return this._filteredNodeList.length;
            }
        });
        Object.defineProperty(this, '_nodeList', { value: nodeList });
        Object.defineProperty(this, '_filteredNodeList', { writable: true });
        Object.defineProperty(this, '_isDirty', { writable: true, value: true });
        Object.defineProperty(this, '_domContentLoadedEventRaised', {
            writable: true,
            value:    domContentLoadedEventRaised
        });
        Object.defineProperty(this, '_tagName', { value: tagName.toLowerCase() });

        if (this.namedItem) {
            Object.defineProperty(this, 'namedItem', {
                enumerable: true,
                value:      (...args) => {
                    var findNamedItem = this._nodeList.namedItem.apply(this._nodeList, args);

                    return findNamedItem && isShadowUIElement(findNamedItem) ? null : findNamedItem;
                }
            });
        }

        Object.defineProperty(this, '_refreshNodeListInternal', {
            value: () => {
                this._filteredNodeList = arrayFilter.call(this._nodeList, element => !isShadowUIElement(element));
            },

            configurable: true // Only for tests
        });
        Object.defineProperty(this, '_refreshNodeList', {
            value: () => {
                if (!this._domContentLoadedEventRaised)
                    this._refreshNodeListInternal();
                else if (this._isDirty) {
                    this._refreshNodeListInternal();
                    this._isDirty = false;
                }
            }
        });

        this._refreshNodeList();

        for (var i = 0; i < this._filteredNodeList.length; i++)
            this._defineProperty(i, true);
    }
}

