import { Ui } from './ui/ui'
import { User, getUser } from './user'

export class Auth {
    static saveLocal(user: User) {
        localStorage.setItem('hasUserSaved', 'true')
        localStorage.setItem('id', user.id)
        localStorage.setItem('email', user.email)
    }

    static clearLocal() {
        localStorage.removeItem('hasUserSaved')
        localStorage.removeItem('id')
        localStorage.removeItem('email')
    }

    static shouldSaveLocal(form: HTMLFormElement) {
        const stayLoggedInElement = form.elements.namedItem('stayLoggedIn')

        return (
            stayLoggedInElement instanceof HTMLInputElement &&
            stayLoggedInElement.checked
        )
    }
}

interface AuthData {
    method: 'post'
    body: FormData
}

export async function tryLocalLogin(): Promise<User | Error> {
    if (!localStorage.getItem('hasUserSaved')) {
        return Error('User ID is not saved locally')
    }

    Ui.updateAuth(localStorage.getItem('email') as string)

    const id = localStorage.getItem('id') as string

    const response = await _fetchUsers(`records/${id}`)

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

async function _fetchUsers(path: string, data?: AuthData): Promise<Response> {
    return await fetch(
        `http://34.42.14.226:8090/api/collections/users/${path}`,
        data
    )
}
