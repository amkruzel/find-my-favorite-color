import { colorsAry, shuffle } from 'scripts/game'

const MAX_COLORS = 0x1000000

/**
 * Takes the current _colors array as input and returns a huge array containing all remaining colors, shuffled
 * @param message
 */
self.onmessage = message => {
    console.log('starting from worker thread')

    const [ary, key] = message.data
    buildArrayIncrementally(ary, key)

    console.log('completed from worker thread - now returning')
}

function fullShuffledArray(origColors: number[]): number[] {
    const colors: number[] = []
    for (let i = 0; i < MAX_COLORS; i++) {
        if (origColors.includes(i)) {
            continue
        }
        colors.push(i)
    }

    return shuffle(colors)
}

function buildArrayIncrementally(colors: number[], key: number): void {
    const HUNDRED_THOU = 100000
    const allColors = fullShuffledArray(colors)
    for (let i = 0; i < 170; i++) {
        const min = i * HUNDRED_THOU
        const max = min + HUNDRED_THOU

        if (min >= MAX_COLORS) {
            break
        }

        const subset = allColors.slice(min, max)

        console.log(`sending elements ${min} through ${max}`)
        self.postMessage([subset, key])
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
