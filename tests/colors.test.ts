import { Colors } from 'scripts/colors'
import { color, colorsAry } from 'scripts/colors'
import { Game } from 'scripts/game'
import { shuffle } from 'scripts/utils/utils'

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

    protected bg() {
        const tmpClr = this.ary
        let newColors: number[] = []
        for (let i = 0; i < Game.MAX_COLORS; i++) {
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

            if (min >= Game.MAX_COLORS) {
                break
            }

            const subset = newColors.slice(min, max)

            this.ary.splice(0, 0, ...(subset as colorsAry))
        }
    }
}
