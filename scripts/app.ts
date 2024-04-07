import { addEventListeners, updateGameUi, updateLogin } from './ui'
import { Game } from './game'
import { tryLocalLogin } from './auth'
import { User, guestUser } from './user'
import { Db } from './db'

export interface App {
    user: User
    game: Game
}

const app: App = {
    game: new Game(),
    user: guestUser(),
}

const db = new Db('http', '34.42.14.226', '8090')

addEventListeners(app, db)
tryLocalLogin().then(response => {
    if (response instanceof Error || !response) {
        return
    }

    app.user = response
    console.log('logged in')

    db.load(app).then(() => updateGameUi(app.game))
    updateLogin(response.email)
})

updateGameUi(app.game)
