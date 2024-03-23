"use strict";
(() => {
  // scripts/eventHandlers.ts
  async function signupOrLogin(e) {
    console.log("loginHandler", e);
    if (!(e.target instanceof HTMLFormElement)) {
      return;
    }
    const form = new FormData(e.target);
    const pw = form.get("password");
    const email = form.get("identity");
    if (!pw || !email) {
      return;
    }
    form.append("passwordConfirm", pw);
    form.set("email", email);
    const data = {
      method: "post",
      body: form
    };
    const res1 = await fetch(
      `http://34.42.14.226:8090/api/collections/users/auth-with-password`,
      data
    );
    const json1 = await res1.json();
    console.log(res1, json1);
    if (res1.status == 200) {
      document.querySelector(".login").classList.add("hidden");
      document.querySelector("#logout-btn").classList.remove("hidden");
      document.querySelector(
        ".welcome-user"
      ).textContent = `Welcome ${json1?.record?.email}`;
      return;
    }
    const res = await fetch(
      `http://34.42.14.226:8090/api/collections/users/records`,
      data
    );
    const json = await res.json();
    console.log(json);
    document.querySelector(".login").classList.add("hidden");
    document.querySelector("#logout-btn").classList.remove("hidden");
    document.querySelector(
      ".welcome-user"
    ).textContent = `Welcome ${json?.email}`;
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
    document.querySelector(".login").addEventListener("submit", (e) => signupOrLogin(e));
    document.querySelector("#logout-btn").addEventListener("click", (e) => logout(e));
    document.querySelector(".new-colors").addEventListener("click", () => shuffleColors());
    document.querySelector(".clear-data").addEventListener("click", () => reset());
    document.querySelector("#color1").addEventListener("click", () => selectColor(1));
    document.querySelector("#color2").addEventListener("click", () => selectColor(2));
  };

  // scripts/app.ts
  addEventListeners();
})();
//# sourceMappingURL=app.js.map
