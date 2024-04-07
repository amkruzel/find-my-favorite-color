import { Db } from 'scripts/db'
import { Game } from 'scripts/game'
import { App } from 'scripts/app'
import { getUser, guestUser } from 'scripts/user'

const app: App = {
    game: new Game(),
    user: guestUser(),
}

const db = new Db('http', '34.42.14.226', '8090')

function assertTrue(val: any): asserts val is true {
    if (!val) {
        throw new Error('val is not true')
    }
}

for (let i = 0; i < 0xfffff; i++) {
    app.game.selectColor(1)
}

async function testSaveGame() {
    await db.save(app)
}

async function testGetGame() {
    //await db.getGame(app.user!.id)
}

async function testSaveAndLoad() {
    const eliminated = app.game.eliminatedColors
    const selected = app.game.selectedColors
    const [colors, nextIterationColors] = app.game.testingProps

    await db.save(app)
    await db.load(app)

    for (let i = 0; i < 0x80000; i++) {
        assertTrue(eliminated[i] === app.game.eliminatedColors[i])
        assertTrue(selected[i] === app.game.selectedColors[i])
    }

    const [newColors, newNextIterationColors] = app.game.testingProps

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
    await testSaveAndLoad()
}
