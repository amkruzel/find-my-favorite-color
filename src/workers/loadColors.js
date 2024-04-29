"use strict";
(() => {
  // scripts/colors.ts
  function assertColor(value) {
    if (parseInt(`${value}`) !== value || value < 0 || value > 16777215) {
      throw new Error(value + "is not a color!");
    }
  }
  function assertColorsAry(ary) {
    if (!ary.every((elem) => {
      assertColor(elem);
      return true;
    }) || ary.length < 2) {
      console.log(ary);
      throw new Error("Not a colorsAry!");
    }
  }

  // scripts/condensedColors.ts
  function assertIndex(value) {
    if (parseInt(`${value}`) !== value || value < 0 || value >= 524288) {
      throw new Error("Not an index!");
    }
  }
  function assertBit(value) {
    if (parseInt(`${value}`) !== value || value < 0 || value & value - 1) {
      throw new Error("Not a bit!");
    }
  }
  var CondensedColors = class {
    constructor(vals) {
      this.init(vals);
    }
    get blob() {
      return new Blob([this.ary]);
    }
    has(val) {
      const [index, bit] = this.split(val);
      const num = this.get(index);
      return !!(num & bit);
    }
    add(val) {
      const [index, bit] = this.split(val);
      this.ary[index] |= bit;
    }
    reset() {
      this.init();
    }
    split(val) {
      const [index, bit] = [val >> 5, 2 ** (val & 31)];
      assertIndex(index);
      assertBit(bit);
      return [index, bit];
    }
    get(val) {
      const num = this.ary[val];
      if (num === void 0) {
        throw new Error("Value is undefined but should not be");
      }
      return num;
    }
    init(vals) {
      if (vals) {
        this.ary = new Uint32Array(vals);
      } else {
        this.ary = new Uint32Array(524288);
      }
    }
  };

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
    console.log(message.data);
    const [colors, arrays, key] = message.data;
    const eliminated = new CondensedColors(arrays.eliminated);
    const selected = new CondensedColors(arrays.selected);
    const [colorsToAdd, nextIterColors] = doWork(colors, {
      eliminated,
      selected
    });
    assertColorsAry(colorsToAdd);
    sendIncrementally(colorsToAdd, nextIterColors, key);
    console.log("completed from worker thread - now returning");
  };
  function doWork(colors, arrays) {
    const newColors = [];
    const nextIterColors = [];
    for (let color2 = 0; color2 < MAX_COLORS; color2++) {
      assertColor(color2);
      const isEliminated = arrays.eliminated.has(color2);
      const isSelected = arrays.selected.has(color2);
      const alreadyIncluded = colors.includes(color2);
      if (isSelected) {
        nextIterColors.push(color2);
        continue;
      }
      if (isEliminated || alreadyIncluded) {
        continue;
      }
      newColors.push(color2);
    }
    return [shuffle(newColors), shuffle(nextIterColors)];
  }
  function sendIncrementally(colors, nextIterColors, key) {
    const HUNDRED_THOU = 1e5;
    for (let i = 0; i < 170; i++) {
      const min = i * HUNDRED_THOU;
      const max = min + HUNDRED_THOU;
      if (min >= MAX_COLORS) {
        break;
      }
      const colorsSubset = colors.slice(min, max);
      const nextIterSubset = nextIterColors.slice(min, max);
      console.log(`sending elements ${min} through ${max}`);
      self.postMessage([[colorsSubset, nextIterSubset], key]);
    }
  }
})();
//# sourceMappingURL=loadColors.js.map
