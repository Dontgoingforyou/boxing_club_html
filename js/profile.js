(function (w) {
  var PROFILE_KEY = "cbc-profile";

  function get() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }

  function save(partial) {
    try {
      var prev = get();
      var next = Object.assign({}, prev, partial || {});
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  function fillView(p) {
    function set(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val != null && String(val).trim() !== "" ? String(val) : "—";
    }
    set("profile-view-name", p.name);
    set("profile-view-email", p.email);
    set("profile-view-phone", p.phone);
    var addr =
      [p.city, p.street, p.house].filter(function (x) {
        return x && String(x).trim();
      }).join(", ") +
      (p.apt ? ", кв. " + p.apt : "") +
      (p.zip ? ", " + p.zip : "");
    set("profile-view-address", addr.trim() ? addr : "");
  }

  function fillForm(p) {
    var map = [
      ["profile-input-name", "name"],
      ["profile-input-email", "email"],
      ["profile-input-phone", "phone"],
      ["profile-input-city", "city"],
      ["profile-input-street", "street"],
      ["profile-input-house", "house"],
      ["profile-input-apt", "apt"],
      ["profile-input-zip", "zip"],
    ];
    map.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) el.value = p[pair[1]] != null ? String(p[pair[1]]) : "";
    });
  }

  function readForm() {
    function val(id) {
      var el = document.getElementById(id);
      return el ? String(el.value).trim() : "";
    }
    return {
      name: val("profile-input-name"),
      email: val("profile-input-email"),
      phone: val("profile-input-phone"),
      city: val("profile-input-city"),
      street: val("profile-input-street"),
      house: val("profile-input-house"),
      apt: val("profile-input-apt"),
      zip: val("profile-input-zip"),
    };
  }

  function validate(data) {
    var ok = true;
    function show(id, msg) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg || "";
      el.hidden = !msg;
      if (msg) ok = false;
    }
    show("err-profile-name", "");
    show("err-profile-email", "");
    show("err-profile-phone", "");
    if (data.name.length < 2) show("err-profile-name", "Укажите имя (не короче 2 символов).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) show("err-profile-email", "Укажите корректный email.");
    if (data.phone.replace(/\D/g, "").length < 10) show("err-profile-phone", "Укажите телефон (не меньше 10 цифр).");
    return ok;
  }

  function syncAuthFromProfile(data) {
    if (!w.CBCAuth || !w.CBCAuth.set) return;
    w.CBCAuth.set({ email: data.email, name: data.name });
  }

  function initProfilePage() {
    var viewEl = document.getElementById("profile-view");
    var formEl = document.getElementById("profile-form");
    if (!viewEl || !formEl) return;
    if (formEl._cbcProfileBound) return;
    formEl._cbcProfileBound = true;

    (function mergeAuthIntoProfile() {
      var p = get();
      if (p.email) return;
      if (!w.CBCAuth || !w.CBCAuth.get) return;
      var a = w.CBCAuth.get();
      if (!a || !a.email) return;
      save({ email: a.email, name: a.name || "" });
    })();

    var btnEdit = document.getElementById("profile-edit-btn");
    var btnCancel = document.getElementById("profile-cancel-btn");

    function showView() {
      viewEl.hidden = false;
      formEl.hidden = true;
      fillView(get());
    }

    function showEdit() {
      fillForm(get());
      document.querySelectorAll("#profile-form .form-error").forEach(function (n) {
        n.textContent = "";
        n.hidden = true;
      });
      viewEl.hidden = true;
      formEl.hidden = false;
    }

    showView();

    if (btnEdit) btnEdit.addEventListener("click", showEdit);
    if (btnCancel) btnCancel.addEventListener("click", showView);

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = readForm();
      if (!validate(data)) return;
      save(data);
      syncAuthFromProfile(data);
      if (w.CBCAuth && w.CBCAuth.refreshAccountLinks) w.CBCAuth.refreshAccountLinks();
      showView();
    });
  }

  w.CBCProfile = {
    get: get,
    save: save,
  };

  function boot() {
    initProfilePage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
