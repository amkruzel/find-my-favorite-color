import { CondensedColors } from './condensedColors'
import { Colors, ColorsLoadData, color } from './colors'

export interface GameProps {
    favoriteColorFound: boolean
    currentIteration: number
    colorsRemainingCurrentIteration: number
}

export interface GameLoadArys {
    eliminated: ArrayBuffer
    selected: ArrayBuffer
    colors: ArrayBuffer
}

export class Game {
    static MAX_COLORS = 0x1000000

    eliminatedColors: CondensedColors
    selectedColors: CondensedColors
    private _favoriteColorFound: boolean
    private _currentIteration: number
    private _colorsRemainingCurrentIteration: number
    private _isNewGame: boolean
    _colors: Colors

    id?: string

    constructor(arys?: GameLoadArys, props?: GameProps) {
        if (!arys || !props) {
            this._init()
        } else {
            this._load(arys, props)
        }
    }

    get isNewGame() {
        return this._isNewGame
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

    get favoriteColor() {
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

    get next1000Colors(): Uint32Array {
        return this._colors.next1000Colors
    }

    selectColor(num: 1 | 2) {
        if (this._favoriteColorFound) {
            return
        }

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

    protected _init() {
        this._isNewGame = true
        this.eliminatedColors = new CondensedColors()
        this.selectedColors = new CondensedColors()
        this._currentIteration = 1
        this._colorsRemainingCurrentIteration = Game.MAX_COLORS
        this._favoriteColorFound = false

        this._buildColors()
    }

    private _load(arys: GameLoadArys, props: GameProps) {
        this._isNewGame = false
        this.eliminatedColors = new CondensedColors(arys.eliminated)
        this.selectedColors = new CondensedColors(arys.selected)
        this._currentIteration = props.currentIteration
        this._colorsRemainingCurrentIteration =
            props.colorsRemainingCurrentIteration
        this._favoriteColorFound = props.favoriteColorFound

        const data: ColorsLoadData = {
            next1000: arys.colors,
            eliminated: arys.eliminated,
            selected: arys.selected,
        }

        this._buildColors(data)
    }

    /**
     * The primary purpose of this method is to allow for easier testing.
     * This method is overridded in the test class so that a worker thread is
     * not used.
     */
    protected _buildColors(data?: ColorsLoadData) {
        this._colors = new Colors(data)
    }

    private _select(num: 1 | 2): void {
        this._isNewGame = false
        const [selected, rejected] = this._colors.select(num)
        this.selectedColors.add(selected)
        this.eliminatedColors.add(rejected)
    }

    private _checkForNewIteration() {
        if (this.colorsRemainingCurrentIteration !== 0) {
            return
        }

        this._colorsRemainingCurrentIteration =
            Game.MAX_COLORS / 2 ** this.currentIteration
        this._currentIteration++
        this.selectedColors.reset()
    }

    private _checkForFavoriteColor() {
        this._favoriteColorFound = this.colorsRemainingCurrentIteration === 1
    }
}
