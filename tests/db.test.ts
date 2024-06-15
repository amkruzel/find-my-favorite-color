import { Db } from 'scripts/db'
import { describe, it } from 'node:test'
import { FormConverter } from 'scripts/formConverter'
import assert from 'assert'
import { TestGame, createCompletedGame } from './game.test'

class TestDb extends Db {
    override async load(userId: string): Promise<TestGame> {
        const game = await this._getGameIfOneExists(userId)

        if (!game) {
            return new TestGame()
        }

        const [eliminated, selected, colors] = await this._getFiles(game)

        return new TestGame(
            {
                eliminated,
                selected,
                colors,
            },
            game.properties
        )
    }
}

const db = new TestDb('https://fmfc.alexkruzel.com')

export async function saveCompletedGame() {
    const testUserId = 'nibf2tps5tidz5h'
    const game = createCompletedGame()

    await db.save(game, testUserId)
}

export const dbTests = () => {
    describe('Db', () => {
        let newUserId: string

        describe('auth methods', () => {
            const myUserId = 'bdnqbqys20625ct'

            const testEmail = `asdf@${makeId(5)}.c`
            const testPw = '12345678'

            it('should create a user', async () => {
                const i = new Map()

                i.set('email', testEmail)
                i.set('password', testPw)
                i.set('passwordConfirm', testPw)

                const f = FormConverter.from(i)

                const u = await db.signup(f)
                newUserId = u.id
            })

            it('should login in existing user', async () => {
                const i = new Map()

                i.set('identity', testEmail)
                i.set('password', testPw)

                const f = FormConverter.from(i)

                await db.login(f)
            })

            it('should throw an error for invalid credentials', async () => {
                const i = new Map()

                i.set('identity', testEmail)
                i.set('password', 'asdfasdfa')

                const f = FormConverter.from(i)

                try {
                    await db.login(f)
                    assert.fail('login should have thrown an error')
                } catch (error) {
                    assert.equal(
                        error.message,
                        'Unable to login; email or password is incorrect.'
                    )
                }
            })

            it('should get info about existing user without logging in', async () => {
                const u = await db.getUser(myUserId)

                assert.equal('kruzelm.alex@gmail.com', u.email)
            })
        })

        describe('game methods', () => {
            const g = new TestGame()

            for (let i = 0; i < 50; i++) {
                g.selectColor(2)
            }

            console.log(g.next1000Colors)

            it('should save a new game without throwing errors', async () => {
                await db.save(g, newUserId)
            })

            it('should load a game without throwing errors', async () => {
                const gameData = await db.load(newUserId)

                console.log(gameData.next1000Colors)

                assert.equal(gameData.color1, g.color1)
                assert.equal(gameData.color2, g.color2)
            })

            it('should delete a game without throwing errors', async () => {
                await db.delete(newUserId)

                const newG = await db.load(newUserId)
                assert.equal(
                    TestGame.MAX_COLORS,
                    newG.colorsRemainingCurrentIteration
                )
            })
        })
    })
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeId(length: number) {
    let result = ''
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        )
        counter += 1
    }
    return result
}

/**
for (let i = 0; i < 0xfffff; i++) {
    app.game.selectColor(1)
}

async function testSaveAndLoad() {
    const g = app.game as TestGame
    const eliminated = g.eliminatedColors
    const selected = g.selectedColors
    const [colors, nextIterationColors] = g.testingProps

    //await db.save(app)
    //await db.load(app)

    for (let i = 0; i < 0x80000; i++) {
        console.log(i, eliminated.raw[0])

        assertTrue(eliminated.raw[i] === g.eliminatedColors.raw[i])
        assertTrue(selected.raw[i] === g.selectedColors.raw[i])
    }

    const [newColors, newNextIterationColors] = g.testingProps

    let i = 0,
        n = 0
    console.log('testing colors')

    for (const color of colors) {
        assertTrue(newColors.includes(color))
        i++
        if (i % 100 === 0) {
            console.log('.')
        }

        if (i % 1000 === 0) {
            console.log(n)
            n++
        }
    }

    ;(i = 0), (n = 0)
    console.log('testing nextIterationColors')

    for (const color of nextIterationColors) {
        assertTrue(newNextIterationColors.includes(color))
        i++
        if (i % 100 === 0) {
            console.log('.')
        }

        if (i % 1000 === 0) {
            console.log(n)
            n++
        }
    }

    console.log('all are equal')
}

export async function testDb() {
    //await testSaveGame()
    //await testGetGame()
    //await testSaveAndLoad()
}

*/
