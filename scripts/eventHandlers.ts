import { tryLogin, trySignup } from './auth'
import { User } from './user'

export async function signupOrLogin(e: SubmitEvent): Promise<User | Error> {
    if (!(e.target instanceof HTMLFormElement)) {
        return Error('Event target not an instance of HTMLFormElement')
    }

    const form = new FormData(e.target)
    const data = {
        method: 'post',
        body: form,
    } as const

    if (e.submitter?.id.includes('login')) {
        return await tryLogin(data)
    }

    const pw = form.get('password') as string | null
    const email = form.get('identity') as string | null
    if (!pw || !email) {
        return Error('Password or email not defined')
    }

    form.append('passwordConfirm', pw)
    form.set('email', email)

    return await trySignup(data)
}

export function logout(e: PointerEvent): void {
    console.log('logoutHandler', e)

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
