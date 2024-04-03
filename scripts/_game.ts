const MAX_COLORS = 0x1000000

export type color = number & { __type: color }
type index = number & { __type: index }
type bit = number & { __type: bit }
type colorsAry = [color, color, ...color[]]

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

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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

export class _Game {
    eliminatedColors: Uint32Array
    selectedColors: Uint32Array
    private _favoriteColorFound: boolean
    private _currentIteration: number
    private _colorsRemainingCurrentIteration: number
    private _colors: colorsAry
    private _nextIterationColors: color[]

    constructor() {
        this._init()
    }

    public get color1() {
        return this._colors[this._colors.length - 1] as color
    }

    public get color2() {
        return this._colors[this._colors.length - 2] as color
    }

    public get currentIteration() {
        return this._currentIteration
    }

    public get colorsRemainingCurrentIteration() {
        return this._colorsRemainingCurrentIteration
    }

    public get favoriteColor(): color | null {
        return this._favoriteColorFound ? this.color1 : null
    }

    selectColor(num: 1 | 2) {
        this._updateSelectedColors(num)
        this._colorsRemainingCurrentIteration -= 2
        this._checkForNewIteration()
        this._checkForFavoriteColor()
    }

    reset() {
        this._init()
    }

    shuffleColors() {
        shuffle(this._colors)
    }

    isEliminated(color: color) {
        return this._is(color, 'eliminated')
    }

    isSelected(color: color) {
        return this._is(color, 'selected')
    }

    private _init() {
        const initColors = (): void => {
            this._colors = [0, 1] as [color, color]

            for (let i = 2; i < 0x1000000; i++) {
                this._colors.push(i as color)
            }

            shuffle(this._colors)
        }

        this.eliminatedColors = new Uint32Array(0x80000)
        this.selectedColors = new Uint32Array(0x80000)
        this._currentIteration = 1
        this._colorsRemainingCurrentIteration = MAX_COLORS
        this._favoriteColorFound = false
        this._nextIterationColors = []

        initColors()
    }

    private _updateSelectedColors(num: 1 | 2): void {
        const _do = (action: 'select' | 'eliminate', color: color): void => {
            const [index, bit] = this._split(color)
            const array =
                action === 'select' ? 'selectedColors' : 'eliminatedColors'

            assertColor(color)
            if (action === 'select') {
                this._nextIterationColors.push(this._colors.pop()!)
            } else {
                this._colors.pop()
            }
            this[array][index] |= bit
        }

        const selectAndEliminateColors = (select: color, elim: color): void => {
            _do('select', select)
            _do('eliminate', elim)
        }

        const selectedColor = num === 1 ? this.color1 : this.color2
        const rejectedColor = num === 1 ? this.color2 : this.color1

        selectAndEliminateColors(selectedColor, rejectedColor)
    }

    private _split(color: color): [index, bit] {
        const [index, bit] = [color >> 5, 2 ** (color & 31)]
        assertIndex(index)
        assertBit(bit)
        return [index, bit]
    }

    private _checkForNewIteration() {
        if (this.colorsRemainingCurrentIteration !== 0) {
            return
        }

        this._colorsRemainingCurrentIteration =
            MAX_COLORS / 2 ** this.currentIteration
        this._currentIteration++
        this.selectedColors = new Uint32Array(0x80000)

        if (this._nextIterationColors.length < 1) {
            throw new Error('Array is empty but should not be')
        }

        this._colors = shuffle(this._nextIterationColors) as colorsAry
        this._nextIterationColors = []
    }

    private _checkForFavoriteColor() {
        this._favoriteColorFound = this.colorsRemainingCurrentIteration === 1
    }

    private _is(color: color, testingFor: 'eliminated' | 'selected'): boolean {
        const [index, bit] = this._split(color)

        const num =
            testingFor === 'eliminated'
                ? this.eliminatedColors[index]
                : this.selectedColors[index]

        if (num === undefined) {
            return false
        }

        return !!(num & bit)
    }
}
