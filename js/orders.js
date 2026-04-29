(function (w) {
  var KEY = "cbc-orders";

  function getAll() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function findById(id) {
    if (!id) return null;
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function push(order) {
    try {
      var list = getAll();
      list.unshift(order);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function formatRub(num) {
    var n = Math.round(Number(num)) || 0;
    return n.toLocaleString("ru-RU") + "\u00a0₽";
  }

  function formatRubHtml(num) {
    var n = Math.round(Number(num)) || 0;
    return (
      '<span class="price-rub"><span class="price-rub__amount">' +
      esc(n.toLocaleString("ru-RU")) +
      '</span><span class="price-rub__currency">₽</span></span>'
    );
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e2) {
      return String(iso);
    }
  }

  function deliveryLabel(order) {
    if (!order || !order.address) return "—";
    var a = order.address;
    if (a.deliveryType === "courier" && a.courier) {
      var c = a.courier;
      var parts = [c.city, c.street, c.house].filter(function (x) {
        return x && String(x).trim();
      });
      var line = parts.join(", ");
      if (c.apt) line += ", кв. " + c.apt;
      if (c.zip) line += ", " + c.zip;
      return "Курьер: " + line;
    }
    if (a.pickupLabel) return "Пункт выдачи: " + a.pickupLabel;
    return "Пункт выдачи";
  }

  function paymentLabel(code) {
    if (code === "card") return "Онлайн картой";
    if (code === "cod") return "При получении";
    return "—";
  }

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderOrdersList() {
    var root = document.getElementById("account-orders-list");
    var empty = document.getElementById("account-orders-empty");
    if (!root) return;

    var items = getAll();
    if (items.length === 0) {
      root.innerHTML = "";
      root.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    root.hidden = false;

    var html = "";
    items.forEach(function (o) {
      html +=
        '<article class="account-order-card">' +
        '<div class="account-order-card__main">' +
        '<span class="account-order-card__id">№ ' +
        esc(o.id) +
        "</span>" +
        '<time class="account-order-card__date" datetime="' +
        esc(o.createdAt || "") +
        '">' +
        esc(formatDate(o.createdAt)) +
        "</time>" +
        "</div>" +
        '<div class="account-order-card__footer">' +
        '<span class="account-order-card__total">' +
        formatRubHtml(o.total) +
        "</span>" +
        '<a class="btn btn--ghost btn--sm" href="order.html?id=' +
        encodeURIComponent(o.id) +
        '">Подробнее</a>' +
        "</div>" +
        "</article>";
    });
    root.innerHTML = html;
  }

  function renderOrderDetail() {
    var root = document.getElementById("account-order-detail");
    var missing = document.getElementById("account-order-missing");
    if (!root) return;

    var params = new URLSearchParams(w.location.search);
    var id = params.get("id");
    var order = findById(id);

    if (!order) {
      root.hidden = true;
      if (missing) missing.hidden = false;
      document.title = "Заказ не найден — California Boxing Wear";
      return;
    }
    if (missing) missing.hidden = true;
    root.hidden = false;

    document.title = "Заказ " + order.id + " — California Boxing Wear";

    var set = function (tid, text) {
      var el = document.getElementById(tid);
      if (el) el.textContent = text != null ? text : "—";
    };

    set("order-detail-id", order.id);
    set("order-detail-date", formatDate(order.createdAt));
    set("order-detail-total", formatRub(order.total));
    set("order-detail-delivery", deliveryLabel(order));
    set("order-detail-payment", paymentLabel(order));

    var contact = order.contact || {};
    var parts = [contact.name, contact.phone, contact.email].filter(function (x) {
      return x && String(x).trim();
    });
    set("order-detail-contact", parts.length ? parts.join(" · ") : "—");

    var linesEl = document.getElementById("order-detail-lines");
    if (linesEl && order.items && order.items.length) {
      var h = "";
      order.items.forEach(function (line) {
        var title = line.name || line.id || "—";
        var sz = line.size ? String(line.size).toUpperCase() : "—";
        h +=
          '<div class="order-detail-line">' +
          '<div class="order-detail-line__main">' +
          '<span class="order-detail-line__title">' +
          esc(title) +
          "</span>" +
          '<span class="order-detail-line__meta">' +
          esc(sz) +
          " × " +
          esc(String(line.qty || 0)) +
          "</span>" +
          "</div>" +
          '<span class="order-detail-line__price">' +
          formatRubHtml(line.lineTotalRub != null ? line.lineTotalRub : 0) +
          "</span>" +
          "</div>";
      });
      linesEl.innerHTML = h;
    } else if (linesEl) {
      linesEl.innerHTML = "";
    }
  }

  function boot() {
    renderOrdersList();
    renderOrderDetail();
  }

  w.CBCOrders = {
    getAll: getAll,
    findById: findById,
    push: push,
    formatRub: formatRub,
    formatDate: formatDate,
    deliveryLabel: deliveryLabel,
    paymentLabel: paymentLabel,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("cbc:partials-ready", boot);
})(window);
