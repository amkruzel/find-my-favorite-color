import { Game } from 'scripts/game'
import { User } from 'scripts/user'
import { App } from 'scripts/app'

export class Ui {
    static updateAll(app: App) {
        Ui.updateAuth(app.user)
        Ui.updateGame(app.game)
    }

    static showLoadingMessage() {
        Ui.appLoadingMessage('Loading...')

        const game = {
            currentIteration: '...',
            colorsRemainingCurrentIteration: '...',
            color1: 4095,
            color2: 4095,
        } as unknown as Game

        Ui.updateGame(game)
    }

    static hideLoadingMessage() {
        Ui.appLoadingMessage()
    }

    private static appLoadingMessage(text?: string) {
        const message = document.querySelector('.game-loading-message')

        if (message instanceof HTMLDivElement) {
            message.textContent = text ?? ''
        }
    }

    static updateAuth(user: User | string) {
        const name = typeof user === 'object' ? user.email : user
        const isLoggedIn = name !== 'guest'

        const loginClasses = document.querySelector('.login')!.classList
        const logoutClasses =
            document.querySelector('.logout-button')!.classList
        const welcomeMessage = document.querySelector('.welcome-user')!

        const signupLoginPopupButtonClasses =
            document.querySelector('.auth-popup-button')!.classList

        if (isLoggedIn) {
            loginClasses.add('hidden')
            signupLoginPopupButtonClasses.add('hidden')
            logoutClasses.remove('hidden')
            welcomeMessage.textContent = `Welcome, ${name}`
        } else {
            loginClasses.remove('hidden')
            signupLoginPopupButtonClasses.remove('hidden')
            logoutClasses.add('hidden')
            welcomeMessage.textContent = ''
        }
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
