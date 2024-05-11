import { Game } from 'scripts/game'
import { UiElement } from './uielement'
import { User } from 'scripts/user'
import { App } from 'scripts/app'

export class Ui {
    private elements: Map<string, UiElement>

    constructor(elems?: string[], names?: string[]) {
        this.elements = new Map()

        if (!elems) {
            return
        }

        if (!names) {
            names = elems
        }

        for (let i = 0; i < elems.length; i++) {
            const selector = elems[i]
            const name = names[i]

            if (!selector || !name) {
                return
            }

            if (!this.add(selector, name)) {
                return
            }
        }
    }

    /**
     * Attempts to add an element to the Ui. If there is already a value with
     * the given name, it is not overwritten (the new element is not added).
     * @param elem
     * @returns true if the element is added
     */
    add(
        descriptor: string,
        name: string = descriptor,
        event?: string,
        handler?: EventListenerOrEventListenerObject
    ): boolean {
        if (this.elements.has(name)) {
            return false
        }

        this.elements.set(name, new UiElement(descriptor))

        if (event && handler) {
            this.get(name)?.addEventListener(event, handler)
        }

        return true
    }

    get(name: string) {
        return this.elements.get(name)
    }

    static updateAll(app: App) {
        Ui.updateAuth(app.user)
        Ui.updateGame(app.game)
    }

    static updateAuth(user: User | string) {
        const name = typeof user === 'string' ? user : user.email

        const loginClasses = document.querySelector('.login')!.classList
        const logoutClasses = document.querySelector('#logout-btn')!.classList
        const welcomeContainerClasses =
            document.querySelector('.welcome-container')!.classList
        const welcomeMessage = document.querySelector('.welcome-user')!

        if (!name) {
            loginClasses.remove('hidden')
            logoutClasses.add('hidden')
            welcomeContainerClasses.add('hidden')
            welcomeMessage.textContent = ''

            return
        }

        loginClasses.add('hidden')
        logoutClasses.remove('hidden')
        welcomeContainerClasses.remove('hidden')
        welcomeMessage.textContent = `Welcome, ${name}`
    }

    static updateGame(game: Game) {
        Ui.tryUpdateCurIter(game)
        Ui.tryUpdateColorsRemaining(game)
        Ui.tryUpdateColors(game)
    }

    private static tryUpdateCurIter(game: Game) {
        const currenIter = document.querySelector('.current-iteration')
        if (currenIter instanceof HTMLSpanElement) {
            currenIter.textContent = game.currentIteration.toLocaleString()
        }
    }

    private static tryUpdateColorsRemaining(game: Game) {
        const colorsRemaining = document.querySelector(
            '.colors-remaining-cur-iter'
        )
        if (colorsRemaining instanceof HTMLSpanElement) {
            colorsRemaining.textContent =
                game.colorsRemainingCurrentIteration.toLocaleString()
        }
    }

    private static tryUpdateColors(game: Game) {
        const color1 = document.querySelector('#color1')
        const color2 = document.querySelector('#color2')

        const colorsExist =
            color1 instanceof HTMLDivElement && color2 instanceof HTMLDivElement

        if (!colorsExist) {
            return
        }

        let bgColor1: string, bgColor2: string

        if (game.favoriteColor) {
            bgColor1 = bgColor2 = Ui.intToHex(game.favoriteColor)
        } else {
            bgColor1 = Ui.intToHex(game.color1)
            bgColor2 = Ui.intToHex(game.color2)
        }

        color1.style.backgroundColor = `#${bgColor1}`
        color2.style.backgroundColor = `#${bgColor2}`
    }

    private static intToHex(num: number) {
        return num.toString(16).padStart(6, '0')
    }
}
