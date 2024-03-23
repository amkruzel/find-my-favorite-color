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
