"use strict";
(() => {
  // scripts/user.ts
  function getUser(obj) {
    return obj;
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
  var addEventListeners = (game) => {
    document.querySelector(".login").addEventListener("submit", async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) {
        notify(
          "error" /* error */,
          "Something went wrong - please refresh the page and try again."
        );
        return;
      }
      const rv = await signupOrLogin(form, e.submitter?.dataset.action);
      if (rv instanceof Error) {
        notify("error" /* error */, rv.message);
        return;
      }
      if (_shouldSaveAuthLocal(form)) {
        saveAuthLocal(rv.id, rv.email);
      } else {
        clearAuthLocal();
      }
      form.reset();
      updateLogin(rv.email);
    });
    document.querySelector("#logout-btn").addEventListener("click", (e) => logout(e));
    document.querySelector(".new-colors").addEventListener("click", () => {
      game.shuffleColors();
      updateGameUi(game);
    });
    document.querySelector(".clear-data").addEventListener("click", () => {
      game.reset();
      updateGameUi(game);
    });
    document.querySelector("#color1").addEventListener("click", () => {
      game.selectColor(1);
      updateGameUi(game);
    });
    document.querySelector("#color2").addEventListener("click", () => {
      game.selectColor(2);
      updateGameUi(game);
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
    isEliminated(color) {
      return this._is(color, "eliminated");
    }
    isSelected(color) {
      return this._is(color, "selected");
    }
    _init() {
      const initColors = () => {
        this._colors = [0, 1];
        for (let i = 2; i < 16777216; i++) {
          this._colors.push(i);
        }
        shuffle(this._colors);
      };
      this.eliminatedColors = new Uint32Array(524288);
      this.selectedColors = new Uint32Array(524288);
      this._currentIteration = 1;
      this._colorsRemainingCurrentIteration = MAX_COLORS;
      this._favoriteColorFound = false;
      this._nextIterationColors = [];
      initColors();
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

  // scripts/app.ts
  var app = {
    game: new Game()
  };
  addEventListeners(app.game);
  tryLocalLogin().then((response) => {
    if (response instanceof Error || !response) {
      return;
    }
    updateLogin(response.email);
  });
  updateGameUi(app.game);
})();
//# sourceMappingURL=app.js.map
