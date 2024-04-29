import { Game, color } from 'scripts/game'

//import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import { TestColors } from './colors.test'
import { TestCondensedColors } from './condensedColors.test'

const MAX_COLORS = 0x1000000

export class TestGame extends Game {
    _colors: TestColors
    selectedColors: TestCondensedColors
    eliminatedColors: TestCondensedColors

    constructor() {
        super()
    }

    get testingProps(): [color[], color[]] {
        return [this._colors.raw, this._colors.nextIter]
    }

    protected _buildColors() {
        this._colors = new TestColors()
        this.selectedColors = new TestCondensedColors()
        this.eliminatedColors = new TestCondensedColors()
    }
}

function assertTrue(val: any): asserts val is true {
    if (!val) {
        throw new Error('val is not true')
    }
}

function loop(g: Game, numLoops: number) {
    for (let i = 0; i < numLoops; i++) {
        g.selectColor(1)
    }
}

function _split(color: color) {
    const [index, bit] = [color >> 5, 2 ** (color & 31)]
    return [index, bit]
}

function testSelectColor() {
    const g = new TestGame()
    let selected: color = g.color1
    let eliminated: color = g.color2
    g.selectColor(1)

    assertTrue(g.isEliminated(eliminated))
    assertTrue(g.isSelected(selected))

    // now do it a bunch more times
    for (let i = 0; i < 0xffff; i++) {
        selected = g.color1
        eliminated = g.color2
        g.selectColor(1)
        //console.log(i)
        assertTrue(g.isEliminated(eliminated))
        assertTrue(g.isSelected(selected))
    }

    console.log('testSelectColor PASS')
}

function testUintArray() {
    const ary = new Uint32Array(0x80000)

    for (let i = 0; i < MAX_COLORS; i++) {
        const [index, bit] = _split(i as color)

        const num = ary[index!]

        if (num === undefined) {
            console.log('num is not truthy: ', num)
            continue
        }

        assertTrue(!(num & bit!))
        ary[index!] |= bit!
    }
    console.log('testUintArray PASS')
}

async function testColorUniqueness() {
    async function _assertTrue(val: any) {
        if (!val) {
            const elimFh = await fsPromises.open('elim.txt', 'w')
            const seleFh = await fsPromises.open('sele.txt', 'w')
            const coloFh = await fsPromises.open('colo.txt', 'w')

            for (let num of g.eliminatedColors.raw) {
                await elimFh.write(num.toString() + '\n')
            }

            for (let num of g.selectedColors.raw) {
                await seleFh.write(num.toString() + '\n')
            }

            for (let num of colors) {
                await coloFh.write(num.toString() + '\n')
            }

            await elimFh.close()
            await seleFh.close()
            await coloFh.close()

            throw new Error('val is not true')
        }
    }

    const g = new TestGame()
    const colors = new Set<color>()

    for (let i = 0; i < MAX_COLORS / 2; i++) {
        await _assertTrue(!colors.has(g.color1))
        await _assertTrue(!colors.has(g.color2))

        colors.add(g.color1)
        colors.add(g.color2)

        g.selectColor(1)
    }

    console.log('testColorUniqueness PASS')
}

function testCheckForNewIteration() {
    const g = new TestGame()
    let curColors: number = g.colorsRemainingCurrentIteration
    let curIter: number = g.currentIteration

    function _assertTrue(val: any) {
        if (!val) {
            console.log(g)
            console.log('curIter: ', curIter)
            console.log('curColors: ', curColors)

            assertTrue(val)
        }
    }

    function assertVals() {
        _assertTrue(g.currentIteration === curIter)
        _assertTrue(g.colorsRemainingCurrentIteration === curColors)
    }

    function incrementVals() {
        curColors = MAX_COLORS / 2 ** curIter
        curIter++
    }

    while (curColors !== 2) {
        loop(g, MAX_COLORS / 2 ** curIter - 1)
        _assertTrue(g.currentIteration === curIter)
        g.selectColor(1)
        incrementVals()
        assertVals()
    }

    _assertTrue(!g.favoriteColor)

    const c1 = g.color1
    const c2 = g.color2
    console.log(c1, c2)

    g.selectColor(2)
    _assertTrue(g.favoriteColor || g.favoriteColor === 0)
    _assertTrue(g.favoriteColor === c2)
    console.log('testCheckForNewIteration PASS')
}

export async function gameTests() {
    testSelectColor()
    testUintArray()
    await testColorUniqueness()
    testCheckForNewIteration()
}
