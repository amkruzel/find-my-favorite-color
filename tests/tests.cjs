"use strict";

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
var ColorsAry = class {
  static new() {
    return new Array();
  }
};
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
  select(num) {
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
  static load(data) {
    const c = new _Colors();
    c.load(data);
    return c;
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
  load(data) {
    const tmp = Array.from(new Uint32Array(data.next1000));
    assertColorsAry(tmp);
    this.ary = tmp;
    this.loadBg({ eliminated: data.eliminated, selected: data.selected });
  }
  loadBg(data) {
    console.log("_buildColorsBg");
    const worker = new Worker("workers/loadColors.js");
    worker.postMessage([this.ary, data, this.reloadBgKey]);
    worker.addEventListener("message", (msg) => {
      const [[colors, selectedColors], oldKey] = msg.data;
      if (oldKey !== _Colors.bgKey) {
        return;
      }
      console.log(colors);
      assertColorsAry(colors);
      this.ary.splice(0, 0, ...colors);
      if (selectedColors.length !== 0) {
        this.selectedColors.splice(0, 0, ...selectedColors);
      }
    });
  }
  init() {
    this.ary = ColorsAry.new();
    this.selectedColors = Array();
    this.first1000();
    this.background();
  }
  first1000() {
    for (let i = 0; i < 1e3; i++) {
      let color3;
      do {
        color3 = ~~(Math.random() * MAX_COLORS);
        assertColor(color3);
      } while (this.ary.includes(color3));
      this.ary.push(color3);
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
  isEliminated(color3) {
    return this.eliminatedColors.has(color3);
  }
  isSelected(color3) {
    return this.selectedColors.has(color3);
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
    const data = {
      next1000: colors,
      eliminated,
      selected
    };
    this._loadColors(data);
  }
  _loadColors(data) {
    this._colors = Colors.load(data);
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
    const [selected, rejected] = this._colors.select(num);
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

// scripts/user.ts
function getUser(obj) {
  return obj;
}
function guestUser() {
  return getUser({
    id: "guest"
  });
}

// scripts/db.ts
function assertUser(app2) {
  if (!app2.user) {
    return;
  }
}
var Db = class {
  constructor(protocol, ip, port) {
    this._path = `${protocol}://${ip}:${port}`;
    this._pendingSave = false;
  }
  async tryLogin(data) {
    const response = await this._fetchUsers("auth-with-password", data);
    return await this._parseResponse(response, "record");
  }
  async trySignup(data) {
    const response = await this._fetchUsers("records", data);
    return await this._parseResponse(response);
  }
  async save(app2) {
    if (app2.user.id === "guest") {
      return false;
    }
    if (this._pendingSave) {
      return false;
    }
    this._pendingSave = true;
    assertUser(app2);
    const game = await this._getGameIfOneExists(app2.user.id);
    console.log(game);
    const rv = await this._createOrUpdate(app2, game?.id);
    this._pendingSave = false;
    return rv;
  }
  async load(app2) {
    if (app2.user.id === "guest") {
      return;
    }
    const game = await this._getGameIfOneExists(app2.user.id);
    if (!game) {
      return;
    }
    const [eliminatedColors, selectedColors, colors] = await this._getFiles(
      game
    );
    if (!eliminatedColors || !selectedColors || !colors) {
      return;
    }
    app2.game = new Game(
      eliminatedColors,
      selectedColors,
      colors,
      game.properties
    );
  }
  get path() {
    return {
      games: this._path + "/api/collections/games",
      files: this._path + "/api/files/games",
      users: this._path + "/api/collections/users"
    };
  }
  async _createOrUpdate(app2, gameId) {
    const form = this._buildForm(app2);
    let response;
    if (gameId) {
      response = await this._patch(form, gameId);
    } else {
      response = await this._post(form);
    }
    return true;
  }
  _buildForm(app2) {
    const elimColorBlob = app2.game.eliminatedColors.blob;
    const selectColorBlob = app2.game.selectedColors.blob;
    const colorsBlob = new Blob([app2.game.next1000Colors]);
    const form = new FormData();
    form.set("eliminatedColors", elimColorBlob);
    form.set("selectedColors", selectColorBlob);
    form.set("colors", colorsBlob);
    form.set("properties", JSON.stringify(app2.game.properties));
    form.set("user", app2.user.id);
    return form;
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
  async _getFiles(game) {
    return Promise.all([
      this._getFile(game.id, game.eliminatedColors),
      this._getFile(game.id, game.selectedColors),
      this._getFile(game.id, game.colors)
    ]);
  }
  async _getFile(gameId, filename) {
    try {
      const res = await fetch(`${this.path.files}/${gameId}/${filename}`);
      if (!res.ok) {
        return null;
      }
      return await res.arrayBuffer();
    } catch (error) {
      return null;
    }
  }
  async _getGameIfOneExists(userId) {
    try {
      const response = await fetch(
        `${this.path.games}/records?filter=(user='${userId}')`
      );
      if (!response.ok) {
        return null;
      }
      const json = await response.json();
      if (json.totalItems != 1) {
        return null;
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
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  async _fetchUsers(path, data) {
    return await fetch(`${this.path.users}/${path}`, data);
  }
  async _parseResponse(response, propName) {
    const json = await response.json();
    if (response.status != 200) {
      return Error(json.message);
    }
    return getUser(propName ? json[propName] : json);
  }
};

// tests/colors.test.ts
var TestColors = class extends Colors {
  constructor() {
    super();
  }
  get raw() {
    return this.ary;
  }
  get nextIter() {
    return this.selectedColors;
  }
  background() {
    const tmpClr = this.ary;
    let newColors = [];
    for (let i = 0; i < MAX_COLORS2; i++) {
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
      if (min >= MAX_COLORS2) {
        break;
      }
      const subset = newColors.slice(min, max);
      this.ary.splice(0, 0, ...subset);
    }
  }
};

// tests/condensedColors.test.ts
var TestCondensedColors = class extends CondensedColors {
  get raw() {
    return this.ary;
  }
};

// tests/game.test.ts
var TestGame = class extends Game {
  constructor() {
    super();
  }
  get testingProps() {
    return [this._colors.raw, this._colors.nextIter];
  }
  _buildColors() {
    this._colors = new TestColors();
    this.selectedColors = new TestCondensedColors();
    this.eliminatedColors = new TestCondensedColors();
  }
};

// tests/db.test.ts
var app = {
  game: new TestGame(),
  user: guestUser()
};
var db = new Db("http", "34.42.14.226", "8090");
function assertTrue(val) {
  if (!val) {
    throw new Error("val is not true");
  }
}
for (let i = 0; i < 1048575; i++) {
  app.game.selectColor(1);
}
async function testSaveAndLoad() {
  const g = app.game;
  const eliminated = g.eliminatedColors;
  const selected = g.selectedColors;
  const [colors, nextIterationColors] = g.testingProps;
  await db.save(app);
  await db.load(app);
  for (let i2 = 0; i2 < 524288; i2++) {
    console.log(i2, eliminated.raw[0]);
    assertTrue(eliminated.raw[i2] === g.eliminatedColors.raw[i2]);
    assertTrue(selected.raw[i2] === g.selectedColors.raw[i2]);
  }
  const [newColors, newNextIterationColors] = g.testingProps;
  let i = 0, n = 0;
  console.log("testing colors");
  for (const color3 of colors) {
    assertTrue(newColors.includes(color3));
    i++;
    if (i % 100 === 0) {
      console.log(".");
    }
    if (i % 1e3 === 0) {
      console.log(n);
      n++;
    }
  }
  ;
  i = 0, n = 0;
  console.log("testing nextIterationColors");
  for (const color3 of nextIterationColors) {
    assertTrue(newNextIterationColors.includes(color3));
    i++;
    if (i % 100 === 0) {
      console.log(".");
    }
    if (i % 1e3 === 0) {
      console.log(n);
      n++;
    }
  }
  console.log("all are equal");
}
async function testDb() {
  await testSaveAndLoad();
}

// tests/tests.ts
testDb();
//# sourceMappingURL=tests.cjs.map
