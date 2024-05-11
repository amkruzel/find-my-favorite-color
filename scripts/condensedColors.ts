import type { color } from './colors'

type index = number & { __type: index }
type bit = number & { __type: bit }

/**
 * This class represents a Uint32Array of length 0x80000
 * each bit in each 32 bit number can be used as a flag,
 * such as checking if a color is eliminated or not
 */
export class CondensedColors {
    protected ary: Uint32Array

    constructor(vals?: ArrayBuffer) {
        this.init(vals)
    }

    get blob(): Blob {
        return new Blob([this.ary])
    }

    has(val: color): boolean {
        const [index, bit] = this.split(val)
        const num = this.get(index)
        return !!(num & bit)
    }

    add(val: color): void {
        const [index, bit] = this.split(val)
        this.ary[index] |= bit
    }

    reset(): void {
        this.init()
    }

    private split(val: color): [index, bit] {
        const [index, bit] = [val >> 5, 2 ** (val & 31)]
        assertIndex(index)
        assertBit(bit)
        return [index, bit]
    }

    private get(val: index): number {
        const num = this.ary[val]

        if (num === undefined) {
            throw new Error('Value is undefined but should not be')
        }

        return num
    }

    private init(vals?: ArrayBuffer) {
        if (vals) {
            this.ary = new Uint32Array(vals)
        } else {
            this.ary = new Uint32Array(0x80000)
        }
    }
}

function assertIndex(value: number): asserts value is index {
    if (parseInt(`${value}`) !== value || value < 0 || value >= 0x80000) {
        throw new Error('Not an index!')
    }
}

function assertBit(value: number): asserts value is bit {
    if (parseInt(`${value}`) !== value || value < 0 || value & (value - 1)) {
        throw new Error('Not a bit!')
    }
}
