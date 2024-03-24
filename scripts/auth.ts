import { updateLogin } from './ui'
import { User, getUser } from './user'

interface AuthData {
    method: 'post'
    body: FormData
}

export async function tryLogin(data: AuthData): Promise<User | Error> {
    const response = await _fetchUsers('auth-with-password', data)

    return await _parseResponse(response, 'record')
}

export async function trySignup(data: AuthData): Promise<User | Error> {
    const response = await _fetchUsers('records', data)

    return await _parseResponse(response)
}

export async function tryChangePw(data: AuthData): Promise<User | Error> {
    const response = await _fetchUsers('request-password-reset', data)

    console.log(response)

    return await _parseResponse(response)
}

export function saveAuthLocal(userId: string, email: string) {
    localStorage.setItem('hasUserSaved', 'true')
    localStorage.setItem('id', userId)
    localStorage.setItem('email', email)
}

export async function tryLocalLogin(): Promise<User | Error> {
    if (!localStorage.getItem('hasUserSaved')) {
        return Error('User ID is not saved locally')
    }

    updateLogin(localStorage.getItem('email') as string)

    const id = localStorage.getItem('id') as string

    const response = await _fetchUsers(`records/${id}`)

    return await _parseResponse(response)
}

export function clearAuthLocal() {
    localStorage.removeItem('hasUserSaved')
    localStorage.removeItem('id')
    localStorage.removeItem('email')
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

async function _fetchUsers(path: string, data?: AuthData): Promise<Response> {
    return await fetch(
        `http://34.42.14.226:8090/api/collections/users/${path}`,
        data
    )
}
