import {
    Colors,
    ColorsLoadData,
    assertColor,
    assertColorsAry,
} from 'scripts/colors'
import { color } from 'scripts/colors'
import { Game } from 'scripts/game'
import { shuffle } from 'scripts/utils/utils'

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { TestCondensedColors } from './condensedColors.test'

export class TestColors extends Colors {
    isBgWorkDone: boolean

    constructor(data?: ColorsLoadData) {
        super(data)
    }

    get raw() {
        return this.ary
    }

    get nextIter(): color[] {
        return this.selectedColors
    }

    get faveColorFound() {
        return this.favoriteColorFound
    }

    protected override bg(
        data: { eliminated: ArrayBuffer; selected: ArrayBuffer } | null = null
    ) {
        if (!data) {
            this.bgNew()
        } else {
            this.bgLoad(data)
        }

        this.isBgWorkDone = true
    }

    private bgNew() {
        const tmp = []
        for (let i = 0; i < Game.MAX_COLORS; i++) {
            tmp.push(i)
        }
        const tmp2 = shuffle(tmp)
        assertColorsAry(tmp2)
        this.ary = tmp2
    }

    private bgLoad(data: { eliminated: ArrayBuffer; selected: ArrayBuffer }) {
        const eliminated = new TestCondensedColors(data.eliminated)
        const selected = new TestCondensedColors(data.selected)

        // go through all numbers
        // - if a number is included in colors, skip it
        // - if a number is included in eliminatedColors, skip it
        // - if a color is included in selectedColors, add it to nextIterColors
        const newColors = []

        for (let color = 0; color < Game.MAX_COLORS; color++) {
            assertColor(color)
            const isEliminated = eliminated.has(color)
            const isSelected = selected.has(color)
            const alreadyIncluded = this.ary.includes(color)

            if (isSelected) {
                this.selectedColors.push(color)
                continue
            }

            if (isEliminated || alreadyIncluded) {
                continue
            }

            newColors.push(color)
        }

        shuffle(newColors)
        shuffle(this.selectedColors)

        assertColorsAry(newColors)

        const HUNDRED_THOU = 100000
        for (let i = 0; i < 170; i++) {
            const min = i * HUNDRED_THOU
            const max = min + HUNDRED_THOU

            if (min >= Game.MAX_COLORS) {
                break
            }

            const colorsSubset = newColors.slice(min, max)
            this.ary.splice(0, 0, ...colorsSubset)
        }
    }
}

export const colorTests = () => {
    describe('Colors', () => {
        const c = new TestColors()

        it('should initialize', () => {
            assert.equal(true, c.isBgWorkDone)
        })

        it('should get new colors after a selection', () => {
            const [c1, c2] = [c.color1, c.color2]

            c.select(1)

            assert.notEqual(c1, c.color1)
            assert.notEqual(c2, c.color2)
        })

        it('should correctly select colors', () => {
            const numSelections = c.raw.length / 2

            for (let i = 0; i < numSelections - 1; i++) {
                c.select(1)
            }

            assert.equal(c.raw.length, 2)
        })

        it('should currectly shuffle when there are only two colors', () => {
            const [c1, c2] = [c.color1, c.color2].sort()

            c.shuffle()

            const [newC1, newC2] = [c.color1, c.color2].sort()

            assert.equal(c1, newC1)
            assert.equal(c2, newC2)
        })

        it('should rebuild the array once all colors have been selected', () => {
            c.select(2)

            assert.equal(c.raw.length, Game.MAX_COLORS / 2)
        })

        it('should correctly iterate through the entire game', () => {
            while (!c.faveColorFound) {
                c.select(1)
            }
        })

        it('should correctly load colors', async () => {
            const c2 = new TestColors()
            const elim = new TestCondensedColors()
            const select = new TestCondensedColors()

            for (let i = 0; i < 100000; i++) {
                elim.add(c2.color2)
                select.add(c2.color1)
                c2.select(1)
            }

            assert.equal(1000, c2.next1000Colors.length)

            const next1000b = new Blob([c2.next1000Colors])
            const next1000 = await next1000b.arrayBuffer()
            const eliminated = await elim.blob.arrayBuffer()
            const selected = await select.blob.arrayBuffer()

            const newC = new TestColors({ next1000, eliminated, selected })

            assert.equal(c2.color1, newC.color1)
            assert.equal(c2.color2, newC.color2)
        })
    })
}
