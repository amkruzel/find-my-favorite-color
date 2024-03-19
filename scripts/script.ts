import { App, GameUI } from './app'

import { showSignupForm } from './ui'

const GameUI: GameUI = {
    shuffleColors: () => console.log('shuffle colors handler'),
    reset: () => console.log('reset handler'),
    selectColor: colorNum => console.log(`select color '${colorNum}' handler`),
}

const app: App = {
    login: () => console.log('login handler'),
    logout: () => console.log('logout handler'),
    signup: () => console.log('signup handler'),
    showSignupForm: () => {
        showSignupForm()
        console.log('show signup form handler')
    },
    game: GameUI,
}

document.querySelector('.login')?.addEventListener('submit', () => app.login())
document
    .querySelector('#logout-btn')
    ?.addEventListener('click', () => app.logout())
document
    .querySelector('.signup-form')
    ?.addEventListener('submit', () => app.signup())
document
    .querySelector('.signup-dialog-btn')
    ?.addEventListener('click', () => app.showSignupForm())
document
    .querySelector('.new-colors')
    ?.addEventListener('click', () => app.game.shuffleColors())
document
    .querySelector('.clear-data')
    ?.addEventListener('click', () => app.game.reset())
document
    .querySelector('#color1')
    ?.addEventListener('click', () => app.game.selectColor(1))
document
    .querySelector('#color2')
    ?.addEventListener('click', () => app.game.selectColor(2))
