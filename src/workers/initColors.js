"use strict";
(() => {
  // scripts/utils/utils.ts
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

  // scripts/workers/initColors.ts
  var MAX_COLORS = 16777216;
  self.onmessage = (message) => {
    const [ary, key] = message.data;
    buildArrayIncrementally(ary, key);
  };
  function fullShuffledArray(origColors) {
    const colors = [];
    for (let i = 0; i < MAX_COLORS; i++) {
      if (origColors.includes(i)) {
        continue;
      }
      colors.push(i);
    }
    return shuffle(colors);
  }
  function buildArrayIncrementally(colors, key) {
    const HUNDRED_THOU = 1e5;
    const allColors = fullShuffledArray(colors);
    for (let i = 0; i < 170; i++) {
      const min = i * HUNDRED_THOU;
      const max = min + HUNDRED_THOU;
      if (min >= MAX_COLORS) {
        break;
      }
      const subset = allColors.slice(min, max);
      self.postMessage([subset, key]);
    }
  }
})();
//# sourceMappingURL=initColors.js.map
