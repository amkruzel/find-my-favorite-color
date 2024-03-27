export interface Game {
    eliminatedColors: Uint32Array
    selectedColors: Uint32Array
    color1: color
    color2: color
    favoriteColor?: color
    currentIteration: number
    colorsRemainingCurrentIteration: number
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
    const [color1, color2] = _getTwoUniqueColors()

    const game: Game = {
        eliminatedColors: new Uint32Array(0x80000),
        selectedColors: new Uint32Array(0x80000),
        currentIteration: 1,
        colorsRemainingCurrentIteration: 0x1000000,
        color1,
        color2,
    }

    return game
}

export function selectColor(game: Game, num: 1 | 2): void {
    _updateSelectedColors(game, num)
    game.colorsRemainingCurrentIteration -= 2
    _checkForNewIteration(game)
    pickTwoColors(game)
}

export function pickTwoColors(game: Game): void {
    for (let i = 0; i < 2; i++) {
        let num: number

        do {
            num = Math.floor(Math.random() * 0x1000000)
            assertColor(num)
        } while (_is('eliminated', game, num) || _is('selected', game, num))

        if (i === 0) {
            game.color1 = num
        } else {
            game.color2 = num
        }
    }
}

export function reset(game: Game) {
    const [color1, color2] = _getTwoUniqueColors()

    game.eliminatedColors = new Uint32Array(0x80000)
    game.selectedColors = new Uint32Array(0x80000)
    game.currentIteration = 1
    game.colorsRemainingCurrentIteration = 0x1000000
    game.color1 = color1
    game.color2 = color2
}

export function shuffleColors(game: Game): void {
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

function _split(color: number): [index, bit] {
    const [index, bit] = [color >> 5, 2 ** (color & 31)]
    assertIndex(index)
    assertBit(bit)
    return [index, bit]
}

function _do(action: 'select' | 'eliminate', game: Game, color: number): void {
    const [index, bit] = _split(color)
    const array = action === 'select' ? 'selectedColors' : 'eliminatedColors'

    game[array][index] |= bit
}

function _getTwoUniqueColors(): [color, color] {
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

    game.currentIteration++
    game.selectedColors = new Uint32Array(0x80000)
    game.colorsRemainingCurrentIteration =
        0x80000 / (2 ** game.currentIteration - 1)
}
