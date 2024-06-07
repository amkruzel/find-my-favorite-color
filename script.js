"use strict";
(() => {
  // scripts/ui.ts
  var Ui = class _Ui {
    static updateAll(app2) {
      _Ui.updateAuth(app2.user);
      _Ui.updateGame(app2.game);
    }
    static showLoadingMessage() {
      _Ui.appLoadingMessage("Loading...");
    }
    static hideLoadingMessage() {
      _Ui.appLoadingMessage();
    }
    static appLoadingMessage(text) {
      const message = document.querySelector(".game-loading-message");
      if (message instanceof HTMLDivElement) {
        message.textContent = text ?? "";
      }
    }
    static updateAuth(user) {
      const name = typeof user === "object" ? user.email : user;
      const isLoggedIn = name !== "guest";
      const loginClasses = document.querySelector(".login").classList;
      const logoutClasses = document.querySelector(".logout-button").classList;
      const welcomeMessage = document.querySelector(".welcome-user");
      const signupLoginPopupButtonClasses = document.querySelector(".auth-popup-button").classList;
      if (isLoggedIn) {
        loginClasses.add("hidden");
        signupLoginPopupButtonClasses.add("hidden");
        logoutClasses.remove("hidden");
        welcomeMessage.textContent = `Welcome, ${name}`;
      } else {
        loginClasses.remove("hidden");
        signupLoginPopupButtonClasses.remove("hidden");
        logoutClasses.add("hidden");
        welcomeMessage.textContent = "";
      }
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

  // scripts/user.ts
  function userFrom(obj) {
    return obj;
  }
  function guestUser() {
    return userFrom({
      id: "guest",
      email: "guest"
    });
  }

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

  // scripts/app.ts
  var App = class {
    constructor() {
      this._user = guestUser();
      this._game = new Game();
      this._db = new Db("https://fmfc.alexkruzel.com");
    }
    get user() {
      return this._user;
    }
    get game() {
      return this._game;
    }
    async init() {
      await this._init();
    }
    async _init() {
      try {
        await this.tryLocalLogin();
        await this.loadGame();
      } catch (err) {
      }
    }
    async tryLocalLogin() {
      if (!localStorage.getItem("hasUserSaved")) {
        return;
      }
      Ui.updateAuth(localStorage.getItem("email"));
      const id = localStorage.getItem("id");
      this._user = await this._db.getUser(id);
    }
    async loadGame() {
      await this._loadGame();
    }
    async _loadGame() {
      if (!this.isLoggedIn) {
        return;
      }
      try {
        this._game = await this._db.load(this._user.id);
      } catch (error) {
      }
    }
    async saveGame() {
      await this._saveGame();
    }
    async _saveGame() {
      if (!this.isLoggedIn) {
        return;
      }
      try {
        await this._db.save(this._game, this._user.id);
      } catch (err) {
      }
    }
    async deleteGame() {
      this._deleteGame();
    }
    async _deleteGame() {
      if (!this.isLoggedIn) {
        return;
      }
      try {
        await this._db.delete(this._user.id);
      } catch (err) {
      }
    }
    logoutUser(e) {
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
      this._user = guestUser();
      Auth.clearLocal();
    }
    get isLoggedIn() {
      return this._user.id !== "guest";
    }
    async login(form) {
      this._user = await this._db.login(FormConverter.login(form));
      this.maybeSaveAuthLocally(form);
    }
    async signup(form) {
      this._user = await this._db.signup(FormConverter.signup(form));
      this.maybeSaveAuthLocally(form);
    }
    maybeSaveAuthLocally(form) {
      if (Auth.shouldSaveLocal(form)) {
        Auth.saveLocal(this._user);
      } else {
        Auth.clearLocal();
      }
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
    async gameAction(action, num) {
      switch (action) {
        case "shuffle":
          this.game.shuffleColors();
          break;
        case "reset":
          this.game.reset();
          await this.deleteGame();
          return;
        case "selectColor":
          if (num) {
            this._game.selectColor(num);
          }
          break;
        default:
          break;
      }
      await this.saveGame();
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

  // scripts/script.ts
  var uiElements = [
    {
      selector: ".auth-popup-button",
      handler: loginSigupModalHandler
    },
    {
      selector: ".login",
      handler: loginSignupHandler,
      action: "submit"
    },
    {
      selector: ".logout-button",
      handler: logoutHandler
    },
    {
      selector: ".close-modal",
      handler: closeModalHandler
    },
    {
      selector: ".debug",
      handler: debugHandler
    },
    {
      selector: ".new-colors",
      handler: shuffleHandler
    },
    {
      selector: ".clear-data",
      handler: resetHandler
    },
    {
      selector: "#color1",
      handler: selectColor1Handler
    },
    {
      selector: "#color2",
      handler: selectColor2Handler
    }
  ];
  var app = new App();
  async function main() {
    for (let elem of uiElements) {
      document.querySelector(elem.selector)?.addEventListener(elem.action ?? "click", elem.handler);
    }
    Ui.showLoadingMessage();
    await app.init();
    Ui.hideLoadingMessage();
    Ui.updateAll(app);
  }
  main();
  function closeModalHandler(e) {
    const modal = document.querySelector(
      ".auth-form-container"
    );
    logoutHandler(e);
    modal.close();
  }
  function loginSigupModalHandler() {
    const modal = document.querySelector(
      ".auth-form-container"
    );
    modal.showModal();
  }
  async function loginSignupHandler(e) {
    const form = e.target;
    if (!(e instanceof SubmitEvent) || !(form instanceof HTMLFormElement)) {
      return;
    }
    const action = e.submitter?.dataset.action;
    try {
      if (action === "login") {
        await app.login(form);
      } else if (action === "signup") {
        await app.signup(form);
      }
      ;
      document.querySelector(".auth-form-container").close();
      form.reset();
      Ui.showLoadingMessage();
      Ui.updateAuth(app.user);
      await app.loadGame();
      Ui.hideLoadingMessage();
      Ui.updateGame(app.game);
    } catch (error) {
      const message = error.name === "DbError" ? error.message : "Something went wrong - please refresh the page and try again.";
      notify("error" /* error */, message);
    }
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
