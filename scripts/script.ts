import { App } from './app'
import { Ui } from './ui/ui'

const app = new App()
const ui = new Ui()

ui.add('.login', 'loginSignupForm', 'submit', loginSignupHandler)
ui.add('#logout-btn', 'logoutButton', 'click', logoutHandler)
ui.add('.debug', 'debugButon', 'click', debugHandler)
ui.add('.new-colors', 'shuffleColorsButton', 'click', shuffleHandler)
ui.add('.clear-data', 'resetGameButton', 'click', resetHandler)
ui.add('#color1', 'color1', 'click', selectColor1Handler)
ui.add('#color2', 'color2', 'click', selectColor2Handler)

async function main() {
    await app.init()
    Ui.updateAll(app)
}

main()

async function loginSignupHandler(e: Event) {
    if (!(e instanceof SubmitEvent)) {
        return
    }

    await app.trySignupOrLogin(e)
    await app.loadGame()

    Ui.updateAll(app)
}

async function logoutHandler(e: Event) {
    app.logoutUser(e)
    app.resetGame()
    Ui.updateAll(app)
}

function debugHandler() {
    app.debug()
}

function shuffleHandler() {
    app.shuffleGameColors()
    Ui.updateAll(app)
}

function resetHandler() {
    app.resetGame()
    Ui.updateAll(app)
}

function selectColor1Handler() {
    selectColor(1)
}

function selectColor2Handler() {
    selectColor(2)
}

function selectColor(num: 1 | 2) {
    app.selectGameColor(num)
    Ui.updateAll(app)
}
