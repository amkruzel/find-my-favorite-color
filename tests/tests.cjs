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
var import_node_test5 = require("node:test");

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
    if (c === void 0) {
      console.log(this.ary);
    }
    assertDefined(c);
    return c;
  }
  get next1000Colors() {
    return Uint32Array.from(this.ary.slice(-1e3, this.ary.length));
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
var import_node_assert2 = __toESM(require("node:assert"), 1);

// tests/condensedColors.test.ts
var import_node_assert = __toESM(require("node:assert"), 1);
var import_node_test = require("node:test");
var TestCondensedColors = class extends CondensedColors {
  constructor(vals) {
    super(vals);
  }
  get raw() {
    return this.ary;
  }
};
var condensedColorTests = () => {
  const c = new TestCondensedColors();
  function randomInt() {
    return ~~(Math.random() * Game.MAX_COLORS);
  }
  (0, import_node_test.describe)("CondensedColors", () => {
    (0, import_node_test.it)("correctly inserts colors", () => {
      for (let i = 0; i < 10; i++) {
        const int = randomInt();
        assertColor(int);
        if (!c.has(int)) {
          c.add(int);
        }
        import_node_assert.default.equal(c.has(int), true);
      }
    });
    (0, import_node_test.it)("returns a blob that can be converted back to CondensedColors", async () => {
      const b = c.blob;
      const newC = new TestCondensedColors(await b.arrayBuffer());
      const newB = newC.blob;
      const arrayBufferFileA = await b.arrayBuffer();
      const arrayBufferFileB = await newB.arrayBuffer();
      import_node_assert.default.equal(
        arrayBufferFileA.byteLength,
        arrayBufferFileB.byteLength
      );
      const uint8ArrayA = new Uint8Array(arrayBufferFileA);
      const uint8ArrayB = new Uint8Array(arrayBufferFileB);
      for (let i = 0, len = uint8ArrayA.length; i < len; i++) {
        import_node_assert.default.equal(uint8ArrayA[i], uint8ArrayB[i]);
      }
    });
    (0, import_node_test.it)("loads from ArrayBuffer correctly", async () => {
      const x = await c.blob.arrayBuffer();
      const newC = new TestCondensedColors(x);
      for (let i = 0; i < Game.MAX_COLORS; i++) {
        assertColor(i);
        import_node_assert.default.equal(c.has(i), newC.has(i));
      }
    });
  });
};

// tests/colors.test.ts
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
    if (!data) {
      this.bgNew();
    } else {
      this.bgLoad(data);
    }
    this.isBgWorkDone = true;
  }
  bgNew() {
    const tmp = [];
    for (let i = 0; i < Game.MAX_COLORS; i++) {
      tmp.push(i);
    }
    const tmp2 = shuffle(tmp);
    assertColorsAry(tmp2);
    this.ary = tmp2;
  }
  bgLoad(data) {
    const eliminated = new TestCondensedColors(data.eliminated);
    const selected = new TestCondensedColors(data.selected);
    const newColors = [];
    for (let color2 = 0; color2 < Game.MAX_COLORS; color2++) {
      assertColor(color2);
      const isEliminated = eliminated.has(color2);
      const isSelected = selected.has(color2);
      const alreadyIncluded = this.ary.includes(color2);
      if (isSelected) {
        this.selectedColors.push(color2);
        continue;
      }
      if (isEliminated || alreadyIncluded) {
        continue;
      }
      newColors.push(color2);
    }
    shuffle(newColors);
    shuffle(this.selectedColors);
    assertColorsAry(newColors);
    const HUNDRED_THOU = 1e5;
    for (let i = 0; i < 170; i++) {
      const min = i * HUNDRED_THOU;
      const max = min + HUNDRED_THOU;
      if (min >= Game.MAX_COLORS) {
        break;
      }
      const colorsSubset = newColors.slice(min, max);
      this.ary.splice(0, 0, ...colorsSubset);
    }
  }
};
var colorTests = () => {
  (0, import_node_test2.describe)("Colors", () => {
    const c = new TestColors();
    (0, import_node_test2.it)("should initialize", () => {
      import_node_assert2.default.equal(true, c.isBgWorkDone);
    });
    (0, import_node_test2.it)("should get new colors after a selection", () => {
      const [c1, c2] = [c.color1, c.color2];
      c.select(1);
      import_node_assert2.default.notEqual(c1, c.color1);
      import_node_assert2.default.notEqual(c2, c.color2);
    });
    (0, import_node_test2.it)("should correctly select colors", () => {
      const numSelections = c.raw.length / 2;
      for (let i = 0; i < numSelections - 1; i++) {
        c.select(1);
      }
      import_node_assert2.default.equal(c.raw.length, 2);
    });
    (0, import_node_test2.it)("should currectly shuffle when there are only two colors", () => {
      const [c1, c2] = [c.color1, c.color2].sort();
      c.shuffle();
      const [newC1, newC2] = [c.color1, c.color2].sort();
      import_node_assert2.default.equal(c1, newC1);
      import_node_assert2.default.equal(c2, newC2);
    });
    (0, import_node_test2.it)("should rebuild the array once all colors have been selected", () => {
      c.select(2);
      import_node_assert2.default.equal(c.raw.length, Game.MAX_COLORS / 2);
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
      import_node_assert2.default.equal(1e3, c2.next1000Colors.length);
      const next1000b = new Blob([c2.next1000Colors]);
      const next1000 = await next1000b.arrayBuffer();
      const eliminated = await elim.blob.arrayBuffer();
      const selected = await select.blob.arrayBuffer();
      const newC = new TestColors({ next1000, eliminated, selected });
      import_node_assert2.default.equal(c2.color1, newC.color1);
      import_node_assert2.default.equal(c2.color2, newC.color2);
    });
  });
};

