(function (w) {
  var KEY = "cbc-cart";

  var REMOVE_ICON_SVG =
    '<svg class="cart-remove-link__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />' +
    "</svg>";

  var pendingRemoval = null;

  function pathToRoot() {
    return /\/account\//.test(w.location.pathname) ? "../" : "";
  }

  function resolveProductAssetUrl(raw) {
    if (!raw) return "";
    var s = String(raw);
    if (/^(?:https?:)?\/\//i.test(s) || s.charAt(0) === "/" || s.indexOf("data:") === 0) {
      return s;
    }
    return pathToRoot() + s.replace(/^\.\//, "");
  }

  function clampQty(n) {
    var v = parseInt(String(n), 10);
    if (isNaN(v) || v < 1) return 1;
    if (v > 99) return 99;
    return v;
  }

  function normalizeSize(s) {
    return String(s == null ? "" : s).toLowerCase();
  }

  function lineEqual(a, b) {
    return !!(a && b && a.id === b.id && normalizeSize(a.size) === normalizeSize(b.size));
  }

  function findLineIndex(snapshot) {
    var items = getItems();
    for (var i = 0; i < items.length; i++) {
      if (lineEqual(items[i], snapshot)) return i;
    }
    return -1;
  }

  function getItems() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function setItems(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
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

  function parsePriceRub(text) {
    if (text == null) return 0;
    var digits = String(text).replace(/[^\d]/g, "");
    if (!digits) return 0;
    return parseInt(digits, 10) || 0;
  }

  function formatRub(num) {
    var n = Math.round(Number(num)) || 0;
    return n.toLocaleString("ru-RU") + "\u00a0₽";
  }

  function formatRubHtml(num) {
    var n = Math.round(Number(num)) || 0;
    return (
      '<span class="price-rub"><span class="price-rub__amount">' +
      escapeHtml(n.toLocaleString("ru-RU")) +
      '</span><span class="price-rub__currency">₽</span></span>'
    );
  }

  var SIZE_LABELS = {
    s: "S",
    m: "M",
    l: "L",
    xl: "XL",
    "2xl": "2XL",
  };

  function sizeLabel(size) {
    var k = normalizeSize(size);
    return SIZE_LABELS[k] || String(size || "").toUpperCase();
  }

  function lineUnitRub(item) {
    var products = w.CBC_PRODUCTS || {};
    var p = products[item.id];
    return p ? parsePriceRub(p.price) : 0;
  }

  function cancelPendingRemoval() {
    if (!pendingRemoval) return;
    if (pendingRemoval.timerId) w.clearTimeout(pendingRemoval.timerId);
    if (pendingRemoval.tickId) w.clearInterval(pendingRemoval.tickId);
    pendingRemoval = null;
  }

  function commitPendingRemoval() {
    if (!pendingRemoval) return;
    var snap = pendingRemoval.snapshot;
    cancelPendingRemoval();
    var items = getItems();
    for (var i = 0; i < items.length; i++) {
      if (lineEqual(items[i], snap)) {
        items.splice(i, 1);
        setItems(items);
        return;
      }
    }
  }

  function startPendingRemoval(idx) {
    cancelPendingRemoval();
    var items = getItems();
    if (idx < 0 || idx >= items.length) return;
    var snapshot = {
      id: items[idx].id,
      size: items[idx].size,
      qty: items[idx].qty,
    };
    var endsAt = Date.now() + 5000;
    pendingRemoval = {
      snapshot: snapshot,
      endsAt: endsAt,
      timerId: null,
      tickId: null,
    };
    pendingRemoval.timerId = w.setTimeout(function () {
      commitPendingRemoval();
      w.CBCCart.refreshNav();
      w.CBCCart.render();
    }, 5000);
    pendingRemoval.tickId = w.setInterval(function () {
      var el = document.getElementById("cart-remove-countdown");
      if (!pendingRemoval || !el) return;
      var left = Math.max(0, Math.ceil((pendingRemoval.endsAt - Date.now()) / 1000));
      el.textContent = String(left);
    }, 250);
    w.CBCCart.render();
  }

  function idxFromLineEl(el) {
    var row = el && el.closest ? el.closest("[data-line-index]") : null;
    if (!row) return -1;
    var raw = row.getAttribute("data-line-index");
    var i = parseInt(raw, 10);
    return isNaN(i) ? -1 : i;
  }

  function bindCartDrawerHandlersOnce() {
    var root = document.getElementById("cart-drawer");
    if (!root || root._cbcCartUiBound) return;
    root._cbcCartUiBound = true;

    root.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var undo = t.closest("[data-undo-remove]");
      if (undo) {
        e.preventDefault();
        cancelPendingRemoval();
        w.CBCCart.render();
        return;
      }
      var rm = t.closest("[data-remove-line]");
      if (rm) {
        e.preventDefault();
        var ix = idxFromLineEl(rm);
        if (ix < 0) return;
        var itemsNow = w.CBCCart.getItems();
        if (!itemsNow[ix]) return;
        var clickedSnap = {
          id: itemsNow[ix].id,
          size: itemsNow[ix].size,
          qty: itemsNow[ix].qty,
        };
        if (pendingRemoval && lineEqual(pendingRemoval.snapshot, clickedSnap)) {
          commitPendingRemoval();
          w.CBCCart.refreshNav();
          w.CBCCart.render();
          return;
        }
        if (pendingRemoval) {
          commitPendingRemoval();
          w.CBCCart.refreshNav();
          w.CBCCart.render();
        }
        var ix2 = findLineIndex(clickedSnap);
        if (ix2 >= 0) {
          startPendingRemoval(ix2);
        }
        return;
      }
      var deltaBtn = t.closest("[data-qty-delta]");
      if (deltaBtn) {
        e.preventDefault();
        if (deltaBtn.closest("[data-qty-blocked]")) return;
        if (pendingRemoval) commitPendingRemoval();
        var ix = idxFromLineEl(deltaBtn);
        if (ix < 0) return;
        var delta = parseInt(deltaBtn.getAttribute("data-qty-delta"), 10);
        var row = w.CBCCart.getItems()[ix];
        if (!row) return;
        w.CBCCart.update(ix, row.qty + (delta || 0));
        w.CBCCart.refreshNav();
        w.CBCCart.render();
      }
    });

    root.addEventListener("change", function (e) {
      var inp = e.target;
      if (!inp || inp.getAttribute("data-qty-input") == null) return;
      if (inp.closest("[data-qty-blocked]")) return;
      if (pendingRemoval) commitPendingRemoval();
      var ix = idxFromLineEl(inp);
      if (ix < 0) return;
      w.CBCCart.update(ix, inp.value);
      w.CBCCart.refreshNav();
      w.CBCCart.render();
    });
  }

  w.CBCCart = {
    getItems: function () {
      return getItems().slice();
    },

    hasLine: function (id, size) {
      var sz = normalizeSize(size);
      return getItems().some(function (row) {
        return row.id === id && normalizeSize(row.size) === sz;
      });
    },

    add: function (obj) {
      if (!obj || !obj.id) return;
      var id = obj.id;
      var size = normalizeSize(obj.size);
      var qty = clampQty(obj.qty);
      var items = getItems();
      var found = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id && normalizeSize(items[i].size) === size) {
          found = i;
          break;
        }
      }
      if (found >= 0) {
        items[found].qty = clampQty(items[found].qty + qty);
      } else {
        items.push({ id: id, size: size, qty: qty });
      }
      setItems(items);
    },

    update: function (idx, qty) {
      var items = getItems();
      if (idx < 0 || idx >= items.length) return;
      var q = clampQty(qty);
      if (q < 1) {
        items.splice(idx, 1);
      } else {
        items[idx].qty = q;
      }
      setItems(items);
    },

    remove: function (idx) {
      var items = getItems();
      if (idx < 0 || idx >= items.length) return;
      items.splice(idx, 1);
      setItems(items);
    },

    clear: function () {
      setItems([]);
    },

    count: function () {
      return getItems().reduce(function (acc, row) {
        return acc + (row.qty || 0);
      }, 0);
    },

    total: function () {
      var items = getItems();
      var sum = 0;
      for (var i = 0; i < items.length; i++) {
        var unit = lineUnitRub(items[i]);
        sum += unit * (items[i].qty || 0);
      }
      return sum;
    },

    refreshNav: function () {
      var el = document.getElementById("nav-cart");
      if (!el) return;
      var n = this.count();
      var word =
        n === 0
          ? ""
          : n === 1
            ? "1 шт."
            : n < 5
              ? n + " шт."
              : n + " шт.";
      el.setAttribute("aria-label", n ? "Корзина, " + word : "Корзина");

      var badge = document.getElementById("nav-cart-badge");
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

    render: function () {
      var linesEl = document.getElementById("cart-drawer-lines");
      var emptyEl = document.getElementById("cart-drawer-empty");
      var cartBlock = document.getElementById("cart-drawer-cart");
      var totalEl = document.getElementById("cart-drawer-total");

      bindCartDrawerHandlersOnce();

      if (!linesEl) return;

      var items = getItems();
      var products = w.CBC_PRODUCTS || {};
      var base = pathToRoot();
      var html = "";

      items.forEach(function (row, idx) {
        var p = products[row.id];
        var title = (p && (p.breadcrumb || p.name)) || row.id;
        var priceText = (p && p.price) || "—";
        var imgUrl = p && p.images && p.images.length ? resolveProductAssetUrl(p.images[0]) : "";
        var unitRub = lineUnitRub(row);
        var lineSum = unitRub * (row.qty || 0);
        var isPending = pendingRemoval && lineEqual(pendingRemoval.snapshot, row);
        var removeBlock = "";
        if (isPending) {
          var secLeft = pendingRemoval
            ? Math.max(0, Math.ceil((pendingRemoval.endsAt - Date.now()) / 1000))
            : 5;
          removeBlock =
            '<div class="cart-pending-remove cart-drawer__line-remove">' +
            '<span class="cart-pending-remove__msg">Удалим через <strong id="cart-remove-countdown">' +
            escapeHtml(String(secLeft)) +
            '</strong> с</span>' +
            '<button type="button" class="cart-remove-undo link-more" data-undo-remove>Отменить</button>' +
            "</div>";
        } else {
          removeBlock =
            '<button type="button" class="cart-remove-link" data-remove-line aria-label="Удалить позицию">' +
            REMOVE_ICON_SVG +
            "<span>Удалить</span>" +
            "</button>";
        }

        var qtyDisabled = isPending ? " disabled" : "";
        var qtyAria = isPending ? ' aria-disabled="true"' : "";

        html +=
          '<article class="cart-drawer__line cart-row' +
          (isPending ? " cart-row--pending-remove" : "") +
          '" data-line-index="' +
          idx +
          '">' +
          '<div class="cart-drawer__line-media">' +
          (imgUrl
            ? '<a href="' +
              base +
              "product.html?id=" +
              encodeURIComponent(row.id) +
              '" class="cart-drawer__line-thumb-wrap">' +
              '<img src="' +
              escapeHtml(imgUrl) +
              '" alt="" width="72" height="112" loading="lazy" />' +
              "</a>"
            : '<span class="cart-thumb cart-thumb--placeholder" aria-hidden="true"></span>') +
          "</div>" +
          '<div class="cart-drawer__line-main">' +
          '<a href="' +
          base +
          "product.html?id=" +
          encodeURIComponent(row.id) +
          '" class="cart-drawer__line-title">' +
          escapeHtml(title) +
          "</a>" +
          '<p class="cart-drawer__line-meta">Размер: <span class="cart-size">' +
          escapeHtml(sizeLabel(row.size)) +
          "</span> · " +
          escapeHtml(priceText) +
          "</p>" +
          '<div class="cart-drawer__line-row">' +
          '<div class="product-qty product-qty--sm"' +
          (isPending ? " data-qty-blocked" : "") +
          ' data-line-qty' +
          qtyAria +
          ">" +
          '<button type="button" class="product-qty__btn" data-qty-delta="-1" aria-label="Уменьшить количество"' +
          qtyDisabled +
          ">−</button>" +
          '<input type="number" class="product-qty__input" min="1" max="99" value="' +
          escapeHtml(String(row.qty)) +
          '" inputmode="numeric" aria-label="Количество" data-qty-input' +
          qtyDisabled +
          " />" +
          '<button type="button" class="product-qty__btn" data-qty-delta="1" aria-label="Увеличить количество"' +
          qtyDisabled +
          ">+</button>" +
          "</div>" +
          '<span class="cart-drawer__line-price">' +
          formatRubHtml(lineSum) +
          "</span>" +
          "</div>" +
          '<div class="cart-drawer__line-remove">' +
          removeBlock +
          "</div>" +
          "</div>" +
          "</article>";
      });

      linesEl.innerHTML = html;

      var isEmpty = items.length === 0;
      if (emptyEl) emptyEl.hidden = !isEmpty;
      if (cartBlock) cartBlock.hidden = isEmpty;

      var total = this.total();
      if (totalEl) totalEl.textContent = formatRub(total);

      var toCheckout = document.getElementById("cart-drawer-to-checkout");
      if (toCheckout) toCheckout.hidden = isEmpty;
    },
  };

  document.addEventListener("cbc:partials-ready", function () {
    if (w.CBCCart) {
      w.CBCCart.refreshNav();
      w.CBCCart.render();
    }
  });
})(window);
