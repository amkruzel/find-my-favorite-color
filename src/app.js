"use strict";
(() => {
  // scripts/user.ts
  function getUser(obj) {
    return obj;
  }
  function guestUser() {
    return getUser({
      id: "guest"
    });
  }

  // scripts/auth.ts
  async function tryLogin(data) {
    const response = await _fetchUsers("auth-with-password", data);
    return await _parseResponse(response, "record");
  }
  async function trySignup(data) {
    const response = await _fetchUsers("records", data);
    return await _parseResponse(response);
  }
  async function tryChangePw(data) {
    const response = await _fetchUsers("request-password-reset", data);
    console.log(response);
    return await _parseResponse(response);
  }
  function saveAuthLocal(userId, email) {
    localStorage.setItem("hasUserSaved", "true");
    localStorage.setItem("id", userId);
    localStorage.setItem("email", email);
  }
  async function tryLocalLogin() {
    if (!localStorage.getItem("hasUserSaved")) {
      return Error("User ID is not saved locally");
    }
    updateLogin(localStorage.getItem("email"));
    const id = localStorage.getItem("id");
    const response = await _fetchUsers(`records/${id}`);
    return await _parseResponse(response);
  }
  function clearAuthLocal() {
    localStorage.removeItem("hasUserSaved");
    localStorage.removeItem("id");
    localStorage.removeItem("email");
  }
  async function _parseResponse(response, propName) {
    const json = await response.json();
    if (response.status != 200) {
      return Error(json.message);
    }
    return getUser(propName ? json[propName] : json);
  }
  async function _fetchUsers(path, data) {
    return await fetch(
      `http://34.42.14.226:8090/api/collections/users/${path}`,
      data
    );
  }

  // scripts/eventHandlers.ts
  async function signupOrLogin(formElement, action) {
    const form = new FormData(formElement);
    const data = {
      method: "post",
      body: form
    };
    if (action === "login") {
      return await tryLogin(data);
    }
    const email = form.get("identity");
    form.set("email", email);
    if (action === "changepw") {
      return await tryChangePw(data);
    }
    const pw = form.get("password");
    if (!pw || !email) {
      return Error(
        "Something went wrong - please refresh the page and try again."
      );
    }
    form.append("passwordConfirm", pw);
    return await trySignup(data);
  }
  function logout(e) {
    console.log("logoutHandler", e);
    if (e.target instanceof HTMLFormElement) {
      e.target.reset();
    }
    clearAuthLocal();
    document.querySelector(".login").classList.remove("hidden");
    document.querySelector("#logout-btn").classList.add("hidden");
    document.querySelector(".welcome-user").textContent = "";
  }

  // scripts/notification.ts
  function notify(type, message) {
    const container = document.querySelector(".notification-container");
    if (!container) {
      return;
    }
    const notification = _make("div", "notification", type.toString());
    const coloredSection = _make("div");
    const messageSection = _make("div");
    messageSection.textContent = message;
    notification.append(coloredSection, messageSection);
    container.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 2500);
    }, 5e3);
  }
  function _make(type, ...classes) {
    const elem = document.createElement(type);
    for (const cl of classes) {
      elem.classList.add(cl);
    }
    return elem;
  }

  // scripts/ui.ts
  var addEventListeners = (app2, db2) => {
    document.querySelector(".login").addEventListener("submit", async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) {
        notify(
          "error" /* error */,
          "Something went wrong - please refresh the page and try again."
        );
        return;
      }
      const user = await signupOrLogin(form, e.submitter?.dataset.action);
      if (user instanceof Error) {
        notify("error" /* error */, user.message);
        return;
      }
      app2.user = user;
      if (_shouldSaveAuthLocal(form)) {
        saveAuthLocal(user.id, user.email);
      } else {
        clearAuthLocal();
      }
      form.reset();
      updateLogin(user.email);
    });
    document.querySelector("#logout-btn").addEventListener("click", (e) => {
      logout(e);
      app2.user = guestUser();
    });
    document.querySelector(".new-colors").addEventListener("click", async () => {
      app2.game.shuffleColors();
      await db2.save(app2);
      updateGameUi(app2.game);
    });
    document.querySelector(".clear-data").addEventListener("click", async () => {
      app2.game.reset();
      await db2.save(app2);
      updateGameUi(app2.game);
    });
    document.querySelector("#color1").addEventListener("click", async () => {
      app2.game.selectColor(1);
      await db2.save(app2);
      updateGameUi(app2.game);
    });
    document.querySelector("#color2").addEventListener("click", async () => {
      app2.game.selectColor(2);
      await db2.save(app2);
      updateGameUi(app2.game);
    });
  };
  function updateLogin(user) {
    document.querySelector(".login").classList.add("hidden");
    document.querySelector("#logout-btn").classList.remove("hidden");
    document.querySelector(".welcome-user").textContent = `Welcome ${user}`;
  }
  function _shouldSaveAuthLocal(form) {
    const stayLoggedInElement = form.elements.namedItem("stayLoggedIn");
    return stayLoggedInElement instanceof HTMLInputElement && stayLoggedInElement.checked;
  }
  function updateGameUi(game) {
    const currenIter = document.querySelector(".current-iteration");
    if (currenIter instanceof HTMLSpanElement) {
      currenIter.textContent = game.currentIteration.toLocaleString();
    }
    const colorsRemaining = document.querySelector(".colors-remaining-cur-iter");
    if (colorsRemaining instanceof HTMLSpanElement) {
      colorsRemaining.textContent = game.colorsRemainingCurrentIteration.toLocaleString();
    }
    const color1 = document.querySelector("#color1");
    const color2 = document.querySelector("#color2");
    if (color1 instanceof HTMLDivElement && color2 instanceof HTMLDivElement) {
      let bgColor1, bgColor2;
      if (game.favoriteColor) {
        bgColor1 = bgColor2 = intToHex(game.favoriteColor);
      } else {
        bgColor1 = intToHex(game.color1);
        bgColor2 = intToHex(game.color2);
      }
      color1.style.backgroundColor = `#${bgColor1}`;
      color2.style.backgroundColor = `#${bgColor2}`;
    }
  }
  function intToHex(num) {
    return num.toString(16).padStart(6, "0");
  }

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
      } else {
        this._load(eliminated, selected, props);
      }
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
        colorsRemainingCurrentIteration: this.colorsRemainingCurrentIteration,
        color1: this.color1,
        color2: this.color2
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
      assertColor(props.color1);
      assertColor(props.color2);
      this._buildColors(props.color1, props.color2);
    }
    _buildColors(color1, color2) {
      const colors = [];
      const nextIterationColors = [];
      for (let i = 0; i < MAX_COLORS; i++) {
        assertColor(i);
        if (this.isEliminated(i) || i == color1 || i == color2) {
          continue;
        }
        if (this.isSelected(i)) {
          nextIterationColors.push(i);
          continue;
        }
        colors.push(i);
      }
      this._colors = shuffle(colors);
      this._colors.push(color2);
      this._colors.push(color1);
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
      console.log("game saved!");
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
      console.log("game loaded!");
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
      console.log("_getFiles");
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
      console.log("_getGameIfOneExists");
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
        console.log(game);
        return {
          id: game.id,
          user: game.user,
          properties: game.properties,
          eliminatedColors: game.eliminatedColors,
          selectedColors: game.selectedColors
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

  // scripts/app.ts
  var app = {
    game: new Game(),
    user: guestUser()
  };
  var db = new Db("http", "34.42.14.226", "8090");
  addEventListeners(app, db);
  tryLocalLogin().then((response) => {
    if (response instanceof Error || !response) {
      return;
    }
    app.user = response;
    console.log("logged in");
    db.load(app).then(() => updateGameUi(app.game));
    updateLogin(response.email);
  });
  updateGameUi(app.game);
})();
//# sourceMappingURL=app.js.map
