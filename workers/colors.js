"use strict";
(() => {
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
    get isNewGame() {
      return this._isNewGame;
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
    isEliminated(color3) {
      return this.eliminatedColors.has(color3);
    }
    isSelected(color3) {
      return this.selectedColors.has(color3);
    }
    _init() {
      this._isNewGame = true;
      this.eliminatedColors = new CondensedColors();
      this.selectedColors = new CondensedColors();
      this._currentIteration = 1;
      this._colorsRemainingCurrentIteration = _Game.MAX_COLORS;
      this._favoriteColorFound = false;
      this._buildColors();
    }
    _load(arys, props) {
      this._isNewGame = false;
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
      this._isNewGame = false;
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
        let color3;
        do {
          color3 = ~~(Math.random() * Game.MAX_COLORS);
          assertColor(color3);
        } while (this.ary.includes(color3));
        this.ary.push(color3);
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

  // scripts/workers/colors.ts
  self.onmessage = (message) => {
    const [[colors, arrays], key] = message.data;
    if (arrays === null) {
      const shuffledColors = fullShuffledArray(colors);
      assertColorsAry(shuffledColors);
      sendIncrementally(shuffledColors, [], key);
      return;
    }
    const eliminated = new CondensedColors(arrays.eliminated);
    const selected = new CondensedColors(arrays.selected);
    const [colorsToAdd, nextIterColors] = doWork(colors, {
      eliminated,
      selected
    });
    assertColorsAry(colorsToAdd);
    sendIncrementally(colorsToAdd, nextIterColors, key);
  };
  function fullShuffledArray(origColors) {
    const colors = [];
    for (let i = 0; i < Game.MAX_COLORS; i++) {
      if (origColors.includes(i)) {
        continue;
      }
      colors.push(i);
    }
    return shuffle(colors);
  }
  function doWork(colors, arrays) {
    const newColors = [];
    const nextIterColors = [];
    for (let color3 = 0; color3 < Game.MAX_COLORS; color3++) {
      assertColor(color3);
      const isEliminated = arrays.eliminated.has(color3);
      const isSelected = arrays.selected.has(color3);
      const alreadyIncluded = colors.includes(color3);
      if (isSelected) {
        nextIterColors.push(color3);
        continue;
      }
      if (isEliminated || alreadyIncluded) {
        continue;
      }
      newColors.push(color3);
    }
    return [shuffle(newColors), shuffle(nextIterColors)];
  }
  function sendIncrementally(colors, nextIterColors, key) {
    const HUNDRED_THOU = 1e5;
    for (let i = 0; i < 170; i++) {
      const min = i * HUNDRED_THOU;
      const max = min + HUNDRED_THOU;
      if (min >= Game.MAX_COLORS) {
        break;
      }
      const colorsSubset = colors.slice(min, max);
      const nextIterSubset = nextIterColors.slice(min, max);
      self.postMessage([[colorsSubset, nextIterSubset], key]);
    }
  }
})();
//# sourceMappingURL=colors.js.map
