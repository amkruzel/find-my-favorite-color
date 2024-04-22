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
  get raw() {
    return this.ary;
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

// scripts/colors.ts
var MAX_COLORS = 16777216;
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
var Colors = class _Colors {
  constructor() {
    this.init();
  }
  get color1() {
    const c = this.ary[this.ary.length - 1];
    if (c === void 0) {
      throw new Error("Color is undefined!");
    }
    return c;
  }
  get color2() {
    const c = this.ary[this.ary.length - 2];
    if (c === void 0) {
      throw new Error("Color is undefined!");
    }
    return c;
  }
  get next1000Colors() {
    return new Uint32Array(this.ary.slice(0, 1001));
  }
  get raw() {
    return this.ary;
  }
  get nextIter() {
    return this.selectedColors;
  }
  shuffle() {
    const c1 = this.ary.shift();
    const c2 = this.ary.shift();
    if (c1 === void 0 || c2 === void 0) {
      throw new Error("Color is undefined!");
    }
    this.ary.push(c1, c2);
  }
  /**
   *
   * @param num Updates ary, ensuring that there are always >= 2 elements
   * If this.ary.length == 2 at the beginning of the method, then both elements
   * will be the same at the end - the selected color
   * @return the colors in the format `[selected, rejected]`
   */
  selectColor(num) {
    const selectedColor = num === 1 ? this.color1 : this.color2;
    const rejectedColor = num === 1 ? this.color2 : this.color1;
    this.selectedColors.push(selectedColor);
    if (this.ary.length > 2) {
      this.pop2();
    } else {
      if (this.ary.length !== 2) {
        throw new Error("Array is the incorrect length");
      }
      const favoriteColorFound = this.selectedColors.length === 1;
      if (favoriteColorFound) {
        this.selectedColors.push(this.selectedColors[0]);
      }
      this.reset(shuffle(this.selectedColors));
      this.selectedColors = [];
    }
    return [selectedColor, rejectedColor];
  }
  reset(newAry) {
    assertColorsAry(newAry);
    this.ary = newAry;
  }
  get reloadBgKey() {
    _Colors.bgKey = Date.now();
    return _Colors.bgKey;
  }
  pop2() {
    this.ary.splice(this.ary.length - 2, 2);
  }
  init() {
    this.ary = new Array();
    this.selectedColors = [];
    this.first1000();
    this.background();
  }
  first1000() {
    for (let i = 0; i < 1e3; i++) {
      let color2;
      do {
        color2 = ~~(Math.random() * MAX_COLORS);
        assertColor(color2);
      } while (this.ary.includes(color2));
      this.ary.push(color2);
    }
    assertColorsAry(this.ary);
  }
  background() {
    console.log("_buildColorsBg");
    const worker = new Worker("workers/initColors.js");
    worker.postMessage([this.ary, this.reloadBgKey]);
    worker.addEventListener("message", (msg) => {
      const [colors, oldKey] = msg.data;
      if (oldKey !== _Colors.bgKey) {
        return;
      }
      console.log(colors);
      assertColorsAry(colors);
      this.ary.splice(0, 0, ...colors);
    });
  }
};

// scripts/game.ts
var MAX_COLORS2 = 16777216;
function assertColor2(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value > 16777215) {
    throw new Error(value + "is not a color!");
  }
}
function assertColorsAry2(ary) {
  if (!ary.every((elem) => {
    assertColor2(elem);
    return true;
  }) || ary.length < 2) {
    console.log(ary);
    throw new Error("Not a colorsAry!");
  }
}
var Game = class {
  constructor(eliminated, selected, colors, props) {
    this._bgJobInstant = 0;
    if (!eliminated || !selected || !colors || !props) {
      this._init();
    } else {
      this._load(eliminated, selected, colors, props);
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
  get testingProps() {
    return [this._colors.raw, this._colors.nextIter];
  }
  get next1000Colors() {
    return this._colors.next1000Colors;
  }
  get _reloadBgKey() {
    this._bgJobInstant = Date.now();
    return this._getBgKey;
  }
  get _getBgKey() {
    return this._bgJobInstant;
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
    this._colorsRemainingCurrentIteration = MAX_COLORS2;
    this._favoriteColorFound = false;
    this._buildColors();
  }
  _load(eliminated, selected, colors, props) {
    this.eliminatedColors = new CondensedColors(eliminated);
    this.selectedColors = new CondensedColors(selected);
    this._currentIteration = props.currentIteration;
    this._colorsRemainingCurrentIteration = props.colorsRemainingCurrentIteration;
    this._favoriteColorFound = props.favoriteColorFound;
    const tempColors = Array.from(new Uint32Array(colors));
    assertColorsAry2(tempColors);
    this._loadColors();
  }
  _loadColors() {
    console.log("_loadColorsBg");
    const worker = new Worker("workers/loadColors.js");
    const data = {
      colors: this._colors,
      eliminatedColors: this.eliminatedColors,
      selectedColors: this.selectedColors
    };
    worker.postMessage([data, this._reloadBgKey]);
    worker.addEventListener("message", (msg) => {
      const [[colors, nextIterationColors], oldKey] = msg.data;
      if (oldKey !== this._getBgKey) {
        return;
      }
      assertColorsAry2(colors);
      assertColorsAry2(nextIterationColors);
    });
  }
  /**
   * The primary purpose of this method is to allow for easier testing.
   * This method is overridded in the test class so that a worker thread is
   * not used.
   */
  _buildColors() {
    this._colors = new Colors();
  }
  _select(num) {
    const [selected, rejected] = this._colors.selectColor(num);
    this.selectedColors.add(selected);
    this.eliminatedColors.add(rejected);
  }
  _checkForNewIteration() {
    if (this.colorsRemainingCurrentIteration !== 0) {
      return;
    }
    this._colorsRemainingCurrentIteration = MAX_COLORS2 / 2 ** this.currentIteration;
    this._currentIteration++;
    this.selectedColors.reset();
  }
  _checkForFavoriteColor() {
    this._favoriteColorFound = this.colorsRemainingCurrentIteration === 1;
  }
};

// tests/game.test.ts
var fsPromises = __toESM(require("fs/promises"), 1);
var MAX_COLORS3 = 16777216;
var TestColors = class extends Colors {
  constructor() {
    super();
  }
  background() {
    const tmpClr = this.ary;
    let newColors = [];
    for (let i = 0; i < MAX_COLORS3; i++) {
      if (tmpClr.includes(i)) {
        continue;
      }
      newColors.push(i);
    }
    newColors = shuffle2(newColors);
    const HUNDRED_THOU = 1e5;
    for (let i = 0; i < 170; i++) {
      const min = i * HUNDRED_THOU;
      const max = min + HUNDRED_THOU;
      if (min >= MAX_COLORS3) {
        break;
      }
      const subset = newColors.slice(min, max);
      this.ary.splice(0, 0, ...subset);
    }
  }
};
var TestGame = class extends Game {
  constructor() {
    super();
  }
  _buildColors() {
    this._colors = new TestColors();
  }
};
function shuffle2(array) {
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
function assertTrue(val) {
  if (!val) {
    throw new Error("val is not true");
  }
}
function loop(g, numLoops) {
  for (let i = 0; i < numLoops; i++) {
    g.selectColor(1);
  }
}
function _split(color2) {
  const [index, bit] = [color2 >> 5, 2 ** (color2 & 31)];
  return [index, bit];
}
function testSelectColor() {
  const g = new TestGame();
  let selected = g.color1;
  let eliminated = g.color2;
  g.selectColor(1);
  assertTrue(g.isEliminated(eliminated));
  assertTrue(g.isSelected(selected));
  for (let i = 0; i < 65535; i++) {
    selected = g.color1;
    eliminated = g.color2;
    g.selectColor(1);
    assertTrue(g.isEliminated(eliminated));
    assertTrue(g.isSelected(selected));
  }
  console.log("testSelectColor PASS");
}
function testUintArray() {
  const ary = new Uint32Array(524288);
  for (let i = 0; i < MAX_COLORS3; i++) {
    const [index, bit] = _split(i);
    const num = ary[index];
    if (num === void 0) {
      console.log("num is not truthy: ", num);
      continue;
    }
    assertTrue(!(num & bit));
    ary[index] |= bit;
  }
  console.log("testUintArray PASS");
}
async function testColorUniqueness() {
  async function _assertTrue(val) {
    if (!val) {
      const elimFh = await fsPromises.open("elim.txt", "w");
      const seleFh = await fsPromises.open("sele.txt", "w");
      const coloFh = await fsPromises.open("colo.txt", "w");
      for (let num of g.eliminatedColors.raw) {
        await elimFh.write(num.toString() + "\n");
      }
      for (let num of g.selectedColors.raw) {
        await seleFh.write(num.toString() + "\n");
      }
      for (let num of colors) {
        await coloFh.write(num.toString() + "\n");
      }
      await elimFh.close();
      await seleFh.close();
      await coloFh.close();
      throw new Error("val is not true");
    }
  }
  const g = new TestGame();
  const colors = /* @__PURE__ */ new Set();
  for (let i = 0; i < MAX_COLORS3 / 2; i++) {
    await _assertTrue(!colors.has(g.color1));
    await _assertTrue(!colors.has(g.color2));
    colors.add(g.color1);
    colors.add(g.color2);
    g.selectColor(1);
  }
  console.log("testColorUniqueness PASS");
}
function testCheckForNewIteration() {
  const g = new TestGame();
  let curColors = g.colorsRemainingCurrentIteration;
  let curIter = g.currentIteration;
  function _assertTrue(val) {
    if (!val) {
      console.log(g);
      console.log("curIter: ", curIter);
      console.log("curColors: ", curColors);
      assertTrue(val);
    }
  }
  function assertVals() {
    _assertTrue(g.currentIteration === curIter);
    _assertTrue(g.colorsRemainingCurrentIteration === curColors);
  }
  function incrementVals() {
    curColors = MAX_COLORS3 / 2 ** curIter;
    curIter++;
  }
  while (curColors !== 2) {
    loop(g, MAX_COLORS3 / 2 ** curIter - 1);
    _assertTrue(g.currentIteration === curIter);
    g.selectColor(1);
    incrementVals();
    assertVals();
  }
  _assertTrue(!g.favoriteColor);
  const c1 = g.color1;
  const c2 = g.color2;
  console.log(c1, c2);
  g.selectColor(2);
  _assertTrue(g.favoriteColor || g.favoriteColor === 0);
  _assertTrue(g.favoriteColor === c2);
  console.log("testCheckForNewIteration PASS");
}
async function gameTests() {
  testSelectColor();
  testUintArray();
  await testColorUniqueness();
  testCheckForNewIteration();
}

// tests/tests.ts
gameTests();
//# sourceMappingURL=tests.cjs.map
