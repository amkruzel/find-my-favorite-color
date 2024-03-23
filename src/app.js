"use strict";
(() => {
  // scripts/user.ts
  function getUser(obj) {
    return obj;
  }

  // scripts/auth.ts
  async function tryLogin(data) {
    const response = await fetch(
      `http://34.42.14.226:8090/api/collections/users/auth-with-password`,
      data
    );
    return await _parseResponse(response, "record");
  }
  async function trySignup(data) {
    const response = await fetch(
      `http://34.42.14.226:8090/api/collections/users/records`,
      data
    );
    return await _parseResponse(response);
  }
  async function _parseResponse(response, propName) {
    const json = await response.json();
    if (response.status != 200) {
      return Error(json.message);
    }
    return getUser(propName ? json[propName] : json);
  }

  // scripts/eventHandlers.ts
  async function signupOrLogin(e) {
    if (!(e.target instanceof HTMLFormElement)) {
      return Error("Event target not an instance of HTMLFormElement");
    }
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
      return Error("Password or email not defined");
    }
    form.append("passwordConfirm", pw);
    form.set("email", email);
    return await trySignup(data);
  }
  function logout(e) {
    console.log("logoutHandler", e);
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

  // scripts/ui.ts
  var addEventListeners = () => {
    document.querySelector(".login").addEventListener("submit", async (e) => {
      const rv = await signupOrLogin(e);
      console.log(rv);
      if (rv instanceof Error) {
        console.log(rv);
        return;
      }
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
})();
//# sourceMappingURL=app.js.map
