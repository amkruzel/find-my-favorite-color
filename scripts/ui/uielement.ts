export class UiElement {
    private _value: Element

    constructor(selector?: string) {
        if (!selector) {
            throw new TypeError('UIElement constructor selector was undefined')
        }

        const val = document.querySelector(selector)

        this.assertType(val)

        this._value = val
    }

    private assertType(el: Element | null): asserts el is Element {
        if (el === null || !(el instanceof Element)) {
            throw new TypeError('Invalid selector.')
        }
    }

    public addEventListener(
        type: string,
        event: EventListenerOrEventListenerObject,
        options?: Object
    ) {
        this._value.addEventListener(type, event, options)
    }
}
