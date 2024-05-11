import { shuffle } from 'scripts/utils/utils'

const MAX_COLORS = 0x1000000

/**
 * Takes the current _colors array as input and returns a huge array containing all remaining colors, shuffled
 * @param message
 */
self.onmessage = message => {
    const [ary, key] = message.data
    buildArrayIncrementally(ary, key)
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

        self.postMessage([subset, key])
    }
}
