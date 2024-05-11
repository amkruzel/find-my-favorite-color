import { Ui } from './ui/ui'
import { Game } from './game'
import { Auth, tryLocalLogin } from './auth'
import { User, guestUser } from './user'
import { Db } from './db'
import { NotifyType, notify } from './notification'

function assertType<T>(
    elem: any,
    cls: new (...a: any) => T
): asserts elem is T {
    if (!(elem instanceof cls)) {
        notify(
            NotifyType.error,
            'Something went wrong - please refresh the page and try again.'
        )
        throw new TypeError('Element is not an instance of ' + cls)
    }
}

function getAndAssertType<T>(selector: string, cls: new (...a: any) => T): T {
    const elem = document.querySelector(selector)
    assertType(elem, cls)
    return elem
}

function getButton(selector: string): HTMLButtonElement {
    return getAndAssertType(selector, HTMLButtonElement)
}

export class App {
    private _user: User
    private _game: Game
    private db: Db

    constructor() {
        this._user = guestUser()
        this._game = new Game()
        this.db = new Db('http', '34.42.14.226', '8090')
    }

    async init() {
        const user = await tryLocalLogin()

        if (user instanceof Error || !user) {
            Ui.updateGame(this.game)
            return
        }

        this._user = user

        await this.loadGame()
    }

    get user(): User {
        return this._user
    }

    get game() {
        return this._game
    }

    set game(game: Game) {
        this._game = game
    }

    async loadGame(): Promise<boolean> {
        if (!this.isLoggedIn()) {
            return false
        }

        const game = await this.db.load(this._user.id)

        if (game instanceof Error) {
            notify(NotifyType.error, game.message)
            return false
        }

        this._game = game
        return true
    }

    async saveGame(): Promise<boolean> {
        if (!this.isLoggedIn()) {
            return false
        }

        await this.db.save(this._game, this._user.id)
        return true
    }

    logoutUser(e: Event) {
        if (e.target instanceof HTMLFormElement) {
            e.target.reset()
        }

        this._user = guestUser()
        Auth.clearLocal()
    }

    private set user(user: User) {
        this._user = user
    }

    private isLoggedIn() {
        return this._user.id !== 'guest'
    }

    async trySignupOrLogin(e: SubmitEvent) {
        const form = e.target
        assertType(form, HTMLFormElement)

        console.log(this)

        const user = await this.db.try(e.submitter?.dataset.action!, form)

        if (user instanceof Error) {
            notify(NotifyType.error, user.message)
            return
        }

        this._user = user

        if (Auth.shouldSaveLocal(form)) {
            Auth.saveLocal(user)
        } else {
            Auth.clearLocal()
        }

        form.reset()
        return user
    }

    debug() {
        console.log(this)
    }

    shuffleGameColors() {
        this.gameAction('shuffle')
    }

    resetGame() {
        this.gameAction('reset')
    }

    selectGameColor(num: 1 | 2) {
        this.gameAction('selectColor', num)
    }

    private gameAction(
        action: 'shuffle' | 'reset' | 'selectColor',
        num?: 1 | 2
    ) {
        switch (action) {
            case 'shuffle':
                this.game.shuffleColors()
                break
            case 'reset':
                this.game.reset()
                break
            case 'selectColor':
                if (num) {
                    this._game.selectColor(num)
                }
                break
            default:
                break
        }
        this.db.save(this._game, this._user.id)
    }
}
