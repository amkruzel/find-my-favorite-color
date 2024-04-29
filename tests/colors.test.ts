import { Colors } from 'scripts/colors'
import { MAX_COLORS, color, colorsAry, shuffle } from 'scripts/game'

export class TestColors extends Colors {
    constructor() {
        super()
    }

    get raw() {
        return this.ary
    }

    get nextIter(): color[] {
        return this.selectedColors
    }

    protected background() {
        const tmpClr = this.ary
        let newColors: number[] = []
        for (let i = 0; i < MAX_COLORS; i++) {
            if (tmpClr.includes(i as color)) {
                continue
            }
            newColors.push(i)
        }

        newColors = shuffle(newColors)

        const HUNDRED_THOU = 100000
        for (let i = 0; i < 170; i++) {
            const min = i * HUNDRED_THOU
            const max = min + HUNDRED_THOU

            if (min >= MAX_COLORS) {
                break
            }

            const subset = newColors.slice(min, max)

            this.ary.splice(0, 0, ...(subset as colorsAry))
        }
    }
}
