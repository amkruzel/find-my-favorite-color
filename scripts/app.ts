import { Ui } from './ui'
import { Game } from './game'
import { Auth } from './auth'
import { User, guestUser } from './user'
import { Db } from './db'
import { FormConverter } from './formConverter'

export class App {
    private _user: User
    private _game: Game
    private _db: Db

    constructor() {
        this._user = guestUser()
        this._game = new Game()
        this._db = new Db('https://fmfc.alexkruzel.com')
    }

    get user(): User {
        return this._user
    }

    get game() {
        return this._game
    }

    async init(): Promise<void> {
        await this._init()
    }

    private async _init(): Promise<void> {
        try {
            await this.tryLocalLogin()
            await this.loadGame()
        } catch (err) {}
    }

    private async tryLocalLogin(): Promise<void> {
        if (!localStorage.getItem('hasUserSaved')) {
            return
        }

        Ui.updateAuth(localStorage.getItem('email') as string)

        const id = localStorage.getItem('id') as string

        this._user = await this._db.getUser(id)
    }

    async loadGame(): Promise<void> {
        await this._loadGame()
    }

    async _loadGame(): Promise<void> {
        try {
            const game = await this._db.load(this._user.id)

            if (!this.isLoggedIn) {
                return
            }

            this._game = game
        } catch (error) {}
    }

    private async saveGame(): Promise<void> {
        await this._saveGame()
    }

    private async _saveGame(): Promise<void> {
        if (!this.isLoggedIn) {
            return
        }

        try {
            await this._db.save(this._game, this._user.id)
        } catch (err) {}
    }

    private async deleteGame() {
        this._deleteGame()
    }

    private async _deleteGame(): Promise<void> {
        if (!this.isLoggedIn) {
            return
        }

        try {
            await this._db.delete(this._user.id)
        } catch (err) {}
    }

    logoutUser(e: Event) {
        if (e.target instanceof HTMLFormElement) {
            e.target.reset()
        }

        this._user = guestUser()
        Auth.clearLocal()
    }

    get isLoggedIn(): boolean {
        return this._user.id !== 'guest'
    }

    async login(form: HTMLFormElement): Promise<void> {
        this._user = await this._db.login(FormConverter.login(form))
        this.maybeSaveAuthLocally(form)
    }

    async signup(form: HTMLFormElement): Promise<void> {
        this._user = await this._db.signup(FormConverter.signup(form))
        this.maybeSaveAuthLocally(form)
    }

    private maybeSaveAuthLocally(form: HTMLFormElement): void {
        if (Auth.shouldSaveLocal(form)) {
            Auth.saveLocal(this._user)
        } else {
            Auth.clearLocal()
        }
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

    private async gameAction(
        action: 'shuffle' | 'reset' | 'selectColor',
        num?: 1 | 2
    ) {
        switch (action) {
            case 'shuffle':
                this.game.shuffleColors()
                break
            case 'reset':
                this.game.reset()
                await this.deleteGame()
                return
            case 'selectColor':
                if (num) {
                    this._game.selectColor(num)
                }
                break
            default:
                break
        }
        await this.saveGame()
    }
}
