(function (w) {
  var KEY = "cbc-favorites";

  function getIds() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function setIds(ids) {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch (e) {}
  }

  w.CBCFavorites = {
    getIds: getIds,
    has: function (id) {
      return getIds().indexOf(id) !== -1;
    },
    add: function (id) {
      var ids = getIds();
      if (ids.indexOf(id) === -1) {
        ids.push(id);
        setIds(ids);
      }
    },
    remove: function (id) {
      setIds(
        getIds().filter(function (x) {
          return x !== id;
        })
      );
    },
    /** @returns {boolean} true если теперь в избранном */
    toggle: function (id) {
      if (this.has(id)) {
        this.remove(id);
        return false;
      }
      this.add(id);
      return true;
    },
    refreshNav: function () {
      var el = document.getElementById("nav-favorites");
      if (!el) return;
      var n = getIds().length;
      var word =
        n === 0
          ? ""
          : n === 1
            ? "1 товар"
            : n < 5
              ? n + " товара"
              : n + " товаров";
      el.setAttribute("aria-label", n ? "Избранное, " + word : "Избранное");
    }
  };
})(window);
