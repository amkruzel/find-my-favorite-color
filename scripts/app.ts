import { updateGameUi, updateLogin } from './ui'
import { Game } from './game'
import { clearAuthLocal, saveAuthLocal, tryLocalLogin } from './auth'
import { User, guestUser } from './user'
import { Db } from './db'
import { NotifyType, notify } from './notification'
import { logout, signupOrLogin } from './eventHandlers'

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

    private static isInternal: boolean = false

    constructor() {
        if (!App.isInternal) {
            throw new TypeError('App is not constructable.')
        }
        this._user = guestUser()
        this._game = new Game()
        this.db = new Db('http', '34.42.14.226', '8090')

        App.isInternal = false
    }

    static start() {
        App.isInternal = true
        const app = new App()
        app.addEventListeners()
        tryLocalLogin().then(response => {
            if (response instanceof Error || !response) {
                updateGameUi(app.game)
                return
            }

            app._user = response
            app.db.load(app).then(() => updateGameUi(app.game))
            updateLogin(response.email)
        })
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

    private addEventListeners() {
        this.addAuthEventListeners()
        this.addGameEventListeners()
    }

    private addAuthEventListeners() {
        this.addLoginEventListener()
        this.addLogoutEventListener()
    }

    private addLoginEventListener() {
        function _shouldSaveAuthLocal(form: HTMLFormElement): boolean {
            const stayLoggedInElement = form.elements.namedItem('stayLoggedIn')

            return (
                stayLoggedInElement instanceof HTMLInputElement &&
                stayLoggedInElement.checked
            )
        }

        getAndAssertType('.login', HTMLFormElement).onsubmit = async (
            e: SubmitEvent
        ) => {
            const form = e.target
            assertType(form, HTMLFormElement)

            const user = await signupOrLogin(form, e.submitter?.dataset.action!)

            if (user instanceof Error) {
                notify(NotifyType.error, user.message)
                return
            }

            this._user = user

            if (_shouldSaveAuthLocal(form)) {
                saveAuthLocal(user.id, user.email)
            } else {
                clearAuthLocal()
            }

            form.reset()
            updateLogin(user.email)
        }
    }

    private addLogoutEventListener() {
        getAndAssertType('#logout-btn', HTMLInputElement).onclick = e => {
            logout(e as PointerEvent)
            this._user = guestUser()
        }
    }

    private addGameEventListeners() {
        this.addShuffleEventListener()
        this.addClearEventListener()
        this.addColorEventListener()
    }

    private addShuffleEventListener() {
        getButton('.new-colors').onclick = async () => {
            this.game.shuffleColors()
            this.saveGameAndUpdate()
        }
    }
    private addClearEventListener() {
        getButton('.clear-data').onclick = async () => {
            this.game.reset()
            this.saveGameAndUpdate()
        }
    }

    private addColorEventListener() {
        const clickColor = async (num: 1 | 2) => {
            this.game.selectColor(num)
            this.saveGameAndUpdate()
        }

        getAndAssertType('#color1', HTMLDivElement).onclick = async () =>
            await clickColor(1)
        getAndAssertType('#color2', HTMLDivElement).onclick = async () =>
            await clickColor(2)
    }

    private saveGameAndUpdate() {
        this.db.save(this)
        updateGameUi(this.game)
    }
}

App.start()
