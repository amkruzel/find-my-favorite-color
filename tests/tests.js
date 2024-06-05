"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/tests.ts
var import_node_test3 = require("node:test");

// scripts/condensedColors.ts
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
      throw new Error(
        `Value is undefined but should not be - val: '${val}'`
      );
    }
    return num;
  }
  init(vals) {
    if (vals) {
      console.log(`AB bl: ${vals.byteLength}`);
      console.log(`bl / 32: ${vals.byteLength / 32}`);
      this.ary = new Uint32Array(vals, 0, 524288);
    } else {
      this.ary = new Uint32Array(524288);
    }
  }
};
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

// scripts/game.ts
var Game = class _Game {
  static {
    this.MAX_COLORS = 16777216;
  }
  constructor(arys, props) {
    if (!arys || !props) {
      this._init();
    } else {
      this._load(arys, props);
    }
  }
  get color1() {
    return this._colors.color1;
  }
  get color2() {
    return this._colors.color2;
  }
  get currentIteration() {
    return this._currentIteration;
  }
  get colorsRemainingCurrentIteration() {
    return this._colorsRemainingCurrentIteration;
  }
  get favoriteColor() {
    return this._favoriteColorFound ? this.color1 : null;
  }
  get properties() {
    return {
      favoriteColorFound: this.favoriteColor !== null,
      currentIteration: this.currentIteration,
      colorsRemainingCurrentIteration: this.colorsRemainingCurrentIteration
    };
  }
  get next1000Colors() {
    return this._colors.next1000Colors;
  }
  selectColor(num) {
    this._select(num);
    this._colorsRemainingCurrentIteration -= 2;
    this._checkForNewIteration();
    this._checkForFavoriteColor();
  }
  reset() {
    this._init();
  }
  shuffleColors() {
    this._colors.shuffle();
  }
  isEliminated(color2) {
    return this.eliminatedColors.has(color2);
  }
  isSelected(color2) {
    return this.selectedColors.has(color2);
  }
  _init() {
    this.eliminatedColors = new CondensedColors();
    this.selectedColors = new CondensedColors();
    this._currentIteration = 1;
    this._colorsRemainingCurrentIteration = _Game.MAX_COLORS;
    this._favoriteColorFound = false;
    this._buildColors();
  }
  _load(arys, props) {
    this.eliminatedColors = new CondensedColors(arys.eliminated);
    this.selectedColors = new CondensedColors(arys.selected);
    this._currentIteration = props.currentIteration;
    this._colorsRemainingCurrentIteration = props.colorsRemainingCurrentIteration;
    this._favoriteColorFound = props.favoriteColorFound;
    const data = {
      next1000: arys.colors,
      eliminated: arys.eliminated,
      selected: arys.selected
    };
    this._buildColors(data);
  }
  /**
   * The primary purpose of this method is to allow for easier testing.
   * This method is overridded in the test class so that a worker thread is
   * not used.
   */
  _buildColors(data) {
    this._colors = new Colors(data);
  }
  _select(num) {
    const [selected, rejected] = this._colors.select(num);
    this.selectedColors.add(selected);
    this.eliminatedColors.add(rejected);
  }
  _checkForNewIteration() {
    if (this.colorsRemainingCurrentIteration !== 0) {
      return;
    }
    this._colorsRemainingCurrentIteration = _Game.MAX_COLORS / 2 ** this.currentIteration;
    this._currentIteration++;
    this.selectedColors.reset();
  }
  _checkForFavoriteColor() {
    this._favoriteColorFound = this.colorsRemainingCurrentIteration === 1;
  }
};

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

