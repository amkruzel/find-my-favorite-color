export interface App {
    login: () => void
    logout: () => void
    signup: () => void
    showSignupForm: () => void
    game: GameUI
}

export interface GameUI {
    shuffleColors: () => void
    reset: () => void
    selectColor: (colorNum: 1 | 2) => void
}
