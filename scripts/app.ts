import { addEventListeners, updateLogin } from './ui'
import { Game } from './game'
import { tryLocalLogin } from './auth'
import { User } from './user'

export interface App {
    user?: User
    game?: Game
}

const app: App = {}

addEventListeners()
tryLocalLogin().then(response => {
    if (response instanceof Error || !response) {
        return
    }

    updateLogin(response.email)
})
