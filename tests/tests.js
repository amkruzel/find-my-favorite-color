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
function assertColor(value) {
  if (parseInt(`${value}`) !== value || value < 0 || value > 16777215) {
    throw new Error("Not a color!");
  }
}
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
function createGame() {
  const _colors = _getAvailableColors();
  const [color1, color2] = _getTwoUniqueColors(_colors);
  const game = {
    eliminatedColors: new Uint32Array(524288),
    selectedColors: new Uint32Array(524288),
    currentIteration: 1,
    colorsRemainingCurrentIteration: 16777216,
    color1,
    color2,
    _colors
  };
  return game;
}
function selectColor(game, num) {
  _updateSelectedColors(game, num);
  game.colorsRemainingCurrentIteration -= 2;
  _checkForNewIteration(game);
  pickTwoColors(game);
}
function pickTwoColors(game) {
  if (game._colors.length < 2) {
    return;
  }
  game.color1 = game._colors.pop();
  game.color2 = game._colors.pop();
}
function isEliminated(game, color2) {
  return _is("eliminated", game, color2);
}
function isSelected(game, color2) {
  return _is("selected", game, color2);
}
function _is(testingFor, game, color2) {
  const [index, bit] = _split(color2);
  let num;
  if (testingFor === "eliminated") {
    num = game.eliminatedColors[index];
  } else {
    num = game.selectedColors[index];
  }
  if (num === void 0) {
    return false;
  }
  return !!(num & bit);
}
function _split(color2) {
  const [index, bit] = [color2 >> 5, 2 ** (color2 & 31)];
  assertIndex(index);
  assertBit(bit);
  return [index, bit];
}
function _do(action, game, color2) {
  const [index, bit] = _split(color2);
  const array = action === "select" ? "selectedColors" : "eliminatedColors";
  game[array][index] |= bit;
}
function _getTwoUniqueColors(colors) {
  if (colors) {
    const color12 = colors.pop();
    const color22 = colors.pop();
    return [color12, color22];
  }
  const color1 = Math.floor(Math.random() * 16777216);
  let color2 = Math.floor(Math.random() * 16777216);
  while (color2 == color1) {
    color2 = Math.floor(Math.random() * 16777216);
  }
  assertColor(color1);
  assertColor(color2);
  return [color1, color2];
}
function _updateSelectedColors(game, num) {
  const selectedColor = num === 1 ? game.color1 : game.color2;
  const rejectedColor = num === 1 ? game.color2 : game.color1;
  _do("select", game, selectedColor);
  _do("eliminate", game, rejectedColor);
}
function _checkForNewIteration(game) {
  if (game.colorsRemainingCurrentIteration !== 0) {
    return;
  }
  game.currentIteration++;
  game.selectedColors = new Uint32Array(524288);
  game.colorsRemainingCurrentIteration = 16777216 / 2 ** game.currentIteration;
}
function _getAvailableColors() {
  const availColors = [];
  for (let i = 0; i < 16777216; i++) {
    availColors.push(i);
  }
  return shuffle(availColors);
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

// tests/game.test.ts
var fsPromises = __toESM(require("fs/promises"), 1);
var MAX_COLORS = 16777216;
function assertTrue(val) {
  if (!val) {
    throw new Error("val is not true");
  }
}
function testSelectColor() {
  const g = createGame();
  let selected = g.color1;
  let eliminated = g.color2;
  selectColor(g, 1);
  assertTrue(isEliminated(g, eliminated));
  assertTrue(isSelected(g, selected));
  for (let i = 0; i < 65535; i++) {
    selected = g.color1;
    eliminated = g.color2;
    selectColor(g, 1);
    console.log(i);
    assertTrue(isEliminated(g, eliminated));
    assertTrue(isSelected(g, selected));
  }
}
function testUintArray() {
  const ary = new Uint32Array(524288);
  for (let i = 0; i < MAX_COLORS; i++) {
    const [index, bit] = _split(i);
    const num = ary[index];
    if (num === void 0) {
      console.log("num is not truthy: ", num);
      continue;
    }
    assertTrue(!(num & bit));
    ary[index] |= bit;
  }
  console.log(ary);
}
async function testColorUniqueness() {
  async function _assertTrue(val) {
    if (!val) {
      const elimFh = await fsPromises.open("elim.txt");
      const seleFh = await fsPromises.open("sele.txt");
      const coloFh = await fsPromises.open("colo.txt");
      for (let num of g.eliminatedColors) {
        await elimFh.write(num.toString());
      }
      await elimFh.close();
      throw new Error("val is not true");
    }
  }
  console.log("begin testColorUniqueness");
  const g = createGame();
  const colors = /* @__PURE__ */ new Set();
  for (let i = 0; i < MAX_COLORS / 2 + 1; i++) {
    _assertTrue(!colors.has(g.color1));
    _assertTrue(!colors.has(g.color2));
    colors.add(g.color1);
    colors.add(g.color2);
    selectColor(g, 1);
  }
  console.log("end testColorUniqueness");
}
function gameTests() {
  testSelectColor();
  testUintArray();
  testColorUniqueness();
}

// tests/tests.ts
gameTests();
//# sourceMappingURL=tests.js.map
