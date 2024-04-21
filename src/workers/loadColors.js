"use strict";
(() => {
  // scripts/game.ts
  function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex]
      ];
    }
    return array;
  }

  // scripts/workers/loadColors.ts
  var MAX_COLORS = 16777216;
  self.onmessage = (message) => {
    console.log("starting from worker thread");
    const { colors, eliminatedColors, selectedColors } = message.data;
    const newColors = buildShuffledArray(message.data);
    console.log("completed from worker thread - now returning");
    self.postMessage(newColors);
  };
  function buildShuffledArray(colors) {
    if (colors?.length <= 0) {
      return [];
    }
    const newColors = [];
    for (let color = 0; color < MAX_COLORS; color++) {
      if (color % 1e5 == 0) {
        console.log(color);
      }
      if (colors.includes(color)) {
        continue;
      }
      newColors.push(color);
    }
    return shuffle(newColors);
  }
})();
//# sourceMappingURL=loadColors.js.map
