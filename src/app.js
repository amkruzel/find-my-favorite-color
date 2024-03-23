"use strict";
(() => {
  // scripts/eventHandlers.ts
  function login(e) {
    console.log("loginHandler", e);
  }
  function logout(e) {
    console.log("logoutHandler", e);
  }
  function shuffleColors() {
    console.log("shuffleColorsHandler");
  }
  function reset() {
    console.log("resetHandler");
  }
  function selectColor(num) {
    console.log("shuffleColorHandler", num);
  }

  // scripts/ui.ts
  var addEventListeners = () => {
    document.querySelector(".login").addEventListener("submit", (e) => login(e));
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
