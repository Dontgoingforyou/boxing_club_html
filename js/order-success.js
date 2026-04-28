(function (w) {
  var ORDERS_KEY = "cbc-orders";

  function formatRub(num) {
    var n = Math.round(Number(num)) || 0;
    return n.toLocaleString("ru-RU") + " ₽";
  }

  function findOrder(id) {
    if (!id) return null;
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      if (!raw) return null;
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
      }
    } catch (e) {
      return null;
    }
    return null;
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

  function render() {
    var params = new URLSearchParams(w.location.search);
    var id = params.get("id");
    var order = findOrder(id);

    var root = document.getElementById("order-success-root");
    var missing = document.getElementById("order-success-missing");

    if (!order) {
      if (root) root.hidden = true;
      if (missing) missing.hidden = false;
      document.title = "Заказ не найден — California Boxing Wear";
      return;
    }

    if (missing) missing.hidden = true;
    if (root) root.hidden = false;

    var elId = document.getElementById("success-order-id");
    var elDate = document.getElementById("success-date");
    var elTotal = document.getElementById("success-total");
    var elDel = document.getElementById("success-delivery");
    var elPay = document.getElementById("success-payment");

    if (elId) elId.textContent = order.id;
    if (elTotal) elTotal.textContent = formatRub(order.total);

    if (elDate && order.createdAt) {
      try {
        var d = new Date(order.createdAt);
        elDate.textContent = d.toLocaleString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e2) {
        elDate.textContent = order.createdAt;
      }
    }

    if (elDel) elDel.textContent = deliveryLabel(order);
    if (elPay) elPay.textContent = paymentLabel(order.payment);

    document.title = "Заказ " + order.id + " — California Boxing Wear";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  document.addEventListener("cbc:partials-ready", function () {
    if (w.CBCFavorites && w.CBCFavorites.refreshNav) w.CBCFavorites.refreshNav();
    if (w.CBCCart && w.CBCCart.refreshNav) w.CBCCart.refreshNav();
  });
})(window);
