(function (w) {
  var KEY = "cbc-cart";

  function clampQty(n) {
    var v = parseInt(String(n), 10);
    if (isNaN(v) || v < 1) return 1;
    if (v > 99) return 99;
    return v;
  }

  function normalizeSize(s) {
    return String(s == null ? "" : s).toLowerCase();
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
    return n.toLocaleString("ru-RU") + " ₽";
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

  w.CBCCart = {
    getItems: function () {
      return getItems().slice();
    },

    /**
     * Есть ли в корзине позиция с этим товаром и размером.
     */
    hasLine: function (id, size) {
      var sz = normalizeSize(size);
      return getItems().some(function (row) {
        return row.id === id && normalizeSize(row.size) === sz;
      });
    },

    /**
     * Добавить позицию или увеличить количество той же вариации.
     */
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

    /** Суммарное количество единиц товара (штук). */
    count: function () {
      return getItems().reduce(function (acc, row) {
        return acc + (row.qty || 0);
      }, 0);
    },

    /** Итого в рублях (число). */
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

    /**
     * Рендер таблицы корзины: #cart-empty / #cart-table-body / #cart-summary-total / #cart-checkout-btn.
     */
    render: function () {
      var tbody = document.getElementById("cart-table-body");
      var emptyEl = document.getElementById("cart-empty");
      var contentEl = document.getElementById("cart-content");
      var totalEl = document.getElementById("cart-summary-total");
      var checkoutBtn = document.getElementById("cart-checkout-btn");

      if (!tbody) return;

      var items = getItems();
      var products = w.CBC_PRODUCTS || {};
      var html = "";

      items.forEach(function (row, idx) {
        var p = products[row.id];
        var title = (p && (p.breadcrumb || p.name)) || row.id;
        var priceText = (p && p.price) || "—";
        var imgUrl = p && p.images && p.images.length ? p.images[0] : "";
        var unitRub = lineUnitRub(row);
        var lineSum = unitRub * (row.qty || 0);

        html +=
          '<tr class="cart-row" data-line-index="' +
          idx +
          '">' +
          '<td class="cart-cell cart-cell--media">' +
          (imgUrl
            ? '<a href="product.html?id=' +
              encodeURIComponent(row.id) +
              '" class="cart-thumb-wrap">' +
              '<img src="' +
              escapeHtml(imgUrl) +
              '" alt="" class="cart-thumb" width="96" height="150" loading="lazy" />' +
              "</a>"
            : '<span class="cart-thumb cart-thumb--placeholder" aria-hidden="true"></span>') +
          "</td>" +
          '<td class="cart-cell cart-cell--info">' +
          '<a href="product.html?id=' +
          encodeURIComponent(row.id) +
          '" class="cart-title-link">' +
          escapeHtml(title) +
          "</a>" +
          '<p class="cart-meta">Размер: <span class="cart-size">' +
          escapeHtml(sizeLabel(row.size)) +
          "</span></p>" +
          "</td>" +
          '<td class="cart-cell cart-cell--price">' +
          '<span class="cart-price-unit">' +
          escapeHtml(priceText) +
          "</span>" +
          "</td>" +
          '<td class="cart-cell cart-cell--qty">' +
          '<div class="product-qty product-qty--sm" data-line-qty>' +
          '<button type="button" class="product-qty__btn" data-qty-delta="-1" aria-label="Уменьшить количество">−</button>' +
          '<input type="number" class="product-qty__input" min="1" max="99" value="' +
          escapeHtml(String(row.qty)) +
          '" inputmode="numeric" aria-label="Количество" data-qty-input />' +
          '<button type="button" class="product-qty__btn" data-qty-delta="1" aria-label="Увеличить количество">+</button>' +
          "</div>" +
          "</td>" +
          '<td class="cart-cell cart-cell--sum">' +
          '<span class="cart-line-sum">' +
          escapeHtml(formatRub(lineSum)) +
          "</span>" +
          "</td>" +
          '<td class="cart-cell cart-cell--remove">' +
          '<button type="button" class="cart-remove btn btn--ghost" data-remove-line aria-label="Удалить позицию">' +
          "Удалить" +
          "</button>" +
          "</td>" +
          "</tr>";
      });

      tbody.innerHTML = html;

      var isEmpty = items.length === 0;
      if (emptyEl) emptyEl.hidden = !isEmpty;
      if (contentEl) contentEl.hidden = isEmpty;

      var total = this.total();
      if (totalEl) totalEl.textContent = formatRub(total);
      if (checkoutBtn) checkoutBtn.hidden = isEmpty;

      bindCartPageHandlersOnce();
    },
  };

  function bindCartPageHandlersOnce() {
    var root = document.getElementById("cart-content");
    if (!root || root._cbcCartUiBound) return;
    root._cbcCartUiBound = true;

    function idxFromRow(el) {
      var tr = el && el.closest ? el.closest("tr.cart-row") : null;
      if (!tr) return -1;
      var raw = tr.getAttribute("data-line-index");
      var i = parseInt(raw, 10);
      return isNaN(i) ? -1 : i;
    }

    root.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var rm = t.closest("[data-remove-line]");
      if (rm) {
        e.preventDefault();
        var ix = idxFromRow(rm);
        if (ix >= 0) {
          w.CBCCart.remove(ix);
          w.CBCCart.refreshNav();
          w.CBCCart.render();
        }
        return;
      }
      var deltaBtn = t.closest("[data-qty-delta]");
      if (deltaBtn) {
        e.preventDefault();
        var ix = idxFromRow(deltaBtn);
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
      var ix = idxFromRow(inp);
      if (ix < 0) return;
      w.CBCCart.update(ix, inp.value);
      w.CBCCart.refreshNav();
      w.CBCCart.render();
    });
  }

  document.addEventListener("cbc:partials-ready", function () {
    if (w.CBCCart) {
      w.CBCCart.refreshNav();
      w.CBCCart.render();
    }
  });
})(window);
