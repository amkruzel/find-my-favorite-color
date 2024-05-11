import { Game } from './game'
import { shuffle } from './utils/utils'

export type color = number & { __type: color }
export type colorsAry = [color, color, ...color[]]

export interface ColorsLoadData {
    next1000: ArrayBuffer
    eliminated: ArrayBuffer
    selected: ArrayBuffer
}

class ColorsAry {
    static new(): colorsAry {
        return new Array() as colorsAry
    }

    static from(ary: ArrayBuffer): colorsAry {
        const tmp = Array.from(new Uint32Array(ary))
        assertColorsAry(tmp)
        return tmp
    }
}

export class Colors {
    protected selectedColors: color[]
    protected ary: colorsAry
    private static bgKey: number

    constructor(data?: ColorsLoadData) {
        this.init(data)
    }

    private init(data?: ColorsLoadData) {
        this.ary = ColorsAry.new()
        this.selectedColors = Array()

        if (data) {
            this.ary = ColorsAry.from(data.next1000)
        } else {
            this.first1000()
        }

        this.bg(data)
    }

    private first1000() {
        for (let i = 0; i < 1000; i++) {
            let color: number

            do {
                // ~~ is identical to Math.floor() but is faster
                color = ~~(Math.random() * Game.MAX_COLORS)
                assertColor(color)
            } while (this.ary.includes(color))

            this.ary.push(color)
        }
        assertColorsAry(this.ary)
    }

    protected bg(
        data: { eliminated: ArrayBuffer; selected: ArrayBuffer } | null = null
    ) {
        const worker = new Worker('workers/colors.js')
        worker.postMessage([[this.ary, data], this.reloadBgKey])

        worker.onmessage = msg => {
            const [[colors, selectedColors], oldKey] = msg.data

            if (this.isInvalid(oldKey)) {
                return
            }

            assertColorsAry(colors)
            this.ary.splice(0, 0, ...colors)

            if (selectedColors?.length !== 0) {
                this.selectedColors.splice(0, 0, ...selectedColors)
            }
        }
    }

    private isInvalid(key: any) {
        return typeof key !== 'number' || key !== Colors.bgKey
    }

    get color1(): color {
        return this.getAndValidate(1)
    }

    get color2(): color {
        return this.getAndValidate(2)
    }

    private getAndValidate(num: 1 | 2): color {
        const c = this.ary[this.ary.length - num]
        assertDefined(c)
        return c
    }

    get next1000Colors(): Uint32Array {
        return new Uint32Array(this.ary.slice(0, 1001))
    }

    shuffle() {
        const c1 = this.ary.shift()
        const c2 = this.ary.shift()

        assertDefined(c1)
        assertDefined(c2)

        this.ary.push(c1, c2)
    }

    /**
     * Updates ary, ensuring that there are always >= 2 elements.
     * If this.ary.length == 2 at the beginning of the method, then both elements
     * will be the same at the end - the selected color.
     * @return the colors in the format `[selected, rejected]`
     */
    select(num: 1 | 2): [color, color] {
        const selectedColor = num === 1 ? this.color1 : this.color2
        const rejectedColor = num === 1 ? this.color2 : this.color1

        this.selectedColors.push(selectedColor)

        const moreThan2ColorsRemaining = this.ary.length > 2

        if (moreThan2ColorsRemaining) {
            this.pop2()
        } else {
            this.resetAry()
        }

        return [selectedColor, rejectedColor]
    }

    private pop2() {
        this.ary.splice(this.ary.length - 2, 2)
    }

    private resetAry() {
        this.validateAry()

        const favoriteColorFound = this.selectedColors.length === 1

        if (favoriteColorFound) {
            this.selectedColors.push(this.selectedColors[0]!) // must be defined because we just pushed a value
        }

        this.reset()
    }

    private validateAry(): void {
        if (this.ary.length !== 2) {
            throw new Error('Array is the incorrect length')
        }
    }

    /**
     * Shuffles `this.selectedColors`, asserts that is is a `colorsAry`,
     * sets `this.ary = <the shuffled ary>`, and clears `this.selectedColors`
     */
    private reset() {
        const newAry = shuffle(this.selectedColors)
        assertColorsAry(newAry)
        this.ary = newAry
        this.selectedColors = []
    }

    private get reloadBgKey(): number {
        Colors.bgKey = Date.now()
        return Colors.bgKey
    }
}

export function assertColor(value: number): asserts value is color {
    if (parseInt(`${value}`) !== value || value < 0 || value > 0xffffff) {
        throw new Error(value + 'is not a color!')
    }
}

export function assertColorsAry(ary: number[]): asserts ary is colorsAry {
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

function assertDefined(val: color | undefined): asserts val is color {
    if (val === undefined) {
        throw new Error('Value is undefined!')
    }
}
