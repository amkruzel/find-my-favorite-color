const MAX_COLORS = 0x1000000

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--

        // And swap it with the current element.
        ;[array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ]
    }

    return array
}

function has(color, ary) {
    const [index, bit] = [color >> 5, 2 ** (color & 31)]

    const num = ary[index]

    if (num === undefined) {
        return false
    }

    return !!(num & bit)
}

self.onmessage = msg => {
    const { _colors, eliminatedColors, selectedColors, nextIterationColors, color1, color2 } = msg.data
    const existingColors = new Set(_colors)
    const colors = new Array()

    for (let color = 0; color < MAX_COLORS; color++) {
        if (existingColors.has(color) || has(color, eliminatedColors) || color == color1 || color == color2) {
            continue
        }

        if (has(color, selectedColors) && !nextIterationColors.includes(color)) {
            nextIterationColors.push(color)
            continue
        }

        colors.push(color)
    }

    shuffle(colors)

    colors.push(..._colors)
    self.postMessage(colors)
}

