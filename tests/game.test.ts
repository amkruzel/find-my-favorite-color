import { Game, GameLoadArys, GameProps } from 'scripts/game'

//import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import { TestColors } from './colors.test'
import { TestCondensedColors } from './condensedColors.test'
import { ColorsLoadData, color } from 'scripts/colors'
import { describe, it } from 'node:test'
import assert from 'assert'

export class TestGame extends Game {
    _colors: TestColors
    selectedColors: TestCondensedColors
    eliminatedColors: TestCondensedColors

    constructor(arys?: any, props?: any) {
        super(arys, props)
    }

    get testingProps(): [color[], color[]] {
        return [this._colors.raw, this._colors.nextIter]
    }

    protected _buildColors(data: ColorsLoadData) {
        this._colors = new TestColors(data)
    }
}

function assertTrue(val: any): asserts val is true {
    assert.equal(true, val)
}

function loop(g: Game, numLoops: number) {
    for (let i = 0; i < numLoops; i++) {
        g.selectColor(1)
    }
}

export function createCompletedGame(): TestGame {
    const g = new TestGame()

    while (!g.favoriteColor) {
        g.selectColor(1)
    }

    return g
}

async function gameToLoadData(
    game: TestGame
): Promise<[GameLoadArys, GameProps]> {
    return [await getAryBuffers(game), game.properties]
}

async function getAryBuffers(game: TestGame): Promise<GameLoadArys> {
    const colors = await new Blob([game.next1000Colors]).arrayBuffer()
    const eliminated = await game.eliminatedColors.blob.arrayBuffer()
    const selected = await game.selectedColors.blob.arrayBuffer()

    return {
        colors,
        eliminated,
        selected,
    } as const
}

export const gameTests = () => {
    describe('Game', () => {
        const g1 = new TestGame()

        it('selects colors correctly', () => {
            let selected: color = g1.color1
            let eliminated: color = g1.color2
            g1.selectColor(1)

            assertTrue(g1.isEliminated(eliminated))
            assertTrue(g1.isSelected(selected))

            // now do it a bunch more times
            for (let i = 0; i < 0xffff; i++) {
                selected = g1.color1
                eliminated = g1.color2
                g1.selectColor(1)
                //console.log(i)
                assertTrue(g1.isEliminated(eliminated))
                assertTrue(g1.isSelected(selected))
            }
        })

        it('should always have unique colors', async () => {
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

            for (let i = 0; i < Game.MAX_COLORS / 2; i++) {
                await _assertTrue(!colors.has(g.color1))
                await _assertTrue(!colors.has(g.color2))

                colors.add(g.color1)
                colors.add(g.color2)

                g.selectColor(1)
            }
        })

        it('should correctly change iterations', () => {
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
                curColors = Game.MAX_COLORS / 2 ** curIter
                curIter++
            }

            while (curColors !== 2) {
                loop(g, Game.MAX_COLORS / 2 ** curIter - 1)
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
        })

        it('should correctly load a game', async () => {
            const [arys, props] = await gameToLoadData(g1)

            const newG = new TestGame(arys, props)

            assert.equal(newG.color1, g1.color1)
            assert.equal(newG.color2, g1.color2)
        })
    })
}
