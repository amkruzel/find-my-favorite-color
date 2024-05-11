import { assertType, isType } from './helper'
import { HtmlElement } from './htmlElement'

export class Button extends HtmlElement<HTMLButtonElement> {
    private element: HTMLButtonElement
    constructor(selector: string) {
        this.init(selector, HTMLButtonElement)
    }

    protected init<T extends HTMLButtonElement>(
        selector: string,
        asdf: {
            new (): T
            prototype: T
        }
    ) {
        const tmp = document.querySelector(selector)

        if (!isType(tmp, asdf)) {
            return
        }

        assertType(tmp, asdf)

        this.element = tmp
    }
}

const b = new Button('.login')
