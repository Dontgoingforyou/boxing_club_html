(function () {
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

  var chips = document.querySelectorAll(".filter-chip");
  var cards = document.querySelectorAll(".product-card");

  function cardHasPlaceholderMedia(card) {
    return !!card.querySelector(".product-card__media.placeholder-checker");
  }

  function applyCatalogFilter(filter) {
    cards.forEach(function (card) {
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
  if (activeChip && cards.length) {
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

  if (window.CBCFavorites) {
    window.CBCFavorites.refreshNav();
  }

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

})();