// scripts/formConverter.ts
var FormConverter = class _FormConverter {
  static signup(fe) {
    const form = new FormData(fe);
    _FormConverter.tryAddProp(form, "password", "passwordConfirm");
    return form;
  }
  static login(fe) {
    const form = new FormData(fe);
    _FormConverter.tryAddProp(form, "identity", "email");
    return form;
  }
  static from(obj) {
    const form = new FormData();
    for (const [key, val] of obj) {
      form.append(key, val);
    }
    return form;
  }
  static game(game, userId) {
    const elimColorBlob = game.eliminatedColors.blob;
    const selectColorBlob = game.selectedColors.blob;
    const colorsBlob = new Blob([game.next1000Colors]);
    const form = new FormData();
    form.set("eliminatedColors", elimColorBlob);
    form.set("selectedColors", selectColorBlob);
    form.set("colors", colorsBlob);
    form.set("properties", JSON.stringify(game.properties));
    form.set("user", userId);
    return form;
  }
  static tryAddProp(form, nameToGet, nameToAdd) {
    const prop = form.get(nameToGet);
    if (!prop || !(typeof prop === "string")) {
      return;
    }
    form.set(nameToAdd, prop);
  }
};

// scripts/user.ts
function userFrom(obj) {
  return obj;
}

// scripts/db.ts
var DbError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "DbError";
  }
};
var Db = class {
  constructor(protocol, ip, port) {
    this._path = `${protocol}://${ip}:${port}`;
    this._pendingSave = false;
  }
  /**
   * required fields are:
   * - email
   * - password
   * - passwordConfirm
   */
  async signup(f) {
    return await this.try("signup", f);
  }
  /**
   * required fields are:
   * - identity
   * - password
   */
  async login(f) {
    return await this.try("login", f);
  }
  async getUser(id) {
    const res = await this._getUser(`records/${id}`);
    return await this._parseUserResponse(res);
  }
  async try(action, form) {
    const data = {
      method: "post",
      body: form
    };
    switch (action) {
      case "login":
        return await this.tryLogin(data);
      case "signup":
        return await this.trySignup(data);
      case "changepw":
        return await this.tryChangePw(data);
      default:
        throw new Error(`'action' was not an expected value`);
    }
  }
  async tryLogin(data) {
    try {
      const response = await this._getUser("auth-with-password", data);
      return await this._parseUserResponse(response, "record");
    } catch (err) {
      throw new DbError(
        "Unable to login; email or password is incorrect.",
        { cause: err }
      );
    }
  }
  async trySignup(data) {
    try {
      const response = await this._getUser("records", data);
      return await this._parseUserResponse(response);
    } catch (err) {
      throw new DbError("Unable to sign-up; user might already exist.", {
        cause: err
      });
    }
  }
  async tryChangePw(data) {
    throw new Error("Method 'tryChangePw' is not implemented!");
  }
  async _getUser(path, data) {
    return await fetch(`${this.path.users}/${path}`, data);
  }
  async _parseUserResponse(response, propName) {
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.message, {
        cause: json
      });
    }
    return userFrom(propName ? json[propName] : json);
  }
  async save(game, userId) {
    if (this.cannotSaveNow(userId)) {
      return;
    }
    this._pendingSave = true;
    const prevGame = await this._getGameIfOneExists(userId);
    await this._createOrUpdate(game, userId, prevGame?.id);
    this._pendingSave = false;
  }
  cannotSaveNow(userId) {
    return userId === "guest" || this._pendingSave;
  }
  async load(userId) {
    const game = await this._getGameIfOneExists(userId);
    if (!game) {
      return new Game();
    }
    const [eliminated, selected, colors] = await this._getFiles(game);
    return new Game(
      {
        eliminated,
        selected,
        colors
      },
      game.properties
    );
  }
  async delete(userId) {
    const game = await this._getGameIfOneExists(userId);
    if (!game) {
      return;
    }
    await this._delete(game.id);
  }
  async _getGameIfOneExists(userId) {
    const response = await fetch(
      `${this.path.games}/records?filter=(user='${userId}')`
    );
    const json = await response.json();
    if (json.totalItems === 0) {
      return null;
    }
    if (!response.ok) {
      throw new DbError(json?.message, {
        cause: { code: json?.code, data: json?.data }
      });
    }
    if (json.totalItems !== 1) {
      throw new DbError("User has more than one game saved.");
    }
    const game = json.items[0];
    return {
      id: game.id,
      user: game.user,
      properties: game.properties,
      eliminatedColors: game.eliminatedColors,
      selectedColors: game.selectedColors,
      colors: game.colors
    };
  }
  async _createOrUpdate(game, userId, gameId) {
    const form = FormConverter.game(game, userId);
    if (gameId) {
      await this._patch(form, gameId);
    } else {
      await this._post(form);
    }
  }
  async _post(form) {
    const data = {
      method: "POST",
      body: form
    };
    return fetch(`${this.path.games}/records`, data);
  }
  async _patch(form, id) {
    const data = {
      method: "PATCH",
      body: form
    };
    return fetch(`${this.path.games}/records/${id}`, data);
  }
  async _delete(id) {
    return fetch(`${this.path.games}/records/${id}`, { method: "DELETE" });
  }
  async _getFiles(game) {
    return Promise.all([
      this._getFile(game.id, game.eliminatedColors),
      this._getFile(game.id, game.selectedColors),
      this._getFile(game.id, game.colors)
    ]);
  }
  async _getFile(gameId, filename) {
    const res = await fetch(`${this.path.files}/${gameId}/${filename}`);
    if (!res.ok) {
      throw new DbError(`File ${filename} was unable to be retrieved.`, {
        cause: await res.json()
      });
    }
    return await res.arrayBuffer();
  }
  get path() {
    return {
      games: this._path + "/api/collections/games",
      files: this._path + "/api/files/games",
      users: this._path + "/api/collections/users"
    };
  }
};

