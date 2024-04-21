import { clearAuthLocal, saveAuthLocal } from './auth'
import { signupOrLogin, logout } from './eventHandlers'
import { NotifyType, notify } from './notification'
import { Game, color } from './game'
import { App } from './app'
import { Db } from './db'
import { guestUser } from './user'

export const addEventListeners = (app: App, db: Db): void => {
    document
        .querySelector('.login')!
        .addEventListener('submit', async (e: SubmitEvent) => {
            const form = e.target

            if (!(form instanceof HTMLFormElement)) {
                notify(
                    NotifyType.error,
                    'Something went wrong - please refresh the page and try again.'
                )
                return
            }

            const user = await signupOrLogin(form, e.submitter?.dataset.action!)

            if (user instanceof Error) {
                notify(NotifyType.error, user.message)
                return
            }

            app.user = user

            if (_shouldSaveAuthLocal(form)) {
                saveAuthLocal(user.id, user.email)
            } else {
                clearAuthLocal()
            }

            form.reset()
            updateLogin(user.email)
        })
    document.querySelector('#logout-btn')!.addEventListener('click', e => {
        logout(e as PointerEvent)
        app.user = guestUser()
    })
    document
        .querySelector('.new-colors')!
        .addEventListener('click', async () => {
            app.game.shuffleColors()
            db.save(app)
            updateGameUi(app.game)
        })
    document
        .querySelector('.clear-data')!
        .addEventListener('click', async () => {
            app.game.reset()
            db.save(app)
            updateGameUi(app.game)
        })
    document.querySelector('#color1')!.addEventListener('click', async () => {
        app.game.selectColor(1)
        db.save(app)
        updateGameUi(app.game)
    })
    document.querySelector('#color2')!.addEventListener('click', async () => {
        app.game.selectColor(2)
        db.save(app)
        updateGameUi(app.game)
    })
    document.querySelector('.debug')!.addEventListener('click', () => {
        console.log(app)
    })
}

export function updateLogin(user: string) {
    document.querySelector('.login')!.classList.add('hidden')
    document.querySelector('#logout-btn')!.classList.remove('hidden')
    document.querySelector('.welcome-user')!.textContent = `Welcome ${user}`
}

function _shouldSaveAuthLocal(form: HTMLFormElement): boolean {
    const stayLoggedInElement = form.elements.namedItem('stayLoggedIn')

    return (
        stayLoggedInElement instanceof HTMLInputElement &&
        stayLoggedInElement.checked
    )
}

export function updateGameUi(game: Game) {
    const currenIter = document.querySelector('.current-iteration')
    if (currenIter instanceof HTMLSpanElement) {
        currenIter.textContent = game.currentIteration.toLocaleString()
    }

    const colorsRemaining = document.querySelector('.colors-remaining-cur-iter')
    if (colorsRemaining instanceof HTMLSpanElement) {
        colorsRemaining.textContent =
            game.colorsRemainingCurrentIteration.toLocaleString()
    }

    const color1 = document.querySelector('#color1')
    const color2 = document.querySelector('#color2')

    if (color1 instanceof HTMLDivElement && color2 instanceof HTMLDivElement) {
        let bgColor1: string, bgColor2: string

        if (game.favoriteColor) {
            bgColor1 = bgColor2 = intToHex(game.favoriteColor)
        } else {
            bgColor1 = intToHex(game.color1)
            bgColor2 = intToHex(game.color2)
        }

        color1.style.backgroundColor = `#${bgColor1}`
        color2.style.backgroundColor = `#${bgColor2}`
    }
}

function intToHex(num: color): string {
    return num.toString(16).padStart(6, '0')
}
