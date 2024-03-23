import { clearAuthLocal } from './auth'
import {
    signupOrLogin,
    logout,
    shuffleColors,
    selectColor,
    reset,
} from './eventHandlers'

export const addEventListeners = () => {
    document
        .querySelector('.login')!
        .addEventListener('submit', async (e: SubmitEvent) => {
            const rv = await signupOrLogin(e)

            if (rv instanceof Error) {
                clearAuthLocal()
                console.log(rv)
                return
            }

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
