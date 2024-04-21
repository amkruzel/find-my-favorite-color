import { shuffle } from 'scripts/game'

const MAX_COLORS = 0x1000000

/**
 * Takes the current _colors array as input and returns a huge array containing all remaining colors, shuffled
 * @param message
 */
self.onmessage = message => {
    console.log('starting from worker thread')

    const [arrays, key] = message.data

    doWork(arrays)

    console.log('completed from worker thread - now returning')

    self.postMessage(newColors)
}

function doWork(arrays: {
    colors: Uint32Array
    eliminatedColors: Uint32Array
    selectedColors: Uint32Array
}): void {
    // go through all numbers
    // - if a number is included in colors, skip it
    // - if a number is included in eliminatedColors, skip it
    // - if a color is included in selectedColors, add it to nextIterColors

    for (let color = 0; color < MAX_COLORS; color++) {
        if (color % 100000 == 0) {
            console.log(color)
        }
        if (arrays.colors.includes(color)) {
            continue
        }
        newColors.push(color)
    }
}

function buildShuffledArray(colors: number[]): number[] {
    if (colors?.length <= 0) {
        return []
    }

    const newColors: number[] = []
    for (let color = 0; color < MAX_COLORS; color++) {
        if (color % 100000 == 0) {
            console.log(color)
        }
        if (colors.includes(color)) {
            continue
        }
        newColors.push(color)
    }
    return shuffle(newColors)
}
