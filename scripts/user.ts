export interface User {
    avatar?: string
    collectionId: string
    collectionName: string
    created: Date
    email: string
    emailVisibility: boolean
    id: string
    name?: string
    updated: Date
    username?: string
    verified: string
}

export function userFrom(obj: {}): User {
    return obj as User
}

export function guestUser(): User {
    return userFrom({
        id: 'guest',
        email: 'guest',
    })
}
