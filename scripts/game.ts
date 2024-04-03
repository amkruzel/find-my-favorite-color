export interface Game {
    eliminatedColors: Uint32Array
    selectedColors: Uint32Array
    color1: color
    color2: color
    favoriteColor?: color
    currentIteration: number
    colorsRemainingCurrentIteration: number
    _colors: color[]
    _nextIterationColors: color[]
}

export type color = number & { __type: color }
type index = number & { __type: index }
type bit = number & { __type: bit }

function assertColor(value: number): asserts value is color {
    if (parseInt(`${value}`) !== value || value < 0 || value > 0xffffff) {
        throw new Error('Not a color!')
    }
}

function assertIndex(value: number): asserts value is index {
    if (parseInt(`${value}`) !== value || value < 0 || value > 0x80000) {
        throw new Error('Not an index!')
    }
}

function assertBit(value: number): asserts value is bit {
    if (parseInt(`${value}`) !== value || value < 0 || value & (value - 1)) {
        throw new Error('Not a bit!')
    }
}

export function createGame(): Game {
    const _colors = _getAvailableColors()
    const [color1, color2] = _getTwoUniqueColors(_colors)

    const game: Game = {
        eliminatedColors: new Uint32Array(0x80000),
        selectedColors: new Uint32Array(0x80000),
        currentIteration: 1,
        colorsRemainingCurrentIteration: 0x1000000,
        color1,
        color2,
        _colors,
        _nextIterationColors: [],
    }

    return game
}

export function selectColor(game: Game, num: 1 | 2): void {
    _updateSelectedColors(game, num)
    game.colorsRemainingCurrentIteration -= 2
    _checkForNewIteration(game)
    _checkForFavoriteColor(game, num)
    pickTwoColors(game)
}

export function pickTwoColors(game: Game): void {
    if (game._colors.length < 2) {
        return
    }

    game.color1 = game._colors.pop()!
    game.color2 = game._colors.pop()!
}

export function reset(game: Game) {
    const _colors = _getAvailableColors()
    const [color1, color2] = _getTwoUniqueColors(_colors)

    game.eliminatedColors = new Uint32Array(0x80000)
    game.selectedColors = new Uint32Array(0x80000)
    game.currentIteration = 1
    game.colorsRemainingCurrentIteration = 0x1000000
    game.color1 = color1
    game.color2 = color2
    game._colors = _colors
}

export function shuffleColors(game: Game): void {
    game._colors.push(game.color1)
    game._colors.push(game.color2)
    shuffle(game._colors)
    pickTwoColors(game)
}

export function isEliminated(game: Game, color: color): boolean {
    return _is('eliminated', game, color)
}

export function isSelected(game: Game, color: color): boolean {
    return _is('selected', game, color)
}

function _is(
    testingFor: 'eliminated' | 'selected',
    game: Game,
    color: number
): boolean {
    const [index, bit] = _split(color)

    let num: number | undefined
    if (testingFor === 'eliminated') {
        num = game.eliminatedColors[index]
    } else {
        num = game.selectedColors[index]
    }

    if (num === undefined) {
        return false
    }

    return !!(num & bit)
}

export function _split(color: number): [index, bit] {
    const [index, bit] = [color >> 5, 2 ** (color & 31)]
    assertIndex(index)
    assertBit(bit)
    return [index, bit]
}

function _do(action: 'select' | 'eliminate', game: Game, color: number): void {
    const [index, bit] = _split(color)
    const array = action === 'select' ? 'selectedColors' : 'eliminatedColors'

    assertColor(color)

    game._nextIterationColors.push(color)

    game[array][index] |= bit
}

function _getTwoUniqueColors(colors?: color[]): [color, color] {
    if (colors) {
        const color1 = colors.pop()!
        const color2 = colors.pop()!

        return [color1, color2]
    }

    const color1 = Math.floor(Math.random() * 0x1000000)
    let color2 = Math.floor(Math.random() * 0x1000000)

    while (color2 == color1) {
        color2 = Math.floor(Math.random() * 0x1000000)
    }

    assertColor(color1)
    assertColor(color2)

    return [color1, color2]
}

function _updateSelectedColors(game: Game, num: 1 | 2) {
    const selectedColor = num === 1 ? game.color1 : game.color2
    const rejectedColor = num === 1 ? game.color2 : game.color1

    _do('select', game, selectedColor)
    _do('eliminate', game, rejectedColor)
}

function _checkForNewIteration(game: Game): void {
    if (game.colorsRemainingCurrentIteration !== 0) {
        return
    }

    game.colorsRemainingCurrentIteration =
        0x1000000 / 2 ** game.currentIteration
    game.currentIteration++
    game.selectedColors = new Uint32Array(0x80000)
    game._colors = shuffle(game._nextIterationColors)
    game._nextIterationColors = []
}

function _checkForFavoriteColor(game: Game, num: 1 | 2): void {
    if (game.colorsRemainingCurrentIteration !== 1) {
        return
    }

    game.favoriteColor = num === 1 ? game.color1 : game.color2
    game.color2 = game.color1
}

export function _getAvailableColors(): color[] {
    const availColors: color[] = []

    for (let i = 0; i < 0x1000000; i++) {
        availColors.push(i as color)
    }

    return shuffle(availColors)
}

function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--

        // And swap it with the current element.
        ;[array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ] as [T, T]
    }

    return array
}
