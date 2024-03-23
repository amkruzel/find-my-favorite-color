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
        .addEventListener('submit', e => signupOrLogin(e as SubmitEvent))
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
