"use strict";

// scripts/game.ts
var MAX_COLORS = 16777216;
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
var Game = class {
  constructor(eliminated, selected, props) {
    if (!eliminated || !selected || !props) {
      this._init();
      return;
    }
    this._load(eliminated, selected, props);
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
  get properties() {
    return {
      favoriteColorFound: this.favoriteColor !== null,
      currentIteration: this.currentIteration,
      colorsRemainingCurrentIteration: this.colorsRemainingCurrentIteration
    };
  }
  get testingProps() {
    return [this._colors, this._nextIterationColors];
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
  isEliminated(color) {
    return this._is(color, "eliminated");
  }
  isSelected(color) {
    return this._is(color, "selected");
  }
  _init() {
    let p = performance.now();
    console.log(`begin _init()`);
    const initColors = () => {
      this._colors = [0, 1];
      p = performance.now();
      for (let i = 2; i < 16777216; i++) {
        this._colors.push(i);
      }
      console.log(`loop took ${performance.now() - p}ms`);
      p = performance.now();
      shuffle(this._colors);
      console.log(`shuffle took ${performance.now() - p}ms`);
    };
    this.eliminatedColors = new Uint32Array(524288);
    this.selectedColors = new Uint32Array(524288);
    this._currentIteration = 1;
    this._colorsRemainingCurrentIteration = MAX_COLORS;
    this._favoriteColorFound = false;
    this._nextIterationColors = [];
    console.log(`_init() took ${performance.now() - p}ms`);
    console.log(`begin initColors()`);
    p = performance.now();
    initColors();
    console.log(`initColors() took ${performance.now() - p}ms`);
  }
  _load(eliminated, selected, props) {
    this.eliminatedColors = new Uint32Array(eliminated);
    this.selectedColors = new Uint32Array(selected);
    this._currentIteration = props.currentIteration;
    this._colorsRemainingCurrentIteration = props.colorsRemainingCurrentIteration;
    this._favoriteColorFound = props.favoriteColorFound;
    this._buildColors();
  }
  _buildColors() {
    const colors = [];
    const nextIterationColors = [];
    for (let i = 0; i < MAX_COLORS; i++) {
      assertColor(i);
      if (this.isEliminated(i)) {
        continue;
      }
      if (this.isSelected(i)) {
        nextIterationColors.push(i);
        continue;
      }
      colors.push(i);
    }
    this._colors = shuffle(colors);
    this._nextIterationColors = nextIterationColors;
  }
  _updateSelectedColors(num) {
    const _do = (action, color) => {
      const [index, bit] = this._split(color);
      const array = action === "select" ? "selectedColors" : "eliminatedColors";
      assertColor(color);
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
  _split(color) {
    const [index, bit] = [color >> 5, 2 ** (color & 31)];
    assertIndex(index);
    assertBit(bit);
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
  _is(color, testingFor) {
    const [index, bit] = this._split(color);
    const num = testingFor === "eliminated" ? this.eliminatedColors[index] : this.selectedColors[index];
    if (num === void 0) {
      return false;
    }
    return !!(num & bit);
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
    if (this._pendingSave) {
      return false;
    }
    this._pendingSave = true;
    if (!app2.user) {
      return false;
    }
    assertUser(app2);
    const game = await this._getGameIfOneExists(app2.user.id);
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
    const [eliminatedColors, selectedColors] = await this._getFiles(game);
    if (!eliminatedColors || !selectedColors) {
      return;
    }
    app2.game = new Game(eliminatedColors, selectedColors, game.properties);
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
    const json = await response.json();
    console.log(json);
    return true;
  }
  _buildForm(app2) {
    const elimColorBlob = new Blob([app2.game.eliminatedColors]);
    const selectColorBlob = new Blob([app2.game.selectedColors]);
    const form = new FormData();
    form.set("eliminatedColors", elimColorBlob);
    form.set("selectedColors", selectColorBlob);
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
      this._getFile(game.id, game.selectedColors)
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
        properties: JSON.parse(game.properties),
        eliminatedColors: game.eliminatedColors,
        selectedColors: game.selectedColors
      };
    } catch (error) {
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

// tests/db.test.ts
var app = {
  game: new Game(),
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
  const eliminated = app.game.eliminatedColors;
  const selected = app.game.selectedColors;
  const [colors, nextIterationColors] = app.game.testingProps;
  await db.save(app);
  await db.load(app);
  for (let i2 = 0; i2 < 524288; i2++) {
    assertTrue(eliminated[i2] === app.game.eliminatedColors[i2]);
    assertTrue(selected[i2] === app.game.selectedColors[i2]);
  }
  const [newColors, newNextIterationColors] = app.game.testingProps;
  let i = 0, n = 0;
  console.log("testing colors");
  for (const color of colors) {
    assertTrue(newColors.includes(color));
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
  for (const color of nextIterationColors) {
    assertTrue(newNextIterationColors.includes(color));
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
