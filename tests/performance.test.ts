import { createGame, getAvailableColors } from 'scripts/game'

const MAX_COLORS = 0x1000000

export function testPerformance() {
    let begin: number, end

    begin = performance.now()
    /** 
    getAvailableColors(createGame()).then(colors => {
        end = performance.now()
        console.log(
            'getAvailableColors() completed in ' + (end! - begin) + 'ms'
        )
    })*/
}
