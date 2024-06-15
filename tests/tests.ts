//import { testDb } from './db.test'
//import { gameTests } from './game.test'
//import { testPerformance } from './performance.test'
//import { testColors } from './colors.test'
import { describe } from 'node:test'
import { colorTests } from './colors.test'
import { condensedColorTests } from './condensedColors.test'
import { dbTests, saveCompletedGame } from './db.test'
import { gameTests } from './game.test'
//testPerformance()
//gameTests()

describe('Classes', () => {
    saveCompletedGame()
    //colorTests()
    //condensedColorTests()
    //gameTests()
    //dbTests()
})

// 4753427
