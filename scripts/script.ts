import { App } from './app'
import { NotifyType, notify } from './notification'
import { Ui } from './ui'

/**
 * Event handlers
 */
const uiElements = [
    {
        selector: '.auth-popup-button',
        handler: loginSigupModalHandler,
    },
    {
        selector: '.login',
        handler: loginSignupHandler,
        action: 'submit',
    },
    {
        selector: '.logout-button',
        handler: logoutHandler,
    },
    {
        selector: '.close-modal',
        handler: closeModalHandler,
    },
    {
        selector: '.debug',
        handler: debugHandler,
    },
    {
        selector: '.new-colors',
        handler: shuffleHandler,
    },
    {
        selector: '.clear-data',
        handler: resetHandler,
    },
    {
        selector: '#color1',
        handler: selectColor1Handler,
    },
    {
        selector: '#color2',
        handler: selectColor2Handler,
    },
]

const app = new App()

async function main() {
    for (let elem of uiElements) {
        document
            .querySelector(elem.selector)
            ?.addEventListener(elem.action ?? 'click', elem.handler)
    }

    Ui.showLoadingMessage()

    await app.init()

    Ui.hideLoadingMessage()
    Ui.updateAll(app)
}

main()

function closeModalHandler(e: Event) {
    const modal = document.querySelector(
        '.auth-form-container'
    ) as HTMLDialogElement
    logoutHandler(e)
    modal.close()
}

function loginSigupModalHandler() {
    const modal = document.querySelector(
        '.auth-form-container'
    ) as HTMLDialogElement
    modal.showModal()
}

async function loginSignupHandler(e: Event) {
    const form = e.target

    if (!(e instanceof SubmitEvent) || !(form instanceof HTMLFormElement)) {
        return
    }

    const action = e.submitter?.dataset.action

    try {
        if (action === 'login') {
            await app.login(form)
        } else if (action === 'signup') {
            await app.signup(form)
        }

        ;(
            document.querySelector('.auth-form-container') as HTMLDialogElement
        ).close()

        form.reset()

        Ui.showLoadingMessage()
        Ui.updateAuth(app.user)

        await app.loadGame()
        Ui.hideLoadingMessage()
        Ui.updateGame(app.game)
    } catch (error) {
        const message =
            error.name === 'DbError'
                ? error.message
                : 'Something went wrong - please refresh the page and try again.'

        notify(NotifyType.error, message)
    }
}

async function logoutHandler(e: Event) {
    app.logoutUser(e)
    Ui.hideLoadingMessage()
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
