"use strict";
(() => {
  // scripts/ui/uielement.ts
  var UiElement = class {
    constructor(selector) {
      if (!selector) {
        throw new TypeError("UIElement constructor selector was undefined");
      }
      const val = document.querySelector(selector);
      this.assertType(val);
      this._value = val;
    }
    assertType(el) {
      if (el === null || !(el instanceof Element)) {
        throw new TypeError("Invalid selector.");
      }
    }
    addEventListener(type, event, options) {
      this._value.addEventListener(type, event, options);
    }
  };

  // scripts/ui/ui.ts
  var Ui = class _Ui {
    constructor(elems, names) {
      this.elements = /* @__PURE__ */ new Map();
      if (!elems) {
        return;
      }
      if (!names) {
        names = elems;
      }
      for (let i = 0; i < elems.length; i++) {
        const selector = elems[i];
        const name = names[i];
        if (!selector || !name) {
          return;
        }
        if (!this.add(selector, name)) {
          return;
        }
      }
    }
    /**
     * Attempts to add an element to the Ui. If there is already a value with
     * the given name, it is not overwritten (the new element is not added).
     * @param elem
     * @returns true if the element is added
     */
    add(descriptor, name = descriptor, event, handler) {
      if (this.elements.has(name)) {
        return false;
      }
      this.elements.set(name, new UiElement(descriptor));
      if (event && handler) {
        this.get(name)?.addEventListener(event, handler);
      }
      return true;
    }
    get(name) {
      return this.elements.get(name);
    }
    static updateAll(app2) {
      _Ui.updateAuth(app2.user);
      _Ui.updateGame(app2.game);
    }
    static updateAuth(user) {
      const name = typeof user === "string" ? user : user.email;
      const loginClasses = document.querySelector(".login").classList;
      const logoutClasses = document.querySelector("#logout-btn").classList;
      const welcomeContainerClasses = document.querySelector(".welcome-container").classList;
      const welcomeMessage = document.querySelector(".welcome-user");
      if (!name) {
        loginClasses.remove("hidden");
        logoutClasses.add("hidden");
        welcomeContainerClasses.add("hidden");
        welcomeMessage.textContent = "";
        return;
      }
      loginClasses.add("hidden");
      logoutClasses.remove("hidden");
      welcomeContainerClasses.remove("hidden");
      welcomeMessage.textContent = `Welcome ${name}`;
    }
    static updateGame(game) {
      _Ui.tryUpdateCurIter(game);
      _Ui.tryUpdateColorsRemaining(game);
      _Ui.tryUpdateColors(game);
    }
    static tryUpdateCurIter(game) {
      const currenIter = document.querySelector(".current-iteration");
      if (currenIter instanceof HTMLSpanElement) {
        currenIter.textContent = game.currentIteration.toLocaleString();
      }
    }
    static tryUpdateColorsRemaining(game) {
      const colorsRemaining = document.querySelector(
        ".colors-remaining-cur-iter"
      );
      if (colorsRemaining instanceof HTMLSpanElement) {
        colorsRemaining.textContent = game.colorsRemainingCurrentIteration.toLocaleString();
      }
    }
    static tryUpdateColors(game) {
      const color1 = document.querySelector("#color1");
      const color2 = document.querySelector("#color2");
      const colorsExist = color1 instanceof HTMLDivElement && color2 instanceof HTMLDivElement;
      if (!colorsExist) {
        return;
      }
      let bgColor1, bgColor2;
      if (game.favoriteColor) {
        bgColor1 = bgColor2 = _Ui.intToHex(game.favoriteColor);
      } else {
        bgColor1 = _Ui.intToHex(game.color1);
        bgColor2 = _Ui.intToHex(game.color2);
      }
      color1.style.backgroundColor = `#${bgColor1}`;
      color2.style.backgroundColor = `#${bgColor2}`;
    }
    static intToHex(num) {
      return num.toString(16).padStart(6, "0");
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
     * Updates ary, ensuring that there are always >= 2 elements.
     * If this.ary.length == 2 at the beginning of the method, then both elements
     * will be the same at the end - the selected color.
     * @return the colors in the format `[selected, rejected]`
     */
    select(num) {
      const selectedColor = num === 1 ? this.color1 : this.color2;
      const rejectedColor = num === 1 ? this.color2 : this.color1;
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
      const favoriteColorFound = this.selectedColors.length === 1;
      if (favoriteColorFound) {
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
  var Auth = class {
    static saveLocal(user) {
      localStorage.setItem("hasUserSaved", "true");
      localStorage.setItem("id", user.id);
      localStorage.setItem("email", user.email);
    }
    static clearLocal() {
      localStorage.removeItem("hasUserSaved");
      localStorage.removeItem("id");
      localStorage.removeItem("email");
    }
    static shouldSaveLocal(form) {
      const stayLoggedInElement = form.elements.namedItem("stayLoggedIn");
      return stayLoggedInElement instanceof HTMLInputElement && stayLoggedInElement.checked;
    }
  };
  async function tryLocalLogin() {
    if (!localStorage.getItem("hasUserSaved")) {
      return Error("User ID is not saved locally");
    }
    Ui.updateAuth(localStorage.getItem("email"));
    const id = localStorage.getItem("id");
    const response = await _fetchUsers(`records/${id}`);
    return await _parseResponse(response);
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

  // scripts/db.ts
  var Db = class {
    constructor(protocol, ip, port) {
      this._path = `${protocol}://${ip}:${port}`;
      this._pendingSave = false;
    }
    async try(action, formElement) {
      const form = new FormData(formElement);
      const data = {
        method: "post",
        body: form
      };
      if (action === "login") {
        return await this.tryLogin(data);
      }
      const email = form.get("identity");
      form.set("email", email);
      if (action === "changepw") {
        return await this.tryChangePw(data);
      }
      const pw = form.get("password");
      if (!pw || !email) {
        return Error(
          "Something went wrong - please refresh the page and try again."
        );
      }
      form.append("passwordConfirm", pw);
      return await this.trySignup(data);
    }
    async tryLogin(data) {
      const response = await this._fetchUsers("auth-with-password", data);
      return await this._parseResponse(response, "record");
    }
    async trySignup(data) {
      const response = await this._fetchUsers("records", data);
      return await this._parseResponse(response);
    }
    async tryChangePw(data) {
      return new Error("Method 'tryChangePw' is not implemented!");
    }
    async save(game, userId) {
      if (userId === "guest") {
        return false;
      }
      if (this._pendingSave) {
        return false;
      }
      this._pendingSave = true;
      const prevGame = await this._getGameIfOneExists(userId);
      const rv = await this._createOrUpdate(game, userId, prevGame?.id);
      this._pendingSave = false;
      return rv;
    }
    async load(userId) {
      const game = await this._getGameIfOneExists(userId);
      if (!game) {
        return new Error(`User ID '${userId}' does not have a game saved.`);
      }
      const [eliminated, selected, colors] = await this._getFiles(game);
      if (!eliminated || !selected || !colors) {
        return new Error("Error loading game.");
      }
      return new Game(
        {
          eliminated,
          selected,
          colors
        },
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
    async _createOrUpdate(game, userId, gameId) {
      const form = this._buildForm(game, userId);
      let response;
      if (gameId) {
        response = await this._patch(form, gameId);
      } else {
        response = await this._post(form);
      }
      return true;
    }
    _buildForm(game, userId) {
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
  var App = class {
    constructor() {
      this._user = guestUser();
      this._game = new Game();
      this.db = new Db("http", "34.42.14.226", "8090");
    }
    async init() {
      const user = await tryLocalLogin();
      if (user instanceof Error || !user) {
        Ui.updateGame(this.game);
        return;
      }
      this._user = user;
      await this.loadGame();
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
    async loadGame() {
      if (!this.isLoggedIn()) {
        return false;
      }
      const game = await this.db.load(this._user.id);
      if (game instanceof Error) {
        notify("error" /* error */, game.message);
        return false;
      }
      this._game = game;
      return true;
    }
    async saveGame() {
      if (!this.isLoggedIn()) {
        return false;
      }
      await this.db.save(this._game, this._user.id);
      return true;
    }
    logoutUser(e) {
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
      this._user = guestUser();
      Auth.clearLocal();
    }
    set user(user) {
      this._user = user;
    }
    isLoggedIn() {
      return this._user.id !== "guest";
    }
    async trySignupOrLogin(e) {
      const form = e.target;
      assertType(form, HTMLFormElement);
      console.log(this);
      const user = await this.db.try(e.submitter?.dataset.action, form);
      if (user instanceof Error) {
        notify("error" /* error */, user.message);
        return;
      }
      this._user = user;
      if (Auth.shouldSaveLocal(form)) {
        Auth.saveLocal(user);
      } else {
        Auth.clearLocal();
      }
      form.reset();
      return user;
    }
    debug() {
      console.log(this);
    }
    shuffleGameColors() {
      this.gameAction("shuffle");
    }
    resetGame() {
      this.gameAction("reset");
    }
    selectGameColor(num) {
      this.gameAction("selectColor", num);
    }
    gameAction(action, num) {
      switch (action) {
        case "shuffle":
          this.game.shuffleColors();
          break;
        case "reset":
          this.game.reset();
          break;
        case "selectColor":
          if (num) {
            this._game.selectColor(num);
          }
          break;
        default:
          break;
      }
      this.db.save(this._game, this._user.id);
    }
  };

  // scripts/script.ts
  var app = new App();
  var ui = new Ui();
  ui.add(".login", "loginSignupForm", "submit", loginSignupHandler);
  ui.add("#logout-btn", "logoutButton", "click", logoutHandler);
  ui.add(".debug", "debugButon", "click", debugHandler);
  ui.add(".new-colors", "shuffleColorsButton", "click", shuffleHandler);
  ui.add(".clear-data", "resetGameButton", "click", resetHandler);
  ui.add("#color1", "color1", "click", selectColor1Handler);
  ui.add("#color2", "color2", "click", selectColor2Handler);
  async function main() {
    await app.init();
    Ui.updateAll(app);
  }
  main();
  async function loginSignupHandler(e) {
    if (!(e instanceof SubmitEvent)) {
      return;
    }
    await app.trySignupOrLogin(e);
    await app.loadGame();
    Ui.updateAll(app);
  }
  async function logoutHandler(e) {
    app.logoutUser(e);
    app.resetGame();
    Ui.updateAll(app);
  }
  function debugHandler() {
    app.debug();
  }
  function shuffleHandler() {
    app.shuffleGameColors();
    Ui.updateAll(app);
  }
  function resetHandler() {
    app.resetGame();
    Ui.updateAll(app);
  }
  function selectColor1Handler() {
    selectColor(1);
  }
  function selectColor2Handler() {
    selectColor(2);
  }
  function selectColor(num) {
    app.selectGameColor(num);
    Ui.updateAll(app);
  }
})();
//# sourceMappingURL=script.js.map
