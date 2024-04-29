import { assertColor, assertColorsAry } from 'scripts/colors'
import { CondensedColors } from 'scripts/condensedColors'
import { colorsAry, shuffle, color } from 'scripts/game'

const MAX_COLORS = 0x1000000

/**
 * Takes the current _colors array as input and returns a huge array containing all remaining colors, shuffled
 * @param message
 */
self.onmessage = message => {
    console.log('starting from worker thread')
    console.log(message.data)

    const [colors, arrays, key] = message.data

    const eliminated = new CondensedColors(arrays.eliminated)
    const selected = new CondensedColors(arrays.selected)

    const [colorsToAdd, nextIterColors] = doWork(colors, {
        eliminated,
        selected,
    })

    assertColorsAry(colorsToAdd)
    sendIncrementally(colorsToAdd, nextIterColors, key)

    console.log('completed from worker thread - now returning')
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

    for (let color = 0; color < MAX_COLORS; color++) {
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

        if (min >= MAX_COLORS) {
            break
        }

        const colorsSubset = colors.slice(min, max)
        const nextIterSubset = nextIterColors.slice(min, max)

        console.log(`sending elements ${min} through ${max}`)
        self.postMessage([[colorsSubset, nextIterSubset], key])
    }
}
