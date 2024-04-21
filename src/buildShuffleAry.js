const MAX_COLORS = 0x1000000

self.onmessage = msg => {
    const _colors = msg.data
    const existingColors = new Set(_colors)
    const colors = new Array()

    for (let i = 1000; i < MAX_COLORS; i++) {
        let color
        do {
            const c = ~~(Math.random() * MAX_COLORS)
            color = c
        } while (existingColors.has(color))
        colors.push(color)
    }

    colors.push(..._colors)
    self.postMessage(colors)
}