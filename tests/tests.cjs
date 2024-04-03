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

// scripts/game.ts
function assertIndex(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value > 524288) {
    throw new Error("Not an index!");
  }
}
function assertBit(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value & value - 1) {
    throw new Error("Not a bit!");
  }
}
function _split(color2) {
  const [index, bit] = [color2 >> 5, 2 ** (color2 & 31)];
  assertIndex(index);
  assertBit(bit);
  return [index, bit];
}

// scripts/_game.ts
var MAX_COLORS = 16777216;
function assertColor(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value > 16777215) {
    throw new Error("Not a color!");
  }
}
function assertIndex2(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value > 524288) {
    throw new Error("Not an index!");
  }
}
function assertBit2(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value & value - 1) {
    throw new Error("Not a bit!");
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
var _Game = class {
  constructor() {
    this._init();
  }
  get color1() {
    return this._colors[this._colors.length - 1];
  }
  get color2() {
    return this._colors[this._colors.length - 2];
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
  selectColor(num) {
    this._updateSelectedColors(num);
    this._colorsRemainingCurrentIteration -= 2;
    this._checkForNewIteration();
    this._checkForFavoriteColor();
  }
  reset() {
    this._init();
  }
  shuffleColors() {
    shuffle(this._colors);
  }
  isEliminated(color2) {
    return this._is(color2, "eliminated");
  }
  isSelected(color2) {
    return this._is(color2, "selected");
  }
  _init() {
    this.eliminatedColors = new Uint32Array(524288);
    this.selectedColors = new Uint32Array(524288);
    this._currentIteration = 1;
    this._colorsRemainingCurrentIteration = MAX_COLORS;
    this._favoriteColorFound = false;
    this._nextIterationColors = [];
    this._initColors();
  }
  _initColors() {
    this._colors = [0, 1];
    for (let i = 2; i < 16777216; i++) {
      this._colors.push(i);
    }
    shuffle(this._colors);
  }
  _updateSelectedColors(num) {
    const _do = (action, color2) => {
      const [index, bit] = this._split(color2);
      const array = action === "select" ? "selectedColors" : "eliminatedColors";
      assertColor(color2);
      if (action === "select") {
        this._nextIterationColors.push(this._colors.pop());
      } else {
        this._colors.pop();
      }
      this[array][index] |= bit;
    };
    const selectAndEliminateColors = (select, elim) => {
      _do("select", select);
      _do("eliminate", elim);
    };
    const selectedColor = num === 1 ? this.color1 : this.color2;
    const rejectedColor = num === 1 ? this.color2 : this.color1;
    selectAndEliminateColors(selectedColor, rejectedColor);
  }
  _split(color2) {
    const [index, bit] = [color2 >> 5, 2 ** (color2 & 31)];
    assertIndex2(index);
    assertBit2(bit);
    return [index, bit];
  }
  _checkForNewIteration() {
    if (this.colorsRemainingCurrentIteration !== 0) {
      return;
    }
    this._colorsRemainingCurrentIteration = MAX_COLORS / 2 ** this.currentIteration;
    this._currentIteration++;
    this.selectedColors = new Uint32Array(524288);
    if (this._nextIterationColors.length < 1) {
      throw new Error("Array is empty but should not be");
    }
    this._colors = shuffle(this._nextIterationColors);
    this._nextIterationColors = [];
  }
  _checkForFavoriteColor() {
    this._favoriteColorFound = this.colorsRemainingCurrentIteration === 1;
  }
  _is(color2, testingFor) {
    const [index, bit] = this._split(color2);
    const num = testingFor === "eliminated" ? this.eliminatedColors[index] : this.selectedColors[index];
    if (num === void 0) {
      return false;
    }
    return !!(num & bit);
  }
};

// tests/game.test.ts
var fsPromises = __toESM(require("fs/promises"), 1);
var MAX_COLORS2 = 16777216;
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
function testSelectColor() {
  const g = new _Game();
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
  for (let i = 0; i < MAX_COLORS2; i++) {
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
      for (let num of g.eliminatedColors) {
        await elimFh.write(num.toString() + "\n");
      }
      for (let num of g.selectedColors) {
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
  const g = new _Game();
  const colors = /* @__PURE__ */ new Set();
  for (let i = 0; i < MAX_COLORS2 / 2; i++) {
    await _assertTrue(!colors.has(g.color1));
    await _assertTrue(!colors.has(g.color2));
    colors.add(g.color1);
    colors.add(g.color2);
    g.selectColor(1);
  }
  console.log("testColorUniqueness PASS");
}
function testCheckForNewIteration() {
  const g = new _Game();
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
    curColors = MAX_COLORS2 / 2 ** curIter;
    curIter++;
  }
  while (curColors !== 2) {
    loop(g, MAX_COLORS2 / 2 ** curIter - 1);
    _assertTrue(g.currentIteration === curIter);
    g.selectColor(1);
    incrementVals();
    assertVals();
  }
  _assertTrue(!g.favoriteColor);
  const c1 = g.color1;
  g.selectColor(2);
  _assertTrue(g.favoriteColor || g.favoriteColor === 0);
  _assertTrue(g.favoriteColor === c1);
  console.log(g);
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
