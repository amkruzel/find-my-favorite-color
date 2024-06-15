"use strict";

// tests/tests.ts
var import_node_test5 = require("node:test");

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
  get isNewGame() {
    return this._isNewGame;
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
    this._isNewGame = true;
    this.eliminatedColors = new CondensedColors();
    this.selectedColors = new CondensedColors();
    this._currentIteration = 1;
    this._colorsRemainingCurrentIteration = _Game.MAX_COLORS;
    this._favoriteColorFound = false;
    this._buildColors();
  }
  _load(arys, props) {
    this._isNewGame = false;
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
    this._isNewGame = false;
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
  constructor(path) {
    this._path = path;
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

// tests/colors.test.ts
var import_node_test2 = require("node:test");

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

// tests/game.test.ts
var import_node_test3 = require("node:test");
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
function createCompletedGame() {
  const g = new TestGame();
  while (!g.favoriteColor) {
    g.selectColor(1);
  }
  return g;
}

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
var db = new TestDb("https://fmfc.alexkruzel.com");
async function saveCompletedGame() {
  const testUserId = "nibf2tps5tidz5h";
  const game = createCompletedGame();
  await db.save(game, testUserId);
}

// tests/tests.ts
(0, import_node_test5.describe)("Classes", () => {
  saveCompletedGame();
});
//# sourceMappingURL=tests.cjs.map
