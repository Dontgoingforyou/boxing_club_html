(function (w, doc) {
  var CBC_SEARCH = {
    HISTORY_KEY: "cbc_search_history",
    HISTORY_MAX: 10,
    SUGGESTION_TAGS: ["футболка", "худи", "белый", "перчатки", "шорты"],
    TRENDING: ["футболка", "худи", "перчатки", "костюмы"],
    POPULAR_IDS: ["tee-1", "tee-2", "tee-3", "tee-4"],
    STORE_BRAND: "California Boxing Club",
    PRICE_BUCKETS: [
      { label: "До 5 000 ₽", min: 0, max: 5000 },
      { label: "5 000 – 10 000 ₽", min: 5000, max: 10000 },
      { label: "10 000 – 15 000 ₽", min: 10000, max: 15000 },
      { label: "От 15 000 ₽", min: 15000, max: null },
    ],
  };

  function pathPrefix() {
    return /\/account(\/|$)/.test(w.location.pathname || "") ? "../" : "";
  }

  function resolveImgUrl(img) {
    if (!img || /^(https?:)?\/\//.test(img) || img.charAt(0) === "/") return img;
    return pathPrefix() + img;
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

  function parsePriceRubFromProduct(p) {
    if (!p || p.price == null) return null;
    var digits = String(p.price).replace(/\D/g, "");
    if (!digits) return null;
    var n = parseInt(digits, 10);
    return isNaN(n) ? null : n;
  }

  /**
   * Совпадения по каталогу: каждое слово запроса должно встречаться в объединённом тексте полей.
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

  function buildSearchPageUrl(state) {
    var o = state || {};
    var params = new URLSearchParams();
    if (o.q) params.set("q", o.q);
    if (o.cat) params.set("cat", o.cat);
    if (o.min != null && o.min !== "") params.set("min", String(o.min));
    if (o.max != null && o.max !== "") params.set("max", String(o.max));
    if (o.sort && o.sort !== "new") params.set("sort", o.sort);
    var qs = params.toString();
    return pathPrefix() + "search.html" + (qs ? "?" + qs : "");
  }

  function searchPageHref(query) {
    if (typeof query === "string") {
      return buildSearchPageUrl({ q: query });
    }
    return buildSearchPageUrl(query);
  }

  function parseSearchPageState() {
    var params = new URLSearchParams(w.location.search || "");
    return {
      q: (params.get("q") || "").trim(),
      cat: (params.get("cat") || "").trim(),
      min: params.get("min"),
      max: params.get("max"),
      sort: params.get("sort") || "new",
    };
  }

  function readHistory() {
    try {
      var raw = w.localStorage.getItem(CBC_SEARCH.HISTORY_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch (e) {
      return [];
    }
  }

  function writeHistory(arr) {
    try {
      w.localStorage.setItem(CBC_SEARCH.HISTORY_KEY, JSON.stringify(arr.slice(0, CBC_SEARCH.HISTORY_MAX)));
    } catch (e) {
      /* ignore */
    }
  }

  function pushHistory(q) {
    var nq = normalizeText(q);
    if (!nq) return;
    var arr = readHistory().filter(function (x) {
      return normalizeText(x) !== nq;
    });
    arr.unshift(q.trim());
    writeHistory(arr);
  }

  function clearHistory() {
    try {
      w.localStorage.removeItem(CBC_SEARCH.HISTORY_KEY);
    } catch (e) {
      /* ignore */
    }
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
            escapeHtml(resolveImgUrl(item.img)) +
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
          escapeHtml(resolveImgUrl(img)) +
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

  function renderOverlayHistoryList() {
    var items = readHistory();
    if (!items.length) {
      return '<p class="search-overlay__history-empty">Пока пусто</p>';
    }
    var html = '<ul class="search-overlay__mini-list" role="list">';
    items.forEach(function (q) {
      html +=
        '<li class="search-overlay__mini-item">' +
        '<button type="button" class="search-overlay__mini-btn" data-search-history="' +
        escapeHtml(q) +
        '">' +
        '<span class="search-overlay__mini-icon" aria-hidden="true">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/></svg>' +
        "</span>" +
        "<span>" +
        escapeHtml(q) +
        "</span>" +
        "</button></li>";
    });
    html += "</ul>";
    return html;
  }

  function renderOverlayPopularHtml() {
    var products = w.CBC_PRODUCTS || {};
    var html = "";
    CBC_SEARCH.POPULAR_IDS.forEach(function (id) {
      var p = products[id];
      if (!p) return;
      var img = p.images && p.images.length ? p.images[0] : "";
      var title = p.breadcrumb || p.name || id;
      var href = productHref(id);
      html +=
        '<a class="search-overlay__pop-card" href="' +
        href +
        '">' +
        '<div class="search-overlay__pop-img-wrap">' +
        (img
          ? '<img class="search-overlay__pop-img" src="' +
            escapeHtml(resolveImgUrl(img)) +
            '" alt="" width="200" height="312" loading="lazy" />'
          : "") +
        "</div>" +
        '<div class="search-overlay__pop-meta">' +
        '<span class="search-overlay__pop-brand">' +
        escapeHtml(CBC_SEARCH.STORE_BRAND) +
        "</span>" +
        '<span class="search-overlay__pop-name">' +
        escapeHtml(title) +
        "</span>" +
        '<p class="search-overlay__pop-price">' +
        escapeHtml(p.price || "—") +
        "</p>" +
        "</div></a>";
    });
    return html;
  }

  function renderOverlaySuggestionTags() {
    var merged = [];
    var seen = {};
    CBC_SEARCH.SUGGESTION_TAGS.forEach(function (t) {
      if (!seen[t]) {
        seen[t] = true;
        merged.push(t);
      }
    });
    return merged
      .slice(0, 12)
      .map(function (t) {
        return (
          '<button type="button" class="search-overlay__tag" data-search-tag="' +
          escapeHtml(t) +
          '">' +
          escapeHtml(t) +
          "</button>"
        );
      })
      .join("");
  }

  function refreshOverlayExplore() {
    var hist = doc.getElementById("cbc-search-history-list");
    if (hist) hist.innerHTML = renderOverlayHistoryList();
    var pop = doc.getElementById("cbc-search-popular-row");
    if (pop) pop.innerHTML = renderOverlayPopularHtml();
    var tags = doc.getElementById("cbc-search-tags");
    if (tags) tags.innerHTML = renderOverlaySuggestionTags();
  }

  function overlayLupeSvg() {
    return (
      '<svg class="search-overlay__lupe" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
      '<path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />' +
      "</svg>"
    );
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
      '<form id="cbc-search-overlay-form" class="search-overlay__search-row" role="search" action="' +
      searchPageHref("") +
      '" method="get">' +
      '<label class="search-overlay__label" for="cbc-search-input">Запрос</label>' +
      '<div class="search-overlay__input-wrap">' +
      overlayLupeSvg() +
      '<input type="search" id="cbc-search-input" name="q" class="search-overlay__input-inner" autocomplete="off" placeholder="Название, категория, цвет…" />' +
      "</div>" +
      '<button type="submit" class="btn btn--accent search-overlay__submit" id="cbc-search-submit">Найти</button>' +
      "</form>" +
      '<div id="cbc-search-tags" class="search-overlay__tags" aria-label="Быстрые подсказки"></div>' +
      '<div class="search-overlay__results-wrap">' +
      '<div id="cbc-search-explore" class="search-overlay__explore">' +
      '<div class="search-overlay__explore-inner">' +
      '<div class="search-overlay__explore-sidebar">' +
      '<div class="search-overlay__sidebar-block">' +
      '<div class="search-overlay__col-head">' +
      '<p class="search-overlay__col-title">История</p>' +
      '<button type="button" class="search-overlay__clear-history" id="cbc-search-clear-history">Очистить</button>' +
      "</div>" +
      '<div id="cbc-search-history-list"></div>' +
      "</div>" +
      '<div class="search-overlay__sidebar-block">' +
      '<p class="search-overlay__col-title">Часто ищут</p>' +
      '<ul class="search-overlay__mini-list" role="list">' +
      CBC_SEARCH.TRENDING.map(function (t) {
        return (
          '<li class="search-overlay__mini-item">' +
          '<button type="button" class="search-overlay__mini-btn" data-search-trend="' +
          escapeHtml(t) +
          '">' +
          '<span class="search-overlay__mini-icon" aria-hidden="true">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>' +
          "</span><span>" +
          escapeHtml(t) +
          "</span></button></li>"
        );
      }).join("") +
      "</ul>" +
      "</div>" +
      "</div>" +
      '<div class="search-overlay__explore-products">' +
      '<p class="search-overlay__popular-title">Популярные товары</p>' +
      '<div id="cbc-search-popular-row" class="search-overlay__popular-row"></div>' +
      "</div>" +
      "</div></div>" +
      '<div id="cbc-search-live" class="search-overlay__results" role="region" aria-live="polite" hidden></div>' +
      "</div>" +
      "</div>";

    doc.body.appendChild(wrap);
    refreshOverlayExplore();
    return wrap;
  }

  function positionSearchDropdown() {
    var btn = doc.getElementById("nav-search");
    var panel = doc.querySelector("#cbc-search-overlay .search-overlay__panel");
    if (!btn || !panel) return;
    var gap = 8;
    var r = btn.getBoundingClientRect();
    var pad = 64;
    panel.style.top = r.bottom + gap + "px";
    panel.style.left = pad + "px";
    panel.style.right = pad + "px";
    panel.style.width = "auto";
    panel.style.maxWidth = "none";
  }

  function setOpen(open) {
    var overlay = doc.getElementById("cbc-search-overlay");
    var btn = doc.getElementById("nav-search");
    if (!overlay) return;
    overlay.hidden = !open;
    overlay.classList.toggle("search-overlay--open", open);
    doc.documentElement.classList.toggle("search-overlay-active", open);
    if (btn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-controls", "cbc-search-overlay");
    }
    if (open) {
      positionSearchDropdown();
      w.requestAnimationFrame(function () {
        positionSearchDropdown();
      });
      refreshOverlayExplore();
      var inp = doc.getElementById("cbc-search-input");
      if (inp) {
        window.setTimeout(function () {
          inp.focus();
          inp.select();
        }, 10);
      }
      updateOverlayResults(inp && inp.value ? inp.value : "");
    }
  }

  function updateOverlayResults(query) {
    var live = doc.getElementById("cbc-search-live");
    var explore = doc.getElementById("cbc-search-explore");
    if (!live || !explore) return;
    var q = String(query || "").trim();
    if (!q) {
      explore.hidden = false;
      live.hidden = true;
      live.innerHTML = "";
      return;
    }
    explore.hidden = true;
    live.hidden = false;
    var items = searchProducts(query);
    live.innerHTML = renderResultsHtml(items);
  }

  function goSearchPageFromOverlay() {
    var inp = doc.getElementById("cbc-search-input");
    var q = inp ? String(inp.value || "").trim() : "";
    if (q) pushHistory(q);
    w.location.href = buildSearchPageUrl({ q: q });
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
        return;
      }
      var tagBtn = t && t.closest && t.closest("[data-search-tag]");
      if (tagBtn) {
        e.preventDefault();
        ensureOverlay();
        var tag = tagBtn.getAttribute("data-search-tag");
        var inp2 = doc.getElementById("cbc-search-input");
        if (inp2 && tag) {
          inp2.value = tag;
          updateOverlayResults(tag);
        }
        return;
      }
      var histBtn = t && t.closest && t.closest("[data-search-history]");
      if (histBtn) {
        e.preventDefault();
        var hq = histBtn.getAttribute("data-search-history");
        var inp3 = doc.getElementById("cbc-search-input");
        if (inp3 && hq) {
          inp3.value = hq;
          updateOverlayResults(hq);
        }
        return;
      }
      var trBtn = t && t.closest && t.closest("[data-search-trend]");
      if (trBtn) {
        e.preventDefault();
        var tq = trBtn.getAttribute("data-search-trend");
        var inp4 = doc.getElementById("cbc-search-input");
        if (inp4 && tq) {
          inp4.value = tq;
          updateOverlayResults(tq);
        }
        return;
      }
      if (t && t.id === "cbc-search-clear-history") {
        e.preventDefault();
        clearHistory();
        refreshOverlayExplore();
      }
    });

    doc.addEventListener("submit", function (e) {
      if (!e.target || e.target.id !== "cbc-search-overlay-form") return;
      e.preventDefault();
      goSearchPageFromOverlay();
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

  function filterItemsByState(items, state) {
    var products = w.CBC_PRODUCTS || {};
    var cat = (state.cat || "").trim();
    var minV = state.min != null && state.min !== "" ? parseInt(String(state.min), 10) : null;
    var maxV = state.max != null && state.max !== "" ? parseInt(String(state.max), 10) : null;
    if (minV != null && isNaN(minV)) minV = null;
    if (maxV != null && isNaN(maxV)) maxV = null;

    return items.filter(function (item) {
      var p = products[item.id];
      if (cat && (!p || (p.category || "") !== cat)) return false;
      var rub = parsePriceRubFromProduct(p);
      if (rub == null) return true;
      if (minV != null && rub < minV) return false;
      if (maxV != null && rub > maxV) return false;
      return true;
    });
  }

  function sortItems(items, sortKey) {
    var products = w.CBC_PRODUCTS || {};
    var catalogOrder = Object.keys(products);
    var arr = items.slice();
    arr.sort(function (a, b) {
      var pa = products[a.id] || {};
      var pb = products[b.id] || {};
      var cmp = 0;
      switch (sortKey) {
        case "new": {
          var ia = catalogOrder.indexOf(a.id);
          var ib = catalogOrder.indexOf(b.id);
          cmp = (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
          break;
        }
        case "price-asc": {
          var ra = parsePriceRubFromProduct(pa) || 0;
          var rb = parsePriceRubFromProduct(pb) || 0;
          cmp = ra - rb;
          break;
        }
        case "price-desc": {
          var ra2 = parsePriceRubFromProduct(pa) || 0;
          var rb2 = parsePriceRubFromProduct(pb) || 0;
          cmp = rb2 - ra2;
          break;
        }
        case "name":
          cmp = String(a.title).localeCompare(String(b.title), "ru");
          break;
        default:
          cmp = 0;
      }
      if (cmp !== 0) return cmp;
      return String(a.id).localeCompare(String(b.id));
    });
    return arr;
  }

  function categoryCountsFromItems(items) {
    var products = w.CBC_PRODUCTS || {};
    var map = {};
    items.forEach(function (item) {
      var c = (products[item.id] && products[item.id].category) || "—";
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }

  var searchPageDebounceTimer;

  function initSearchPage() {
    var form = doc.getElementById("search-page-form");
    var input = doc.getElementById("search-page-input");
    var grid = doc.getElementById("search-page-grid");
    var empty = doc.getElementById("search-page-empty");
    if (!form || !input || !grid) return;

    var summaryEl = doc.getElementById("search-page-summary");
    var summaryCats = doc.getElementById("search-page-summary-cats");
    var refineEl = doc.getElementById("search-page-refine");
    var aside = doc.getElementById("search-page-aside");
    var catList = doc.getElementById("search-page-cat-list");
    var priceMin = doc.getElementById("search-page-min");
    var priceMax = doc.getElementById("search-page-max");
    var priceApply = doc.getElementById("search-page-price-apply");
    var sortSel = doc.getElementById("search-page-sort");
    var countEl = doc.getElementById("search-page-count");

    function collectState() {
      var st = {
        q: String(input.value || "").trim(),
        cat: "",
        min: priceMin && priceMin.value.trim() !== "" ? priceMin.value.trim() : "",
        max: priceMax && priceMax.value.trim() !== "" ? priceMax.value.trim() : "",
        sort: sortSel && sortSel.value ? sortSel.value : "new",
      };
      var selectedCat = doc.querySelector('input[name="search-page-cat"]:checked');
      if (selectedCat && selectedCat.value) st.cat = selectedCat.value;
      return st;
    }

    function setStateToUrl(state) {
      var url = buildSearchPageUrl(state);
      if (url !== w.location.pathname + w.location.search) {
        w.history.replaceState({}, "", url);
      }
    }

    function renderRefineChips(state) {
      if (!refineEl) return;
      var parts = [];
      if (state.q) {
        parts.push(
          '<button type="button" class="search-page-refine__chip" data-refine-remove="q">Запрос: ' +
            escapeHtml(state.q) +
            " ×</button>"
        );
      }
      if (state.cat) {
        parts.push(
          '<button type="button" class="search-page-refine__chip" data-refine-remove="cat">' +
            escapeHtml(state.cat) +
            " ×</button>"
        );
      }
      if (state.min || state.max) {
        var label = "Цена";
        if (state.min && state.max) label += ": " + state.min + "–" + state.max + " ₽";
        else if (state.min) label += ": от " + state.min + " ₽";
        else label += ": до " + state.max + " ₽";
        parts.push('<button type="button" class="search-page-refine__chip" data-refine-remove="price">' + label + " ×</button>");
      }
      refineEl.innerHTML =
        parts.length > 0
          ? '<span class="search-page-refine__label">Уточнить:</span>' + parts.join("")
          : "";
      refineEl.hidden = parts.length === 0;
    }

    function syncBucketRadios(st) {
      doc.querySelectorAll('input[name="search-page-bucket"]').forEach(function (el) {
        el.checked = false;
      });
      if ((st.min === "" || st.min == null) && (st.max === "" || st.max == null)) return;
      var mn = st.min !== "" && st.min != null ? parseInt(String(st.min), 10) : null;
      var mx = st.max !== "" && st.max != null ? parseInt(String(st.max), 10) : null;
      if (mn != null && isNaN(mn)) return;
      if (mx != null && isNaN(mx)) return;
      CBC_SEARCH.PRICE_BUCKETS.forEach(function (b, idx) {
        var matchMin = mn === b.min;
        var matchMax =
          b.max == null ? mx == null || String(st.max || "") === "" : mx === b.max;
        if (matchMin && matchMax) {
          var radio = doc.getElementById("search-page-bucket-" + idx);
          if (radio) radio.checked = true;
        }
      });
    }

    function syncFormFieldsFromUrl() {
      var st = parseSearchPageState();
      input.value = st.q;
      if (priceMin) priceMin.value = st.min != null && st.min !== "" ? String(st.min) : "";
      if (priceMax) priceMax.value = st.max != null && st.max !== "" ? String(st.max) : "";
      if (sortSel) sortSel.value = st.sort || "new";
      syncBucketRadios(st);
    }

    function renderCategoryRadios(st) {
      if (!catList) return;
      var base = searchProducts(st.q);
      var counts = categoryCountsFromItems(base);
      var cats = Object.keys(counts).sort(function (a, b) {
        return a.localeCompare(b, "ru");
      });
      var html = "";
      html +=
        '<li><label><input type="radio" name="search-page-cat" value=""' +
        (!st.cat ? " checked" : "") +
        ' /><span>Все категории</span><span class="count">' +
        base.length +
        "</span></label></li>";
      cats.forEach(function (c) {
        html +=
          '<li><label><input type="radio" name="search-page-cat" value="' +
          escapeHtml(c) +
          '"' +
          (st.cat === c ? " checked" : "") +
          " /><span>" +
          escapeHtml(c) +
          '</span><span class="count">' +
          counts[c] +
          "</span></label></li>";
      });
      catList.innerHTML = html;
    }

    function run() {
      syncFormFieldsFromUrl();
      var st = parseSearchPageState();

      if (!st.q) {
        grid.innerHTML = "";
        grid.hidden = true;
        if (empty) {
          empty.hidden = true;
          empty.textContent = "";
        }
        if (summaryEl) summaryEl.hidden = true;
        if (aside) aside.hidden = true;
        if (refineEl) {
          refineEl.innerHTML = "";
          refineEl.hidden = true;
        }
        if (countEl) countEl.textContent = "";
        if (catList) catList.innerHTML = "";
        return;
      }

      var base = searchProducts(st.q);
      var filtered = filterItemsByState(base, st);
      var sorted = sortItems(filtered, st.sort);

      if (summaryEl) {
        summaryEl.hidden = false;
        var head = summaryEl.querySelector("[data-search-summary-head]");
        if (head) head.textContent = "Найдено: " + sorted.length;
        if (summaryCats) {
          var cmap = categoryCountsFromItems(base);
          var bits = Object.keys(cmap)
            .sort(function (a, b) {
              return a.localeCompare(b, "ru");
            })
            .map(function (c) {
              return escapeHtml(c) + " — " + cmap[c];
            });
          summaryCats.textContent = bits.length ? bits.join(" · ") : "";
        }
      }

      renderRefineChips(st);
      if (aside) aside.hidden = false;
      renderCategoryRadios(st);

      grid.innerHTML = renderProductCardsForPage(sorted);
      if (empty) {
        empty.hidden = sorted.length > 0;
        empty.textContent = "По запросу и фильтрам ничего не найдено.";
      }
      grid.hidden = sorted.length === 0;
      if (countEl) countEl.textContent = sorted.length ? "Показано: " + sorted.length : "";

      if (w.CBCSetupCatalogCardHover) w.CBCSetupCatalogCardHover(grid);
    }

    function scheduleRun() {
      w.clearTimeout(searchPageDebounceTimer);
      searchPageDebounceTimer = w.setTimeout(function () {
        var st = collectState();
        setStateToUrl(st);
        run();
      }, 200);
    }

    function applyImmediately(options) {
      var opts = options || {};
      w.clearTimeout(searchPageDebounceTimer);
      var st = collectState();
      setStateToUrl(st);
      if (opts.recordHistory && st.q) pushHistory(st.q);
      run();
    }

    input.addEventListener("input", scheduleRun);
    input.addEventListener("paste", function () {
      w.setTimeout(scheduleRun, 0);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      applyImmediately({ recordHistory: true });
    });

    if (sortSel) {
      sortSel.addEventListener("change", function () {
        applyImmediately();
      });
    }

    if (priceMin) {
      priceMin.addEventListener("change", function () {
        doc.querySelectorAll('input[name="search-page-bucket"]').forEach(function (el) {
          el.checked = false;
        });
        applyImmediately();
      });
    }
    if (priceMax) {
      priceMax.addEventListener("change", function () {
        doc.querySelectorAll('input[name="search-page-bucket"]').forEach(function (el) {
          el.checked = false;
        });
        applyImmediately();
      });
    }

    if (priceApply) {
      priceApply.addEventListener("click", function () {
        doc.querySelectorAll('input[name="search-page-bucket"]').forEach(function (el) {
          el.checked = false;
        });
        applyImmediately();
      });
    }

    doc.querySelectorAll('input[name="search-page-bucket"]').forEach(function (el) {
      el.addEventListener("change", function () {
        if (!el.checked) return;
        var idx = parseInt(el.value, 10);
        var b = CBC_SEARCH.PRICE_BUCKETS[idx];
        if (!b) return;
        if (priceMin) priceMin.value = b.min != null ? String(b.min) : "";
        if (priceMax) priceMax.value = b.max != null ? String(b.max) : "";
        applyImmediately();
      });
    });

    if (catList) {
      catList.addEventListener("change", function (e) {
        if (!e.target || e.target.name !== "search-page-cat") return;
        applyImmediately();
      });
    }

    if (refineEl) {
      refineEl.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest && e.target.closest("[data-refine-remove]");
        if (!btn) return;
        var key = btn.getAttribute("data-refine-remove");
        if (key === "q") input.value = "";
        if (key === "cat") {
          var all = doc.querySelector('input[name="search-page-cat"][value=""]');
          if (all) all.checked = true;
        }
        if (key === "price") {
          if (priceMin) priceMin.value = "";
          if (priceMax) priceMax.value = "";
          doc.querySelectorAll('input[name="search-page-bucket"]').forEach(function (el) {
            el.checked = false;
          });
        }
        applyImmediately();
      });
    }

    w.addEventListener("popstate", function () {
      syncFormFieldsFromUrl();
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
    buildSearchPageUrl: buildSearchPageUrl,
    parseSearchPageState: parseSearchPageState,
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  doc.addEventListener("cbc:partials-ready", bindOverlayOnce);
})(window, document);
