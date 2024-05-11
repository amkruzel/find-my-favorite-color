import { assertColor, assertColorsAry, color, colorsAry } from 'scripts/colors'
import { CondensedColors } from 'scripts/condensedColors'
import { Game } from 'scripts/game'
import { shuffle } from 'scripts/utils/utils'

self.onmessage = message => {
    const [[colors, arrays], key] = message.data

    if (arrays === null) {
        const shuffledColors = fullShuffledArray(colors)
        assertColorsAry(shuffledColors)
        sendIncrementally(shuffledColors, [], key)
        return
    }

    const eliminated = new CondensedColors(arrays.eliminated)
    const selected = new CondensedColors(arrays.selected)

    const [colorsToAdd, nextIterColors] = doWork(colors, {
        eliminated,
        selected,
    })

    assertColorsAry(colorsToAdd)
    sendIncrementally(colorsToAdd, nextIterColors, key)
}

function fullShuffledArray(origColors: number[]): number[] {
    const colors: number[] = []
    for (let i = 0; i < Game.MAX_COLORS; i++) {
        if (origColors.includes(i)) {
            continue
        }
        colors.push(i)
    }

    return shuffle(colors)
}

function doWork(
    colors: colorsAry,
    arrays: {
        eliminated: CondensedColors
        selected: CondensedColors
    }
): [color[], color[]] {
    // go through all numbers
    // - if a number is included in colors, skip it
    // - if a number is included in eliminatedColors, skip it
    // - if a color is included in selectedColors, add it to nextIterColors
    const newColors = []
    const nextIterColors = []

    for (let color = 0; color < Game.MAX_COLORS; color++) {
        assertColor(color)
        const isEliminated = arrays.eliminated.has(color)
        const isSelected = arrays.selected.has(color)
        const alreadyIncluded = colors.includes(color)

        if (isSelected) {
            nextIterColors.push(color)
            continue
        }

        if (isEliminated || alreadyIncluded) {
            continue
        }

        newColors.push(color)
    }

    return [shuffle(newColors), shuffle(nextIterColors)]
}

function sendIncrementally(
    colors: color[],
    nextIterColors: color[],
    key: number
): void {
    const HUNDRED_THOU = 100000
    for (let i = 0; i < 170; i++) {
        const min = i * HUNDRED_THOU
        const max = min + HUNDRED_THOU

        if (min >= Game.MAX_COLORS) {
            break
        }

        const colorsSubset = colors.slice(min, max)
        const nextIterSubset = nextIterColors.slice(min, max)

        self.postMessage([[colorsSubset, nextIterSubset], key])
    }
}
