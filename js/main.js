(function () {
  function initShellAfterPartials() {
    var siteHeader = document.getElementById("site-header");
    if (siteHeader && document.body.classList.contains("header-scroll-reveal")) {
      function syncHeaderScroll() {
        siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
      }
      syncHeaderScroll();
      window.addEventListener("scroll", syncHeaderScroll, { passive: true });
    }

    var menuBtn = document.querySelector(".top-bar__menu");
    var drawer = document.getElementById("drawer");
    var backdrop = drawer && drawer.querySelector("[data-close-drawer]");

    function setDrawerOpen(open) {
      if (!drawer || !menuBtn) return;
      drawer.hidden = !open;
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }

    if (menuBtn && drawer) {
      menuBtn.addEventListener("click", function () {
        var open = drawer.hidden;
        setDrawerOpen(open);
      });
      if (backdrop) {
        backdrop.addEventListener("click", function () {
          setDrawerOpen(false);
        });
      }
      drawer.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          setDrawerOpen(false);
        });
      });
    }

    if (window.CBCFavorites) {
      window.CBCFavorites.refreshNav();
    }
    if (window.CBCCart) {
      window.CBCCart.refreshNav();
    }
  }

  document.addEventListener("cbc:partials-ready", initShellAfterPartials);

  function getProductGrid() {
    return document.getElementById("product-grid");
  }

  function getCatalogCards() {
    var grid = getProductGrid();
    return grid ? grid.querySelectorAll(".product-card") : document.querySelectorAll(".product-card");
  }

  var chips = document.querySelectorAll(".filter-chip");

  function cardHasPlaceholderMedia(card) {
    return !!card.querySelector(".product-card__media.placeholder-checker");
  }

  function getActiveCatalogFilter() {
    var active = document.querySelector(".filter-chip.is-active");
    return active ? active.getAttribute("data-filter") || "all" : "all";
  }

  function applyCatalogFilter(filter) {
    getCatalogCards().forEach(function (card) {
      var cats = (card.getAttribute("data-categories") || "").split(/\s+/);
      var inCategory = cats.indexOf(filter) !== -1;
      var show;
      if (filter === "all") {
        show = !cardHasPlaceholderMedia(card);
      } else {
        show = inCategory;
      }
      card.classList.toggle("is-hidden", !show);
    });
  }

  function cardPriceRub(card) {
    var raw = card.getAttribute("data-price-rub");
    if (raw != null && raw !== "") {
      var n = parseInt(raw, 10);
      return isNaN(n) ? 0 : n;
    }
    var t = card.querySelector(".product-card__price");
    if (!t) return 0;
    var digits = (t.textContent || "").replace(/\D/g, "");
    var p = parseInt(digits, 10);
    return isNaN(p) ? 0 : p;
  }

  function cardNameSort(card) {
    var el = card.querySelector(".product-card__name");
    return el ? el.textContent.trim() : "";
  }

  function cardNewOrder(card) {
    var raw = card.getAttribute("data-new-order");
    if (raw != null && raw !== "") {
      var n = parseInt(raw, 10);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  function applyCatalogSort(sortKey) {
    var grid = getProductGrid();
    if (!grid || !sortKey) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));
    items.sort(function (a, b) {
      var cmp = 0;
      switch (sortKey) {
        case "price-asc":
          cmp = cardPriceRub(a) - cardPriceRub(b);
          break;
        case "price-desc":
          cmp = cardPriceRub(b) - cardPriceRub(a);
          break;
        case "name": {
          var na = cardNameSort(a);
          var nb = cardNameSort(b);
          cmp = na.localeCompare(nb, "ru", { sensitivity: "base" });
          if (cmp === 0) {
            cmp = (a.getAttribute("data-product-id") || "").localeCompare(b.getAttribute("data-product-id") || "");
          }
          break;
        }
        case "new":
        default:
          cmp = cardNewOrder(a) - cardNewOrder(b);
          break;
      }
      return cmp;
    });
    items.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  var sortSelect = document.getElementById("catalog-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      applyCatalogSort(sortSelect.value);
      applyCatalogFilter(getActiveCatalogFilter());
    });
    applyCatalogSort(sortSelect.value);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var filter = chip.getAttribute("data-filter") || "all";
      chips.forEach(function (c) {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-selected", c === chip ? "true" : "false");
      });
      applyCatalogFilter(filter);
    });
  });

  var activeChip = document.querySelector(".filter-chip.is-active");
  var catalogCards = getCatalogCards();
  if (activeChip && catalogCards.length) {
    applyCatalogFilter(activeChip.getAttribute("data-filter") || "all");
  }

  function applyCatalogBookmark(btn, saved) {
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", saved ? "true" : "false");
    btn.setAttribute("aria-label", saved ? "В избранном, убрать" : "В избранное");
  }

  document.querySelectorAll(".product-card").forEach(function (card) {
    var id = card.getAttribute("data-product-id");
    var btn = card.querySelector(".product-card__bookmark");
    if (!btn || !id || !window.CBCFavorites) return;
    applyCatalogBookmark(btn, window.CBCFavorites.has(id));
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var nowIn = window.CBCFavorites.toggle(id);
      applyCatalogBookmark(btn, nowIn);
      window.CBCFavorites.refreshNav();
    });
  });

  var CATALOG_HOVER_IMAGE_INDEX = 1;

  function setupCatalogCardImageHover() {
    if (!window.CBC_PRODUCTS) return;
    document.querySelectorAll(".product-card").forEach(function (card) {
      var media = card.querySelector(".product-card__media");
      var img = card.querySelector(".product-card__img");
      if (!media || !img || media.classList.contains("placeholder-checker")) return;
      var id = card.getAttribute("data-product-id");
      if (!id) return;
      var p = window.CBC_PRODUCTS[id];
      if (!p || !p.images || !p.images[CATALOG_HOVER_IMAGE_INDEX]) return;
      var hoverSrc = p.images[CATALOG_HOVER_IMAGE_INDEX];
      var defaultSrc = img.getAttribute("src") || "";
      if (!defaultSrc) return;
      img.setAttribute("data-catalog-default-src", defaultSrc);
      var pre = new Image();
      pre.src = hoverSrc;
      card.addEventListener("mouseenter", function () {
        img.src = hoverSrc;
      });
      card.addEventListener("mouseleave", function () {
        img.src = defaultSrc;
      });
    });
  }

  setupCatalogCardImageHover();

  var showMore = document.getElementById("show-more");
  if (showMore) {
    showMore.addEventListener("click", function () {
      showMore.disabled = true;
      showMore.setAttribute("aria-busy", "true");
    });
  }

  var heroTagline = document.querySelector(".hero__tagline[data-tagline]");
  var heroTaglineInner = heroTagline && heroTagline.querySelector(".hero__tagline__inner");
  if (heroTagline && heroTaglineInner) {
    var fullText = heroTagline.getAttribute("data-tagline") || "";
    if (
      fullText.length &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      heroTagline.classList.add("hero__tagline--typewriter");
      heroTaglineInner.setAttribute("aria-hidden", "true");

      var typeMs = 42;
      var eraseMs = 26;
      var pauseEndMs = 2600;
      var pauseEmptyMs = 520;
      var timer = null;

      function setActiveCaret(active) {
        heroTagline.classList.toggle("hero__tagline--typewriter-active", active);
      }

      function typeLoop() {
        var i = 0;
        setActiveCaret(true);

        function tickType() {
          if (i <= fullText.length) {
            heroTaglineInner.textContent = fullText.slice(0, i);
            i += 1;
            timer = window.setTimeout(tickType, typeMs);
            return;
          }
          setActiveCaret(false);
          timer = window.setTimeout(function () {
            eraseLoop();
          }, pauseEndMs);
        }

        tickType();
      }

      function eraseLoop() {
        var j = fullText.length;
        setActiveCaret(true);

        function tickErase() {
          if (j >= 0) {
            heroTaglineInner.textContent = fullText.slice(0, j);
            j -= 1;
            timer = window.setTimeout(tickErase, eraseMs);
            return;
          }
          setActiveCaret(false);
          timer = window.setTimeout(function () {
            typeLoop();
          }, pauseEmptyMs);
        }

        tickErase();
      }

      typeLoop();
    }
  }
})();
