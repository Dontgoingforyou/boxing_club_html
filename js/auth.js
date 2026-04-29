(function (w) {
  var AUTH_KEY = "cbc-auth";

  function inAccountArea() {
    var p = w.location.pathname || "";
    return /\/account(\/|$)/.test(p);
  }

  function hrefLogin() {
    return inAccountArea() ? "../login.html" : "login.html";
  }

  function hrefAccountHome() {
    return inAccountArea() ? "index.html" : "account/index.html";
  }

  function getAuth() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return null;
      if (!o.email || String(o.email).trim() === "") return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function setAuth(data) {
    try {
      var prev = getAuth() || {};
      var next = {
        email: String(data.email || "").trim(),
        name: String(data.name != null ? data.name : prev.name || "").trim(),
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  function clearAuth() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {}
  }

  function refreshAccountLinks() {
    var loggedIn = !!getAuth();
    var nav = document.getElementById("nav-account");
    var foot = document.getElementById("footer-account-link");
    var href = loggedIn ? hrefAccountHome() : hrefLogin();
    if (nav) nav.setAttribute("href", href);
    if (foot) foot.setAttribute("href", href);
  }

  function guardAccountPages() {
    if (!document.body || !document.body.hasAttribute("data-require-auth")) return false;
    if (getAuth()) return false;
    w.location.replace(hrefLogin());
    return true;
  }

  function markAccountNav() {
    var page = document.body && document.body.getAttribute("data-account-page");
    if (!page) return;
    if (page === "order") page = "orders";
    document.querySelectorAll("[data-account-nav]").forEach(function (el) {
      var match = el.getAttribute("data-account-nav") === page;
      el.classList.toggle("is-active", match);
      if (el.tagName === "A" && match) el.setAttribute("aria-current", "page");
      else if (el.tagName === "A") el.removeAttribute("aria-current");
    });
  }

  function bindLogoutClicks() {
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("[data-auth-logout]");
      if (!t) return;
      e.preventDefault();
      if (w.CBCAuth && w.CBCAuth.logout) w.CBCAuth.logout();
    });
  }

  function validateEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function showErr(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  function initPasswordToggles() {
    document.querySelectorAll(".password-field").forEach(function (wrap) {
      var input = wrap.querySelector("input[type=\"password\"], input[type=\"text\"]");
      var btn = wrap.querySelector(".password-field__toggle");
      if (!input || !btn || btn._cbcPwToggle) return;
      btn._cbcPwToggle = true;
      btn.addEventListener("click", function () {
        var showChars = input.type === "password";
        input.type = showChars ? "text" : "password";
        btn.setAttribute("aria-pressed", showChars ? "true" : "false");
        btn.setAttribute("aria-label", showChars ? "Скрыть пароль" : "Показать пароль");
      });
    });
  }

  function initLoginForm() {
    var form = document.getElementById("login-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("login-email");
      var pass = document.getElementById("login-password");
      showErr("err-login-email", "");
      showErr("err-login-password", "");
      var ok = true;
      if (!email || !validateEmail(email.value)) {
        showErr("err-login-email", "Укажите корректный email.");
        ok = false;
      }
      if (!pass || String(pass.value).length < 1) {
        showErr("err-login-password", "Введите пароль.");
        ok = false;
      }
      if (!ok) return;
      setAuth({ email: email.value.trim(), name: "" });
      w.location.href = hrefAccountHome();
    });
  }

  function initRegisterForm() {
    var form = document.getElementById("register-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("register-name");
      var email = document.getElementById("register-email");
      var p1 = document.getElementById("register-password");
      var p2 = document.getElementById("register-password2");
      showErr("err-register-name", "");
      showErr("err-register-email", "");
      showErr("err-register-password", "");
      showErr("err-register-password2", "");
      var ok = true;
      if (!nameEl || String(nameEl.value).trim().length < 2) {
        showErr("err-register-name", "Укажите имя (не короче 2 символов).");
        ok = false;
      }
      if (!email || !validateEmail(email.value)) {
        showErr("err-register-email", "Укажите корректный email.");
        ok = false;
      }
      if (!p1 || String(p1.value).length < 6) {
        showErr("err-register-password", "Пароль не короче 6 символов.");
        ok = false;
      }
      if (!p2 || !p1 || p1.value !== p2.value) {
        showErr("err-register-password2", "Пароли не совпадают.");
        ok = false;
      }
      if (!ok) return;
      setAuth({ email: email.value.trim(), name: nameEl.value.trim() });
      w.location.href = hrefAccountHome();
    });
  }

  function initPasswordResetForm() {
    var form = document.getElementById("password-reset-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("reset-email");
      showErr("err-reset-email", "");
      if (!email || !validateEmail(email.value)) {
        showErr("err-reset-email", "Укажите корректный email.");
        return;
      }
      var panel = document.getElementById("password-reset-panel");
      var done = document.getElementById("password-reset-done");
      if (panel) panel.hidden = true;
      if (done) done.hidden = false;
    });
  }

  function boot() {
    if (guardAccountPages()) return;
    bindLogoutClicks();
    refreshAccountLinks();
    markAccountNav();
    initPasswordToggles();
    initLoginForm();
    initRegisterForm();
    initPasswordResetForm();
  }

  w.CBCAuth = {
    get: getAuth,
    set: setAuth,
    clear: clearAuth,
    refreshAccountLinks: refreshAccountLinks,
    logout: function () {
      clearAuth();
      w.location.href = hrefLogin();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("cbc:partials-ready", function () {
    refreshAccountLinks();
    markAccountNav();
    initPasswordToggles();
  });
})(window);
