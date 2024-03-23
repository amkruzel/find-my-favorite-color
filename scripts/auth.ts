import { User, getUser } from './user'

interface AuthData {
    method: 'post'
    body: FormData
}

export async function tryLogin(data: AuthData): Promise<User | Error> {
    const response = await fetch(
        `http://34.42.14.226:8090/api/collections/users/auth-with-password`,
        data
    )

    return await _parseResponse(response, 'record')
}

export async function trySignup(data: AuthData): Promise<User | Error> {
    const response = await fetch(
        `http://34.42.14.226:8090/api/collections/users/records`,
        data
    )

    return await _parseResponse(response)
}

export function trySaveAuthLocal(form: FormData) {
    if (form.get('stayLoggedIn') !== 'on') {
        return
    }

    const identity = form.get('identity') as string
    const password = form.get('password') as string

    localStorage.setItem('hasUserSaved', 'true')
    localStorage.setItem('identity', identity)
    localStorage.setItem('password', password)
}

export async function tryLocalLogin() {
    if (!localStorage.getItem('hasUserSaved')) {
        return
    }

    const id = localStorage.getItem('identity') as string
    const pw = localStorage.getItem('password') as string

    const form = new FormData()
    form.append('identity', id)
    form.append('password', pw)

    const data = {
        method: 'post',
        body: form,
    } as const

    return await tryLogin(data)
}

export function clearAuthLocal() {
    localStorage.removeItem('hasUserSaved')
    localStorage.removeItem('identity')
    localStorage.removeItem('password')
}

async function _parseResponse(
    response: Response,
    propName?: string
): Promise<User | Error> {
    const json = await response.json()

    if (response.status != 200) {
        return Error(json.message)
    }

    return getUser(propName ? json[propName] : json)
}
