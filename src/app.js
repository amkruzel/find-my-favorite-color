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
  function updateLogin(user) {
    document.querySelector(".login").classList.add("hidden");
    document.querySelector("#logout-btn").classList.remove("hidden");
    document.querySelector(".welcome-user").textContent = `Welcome ${user}`;
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
    static from(ary) {
      const tmp = Array.from(new Uint32Array(ary));
      assertColorsAry(tmp);
      return tmp;
    }
  };
  function assertDefined(val) {
    if (val === void 0) {
      throw new Error("Value is undefined!");
    }
  }
  var Colors = class _Colors {
    constructor() {
      this.init();
    }
    get color1() {
      return this.getAndValidateColor(1);
    }
    get color2() {
      return this.getAndValidateColor(2);
    }
    getAndValidateColor(num) {
      const c = this.ary[this.ary.length - num];
      assertDefined(c);
      return c;
    }
    get next1000Colors() {
      return new Uint32Array(this.ary.slice(0, 1001));
    }
    shuffle() {
      const c1 = this.ary.shift();
      const c2 = this.ary.shift();
      assertDefined(c1);
      assertDefined(c2);
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
      const selectedAndRejectedColors = this.getSelectedAndRejected(num);
      this.selectColor(selectedAndRejectedColors[0]);
      if (this.ary.length > 2) {
        this.pop2();
      } else {
        this.validateAry();
        if (this.favoriteColorFound()) {
          this.selectedColors.push(this.selectedColors[0]);
        }
        this.reset(shuffle(this.selectedColors));
        this.selectedColors = [];
      }
      return selectedAndRejectedColors;
    }
    getSelectedAndRejected(num) {
      const selectedColor = num === 1 ? this.color1 : this.color2;
      const rejectedColor = num === 1 ? this.color2 : this.color1;
      return [selectedColor, rejectedColor];
    }
    selectColor(color) {
      this.selectedColors.push(color);
    }
    validateAry() {
      if (this.ary.length !== 2) {
        throw new Error("Array is the incorrect length");
      }
    }
    favoriteColorFound() {
      return this.selectedColors.length === 1;
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
      this.ary = ColorsAry.from(data.next1000);
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
        let color;
        do {
          color = ~~(Math.random() * MAX_COLORS);
          assertColor(color);
        } while (this.ary.includes(color));
        this.ary.push(color);
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
    isEliminated(color) {
      return this.eliminatedColors.has(color);
    }
    isSelected(color) {
      return this.selectedColors.has(color);
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

  // scripts/db.ts
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
    async save(app) {
      if (app.user.id === "guest") {
        return false;
      }
      if (this._pendingSave) {
        return false;
      }
      this._pendingSave = true;
      const game = await this._getGameIfOneExists(app.user.id);
      console.log(game);
      const rv = await this._createOrUpdate(app, game?.id);
      this._pendingSave = false;
      return rv;
    }
    async load(app) {
      if (app.user.id === "guest") {
        return;
      }
      const game = await this._getGameIfOneExists(app.user.id);
      if (!game) {
        return;
      }
      const [eliminatedColors, selectedColors, colors] = await this._getFiles(
        game
      );
      if (!eliminatedColors || !selectedColors || !colors) {
        return;
      }
      app.game = new Game(
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
    async _createOrUpdate(app, gameId) {
      const form = this._buildForm(app);
      let response;
      if (gameId) {
        response = await this._patch(form, gameId);
      } else {
        response = await this._post(form);
      }
      return true;
    }
    _buildForm(app) {
      const elimColorBlob = app.game.eliminatedColors.blob;
      const selectColorBlob = app.game.selectedColors.blob;
      const colorsBlob = new Blob([app.game.next1000Colors]);
      const form = new FormData();
      form.set("eliminatedColors", elimColorBlob);
      form.set("selectedColors", selectColorBlob);
      form.set("colors", colorsBlob);
      form.set("properties", JSON.stringify(app.game.properties));
      form.set("user", app.user.id);
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

  // scripts/app.ts
  function assertType(elem, cls) {
    if (!(elem instanceof cls)) {
      notify(
        "error" /* error */,
        "Something went wrong - please refresh the page and try again."
      );
      throw new TypeError("Element is not an instance of " + cls);
    }
  }
  function getAndAssertType(selector, cls) {
    const elem = document.querySelector(selector);
    assertType(elem, cls);
    return elem;
  }
  function getButton(selector) {
    return getAndAssertType(selector, HTMLButtonElement);
  }
  var App = class _App {
    static {
      this.isInternal = false;
    }
    constructor() {
      if (!_App.isInternal) {
        throw new TypeError("App is not constructable.");
      }
      this._user = guestUser();
      this._game = new Game();
      this.db = new Db("http", "34.42.14.226", "8090");
      _App.isInternal = false;
    }
    static start() {
      _App.isInternal = true;
      const app = new _App();
      app.addEventListeners();
      tryLocalLogin().then((response) => {
        if (response instanceof Error || !response) {
          updateGameUi(app.game);
          return;
        }
        app._user = response;
        app.db.load(app).then(() => updateGameUi(app.game));
        updateLogin(response.email);
      });
    }
    get user() {
      return this._user;
    }
    get game() {
      return this._game;
    }
    set game(game) {
      this._game = game;
    }
    addEventListeners() {
      this.addAuthEventListeners();
      this.addGameEventListeners();
    }
    addAuthEventListeners() {
      this.addLoginEventListener();
      this.addLogoutEventListener();
    }
    addLoginEventListener() {
      function _shouldSaveAuthLocal2(form) {
        const stayLoggedInElement = form.elements.namedItem("stayLoggedIn");
        return stayLoggedInElement instanceof HTMLInputElement && stayLoggedInElement.checked;
      }
      getAndAssertType(".login", HTMLFormElement).onsubmit = async (e) => {
        const form = e.target;
        assertType(form, HTMLFormElement);
        const user = await signupOrLogin(form, e.submitter?.dataset.action);
        if (user instanceof Error) {
          notify("error" /* error */, user.message);
          return;
        }
        this._user = user;
        if (_shouldSaveAuthLocal2(form)) {
          saveAuthLocal(user.id, user.email);
        } else {
          clearAuthLocal();
        }
        form.reset();
        updateLogin(user.email);
      };
    }
    addLogoutEventListener() {
      getAndAssertType("#logout-btn", HTMLInputElement).onclick = (e) => {
        logout(e);
        this._user = guestUser();
      };
    }
    addGameEventListeners() {
      this.addShuffleEventListener();
      this.addClearEventListener();
      this.addColorEventListener();
    }
    addShuffleEventListener() {
      getButton(".new-colors").onclick = async () => {
        this.game.shuffleColors();
        this.saveGameAndUpdate();
      };
    }
    addClearEventListener() {
      getButton(".clear-data").onclick = async () => {
        this.game.reset();
        this.saveGameAndUpdate();
      };
    }
    addColorEventListener() {
      const clickColor = async (num) => {
        this.game.selectColor(num);
        this.saveGameAndUpdate();
      };
      getAndAssertType("#color1", HTMLDivElement).onclick = async () => await clickColor(1);
      getAndAssertType("#color2", HTMLDivElement).onclick = async () => await clickColor(2);
    }
    saveGameAndUpdate() {
      this.db.save(this);
      updateGameUi(this.game);
    }
  };
  App.start();
})();
//# sourceMappingURL=app.js.map
