import { FormConverter } from './formConverter'
import { GameProps, Game } from './game'
import { User, userFrom } from './user'

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

class DbError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'DbError'
    }
}

export class Db {
    private _path: string
    private _pendingSave: boolean

    constructor(path: string) {
        this._path = path
        this._pendingSave = false
    }

    /**
     * required fields are:
     * - email
     * - password
     * - passwordConfirm
     */
    async signup(f: FormData): Promise<User> {
        return await this.try('signup', f)
    }

    /**
     * required fields are:
     * - identity
     * - password
     */
    async login(f: FormData): Promise<User> {
        return await this.try('login', f)
    }

    async getUser(id: string): Promise<User> {
        const res = await this._getUser(`records/${id}`)

        return await this._parseUserResponse(res)
    }

    private async try(
        action: 'login' | 'signup' | 'changepw',
        form: FormData
    ): Promise<User> {
        const data = {
            method: 'post',
            body: form,
        } as const

        switch (action) {
            case 'login':
                return await this.tryLogin(data)
            case 'signup':
                return await this.trySignup(data)
            case 'changepw':
                return await this.tryChangePw(data)
            default:
                throw new Error(`'action' was not an expected value`)
        }
    }

    private async tryLogin(data: AuthData): Promise<User> {
        try {
            const response = await this._getUser('auth-with-password', data)
            return await this._parseUserResponse(response, 'record')
        } catch (err) {
            throw new DbError(
                'Unable to login; email or password is incorrect.',
                { cause: err }
            )
        }
    }

    private async trySignup(data: AuthData): Promise<User> {
        try {
            const response = await this._getUser('records', data)
            return await this._parseUserResponse(response)
        } catch (err) {
            throw new DbError('Unable to sign-up; user might already exist.', {
                cause: err,
            })
        }
    }

    private async tryChangePw(data: AuthData): Promise<User> {
        throw new Error("Method 'tryChangePw' is not implemented!")
    }

    private async _getUser(path: string, data?: AuthData): Promise<Response> {
        return await fetch(`${this.path.users}/${path}`, data)
    }

    private async _parseUserResponse(
        response: Response,
        propName?: string
    ): Promise<User> {
        const json = await response.json()

        if (!response.ok) {
            throw new Error(json?.message, {
                cause: json,
            })
        }

        return userFrom(propName ? json[propName] : json)
    }

    async save(game: Game, userId: string): Promise<void> {
        if (this.cannotSaveNow(userId)) {
            return
        }

        this._pendingSave = true

        const prevGame = await this._getGameIfOneExists(userId)
        await this._createOrUpdate(game, userId, prevGame?.id)

        this._pendingSave = false
    }

    private cannotSaveNow(userId: string) {
        return userId === 'guest' || this._pendingSave
    }

    async load(userId: string): Promise<Game> {
        const game = await this._getGameIfOneExists(userId)

        if (!game) {
            return new Game()
        }

        const [eliminated, selected, colors] = await this._getFiles(game)

        return new Game(
            {
                eliminated,
                selected,
                colors,
            },
            game.properties
        )
    }

    async delete(userId: string): Promise<void> {
        const game = await this._getGameIfOneExists(userId)

        if (!game) {
            return
        }

        await this._delete(game.id)
    }

    protected async _getGameIfOneExists(
        userId: string
    ): Promise<GameData | null> {
        const response = await fetch(
            `${this.path.games}/records?filter=(user='${userId}')`
        )

        const json = await response.json()

        if (json.totalItems === 0) {
            return null
        }

        if (!response.ok) {
            throw new DbError(json?.message, {
                cause: { code: json?.code, data: json?.data },
            })
        }

        if (json.totalItems !== 1) {
            throw new DbError('User has more than one game saved.')
        }

        const game: GameData = json.items[0]

        return {
            id: game.id,
            user: game.user,
            properties: game.properties,
            eliminatedColors: game.eliminatedColors,
            selectedColors: game.selectedColors,
            colors: game.colors,
        } as const
    }

    private async _createOrUpdate(
        game: Game,
        userId: string,
        gameId?: string
    ): Promise<void> {
        const form = FormConverter.game(game, userId)

        if (gameId) {
            await this._patch(form, gameId)
        } else {
            await this._post(form)
        }
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

    private async _delete(id: string): Promise<Response> {
        return fetch(`${this.path.games}/records/${id}`, { method: 'DELETE' })
    }

    protected async _getFiles(game: GameData) {
        return Promise.all([
            this._getFile(game.id, game.eliminatedColors),
            this._getFile(game.id, game.selectedColors),
            this._getFile(game.id, game.colors),
        ])
    }

    private async _getFile(
        gameId: string,
        filename: string
    ): Promise<ArrayBuffer> {
        const res = await fetch(`${this.path.files}/${gameId}/${filename}`)

        if (!res.ok) {
            throw new DbError(`File ${filename} was unable to be retrieved.`, {
                cause: await res.json(),
            })
        }

        return await res.arrayBuffer()
    }

    private get path() {
        return {
            games: this._path + '/api/collections/games',
            files: this._path + '/api/files/games',
            users: this._path + '/api/collections/users',
        }
    }
}