// scripts/colors.ts
var ColorsAry = class {
  static new() {
    return new Array();
  }
  static from(ary) {
    const tmp = Array.from(new Uint32Array(ary));
    assertColorsAry(tmp);
    return tmp;
  }
};
var Colors = class _Colors {
  constructor(data) {
    this.init(data);
  }
  init(data) {
    this.ary = ColorsAry.new();
    this.selectedColors = Array();
    this.favoriteColorFound = false;
    if (data) {
      this.ary = ColorsAry.from(data.next1000);
    } else {
      this.first1000();
    }
    this.bg(data);
  }
  first1000() {
    for (let i = 0; i < 1e3; i++) {
      let color2;
      do {
        color2 = ~~(Math.random() * Game.MAX_COLORS);
        assertColor(color2);
      } while (this.ary.includes(color2));
      this.ary.push(color2);
    }
    assertColorsAry(this.ary);
  }
  bg(data = null) {
    const worker = new Worker("workers/colors.js");
    worker.postMessage([[this.ary, data], this.reloadBgKey]);
    worker.onmessage = (msg) => {
      const [[colors, selectedColors], oldKey] = msg.data;
      if (this.isInvalid(oldKey)) {
        return;
      }
      assertColorsAry(colors);
      this.ary.splice(0, 0, ...colors);
      if (selectedColors?.length !== 0) {
        this.selectedColors.splice(0, 0, ...selectedColors);
      }
    };
  }
  isInvalid(key) {
    return typeof key !== "number" || key !== _Colors.bgKey;
  }
  get color1() {
    return this.getAndValidate(1);
  }
  get color2() {
    return this.getAndValidate(2);
  }
  getAndValidate(num) {
    const c = this.ary[this.ary.length - num];
    assertDefined(c);
    return c;
  }
  get next1000Colors() {
    return Uint32Array.from(this.ary.slice(0, 1e3));
  }
  shuffle() {
    const c1 = this.ary.shift();
    const c2 = this.ary.shift();
    assertDefined(c1);
    assertDefined(c2);
    this.ary.push(c1, c2);
  }
  /**
   * Updates ary, ensuring that there are always >= 2 elements.
   * If this.ary.length == 2 at the beginning of the method, then both elements
   * will be the same at the end - the selected color.
   * @return the colors in the format `[selected, rejected]`
   */
  select(num) {
    const selectedColor = num === 1 ? this.color1 : this.color2;
    const rejectedColor = num === 1 ? this.color2 : this.color1;
    if (this.favoriteColorFound) {
      return [selectedColor, rejectedColor];
    }
    this.selectedColors.push(selectedColor);
    const moreThan2ColorsRemaining = this.ary.length > 2;
    if (moreThan2ColorsRemaining) {
      this.pop2();
    } else {
      this.resetAry();
    }
    return [selectedColor, rejectedColor];
  }
  pop2() {
    this.ary.splice(this.ary.length - 2, 2);
  }
  resetAry() {
    this.validateAry();
    this.favoriteColorFound = this.selectedColors.length === 1;
    if (this.favoriteColorFound) {
      this.selectedColors.push(this.selectedColors[0]);
    }
    this.reset();
  }
  validateAry() {
    if (this.ary.length !== 2) {
      throw new Error("Array is the incorrect length");
    }
  }
  /**
   * Shuffles `this.selectedColors`, asserts that is is a `colorsAry`,
   * sets `this.ary = <the shuffled ary>`, and clears `this.selectedColors`
   */
  reset() {
    const newAry = shuffle(this.selectedColors);
    assertColorsAry(newAry);
    this.ary = newAry;
    this.selectedColors = [];
  }
  get reloadBgKey() {
    _Colors.bgKey = Date.now();
    return _Colors.bgKey;
  }
};
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
function assertDefined(val) {
  if (val === void 0) {
    throw new Error("Value is undefined!");
  }
}

// tests/colors.test.ts
var import_node_test2 = require("node:test");
var import_node_assert = __toESM(require("node:assert"), 1);

// tests/condensedColors.test.ts
var import_node_test = require("node:test");
var TestCondensedColors = class extends CondensedColors {
  constructor(vals) {
    super(vals);
  }
  get raw() {
    return this.ary;
  }
};

