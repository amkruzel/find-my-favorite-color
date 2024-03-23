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

export function getUser(obj: {}): User {
    return obj as User
}
