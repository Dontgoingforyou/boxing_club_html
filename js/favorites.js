(function (w) {
  var KEY = "cbc-favorites";

  var BOOKMARK_SVG =
    '<svg class="bookmark-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />' +
    "</svg>";

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

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardMarkup(id, p) {
    var title = (p && (p.breadcrumb || p.name)) || id;
    var price = (p && p.price) || "—";
    var imgs = p && p.images;
    var imgUrl = imgs && imgs.length ? imgs[0] : "";
    var hasPage = !!imgUrl;

    var mediaInner = "";
    if (imgUrl) {
      mediaInner +=
        '<a href="product.html?id=' +
        encodeURIComponent(id) +
        '" class="product-card__cover" aria-label="' +
        escapeHtml(title) +
        ' — страница товара"></a>';
      mediaInner +=
        '<img src="' +
        escapeHtml(imgUrl) +
        '" alt="" width="620" height="968" class="product-card__img" loading="lazy" />';
    }
    mediaInner +=
      '<button type="button" class="product-card__bookmark is-saved" aria-pressed="true" aria-label="В избранном, убрать">' +
      BOOKMARK_SVG +
      "</button>";

    var mediaClass = imgUrl ? "product-card__media" : "product-card__media placeholder-checker";

    var nameBlock = hasPage
      ? '<h3 class="product-card__name"><a href="product.html?id=' +
        encodeURIComponent(id) +
        '" class="product-card__title-link">' +
        escapeHtml(title) +
        "</a></h3>"
      : '<h3 class="product-card__name">' + escapeHtml(title) + "</h3>";

    return (
      '<article class="product-card" data-product-id="' +
      escapeHtml(id) +
      '">' +
      '<div class="' +
      mediaClass +
      '">' +
      mediaInner +
      "</div>" +
      nameBlock +
      '<p class="product-card__price">' +
      escapeHtml(price) +
      "</p>" +
      "</article>"
    );
  }

  function bindFavoriteCardHandlers(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll(".product-card__bookmark").forEach(function (btn) {
      var card = btn.closest(".product-card");
      var pid = card && card.getAttribute("data-product-id");
      if (!pid) return;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        w.CBCFavorites.remove(pid);
        w.CBCFavorites.refreshNav();
        w.CBCFavorites.render();
      });
    });
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

      var badge = document.getElementById("nav-favorites-badge");
      if (badge) {
        if (n > 0) {
          badge.textContent = n > 99 ? "99+" : String(n);
          badge.hidden = false;
          badge.setAttribute("aria-hidden", "false");
        } else {
          badge.hidden = true;
          badge.setAttribute("aria-hidden", "true");
        }
      }
    },
    /**
     * Рендерит сетку избранного в #favorites-grid; переключает #favorites-empty.
     * @param {HTMLElement} [containerEl] необязательный контейнер с grid внутри (по умолчанию document)
     */
    render: function (containerEl) {
      var root = containerEl || document;
      var grid = root.querySelector ? root.querySelector("#favorites-grid") : null;
      if (!grid) {
        grid = document.getElementById("favorites-grid");
      }
      var emptyEl = root.querySelector ? root.querySelector("#favorites-empty") : null;
      if (!emptyEl) {
        emptyEl = document.getElementById("favorites-empty");
      }
      if (!grid) return;

      var ids = getIds();
      var products = w.CBC_PRODUCTS || {};
      var html = "";

      ids.forEach(function (id) {
        var p = products[id];
        if (!p) {
          p = { breadcrumb: id, name: id, price: "—", images: [] };
        }
        html += cardMarkup(id, p);
      });

      grid.innerHTML = html;

      if (emptyEl) {
        var isEmpty = grid.children.length === 0;
        emptyEl.hidden = !isEmpty;
        grid.hidden = isEmpty;
      }

      bindFavoriteCardHandlers(grid);
    }
  };

  document.addEventListener("cbc:partials-ready", function () {
    if (w.CBCFavorites) {
      w.CBCFavorites.refreshNav();
      w.CBCFavorites.render();
    }
  });
})(window);
