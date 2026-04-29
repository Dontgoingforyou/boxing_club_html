(function (w, doc) {
  function pathPrefix() {
    return /\/account(\/|$)/.test(w.location.pathname || "") ? "../" : "";
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeText(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokensFromQuery(q) {
    return normalizeText(q)
      .split(" ")
      .filter(function (t) {
        return t.length > 0;
      });
  }

  function haystackForProduct(id, p) {
    return normalizeText(
      [
        id,
        p.name,
        p.breadcrumb,
        p.category,
        p.lead || "",
        p.color || "",
        p.print || "",
        p.care || "",
      ].join(" ")
    );
  }

  /**
   * Возвращает совпадения по каталогу: каждое слово запроса должно встречаться в объединённом тексте полей.
   */
  function searchProducts(query) {
    var products = w.CBC_PRODUCTS || {};
    var tokens = tokensFromQuery(query);
    if (!tokens.length) return [];

    var out = [];
    Object.keys(products).forEach(function (id) {
      var p = products[id];
      if (!p) return;
      var hay = haystackForProduct(id, p);
      var ok = tokens.every(function (t) {
        return hay.indexOf(t) !== -1;
      });
      if (!ok) return;
      var title = p.breadcrumb || p.name || id;
      var img = p.images && p.images.length ? p.images[0] : "";
      out.push({ id: id, title: title, price: p.price || "—", img: img });
    });

    out.sort(function (a, b) {
      return String(a.title).localeCompare(String(b.title), "ru");
    });
    return out;
  }

  function productHref(id) {
    return pathPrefix() + "product.html?id=" + encodeURIComponent(id);
  }

  function searchPageHref(query) {
    return pathPrefix() + "search.html" + (query ? "?q=" + encodeURIComponent(query) : "");
  }

  function renderResultsHtml(items) {
    if (!items.length) {
      return '<p class="search-overlay__empty">Ничего не найдено. Попробуйте другие слова.</p>';
    }
    var html = '<ul class="search-overlay__list" role="list">';
    items.forEach(function (item) {
      var href = productHref(item.id);
      html +=
        '<li class="search-overlay__item">' +
        '<a class="search-overlay__link" href="' +
        href +
        '">' +
        (item.img
          ? '<span class="search-overlay__thumb-wrap"><img src="' +
            escapeHtml(item.img) +
            '" alt="" class="search-overlay__thumb" width="56" height="88" loading="lazy" /></span>'
          : '<span class="search-overlay__thumb-wrap search-overlay__thumb-wrap--empty" aria-hidden="true"></span>') +
        '<span class="search-overlay__meta">' +
        '<span class="search-overlay__name">' +
        escapeHtml(item.title) +
        "</span>" +
        '<span class="search-overlay__price">' +
        escapeHtml(item.price) +
        "</span>" +
        "</span>" +
        "</a>" +
        "</li>";
    });
    html += "</ul>";
    return html;
  }

  function renderProductCardsForPage(items) {
    var pref = pathPrefix();
    if (!items.length) return "";
    var html = "";
    items.forEach(function (item) {
      var p = (w.CBC_PRODUCTS || {})[item.id] || {};
      var img = item.img || "";
      var alt = escapeHtml(p.name || item.title);
      html +=
        '<article class="product-card product-card--search" data-product-id="' +
        escapeHtml(item.id) +
        '">' +
        '<div class="product-card__media">' +
        '<a href="' +
        productHref(item.id) +
        '" class="product-card__cover" aria-label="' +
        escapeHtml(item.title) +
        ' — страница товара"></a>';
      if (img) {
        html +=
          '<img src="' +
          escapeHtml(img) +
          '" alt="' +
          alt +
          '" width="620" height="968" class="product-card__img" loading="lazy" />';
      } else {
        html += '<span class="product-card__img product-card__img--placeholder" aria-hidden="true"></span>';
      }
      html +=
        "</div>" +
        '<h3 class="product-card__name"><a href="' +
        productHref(item.id) +
        '" class="product-card__title-link">' +
        escapeHtml(item.title) +
        "</a></h3>" +
        '<p class="product-card__price">' +
        escapeHtml(item.price) +
        "</p>" +
        "</article>";
    });
    return html;
  }

  var overlayBound = false;
  var debounceTimer;

  function ensureOverlay() {
    var existing = doc.getElementById("cbc-search-overlay");
    if (existing) return existing;

    var wrap = doc.createElement("div");
    wrap.id = "cbc-search-overlay";
    wrap.className = "search-overlay search-overlay--dropdown";
    wrap.hidden = true;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "cbc-search-title");

    wrap.innerHTML =
      '<div class="search-overlay__backdrop" data-search-close tabindex="-1" aria-hidden="true"></div>' +
      '<div class="search-overlay__panel">' +
      '<div class="search-overlay__head">' +
      '<h2 id="cbc-search-title" class="search-overlay__title">Поиск по каталогу</h2>' +
      '<button type="button" class="search-overlay__close icon-btn" data-search-close aria-label="Закрыть поиск">' +
      '<svg class="top-bar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>' +
      "</button>" +
      "</div>" +
      '<label class="search-overlay__label" for="cbc-search-input">Запрос</label>' +
      '<input type="search" id="cbc-search-input" class="search-overlay__input checkout-input" autocomplete="off" placeholder="Название, категория, цвет…" />' +
      '<div id="cbc-search-results" class="search-overlay__results" role="region" aria-live="polite"></div>' +
      '<p class="search-overlay__hint"><a class="search-overlay__more" id="cbc-search-open-page" href="' +
      searchPageHref("") +
      '">Все результаты на странице поиска</a></p>' +
      "</div>";

    doc.body.appendChild(wrap);
    return wrap;
  }

  function widestContentContainer() {
    var nodes = doc.querySelectorAll("main .container--wide, main .container, .container--wide, .container");
    var best = null;
    var bestW = 0;
    for (var i = 0; i < nodes.length; i++) {
      var w = nodes[i].getBoundingClientRect().width;
      if (w > bestW) {
        bestW = w;
        best = nodes[i];
      }
    }
    return best;
  }

  function contentRightInsetPx(vw) {
    var container = widestContentContainer();
    if (container) {
      var cr = container.getBoundingClientRect();
      return Math.max(12, Math.round(vw - cr.right));
    }
    return Math.min(64, Math.max(12, Math.round(vw * 0.05)));
  }

  function positionSearchDropdown() {
    var btn = doc.getElementById("nav-search");
    var panel = doc.querySelector("#cbc-search-overlay .search-overlay__panel");
    if (!btn || !panel) return;
    var vw = doc.documentElement.clientWidth || w.innerWidth || 0;
    var r = btn.getBoundingClientRect();
    var gap = 8;
    if (vw < 520) {
      panel.style.top = r.bottom + gap + "px";
      panel.style.right = "12px";
      panel.style.left = "12px";
      panel.style.width = "auto";
      panel.style.maxWidth = "";
    } else {
      var inset = contentRightInsetPx(vw);
      var leftMin = 12;
      var maxFit = Math.max(0, vw - inset - leftMin);
      panel.style.top = r.bottom + gap + "px";
      panel.style.right = inset + "px";
      panel.style.left = "auto";
      panel.style.width = "540px";
      panel.style.maxWidth = maxFit + "px";
    }
  }

  function setOpen(open) {
    var overlay = doc.getElementById("cbc-search-overlay");
    var btn = doc.getElementById("nav-search");
    if (!overlay) return;
    overlay.hidden = !open;
    overlay.classList.toggle("search-overlay--open", open);
    if (btn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-controls", "cbc-search-overlay");
    }
    if (open) {
      positionSearchDropdown();
      w.requestAnimationFrame(function () {
        positionSearchDropdown();
      });
      var inp = doc.getElementById("cbc-search-input");
      if (inp) {
        window.setTimeout(function () {
          inp.focus();
          inp.select();
        }, 10);
      }
    }
  }

  function updateOverlayResults(query) {
    var box = doc.getElementById("cbc-search-results");
    var link = doc.getElementById("cbc-search-open-page");
    if (!box) return;
    var q = String(query || "").trim();
    if (!q) {
      box.innerHTML = "";
    } else {
      var items = searchProducts(query);
      box.innerHTML = renderResultsHtml(items);
    }
    if (link) {
      link.setAttribute("href", searchPageHref(q));
    }
  }

  function bindOverlayOnce() {
    if (overlayBound) return;
    overlayBound = true;

    doc.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest && t.closest("#nav-search")) {
        e.preventDefault();
        ensureOverlay();
        setOpen(true);
        var inp = doc.getElementById("cbc-search-input");
        updateOverlayResults(inp && inp.value ? inp.value : "");
        return;
      }
      if (t && t.closest && t.closest("[data-search-close]")) {
        e.preventDefault();
        setOpen(false);
      }
    });

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var o = doc.getElementById("cbc-search-overlay");
        if (o && !o.hidden) {
          setOpen(false);
        }
      }
    });

    doc.addEventListener("input", function (e) {
      if (!e.target || e.target.id !== "cbc-search-input") return;
      var q = e.target.value;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(function () {
        updateOverlayResults(q);
      }, 220);
    });

    w.addEventListener("resize", function () {
      var o = doc.getElementById("cbc-search-overlay");
      if (o && !o.hidden) positionSearchDropdown();
    });

    w.addEventListener(
      "scroll",
      function () {
        var o = doc.getElementById("cbc-search-overlay");
        if (o && !o.hidden) positionSearchDropdown();
      },
      true
    );
  }

  var searchPageDebounceTimer;

  function initSearchPage() {
    var form = doc.getElementById("search-page-form");
    var input = doc.getElementById("search-page-input");
    var grid = doc.getElementById("search-page-grid");
    var empty = doc.getElementById("search-page-empty");
    if (!form || !input || !grid) return;

    function syncUrlFromInput() {
      var q = String(input.value || "").trim();
      var url = searchPageHref(q);
      if (url !== w.location.pathname + w.location.search) {
        w.history.replaceState({}, "", url);
      }
    }

    function run() {
      var q = String(input.value || "").trim();
      if (!q) {
        grid.innerHTML = "";
        grid.hidden = true;
        if (empty) empty.hidden = true;
        return;
      }
      var items = searchProducts(q);
      grid.innerHTML = renderProductCardsForPage(items);
      if (empty) {
        empty.hidden = items.length > 0;
        empty.textContent = "По запросу ничего не найдено.";
      }
      grid.hidden = items.length === 0;
      if (w.CBCSetupCatalogCardHover) w.CBCSetupCatalogCardHover(grid);
    }

    function scheduleRun() {
      w.clearTimeout(searchPageDebounceTimer);
      searchPageDebounceTimer = w.setTimeout(function () {
        syncUrlFromInput();
        run();
      }, 200);
    }

    var params = new URLSearchParams(w.location.search);
    var initial = params.get("q");
    if (initial) input.value = initial;

    input.addEventListener("input", scheduleRun);
    input.addEventListener("paste", function () {
      w.setTimeout(scheduleRun, 0);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      syncUrlFromInput();
      w.clearTimeout(searchPageDebounceTimer);
      run();
    });

    run();
  }

  function boot() {
    bindOverlayOnce();
    initSearchPage();
  }

  w.CBCSearch = {
    search: searchProducts,
    productHref: productHref,
    searchPageHref: searchPageHref,
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  doc.addEventListener("cbc:partials-ready", bindOverlayOnce);
})(window, document);
