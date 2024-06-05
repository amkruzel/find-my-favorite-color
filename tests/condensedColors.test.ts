import assert from 'node:assert'
import { describe, it } from 'node:test'
import { assertColor } from 'scripts/colors'
import { CondensedColors } from 'scripts/condensedColors'
import { Game } from 'scripts/game'

export class TestCondensedColors extends CondensedColors {
    constructor(vals?: ArrayBuffer) {
        super(vals)
    }

    get raw(): Uint32Array {
        return this.ary
    }
}

export const condensedColorTests = () => {
    const c = new TestCondensedColors()

    function randomInt() {
        return ~~(Math.random() * Game.MAX_COLORS)
    }

    describe('CondensedColors', () => {
        it('correctly inserts colors', () => {
            for (let i = 0; i < 10; i++) {
                const int = randomInt()

                assertColor(int)

                if (!c.has(int)) {
                    c.add(int)
                }

                assert.equal(c.has(int), true)
            }
        })

        it('returns a blob that can be converted back to CondensedColors', async () => {
            const b = c.blob

            const newC = new TestCondensedColors(await b.arrayBuffer())
            const newB = newC.blob

            // A) Convert files to ArrayBuffer:
            const arrayBufferFileA = await b.arrayBuffer()
            const arrayBufferFileB = await newB.arrayBuffer()

            // Stop if the files are not the same size:
            assert.equal(
                arrayBufferFileA.byteLength,
                arrayBufferFileB.byteLength
            )

            // B) Convert ArrayBuffer to Uint8Array for byte-size comparison:
            const uint8ArrayA = new Uint8Array(arrayBufferFileA)
            const uint8ArrayB = new Uint8Array(arrayBufferFileB)

            for (let i = 0, len = uint8ArrayA.length; i < len; i++) {
                assert.equal(uint8ArrayA[i], uint8ArrayB[i])
            }
        })

        it('loads from ArrayBuffer correctly', async () => {
            const x = await c.blob.arrayBuffer()

            const newC = new TestCondensedColors(x)

            for (let i = 0; i < Game.MAX_COLORS; i++) {
                assertColor(i)
                assert.equal(c.has(i), newC.has(i))
            }
        })
    })
}
