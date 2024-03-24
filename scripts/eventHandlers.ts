import { tryLogin, trySignup, tryChangePw, clearAuthLocal } from './auth'
import { User } from './user'

export async function signupOrLogin(
    formElement: HTMLFormElement,
    action: string
): Promise<User | Error> {
    const form = new FormData(formElement)

    const data = {
        method: 'post',
        body: form,
    } as const

    if (action === 'login') {
        return await tryLogin(data)
    }

    const email = form.get('identity') as string
    form.set('email', email)
    if (action === 'changepw') {
        return await tryChangePw(data)
    }

    const pw = form.get('password') as string | null
    if (!pw || !email) {
        return Error(
            'Something went wrong - please refresh the page and try again.'
        )
    }

    form.append('passwordConfirm', pw)

    return await trySignup(data)
}

export function logout(e: PointerEvent): void {
    console.log('logoutHandler', e)

    if (e.target instanceof HTMLFormElement) {
        e.target.reset()
    }

    clearAuthLocal()

    document.querySelector('.login')!.classList.remove('hidden')
    document.querySelector('#logout-btn')!.classList.add('hidden')
    document.querySelector('.welcome-user')!.textContent = ''
}

export function shuffleColors(): void {
    console.log('shuffleColorsHandler')
}

export function reset(): void {
    console.log('resetHandler')
}

export function selectColor(num: 1 | 2): void {
    console.log('selectColorHandler', num)
}
