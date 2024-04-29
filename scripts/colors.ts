import { color, colorsAry } from './game'
import { CondensedColors } from './condensedColors'

const MAX_COLORS = 0x1000000

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

function assertDefined(val: color | undefined): asserts val is color {
    if (val === undefined) {
        throw new Error('Value is undefined!')
    }
}

export class Colors {
    protected selectedColors: color[]
    protected ary: colorsAry
    private static bgKey: number

    constructor() {
        this.init()
    }

    get color1(): color {
        return this.getAndValidateColor(1)
    }

    get color2(): color {
        return this.getAndValidateColor(2)
    }

    private getAndValidateColor(num: 1 | 2): color {
        const c = this.ary[this.ary.length - num]
        assertDefined(c)
        return c
    }

    get next1000Colors(): Uint32Array {
        return new Uint32Array(this.ary.slice(0, 1001))
    }

    shuffle(): void {
        const c1 = this.ary.shift()
        const c2 = this.ary.shift()

        assertDefined(c1)
        assertDefined(c2)

        this.ary.push(c1, c2)
    }

    /**
     *
     * @param num Updates ary, ensuring that there are always >= 2 elements
     * If this.ary.length == 2 at the beginning of the method, then both elements
     * will be the same at the end - the selected color
     * @return the colors in the format `[selected, rejected]`
     */
    select(num: 1 | 2): [color, color] {
        const selectedAndRejectedColors = this.getSelectedAndRejected(num)
        this.selectColor(selectedAndRejectedColors[0])

        // if there were more than two colors left before making a selection
        if (this.ary.length > 2) {
            this.pop2()
        } else {
            // else, those were the last two colors and we need to reset
            this.validateAry()

            if (this.favoriteColorFound()) {
                this.selectedColors.push(this.selectedColors[0]!)
            }

            this.reset(shuffle(this.selectedColors))
            this.selectedColors = []
        }

        return selectedAndRejectedColors
    }

    private getSelectedAndRejected(num: 1 | 2): [color, color] {
        const selectedColor = num === 1 ? this.color1 : this.color2
        const rejectedColor = num === 1 ? this.color2 : this.color1
        return [selectedColor, rejectedColor]
    }

    private selectColor(color: color): void {
        this.selectedColors.push(color)
    }

    private validateAry(): void {
        if (this.ary.length !== 2) {
            throw new Error('Array is the incorrect length')
        }
    }

    private favoriteColorFound(): boolean {
        return this.selectedColors.length === 1
    }

    static load(data: ColorsLoadData): Colors {
        const c = new Colors()
        c.load(data)
        return c
    }

    private reset(newAry: color[]): void {
        assertColorsAry(newAry)
        this.ary = newAry
    }

    private get reloadBgKey(): number {
        Colors.bgKey = Date.now()
        return Colors.bgKey
    }

    private pop2(): void {
        this.ary.splice(this.ary.length - 2, 2)
    }

    private load(data: ColorsLoadData) {
        // first 1000
        this.ary = ColorsAry.from(data.next1000)

        // background
        this.loadBg({ eliminated: data.eliminated, selected: data.selected })
    }

    private loadBg(data: { eliminated: ArrayBuffer; selected: ArrayBuffer }) {
        console.log('_buildColorsBg')
        const worker = new Worker('workers/loadColors.js')
        worker.postMessage([this.ary, data, this.reloadBgKey])
        worker.addEventListener('message', msg => {
            const [[colors, selectedColors], oldKey] = msg.data
            if (oldKey !== Colors.bgKey) {
                return
            }
            console.log(colors)

            assertColorsAry(colors)
            this.ary.splice(0, 0, ...colors)

            if (selectedColors.length !== 0) {
                this.selectedColors.splice(0, 0, ...selectedColors)
            }
        })
    }

    private init() {
        this.ary = ColorsAry.new()
        this.selectedColors = Array()
        this.first1000()
        this.background()
    }

    private first1000(): void {
        for (let i = 0; i < 1000; i++) {
            let color: number

            do {
                // ~~ is identical to Math.floor() but is faster
                color = ~~(Math.random() * MAX_COLORS)
                assertColor(color)
            } while (this.ary.includes(color))

            this.ary.push(color)
        }
        assertColorsAry(this.ary)
    }

    protected background(): void {
        console.log('_buildColorsBg')
        const worker = new Worker('workers/initColors.js')
        worker.postMessage([this.ary, this.reloadBgKey])
        worker.addEventListener('message', msg => {
            const [colors, oldKey] = msg.data
            if (oldKey !== Colors.bgKey) {
                return
            }
            console.log(colors)

            assertColorsAry(colors)
            this.ary.splice(0, 0, ...colors)
        })
    }
}