// tests/db.test.ts
var import_node_test4 = require("node:test");
var import_assert2 = __toESM(require("assert"), 1);

// tests/game.test.ts
var fsPromises = __toESM(require("fs/promises"), 1);
var import_node_test3 = require("node:test");
var import_assert = __toESM(require("assert"), 1);
var TestGame = class extends Game {
  constructor(arys, props) {
    super(arys, props);
  }
  get testingProps() {
    return [this._colors.raw, this._colors.nextIter];
  }
  _buildColors(data) {
    this._colors = new TestColors(data);
  }
};
function assertTrue(val) {
  import_assert.default.equal(true, val);
}
function loop(g, numLoops) {
  for (let i = 0; i < numLoops; i++) {
    g.selectColor(1);
  }
}
async function gameToLoadData(game) {
  return [await getAryBuffers(game), game.properties];
}
async function getAryBuffers(game) {
  const colors = await new Blob([game.next1000Colors]).arrayBuffer();
  const eliminated = await game.eliminatedColors.blob.arrayBuffer();
  const selected = await game.selectedColors.blob.arrayBuffer();
  return {
    colors,
    eliminated,
    selected
  };
}
var gameTests = () => {
  (0, import_node_test3.describe)("Game", () => {
    const g1 = new TestGame();
    (0, import_node_test3.it)("selects colors correctly", () => {
      let selected = g1.color1;
      let eliminated = g1.color2;
      g1.selectColor(1);
      assertTrue(g1.isEliminated(eliminated));
      assertTrue(g1.isSelected(selected));
      for (let i = 0; i < 65535; i++) {
        selected = g1.color1;
        eliminated = g1.color2;
        g1.selectColor(1);
        assertTrue(g1.isEliminated(eliminated));
        assertTrue(g1.isSelected(selected));
      }
    });
    (0, import_node_test3.it)("should always have unique colors", async () => {
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
      for (let i = 0; i < Game.MAX_COLORS / 2; i++) {
        await _assertTrue(!colors.has(g.color1));
        await _assertTrue(!colors.has(g.color2));
        colors.add(g.color1);
        colors.add(g.color2);
        g.selectColor(1);
      }
    });
    (0, import_node_test3.it)("should correctly change iterations", () => {
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
        curColors = Game.MAX_COLORS / 2 ** curIter;
        curIter++;
      }
      while (curColors !== 2) {
        loop(g, Game.MAX_COLORS / 2 ** curIter - 1);
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
    });
    (0, import_node_test3.it)("should correctly load a game", async () => {
      const [arys, props] = await gameToLoadData(g1);
      const newG = new TestGame(arys, props);
      import_assert.default.equal(newG.color1, g1.color1);
      import_assert.default.equal(newG.color2, g1.color2);
    });
  });
};

