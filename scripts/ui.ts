import { clearAuthLocal, saveAuthLocal } from './auth'
import {
    signupOrLogin,
    logout,
    shuffleColors,
    selectColor,
    reset,
} from './eventHandlers'
import { NotifyType, notify } from './notification'

export const addEventListeners = () => {
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

            const rv = await signupOrLogin(form, e.submitter?.dataset.action!)

            if (rv instanceof Error) {
                notify(NotifyType.error, rv.message)
                return
            }

            if (_shouldSaveAuthLocal(form)) {
                saveAuthLocal(rv.id, rv.email)
            } else {
                clearAuthLocal()
            }

            form.reset()
            updateLogin(rv.email)
        })
    document
        .querySelector('#logout-btn')!
        .addEventListener('click', e => logout(e as PointerEvent))
    document
        .querySelector('.new-colors')!
        .addEventListener('click', () => shuffleColors())
    document
        .querySelector('.clear-data')!
        .addEventListener('click', () => reset())
    document
        .querySelector('#color1')!
        .addEventListener('click', () => selectColor(1))
    document
        .querySelector('#color2')!
        .addEventListener('click', () => selectColor(2))
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
