import { User } from './user'

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
