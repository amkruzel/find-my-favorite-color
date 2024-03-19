interface Game {
    eliminatedColors: Uint32Array
    selectedColors: Uint32Array
    color1: color
    color2: color
    favoriteColor?: color
    currentIteration: number
    colorsRemainingCurrentIteration: number
    options: GameOptions
}

interface GameOptions {
    numColors: number
}

type color = number & { __type: color }
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

export function createGame(options: GameOptions): Game {
    const [color1, color2] = _getTwoUniqueColors()

    const game: Game = {
        eliminatedColors: new Uint32Array(0x80000),
        selectedColors: new Uint32Array(0x80000),
        currentIteration: 1,
        colorsRemainingCurrentIteration: 0x1000000,
        color1,
        color2,
        options,
    }

    return game
}

export function selectColor(game: Game, num: 1 | 2) {
    game = _updateSelectedColors(game, num)
    game.colorsRemainingCurrentIteration -= 2
    game = _checkForNewIteration(game)
    return pickTwoColors(game)
}

export function pickTwoColors(game: Game): Game {
    for (let i = 0; i < 2; i++) {
        let num: number

        do {
            num = Math.floor(Math.random() * game.options.numColors)
            assertColor(num)
        } while (_is('eliminated', game, num) || _is('selected', game, num))

        if (i === 0) {
            game.color1 = num
        } else {
            game.color2 = num
        }
    }
    return game
}

export function shuffleColors(game: Game): Game {
    return pickTwoColors(game)
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
    const array: 'eliminatedColors' | 'selectedColors' = `${testingFor}Colors`

    return !!(game[array][index] ?? 0 & bit)
}

function _split(color: number): [index, bit] {
    const [index, bit] = [color >> 5, 2 ** (color & 31)]
    assertIndex(index)
    assertBit(bit)
    return [index, bit]
}

function _do(action: 'select' | 'eliminate', game: Game, color: number): Game {
    const [index, bit] = _split(color)
    const array = action === 'select' ? 'selectedColors' : 'eliminatedColors'

    game[array][index] |= bit

    return game
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

    game = _do('select', game, selectedColor)
    return _do('eliminate', game, rejectedColor)
}

function _checkForNewIteration(game: Game): Game {
    if (game.colorsRemainingCurrentIteration !== 0) {
        return game
    }

    game.currentIteration++
    game.selectedColors = new Uint32Array(game.options.numColors)
    game.colorsRemainingCurrentIteration =
        game.options.numColors / (2 ** game.currentIteration - 1)

    return game
}
