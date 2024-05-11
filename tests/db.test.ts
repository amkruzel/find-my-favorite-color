import { Db } from 'scripts/db'
import { App } from 'scripts/app'
import { TestGame } from './game.test'

const app = new App()

const db = new Db('http', '34.42.14.226', '8090')

function assertTrue(val: any): asserts val is true {
    if (!val) {
        throw new Error('val is not true')
    }
}

for (let i = 0; i < 0xfffff; i++) {
    app.game.selectColor(1)
}

async function testSaveAndLoad() {
    const g = app.game as TestGame
    const eliminated = g.eliminatedColors
    const selected = g.selectedColors
    const [colors, nextIterationColors] = g.testingProps

    await db.save(app)
    await db.load(app)

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
    await testSaveAndLoad()
}
