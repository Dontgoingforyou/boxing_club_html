(function (w) {
  var CHECKOUT_DRAFT_KEY = "cbc_checkout_draft";
  var CHECKOUT_DRAFT_VERSION = 1;
  var draftSaveTimer = null;

  function readCheckoutDraftRaw() {
    try {
      var raw = w.localStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeCheckoutDraftRaw(data) {
    try {
      w.localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function clearCheckoutDraft() {
    try {
      w.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch (e) {}
  }

  function valById(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "") : "";
  }

  function collectCheckoutFields() {
    var deliveryEl = document.querySelector('input[name="checkout-delivery"]:checked');
    var paymentEl = document.querySelector('input[name="checkout-payment"]:checked');
    return {
      v: CHECKOUT_DRAFT_VERSION,
      name: valById("checkout-name"),
      email: valById("checkout-email"),
      phone: valById("checkout-phone"),
      city: valById("checkout-city"),
      street: valById("checkout-street"),
      house: valById("checkout-house"),
      apt: valById("checkout-apt"),
      zip: valById("checkout-zip"),
      delivery: deliveryEl ? deliveryEl.value : "courier",
      payment: paymentEl ? paymentEl.value : "card",
      pickup: valById("checkout-pickup"),
    };
  }

  function scheduleCheckoutDraftSave() {
    var step = document.getElementById("cart-drawer-step-checkout");
    if (!step || step.hidden) return;
    w.clearTimeout(draftSaveTimer);
    draftSaveTimer = w.setTimeout(function () {
      var data = collectCheckoutFields();
      data.inCheckout = true;
      data.v = CHECKOUT_DRAFT_VERSION;
      writeCheckoutDraftRaw(data);
    }, 280);
  }

  function bindCheckoutDraftPersistenceOnce() {
    var form = document.getElementById("checkout-form");
    if (!form || form._cbcCheckoutDraftBound) return;
    form._cbcCheckoutDraftBound = true;
    form.addEventListener("input", scheduleCheckoutDraftSave);
    form.addEventListener("change", scheduleCheckoutDraftSave);
  }

  function applyCheckoutDraftOverProfile() {
    var d = readCheckoutDraftRaw();
    if (!d || d.v !== CHECKOUT_DRAFT_VERSION) return;

    function setInput(id, value) {
      if (value === undefined) return;
      var el = document.getElementById(id);
      if (!el) return;
      if (id === "checkout-phone") {
        el.value = value === "" ? "" : normalizePhoneDisplay(String(value));
      } else {
        el.value = String(value);
      }
    }

    if (Object.prototype.hasOwnProperty.call(d, "name")) setInput("checkout-name", d.name);
    if (Object.prototype.hasOwnProperty.call(d, "email")) setInput("checkout-email", d.email);
    if (Object.prototype.hasOwnProperty.call(d, "phone")) setInput("checkout-phone", d.phone);
    if (Object.prototype.hasOwnProperty.call(d, "city")) setInput("checkout-city", d.city);
    if (Object.prototype.hasOwnProperty.call(d, "street")) setInput("checkout-street", d.street);
    if (Object.prototype.hasOwnProperty.call(d, "house")) setInput("checkout-house", d.house);
    if (Object.prototype.hasOwnProperty.call(d, "apt")) setInput("checkout-apt", d.apt);
    if (Object.prototype.hasOwnProperty.call(d, "zip")) setInput("checkout-zip", d.zip);

    if (d.delivery === "courier" || d.delivery === "pickup") {
      var rd = document.querySelector('input[name="checkout-delivery"][value="' + d.delivery + '"]');
      if (rd) rd.checked = true;
    }
    if (d.payment === "card" || d.payment === "cod") {
      var rp = document.querySelector('input[name="checkout-payment"][value="' + d.payment + '"]');
      if (rp) rp.checked = true;
    }
    if (Object.prototype.hasOwnProperty.call(d, "pickup") && String(d.pickup).length) {
      var sel = document.getElementById("checkout-pickup");
      if (sel) sel.value = String(d.pickup);
    }
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

  function sizeLabel(size) {
    var k = String(size || "").toLowerCase();
    var map = { s: "S", m: "M", l: "L", xl: "XL", "2xl": "2XL" };
    return map[k] || String(size || "").toUpperCase();
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function orderSuccessUrl(id) {
    var base = /\/account\//.test(w.location.pathname) ? "../" : "";
    return base + "order-success.html?id=" + encodeURIComponent(id);
  }

  function getProfile() {
    return w.CBCProfile && w.CBCProfile.get ? w.CBCProfile.get() : {};
  }

  function setProfile(data) {
    if (w.CBCProfile && w.CBCProfile.save) w.CBCProfile.save(data || {});
  }

  function newOrderId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function showFormError(el, message) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  function phoneDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function normalizePhoneDisplay(value) {
    var d = phoneDigits(value);
    if (d.charAt(0) === "8") {
      d = "7" + d.slice(1);
    }
    if (!d.length) {
      return "+7";
    }
    if (d.charAt(0) !== "7") {
      d = "7" + d.replace(/^7+/, "");
    }
    if (d.length > 11) {
      d = d.slice(0, 11);
    }
    return "+7" + (d.length > 1 ? " " + d.slice(1) : "");
  }

  function bindCheckoutPhoneMask() {
    var phone = document.getElementById("checkout-phone");
    if (!phone || phone._cbcPhoneMaskBound) return;
    phone._cbcPhoneMaskBound = true;
    phone.addEventListener("focus", function () {
      var v = String(phone.value || "").trim();
      if (!v) {
        phone.value = "+7 ";
      }
    });
    phone.addEventListener("input", function () {
      phone.value = normalizePhoneDisplay(phone.value);
    });
    phone.addEventListener("blur", function () {
      var t = String(phone.value || "").trim();
      if (t === "+7" || t === "+7 ") {
        phone.value = "";
      }
    });
  }

  function clearErrors(form) {
    if (!form) return;
    form.querySelectorAll(".form-error").forEach(function (node) {
      node.textContent = "";
      node.hidden = true;
    });
  }

  function renderSummary() {
    var listEl = document.getElementById("checkout-summary-lines");
    var totalEl = document.getElementById("checkout-summary-total");
    var asideEl = document.getElementById("checkout-aside");
    if (!listEl || !totalEl) return;

    var cart = w.CBCCart;
    var products = w.CBC_PRODUCTS || {};
    if (!cart) {
      listEl.innerHTML = "";
      totalEl.textContent = "—";
      return;
    }

    var items = cart.getItems();
    var html = "";
    items.forEach(function (row) {
      var p = products[row.id] || {};
      var title = p.breadcrumb || p.name || row.id;
      var unit = parsePriceRub(p.price);
      var line = unit * (row.qty || 0);
      html +=
        '<div class="checkout-summary-line">' +
        '<div class="checkout-summary-line__main">' +
        '<span class="checkout-summary-line__title">' +
        escapeHtml(title) +
        "</span>" +
        '<span class="checkout-summary-line__meta">' +
        escapeHtml(sizeLabel(row.size)) +
        " × " +
        escapeHtml(String(row.qty)) +
        "</span>" +
        "</div>" +
        '<span class="checkout-summary-line__price">' +
        formatRubHtml(line) +
        "</span>" +
        "</div>";
    });
    listEl.innerHTML = html;
    totalEl.textContent = formatRub(cart.total());
    if (asideEl) asideEl.hidden = items.length === 0;
  }

  function toggleDeliveryFields() {
    var courier = document.querySelector('input[name="checkout-delivery"][value="courier"]');
    var isCourier = courier && courier.checked;
    var block = document.getElementById("checkout-courier-fields");
    var pickup = document.getElementById("checkout-pickup-wrap");
    if (block) {
      block.hidden = !isCourier;
      block.querySelectorAll("input").forEach(function (inp) {
        inp.disabled = !isCourier;
      });
    }
    if (pickup) {
      pickup.hidden = isCourier;
      var sel = document.getElementById("checkout-pickup");
      if (sel) sel.disabled = isCourier;
    }
  }

  function prefillFromProfile() {
    var p = getProfile();
    var map = [
      ["checkout-name", "name"],
      ["checkout-email", "email"],
      ["checkout-phone", "phone"],
      ["checkout-city", "city"],
      ["checkout-street", "street"],
      ["checkout-house", "house"],
      ["checkout-apt", "apt"],
      ["checkout-zip", "zip"],
    ];
    map.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el && p[pair[1]]) {
        if (pair[0] === "checkout-phone") {
          el.value = normalizePhoneDisplay(String(p[pair[1]]));
        } else {
          el.value = String(p[pair[1]]);
        }
      }
    });
  }

  function validate(form) {
    clearErrors(form);
    var ok = true;
    var name = document.getElementById("checkout-name");
    var email = document.getElementById("checkout-email");
    var phone = document.getElementById("checkout-phone");

    if (name && String(name.value).trim().length < 2) {
      showFormError(document.getElementById("err-name"), "Укажите имя (не короче 2 символов).");
      ok = false;
    }
    if (email) {
      if (!String(email.value).trim()) {
        showFormError(document.getElementById("err-email"), "Укажите email.");
        ok = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email.value).trim())) {
        showFormError(document.getElementById("err-email"), "Некорректный email.");
        ok = false;
      }
    }
    if (phone) {
      var pd = phoneDigits(phone.value);
      if (pd.length < 11) {
        showFormError(
          document.getElementById("err-phone"),
          "Укажите телефон: 10 цифр после кода +7."
        );
        ok = false;
      }
    }

    var courierRadio = document.querySelector('input[name="checkout-delivery"][value="courier"]');
    if (courierRadio && courierRadio.checked) {
      var city = document.getElementById("checkout-city");
      var street = document.getElementById("checkout-street");
      var house = document.getElementById("checkout-house");
      if (!city || !String(city.value).trim()) {
        showFormError(document.getElementById("err-city"), "Укажите город.");
        ok = false;
      }
      if (!street || !String(street.value).trim()) {
        showFormError(document.getElementById("err-street"), "Укажите улицу.");
        ok = false;
      }
      if (!house || !String(house.value).trim()) {
        showFormError(document.getElementById("err-house"), "Укажите дом.");
        ok = false;
      }
    } else {
      var pickup = document.getElementById("checkout-pickup");
      if (!pickup || !String(pickup.value).trim()) {
        showFormError(document.getElementById("err-pickup"), "Выберите пункт выдачи.");
        ok = false;
      }
    }

    return ok;
  }

  function buildSnapshotItems() {
    var cart = w.CBCCart;
    var products = w.CBC_PRODUCTS || {};
    if (!cart) return [];
    return cart.getItems().map(function (row) {
      var p = products[row.id] || {};
      var unit = parsePriceRub(p.price);
      return {
        id: row.id,
        size: row.size,
        qty: row.qty,
        name: p.breadcrumb || p.name || row.id,
        priceText: p.price || "—",
        unitRub: unit,
        lineTotalRub: unit * (row.qty || 0),
      };
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    if (!w.CBCCart || w.CBCCart.count() === 0) {
      if (w.CBCOpenCartDrawer) w.CBCOpenCartDrawer();
      return;
    }
    if (!validate(form)) return;

    var courierEl = document.querySelector('input[name="checkout-delivery"][value="courier"]');
    var deliveryCourier = courierEl && courierEl.checked;
    var cardPayEl = document.querySelector('input[name="checkout-payment"][value="card"]');
    var paymentCard = cardPayEl && cardPayEl.checked;

    var contact = {
      name: String(document.getElementById("checkout-name").value).trim(),
      email: String(document.getElementById("checkout-email").value).trim(),
      phone: String(document.getElementById("checkout-phone").value).trim(),
    };

    var address = {
      deliveryType: deliveryCourier ? "courier" : "pickup",
      courier: deliveryCourier
        ? {
            city: String(document.getElementById("checkout-city").value).trim(),
            street: String(document.getElementById("checkout-street").value).trim(),
            house: String(document.getElementById("checkout-house").value).trim(),
            apt: String(document.getElementById("checkout-apt").value).trim(),
            zip: String(document.getElementById("checkout-zip").value).trim(),
          }
        : null,
      pickupId: deliveryCourier ? null : String(document.getElementById("checkout-pickup").value),
      pickupLabel: deliveryCourier
        ? null
        : (function () {
            var sel = document.getElementById("checkout-pickup");
            if (!sel || !sel.selectedOptions[0]) return "";
            return sel.selectedOptions[0].textContent.trim();
          })(),
    };

    var total = w.CBCCart.total();
    var id = newOrderId();
    var createdAt = new Date().toISOString();

    var order = {
      id: id,
      createdAt: createdAt,
      items: buildSnapshotItems(),
      contact: contact,
      address: address,
      payment: paymentCard ? "card" : "cod",
      total: total,
    };

    if (w.CBCOrders && w.CBCOrders.push) w.CBCOrders.push(order);

    clearCheckoutDraft();

    setProfile({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      city: address.courier ? address.courier.city : "",
      street: address.courier ? address.courier.street : "",
      house: address.courier ? address.courier.house : "",
      apt: address.courier ? address.courier.apt : "",
      zip: address.courier ? address.courier.zip : "",
    });

    w.CBCCart.clear();
    if (w.CBCCart.refreshNav) w.CBCCart.refreshNav();

    w.location.href = orderSuccessUrl(id);
  }

  function bindCheckoutFormOnce() {
    var form = document.getElementById("checkout-form");
    if (!form || form._cbcCheckoutBound) return;
    form._cbcCheckoutBound = true;
    form.addEventListener("submit", onSubmit);

    document.querySelectorAll('input[name="checkout-delivery"]').forEach(function (r) {
      r.addEventListener("change", toggleDeliveryFields);
    });

    bindCheckoutDraftPersistenceOnce();
  }

  w.CBCCheckoutDraft = {
    shouldResumeCheckoutStep: function () {
      if (!w.CBCCart || w.CBCCart.count() === 0) return false;
      var d = readCheckoutDraftRaw();
      return !!(d && d.v === CHECKOUT_DRAFT_VERSION && d.inCheckout === true);
    },
    markEnteringCheckout: function () {
      var data = collectCheckoutFields();
      data.inCheckout = true;
      data.v = CHECKOUT_DRAFT_VERSION;
      writeCheckoutDraftRaw(data);
    },
    markLeavingCheckoutUi: function () {
      var data = collectCheckoutFields();
      data.inCheckout = false;
      data.v = CHECKOUT_DRAFT_VERSION;
      writeCheckoutDraftRaw(data);
    },
    clear: clearCheckoutDraft,
    clearIfCartEmpty: function () {
      if (!w.CBCCart || w.CBCCart.count() === 0) clearCheckoutDraft();
    },
  };

  w.CBCCheckoutOnDrawerStep = function () {
    prefillFromProfile();
    applyCheckoutDraftOverProfile();
    bindCheckoutPhoneMask();
    renderSummary();
    toggleDeliveryFields();
    bindCheckoutFormOnce();
  };

  function boot() {
    bindCheckoutFormOnce();
    renderSummary();
    bindCheckoutPhoneMask();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("cbc:partials-ready", function () {
    if (w.CBCCart && w.CBCCart.refreshNav) w.CBCCart.refreshNav();
    renderSummary();
    bindCheckoutPhoneMask();
    bindCheckoutFormOnce();
  });
})(window);
