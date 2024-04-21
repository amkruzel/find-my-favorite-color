"use strict";
(() => {
  // scripts/workers/buildShuffledColors.ts
  var MAX_COLORS = 16777216;
  self.onmessage = (message) => {
    console.log("starting from worker thread");
    const { eliminatedColors, selectedColors, colors, nextIterationColors } = message.data;
    const returnArys = buildShuffledArray(
      eliminatedColors,
      selectedColors,
      colors,
      nextIterationColors
    );
    console.log("completed from worker thread - now returning");
    self.postMessage(returnArys);
  };
  function contains(ary, val) {
    const [index, bit] = [val >> 5, 2 ** (val & 31)];
    const num = ary[index] ?? 0;
    return !!(num & bit);
  }
  function buildShuffledArray(eliminatedColors, selectedColors, colors, nextIterationColors) {
    const newColors = [];
    const newNextIterationColors = [];
    for (let color = 0; color < MAX_COLORS; color++) {
      if (color % 1e5 === 0) {
        console.log("i: ", color);
      }
      if (contains(eliminatedColors, color)) {
        continue;
      }
      if (contains(selectedColors, color)) {
        if (!nextIterationColors.includes(color)) {
          newNextIterationColors.push(color);
        }
        continue;
      }
      if (!colors.includes(color)) {
        newColors.push(color);
      }
    }
    return [newColors, newNextIterationColors];
  }
})();
//# sourceMappingURL=buildShuffledColors.js.map
