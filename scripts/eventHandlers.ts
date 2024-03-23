export function login(e: SubmitEvent): void {
    console.log('loginHandler', e)
}

export function logout(e: PointerEvent): void {
    console.log('logoutHandler', e)
}

export function shuffleColors(): void {
    console.log('shuffleColorsHandler')
}

export function reset(): void {
    console.log('resetHandler')
}

export function selectColor(num: 1 | 2): void {
    console.log('shuffleColorHandler', num)
}
