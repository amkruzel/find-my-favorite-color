import { color, colorsAry } from './game'

const MAX_COLORS = 0x1000000

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

export class Colors {
    protected ary: colorsAry
    private static bgKey: number

    constructor() {
        this.init()
    }

    get color1(): color {
        const c = this.ary[this.ary.length - 1]

        if (c === undefined) {
            throw new Error('Color is undefined!')
        }

        return c
    }

    get color2(): color {
        const c = this.ary[this.ary.length - 2]

        if (c === undefined) {
            throw new Error('Color is undefined!')
        }

        return c
    }

    get next1000Colors(): Uint32Array {
        return new Uint32Array(this.ary.slice(0, 1001))
    }

    get raw(): colorsAry {
        return this.ary
    }

    shuffle(): void {
        const c1 = this.ary.shift()
        const c2 = this.ary.shift()

        if (c1 === undefined || c2 === undefined) {
            throw new Error('Color is undefined!')
        }

        this.ary.push(c1, c2)
    }

    pop(): color {
        const c = this.ary.pop()

        if (c === undefined) {
            throw new Error('Color is undefined!')
        }

        return c
    }

    reset(newAry: color[]): void {
        assertColorsAry(newAry)
        this.ary = newAry
    }

    private get reloadBgKey(): number {
        Colors.bgKey = Date.now()
        return Colors.bgKey
    }

    private init() {
        this.ary = new Array() as colorsAry
        this.first1000()
        this.background()
    }

    private first1000() {
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

    protected background() {
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
