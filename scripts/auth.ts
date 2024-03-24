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

export function saveAuthLocal(userId: string) {
    localStorage.setItem('hasUserSaved', 'true')
    localStorage.setItem('id', userId)
}

export async function tryLocalLogin(): Promise<User | Error> {
    if (!localStorage.getItem('hasUserSaved')) {
        return Error('User ID is not saved locally')
    }

    const id = localStorage.getItem('id') as string

    const response = await fetch(
        `http://34.42.14.226:8090/api/collections/users/records/${id}`
    )

    return await _parseResponse(response)
}

export function clearAuthLocal() {
    localStorage.removeItem('hasUserSaved')
    localStorage.removeItem('id')
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