// tests/colors.test.ts
var import_node_worker_threads = require("node:worker_threads");
var TestColors = class extends Colors {
  constructor(data) {
    super(data);
  }
  get raw() {
    return this.ary;
  }
  get nextIter() {
    return this.selectedColors;
  }
  get faveColorFound() {
    return this.favoriteColorFound;
  }
  bg(data = null) {
    const worker = new import_node_worker_threads.Worker("workers/colors.js");
    worker.postMessage([[this.ary, data], this.reloadBgKey]);
    worker.on("message", (msg) => {
      const [[colors, selectedColors], oldKey] = msg.data;
      if (this.isInvalid(oldKey)) {
        return;
      }
      assertColorsAry(colors);
      this.ary.splice(0, 0, ...colors);
      if (selectedColors?.length !== 0) {
        this.selectedColors.splice(0, 0, ...selectedColors);
      }
    });
  }
  _bg(data = null) {
    if (!data) {
      const shuffledColors = fullShuffledArray(this.ary);
      assertColorsAry(shuffledColors);
      this.buildIncrementally(shuffledColors, []);
      this.isBgWorkDone = true;
      return;
    }
    const eliminatedColors = new TestCondensedColors(data.eliminated);
    const selectedColors = new TestCondensedColors(data.selected);
    const [colorsToAdd, nextIterColors] = doWork(this.ary, {
      eliminated: eliminatedColors,
      selected: selectedColors
    });
    this.buildIncrementally(colorsToAdd, nextIterColors);
    this.isBgWorkDone = true;
  }
  buildIncrementally(colors, nextIterColors) {
    const HUNDRED_THOU = 1e5;
    for (let i = 0; i < 170; i++) {
      const min = i * HUNDRED_THOU;
      const max = min + HUNDRED_THOU;
      if (min >= Game.MAX_COLORS) {
        break;
      }
      const colorsSubset = colors.slice(min, max);
      const nextIterSubset = nextIterColors.slice(min, max);
      if (colorsSubset.length == 0) {
        console.log(min);
        console.log(max);
      }
      assertColorsAry(colorsSubset);
      this.ary.splice(0, 0, ...colorsSubset);
      if (nextIterSubset?.length !== 0) {
        this.selectedColors.splice(0, 0, ...nextIterSubset);
      }
    }
  }
};
function fullShuffledArray(origColors) {
  const colors = [];
  for (let i = 0; i < Game.MAX_COLORS; i++) {
    if (origColors.includes(i)) {
      continue;
    }
    colors.push(i);
  }
  return shuffle(colors);
}
function doWork(colors, arrays) {
  const newColors = [];
  const nextIterColors = [];
  for (let color2 = 0; color2 < Game.MAX_COLORS; color2++) {
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
var colorTests = () => {
  (0, import_node_test2.describe)("Colors", () => {
    const c = new TestColors();
    (0, import_node_test2.it)("should initialize", () => {
      import_node_assert.default.equal(true, c.isBgWorkDone);
    });
    (0, import_node_test2.it)("should get new colors after a selection", () => {
      const [c1, c2] = [c.color1, c.color2];
      c.select(1);
      import_node_assert.default.notEqual(c1, c.color1);
      import_node_assert.default.notEqual(c2, c.color2);
    });
    (0, import_node_test2.it)("should correctly select colors", () => {
      const numSelections = c.raw.length / 2;
      for (let i = 0; i < numSelections - 1; i++) {
        c.select(1);
      }
      import_node_assert.default.equal(c.raw.length, 2);
    });
    (0, import_node_test2.it)("should currectly shuffle when there are only two colors", () => {
      const [c1, c2] = [c.color1, c.color2].sort();
      c.shuffle();
      const [newC1, newC2] = [c.color1, c.color2].sort();
      import_node_assert.default.equal(c1, newC1);
      import_node_assert.default.equal(c2, newC2);
    });
    (0, import_node_test2.it)("should rebuild the array once all colors have been selected", () => {
      c.select(2);
      import_node_assert.default.equal(c.raw.length, Game.MAX_COLORS / 2);
    });
    (0, import_node_test2.it)("should correctly iterate through the entire game", () => {
      while (!c.faveColorFound) {
        c.select(1);
      }
    });
    (0, import_node_test2.it)("should correctly load colors", async () => {
      const c2 = new TestColors();
      const elim = new TestCondensedColors();
      const select = new TestCondensedColors();
      for (let i = 0; i < 1e5; i++) {
        elim.add(c2.color2);
        select.add(c2.color1);
        c2.select(1);
      }
      console.log(c2.next1000Colors.length);
      const next1000b = new Blob([c2.next1000Colors]);
      const next1000 = await next1000b.arrayBuffer();
      const eliminated = await elim.blob.arrayBuffer();
      const selected = await select.blob.arrayBuffer();
      const newC = new TestColors({ next1000, eliminated, selected });
      import_node_assert.default.equal(c2.color1, newC.color1);
      import_node_assert.default.equal(c2.color2, newC.color2);
    });
  });
};

// tests/tests.ts
(0, import_node_test3.describe)("Classes", () => {
  colorTests();
});
//# sourceMappingURL=tests.js.map