// tests/db.test.ts
var TestDb = class extends Db {
  async load(userId) {
    const game = await this._getGameIfOneExists(userId);
    if (!game) {
      return new TestGame();
    }
    const [eliminated, selected, colors] = await this._getFiles(game);
    return new TestGame(
      {
        eliminated,
        selected,
        colors
      },
      game.properties
    );
  }
};
var db = new TestDb("http", "34.42.14.226", "8090");
var dbTests = () => {
  (0, import_node_test4.describe)("Db", () => {
    let newUserId;
    (0, import_node_test4.describe)("auth methods", () => {
      const myUserId = "bdnqbqys20625ct";
      const testEmail = `asdf@${makeId(5)}.c`;
      const testPw = "12345678";
      (0, import_node_test4.it)("should create a user", async () => {
        const i = /* @__PURE__ */ new Map();
        i.set("email", testEmail);
        i.set("password", testPw);
        i.set("passwordConfirm", testPw);
        const f = FormConverter.from(i);
        const u = await db.signup(f);
        newUserId = u.id;
      });
      (0, import_node_test4.it)("should login in existing user", async () => {
        const i = /* @__PURE__ */ new Map();
        i.set("identity", testEmail);
        i.set("password", testPw);
        const f = FormConverter.from(i);
        await db.login(f);
      });
      (0, import_node_test4.it)("should throw an error for invalid credentials", async () => {
        const i = /* @__PURE__ */ new Map();
        i.set("identity", testEmail);
        i.set("password", "asdfasdfa");
        const f = FormConverter.from(i);
        try {
          await db.login(f);
          import_assert2.default.fail("login should have thrown an error");
        } catch (error) {
          import_assert2.default.equal(
            error.message,
            "Unable to login; email or password is incorrect."
          );
        }
      });
      (0, import_node_test4.it)("should get info about existing user without logging in", async () => {
        const u = await db.getUser(myUserId);
        import_assert2.default.equal("kruzelm.alex@gmail.com", u.email);
      });
    });
    (0, import_node_test4.describe)("game methods", () => {
      const g = new TestGame();
      for (let i = 0; i < 50; i++) {
        g.selectColor(2);
      }
      console.log(g.next1000Colors);
      (0, import_node_test4.it)("should save a new game without throwing errors", async () => {
        await db.save(g, newUserId);
      });
      (0, import_node_test4.it)("should load a game without throwing errors", async () => {
        const gameData = await db.load(newUserId);
        console.log(gameData.next1000Colors);
        import_assert2.default.equal(gameData.color1, g.color1);
        import_assert2.default.equal(gameData.color2, g.color2);
      });
      (0, import_node_test4.it)("should delete a game without throwing errors", async () => {
        await db.delete(newUserId);
        const newG = await db.load(newUserId);
        import_assert2.default.equal(
          TestGame.MAX_COLORS,
          newG.colorsRemainingCurrentIteration
        );
      });
    });
  });
};
function makeId(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
    counter += 1;
  }
  return result;
}

// tests/tests.ts
(0, import_node_test5.describe)("Classes", () => {
  colorTests();
  condensedColorTests();
  gameTests();
  dbTests();
});
//# sourceMappingURL=tests.cjs.map
