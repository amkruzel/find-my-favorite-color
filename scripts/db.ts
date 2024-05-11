import { App } from './app'
import { GameProps, Game } from './game'
import { User, getUser } from './user'

interface GameData {
    id: string
    user: string
    properties: GameProps
    eliminatedColors: string
    selectedColors: string
    colors: string
}

interface AuthData {
    method: 'post'
    body: FormData
}

export class Db {
    private _path: string
    private _pendingSave: boolean

    constructor(protocol: string, ip: string, port: string) {
        this._path = `${protocol}://${ip}:${port}`
        this._pendingSave = false
    }

    async try(action: string, formElement: HTMLFormElement) {
        const form = new FormData(formElement)

        const data = {
            method: 'post',
            body: form,
        } as const

        if (action === 'login') {
            return await this.tryLogin(data)
        }

        const email = form.get('identity') as string
        form.set('email', email)
        if (action === 'changepw') {
            return await this.tryChangePw(data)
        }

        const pw = form.get('password') as string | null
        if (!pw || !email) {
            return Error(
                'Something went wrong - please refresh the page and try again.'
            )
        }

        form.append('passwordConfirm', pw)

        return await this.trySignup(data)
    }

    async tryLogin(data: AuthData): Promise<User | Error> {
        const response = await this._fetchUsers('auth-with-password', data)

        return await this._parseResponse(response, 'record')
    }

    private async trySignup(data: AuthData): Promise<User | Error> {
        const response = await this._fetchUsers('records', data)

        return await this._parseResponse(response)
    }

    private async tryChangePw(data: AuthData): Promise<Error> {
        return new Error("Method 'tryChangePw' is not implemented!")
    }

    async save(game: Game, userId: string): Promise<boolean> {
        if (userId === 'guest') {
            return false
        }

        if (this._pendingSave) {
            return false
        }

        this._pendingSave = true

        const prevGame = await this._getGameIfOneExists(userId)

        const rv = await this._createOrUpdate(game, userId, prevGame?.id)

        this._pendingSave = false

        return rv
    }

    async load(userId: string): Promise<Game | Error> {
        const game = await this._getGameIfOneExists(userId)

        if (!game) {
            return new Error(`User ID '${userId}' does not have a game saved.`)
        }

        const [eliminated, selected, colors] = await this._getFiles(game)

        if (!eliminated || !selected || !colors) {
            return new Error('Error loading game.')
        }

        return new Game(
            {
                eliminated,
                selected,
                colors,
            },
            game.properties
        )
    }

    private get path() {
        return {
            games: this._path + '/api/collections/games',
            files: this._path + '/api/files/games',
            users: this._path + '/api/collections/users',
        }
    }

    private async _createOrUpdate(
        game: Game,
        userId: string,
        gameId?: string
    ): Promise<boolean> {
        const form = this._buildForm(game, userId)

        let response: Response

        if (gameId) {
            response = await this._patch(form, gameId)
        } else {
            response = await this._post(form)
        }
        return true
    }

    private _buildForm(game: Game, userId: string): FormData {
        const elimColorBlob = game.eliminatedColors.blob
        const selectColorBlob = game.selectedColors.blob
        const colorsBlob = new Blob([game.next1000Colors])

        const form = new FormData()

        form.set('eliminatedColors', elimColorBlob)
        form.set('selectedColors', selectColorBlob)
        form.set('colors', colorsBlob)
        form.set('properties', JSON.stringify(game.properties))
        form.set('user', userId)

        return form
    }

    private async _post(form: FormData): Promise<Response> {
        const data = {
            method: 'POST',
            body: form,
        }

        return fetch(`${this.path.games}/records`, data)
    }

    private async _patch(form: FormData, id: string): Promise<Response> {
        const data = {
            method: 'PATCH',
            body: form,
        }

        return fetch(`${this.path.games}/records/${id}`, data)
    }

    private async _getFiles(game: GameData) {
        return Promise.all([
            this._getFile(game.id, game.eliminatedColors),
            this._getFile(game.id, game.selectedColors),
            this._getFile(game.id, game.colors),
        ])
    }

    private async _getFile(
        gameId: string,
        filename: string
    ): Promise<ArrayBuffer | null> {
        try {
            const res = await fetch(`${this.path.files}/${gameId}/${filename}`)
            if (!res.ok) {
                return null
            }

            return await res.arrayBuffer()
        } catch (error) {
            return null
        }
    }

    private async _getGameIfOneExists(
        userId: string
    ): Promise<GameData | null> {
        try {
            const response = await fetch(
                `${this.path.games}/records?filter=(user='${userId}')`
            )

            if (!response.ok) {
                return null
            }

            const json = await response.json()

            if (json.totalItems != 1) {
                return null
            }

            const game = json.items[0]

            return {
                id: game.id,
                user: game.user,
                properties: game.properties,
                eliminatedColors: game.eliminatedColors,
                selectedColors: game.selectedColors,
                colors: game.colors,
            }
        } catch (error) {
            console.log(error)

            return null
        }
    }

    private async _fetchUsers(
        path: string,
        data?: AuthData
    ): Promise<Response> {
        return await fetch(`${this.path.users}/${path}`, data)
    }

    private async _parseResponse(
        response: Response,
        propName?: string
    ): Promise<User | Error> {
        const json = await response.json()

        if (response.status != 200) {
            return Error(json.message)
        }

        return getUser(propName ? json[propName] : json)
    }
}
