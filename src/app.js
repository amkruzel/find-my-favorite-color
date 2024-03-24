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
  async function signupOrLogin(e) {
    if (!(e.target instanceof HTMLFormElement)) {
      return Error(
        "Something went wrong - please refresh the page and try again."
      );
    }
    console.log(e.target);
    const form = new FormData(e.target);
    const data = {
      method: "post",
      body: form
    };
    if (e.submitter?.id.includes("login")) {
      return await tryLogin(data);
    }
    const pw = form.get("password");
    const email = form.get("identity");
    if (!pw || !email) {
      return Error(
        "Something went wrong - please refresh the page and try again."
      );
    }
    form.append("passwordConfirm", pw);
    form.set("email", email);
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
  function shuffleColors() {
    console.log("shuffleColorsHandler");
  }
  function reset() {
    console.log("resetHandler");
  }
  function selectColor(num) {
    console.log("selectColorHandler", num);
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
  var addEventListeners = () => {
    document.querySelector(".login").addEventListener("submit", async (e) => {
      const rv = await signupOrLogin(e);
      if (rv instanceof Error) {
        notify("error" /* error */, rv.message);
        return;
      }
      const stayLoggedInElement = e.target.elements.namedItem("stayLoggedIn");
      console.log(stayLoggedInElement);
      if (stayLoggedInElement instanceof HTMLInputElement && stayLoggedInElement.checked) {
        saveAuthLocal(rv.id, rv.email);
      } else {
        clearAuthLocal();
      }
      ;
      e.target.reset();
      updateLogin(rv.email);
    });
    document.querySelector("#logout-btn").addEventListener("click", (e) => logout(e));
    document.querySelector(".new-colors").addEventListener("click", () => shuffleColors());
    document.querySelector(".clear-data").addEventListener("click", () => reset());
    document.querySelector("#color1").addEventListener("click", () => selectColor(1));
    document.querySelector("#color2").addEventListener("click", () => selectColor(2));
  };
  function updateLogin(user) {
    document.querySelector(".login").classList.add("hidden");
    document.querySelector("#logout-btn").classList.remove("hidden");
    document.querySelector(".welcome-user").textContent = `Welcome ${user}`;
  }

  // scripts/app.ts
  addEventListeners();
  tryLocalLogin().then((response) => {
    console.log(response);
    if (response instanceof Error || !response) {
      return;
    }
    updateLogin(response.email);
  });
})();
//# sourceMappingURL=app.js.map
