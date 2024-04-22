import { CondensedColors } from './condensedColors'
import { Colors } from './colors'

const MAX_COLORS = 0x1000000

export type color = number & { __type: color }
export type colorsAry = [color, color, ...color[]]

export interface GameProps {
    favoriteColorFound: boolean
    currentIteration: number
    colorsRemainingCurrentIteration: number
}

function assertColor(value: number): asserts value is color {
    if (parseInt(`${value}`) !== value || value < 0 || value > 0xffffff) {
        throw new Error(value + 'is not a color!')
    }
}

function assertColorsAry(ary: number[]): asserts ary is colorsAry {
    if (
        !ary.every(elem => {
            assertColor(elem)
            return true
        }) ||
        ary.length < 2
    ) {
        console.log(ary)
        throw new Error('Not a colorsAry!')
    }
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle<T>(array: T[]): T[] {
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

export class Game {
    eliminatedColors: CondensedColors
    selectedColors: CondensedColors
    private _favoriteColorFound: boolean
    private _currentIteration: number
    private _colorsRemainingCurrentIteration: number
    _colors: Colors

    private _bgJobInstant: number = 0

    constructor(
        eliminated?: ArrayBuffer,
        selected?: ArrayBuffer,
        colors?: ArrayBuffer,
        props?: GameProps
    ) {
        if (!eliminated || !selected || !colors || !props) {
            this._init()
        } else {
            this._load(eliminated, selected, colors, props)
        }
    }

    get color1() {
        return this._colors.color1
    }

    get color2() {
        return this._colors.color2
    }

    get currentIteration() {
        return this._currentIteration
    }

    get colorsRemainingCurrentIteration() {
        return this._colorsRemainingCurrentIteration
    }

    get favoriteColor(): color | null {
        return this._favoriteColorFound ? this.color1 : null
    }

    get properties(): GameProps {
        return {
            favoriteColorFound: this.favoriteColor !== null,
            currentIteration: this.currentIteration,
            colorsRemainingCurrentIteration:
                this.colorsRemainingCurrentIteration,
        }
    }

    get testingProps(): [color[], color[]] {
        return [this._colors.raw, this._colors.nextIter]
    }

    get next1000Colors(): Uint32Array {
        return this._colors.next1000Colors
    }

    private get _reloadBgKey(): number {
        this._bgJobInstant = Date.now()
        return this._getBgKey
    }

    private get _getBgKey(): number {
        return this._bgJobInstant
    }

    selectColor(num: 1 | 2) {
        this._select(num)
        this._colorsRemainingCurrentIteration -= 2
        this._checkForNewIteration()
        this._checkForFavoriteColor()
    }

    reset() {
        this._init()
    }

    shuffleColors() {
        this._colors.shuffle()
    }

    isEliminated(color: color) {
        return this.eliminatedColors.has(color)
    }

    isSelected(color: color) {
        return this.selectedColors.has(color)
    }

    private _init() {
        this.eliminatedColors = new CondensedColors()
        this.selectedColors = new CondensedColors()
        this._currentIteration = 1
        this._colorsRemainingCurrentIteration = MAX_COLORS
        this._favoriteColorFound = false

        this._buildColors()
    }

    private _load(
        eliminated: ArrayBuffer,
        selected: ArrayBuffer,
        colors: ArrayBuffer,
        props: GameProps
    ) {
        this.eliminatedColors = new CondensedColors(eliminated)
        this.selectedColors = new CondensedColors(selected)
        this._currentIteration = props.currentIteration
        this._colorsRemainingCurrentIteration =
            props.colorsRemainingCurrentIteration
        this._favoriteColorFound = props.favoriteColorFound

        const tempColors = Array.from(new Uint32Array(colors))
        assertColorsAry(tempColors)
        //this._colors = tempColors

        this._loadColors()
    }

    private _loadColors() {
        console.log('_loadColorsBg')
        const worker = new Worker('workers/loadColors.js')
        const data = {
            colors: this._colors,
            eliminatedColors: this.eliminatedColors,
            selectedColors: this.selectedColors,
        }
        worker.postMessage([data, this._reloadBgKey])
        worker.addEventListener('message', msg => {
            const [[colors, nextIterationColors], oldKey] = msg.data

            if (oldKey !== this._getBgKey) {
                return
            }

            assertColorsAry(colors)
            assertColorsAry(nextIterationColors)

            //colors.push(...this._colors)
            //this._colors = colors

            //nextIterationColors.push(...this._nextIterationColors)
            //this._nextIterationColors = nextIterationColors
        })
    }

    /**
     * The primary purpose of this method is to allow for easier testing.
     * This method is overridded in the test class so that a worker thread is
     * not used.
     */
    protected _buildColors() {
        this._colors = new Colors()
    }

    private _select(num: 1 | 2): void {
        const [selected, rejected] = this._colors.selectColor(num)
        this.selectedColors.add(selected)
        this.eliminatedColors.add(rejected)
    }

    private _checkForNewIteration() {
        if (this.colorsRemainingCurrentIteration !== 0) {
            return
        }

        this._colorsRemainingCurrentIteration =
            MAX_COLORS / 2 ** this.currentIteration
        this._currentIteration++
        this.selectedColors.reset()
    }

    private _checkForFavoriteColor() {
        this._favoriteColorFound = this.colorsRemainingCurrentIteration === 1
    }
}
