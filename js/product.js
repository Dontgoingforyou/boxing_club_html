(function () {
  var minus = document.getElementById("qty-minus");
  var plus = document.getElementById("qty-plus");
  var input = document.getElementById("qty-input");
  var fav = document.getElementById("product-fav");
  var addToCart = document.getElementById("product-add-to-cart");
  var thumbs = document.querySelectorAll(".product-thumb");
  var main = document.getElementById("product-main");
  var galleryRoot = document.querySelector(".product-detail__gallery");
  var btnGalleryPrev = document.getElementById("product-gallery-prev");
  var btnGalleryNext = document.getElementById("product-gallery-next");

  /* ── Populate from URL param ?id= ──────────────────── */

  var urlId = new URLSearchParams(window.location.search).get("id");
  var elDetail = document.querySelector(".product-detail[data-product-id]");

  function revealProduct() {
    if (elDetail) {
      elDetail.style.opacity = "";
      elDetail.style.pointerEvents = "";
    }
  }

  var CAPS_LEAD_PHRASE = "THIS IS BOXING AWESOME!";

  function setLeadWithCaps(el, text) {
    if (!el || text == null) return;
    var i = text.indexOf(CAPS_LEAD_PHRASE);
    if (i < 0) {
      el.textContent = text;
      return;
    }
    el.textContent = "";
    el.appendChild(document.createTextNode(text.slice(0, i)));
    var span = document.createElement("span");
    span.className = "text-caps-track";
    span.textContent = CAPS_LEAD_PHRASE;
    el.appendChild(span);
    el.appendChild(document.createTextNode(text.slice(i + CAPS_LEAD_PHRASE.length)));
  }

  if (urlId && window.CBC_PRODUCTS && window.CBC_PRODUCTS[urlId]) {
    var d = window.CBC_PRODUCTS[urlId];
    document.title = d.name + " — " + d.price + " — California Boxing Wear";

    var elCategory = document.querySelector(".product-detail__category");
    var elTitle = document.querySelector(".product-detail__title");
    var elPrice = document.querySelector(".product-detail__price");
    var elLead = document.querySelector(".product-detail__lead");
    var elCrumb = document.querySelector(".breadcrumbs__current");
    var elAbout = document.querySelector(".product-accordion__item p");
    var elCare = document.querySelector(".product-accordion__item--care li");
    var elModelParams = document.getElementById("about-model-params");
    var elPrint = document.getElementById("about-print");
    var elColor = document.getElementById("about-color");

    if (elCategory) elCategory.textContent = d.category;
    if (elTitle) elTitle.textContent = d.name;
    if (elPrice) elPrice.textContent = d.price;
    if (elLead) setLeadWithCaps(elLead, d.lead);
    if (elCrumb) elCrumb.textContent = d.breadcrumb;
    if (elAbout && typeof d.about === "string") elAbout.textContent = d.about;
    if (elCare) elCare.textContent = d.care;
    if (elModelParams) elModelParams.textContent = d.modelParams;
    if (elPrint) elPrint.textContent = d.print;
    if (elColor) elColor.textContent = d.color;
    if (elDetail) elDetail.setAttribute("data-product-id", urlId);

    var mainImgPop = document.getElementById("product-main-img");
    var mainImgNextPop = document.getElementById("product-main-img-next");
    var mainTrackPop = document.getElementById("product-main-track");
    if (mainImgPop && d.images[0]) mainImgPop.src = d.images[0];
    if (mainImgNextPop) mainImgNextPop.removeAttribute("src");
    if (mainTrackPop) {
      mainTrackPop.style.transition = "none";
      mainTrackPop.style.transform = "translateX(0)";
      void mainTrackPop.offsetWidth;
      mainTrackPop.style.transition = "";
    }

    var thumbBtns = document.querySelectorAll(".product-thumb");
    thumbBtns.forEach(function (btn, i) {
      var src = d.images[i] || "";
      btn.setAttribute("data-src", src);
      var img = btn.querySelector("img");
      if (img) img.src = src;
    });
  }

  revealProduct();

  function clampQty(n) {
    var v = parseInt(String(n), 10);
    if (isNaN(v) || v < 1) return 1;
    if (v > 99) return 99;
    return v;
  }

  if (input && minus && plus) {
    minus.addEventListener("click", function () {
      input.value = clampQty(Number(input.value) - 1);
    });
    plus.addEventListener("click", function () {
      input.value = clampQty(Number(input.value) + 1);
    });
    input.addEventListener("change", function () {
      input.value = clampQty(input.value);
    });
  }

  var productRoot = document.querySelector(".product-detail[data-product-id]");
  var productId = productRoot ? productRoot.getAttribute("data-product-id") : null;

  function applyProductFav(saved) {
    if (!fav) return;
    fav.setAttribute("aria-pressed", saved ? "true" : "false");
    fav.classList.toggle("is-active", saved);
    var favLabel = document.getElementById("product-fav-label");
    if (favLabel) {
      favLabel.textContent = saved ? "В избранном" : "В избранное";
    }
    fav.setAttribute("aria-label", saved ? "В избранном, убрать" : "В избранное");
  }

  if (fav && productId && window.CBCFavorites) {
    applyProductFav(window.CBCFavorites.has(productId));
    fav.addEventListener("click", function () {
      var nowIn = window.CBCFavorites.toggle(productId);
      applyProductFav(nowIn);
      window.CBCFavorites.refreshNav();
    });
  } else if (fav) {
    var favLabel = document.getElementById("product-fav-label");
    fav.addEventListener("click", function () {
      var on = fav.getAttribute("aria-pressed") === "true";
      var next = !on;
      fav.setAttribute("aria-pressed", next ? "true" : "false");
      fav.classList.toggle("is-active", next);
      if (favLabel) {
        favLabel.textContent = next ? "В избранном" : "В избранное";
      }
      fav.setAttribute("aria-label", next ? "В избранном, убрать" : "В избранное");
    });
  }

  function getSelectedSize() {
    var c = document.querySelector('input[name="size"]:checked');
    return c ? c.value : "m";
  }

  function syncCartButton() {
    if (!addToCart || !productId || !window.CBCCart) return;
    var labelAdded = addToCart.getAttribute("data-label-added") || "Перейти в корзину";
    var addLabel = document.getElementById("product-add-label");
    var addCount = document.getElementById("product-cart-count");
    var inCart = window.CBCCart.hasLine(productId, getSelectedSize());
    if (inCart) {
      addToCart.setAttribute("data-in-cart", "true");
      addToCart.classList.add("is-in-cart");
      if (addLabel) addLabel.textContent = labelAdded;
      var lineQty = 0;
      window.CBCCart.getItems().forEach(function (row) {
        if (
          row.id === productId &&
          String(row.size).toLowerCase() === String(getSelectedSize()).toLowerCase()
        ) {
          lineQty = row.qty;
        }
      });
      if (addCount) {
        addCount.textContent = String(lineQty);
        addCount.hidden = false;
      }
      addToCart.setAttribute("aria-label", labelAdded + ", количество: " + lineQty);
    } else {
      addToCart.setAttribute("data-in-cart", "false");
      addToCart.classList.remove("is-in-cart");
      if (addLabel) addLabel.textContent = "В корзину";
      if (addCount) addCount.hidden = true;
      addToCart.setAttribute("aria-label", labelInitial);
    }
  }

  document.querySelectorAll('input[name="size"]').forEach(function (radio) {
    radio.addEventListener("change", syncCartButton);
  });

  if (addToCart) {
    var labelInitialNav = "В корзину";
    addToCart.addEventListener("click", function () {
      if (!productId || !window.CBCCart) return;
      if (addToCart.getAttribute("data-in-cart") === "true") {
        window.location.href = "cart.html";
        return;
      }
      var qty = input ? clampQty(input.value) : 1;
      window.CBCCart.add({ id: productId, size: getSelectedSize(), qty: qty });
      window.CBCCart.refreshNav();
      syncCartButton();
    });
    addToCart.setAttribute("aria-label", labelInitialNav);
  }

  syncCartButton();

  if (window.CBCFavorites) {
    window.CBCFavorites.refreshNav();
  }
  if (window.CBCCart) {
    window.CBCCart.refreshNav();
  }

  var mainImg = document.getElementById("product-main-img");
  var mainImgNext = document.getElementById("product-main-img-next");
  var mainTrack = document.getElementById("product-main-track");
  var galleryDisplayedSrc = mainImg && (mainImg.getAttribute("src") || mainImg.src) ? mainImg.src : "";

  /* ── Галерея: слайды, стрелки, автопрокрутка ─────────── */

  function orderedIndicesWithSrc() {
    var out = [];
    thumbs.forEach(function (btn, i) {
      if (btn.getAttribute("data-src")) out.push(i);
    });
    return out;
  }

  function currentThumbIndex() {
    for (var i = 0; i < thumbs.length; i++) {
      if (thumbs[i].classList.contains("is-active")) return i;
    }
    return 0;
  }

  var panImg = mainImg;
  var panX = 50;
  var panY = 50;

  function resetPan() {
    panX = 50;
    panY = 50;
    if (panImg) panImg.style.objectPosition = "50% 50%";
    if (mainImgNext) mainImgNext.style.objectPosition = "50% 50%";
  }

  function syncGalleryNav() {
    var order = orderedIndicesWithSrc();
    var single = order.length <= 1;
    if (main) main.setAttribute("data-single-image", single ? "true" : "false");
    if (btnGalleryPrev) btnGalleryPrev.hidden = single;
    if (btnGalleryNext) btnGalleryNext.hidden = single;
  }

  function normImageKey(u) {
    if (!u) return "";
    try {
      var abs = new URL(u, window.location.href);
      return abs.pathname + abs.search;
    } catch (e2) {
      return String(u);
    }
  }

  function sameImageUrl(a, b) {
    return normImageKey(a) === normImageKey(b);
  }

  var gallerySwapSeq = 0;

  function resetGalleryTrackToIdle() {
    if (mainTrack) {
      mainTrack.style.transition = "none";
      mainTrack.style.transform = "translateX(0)";
      void mainTrack.offsetWidth;
      mainTrack.style.transition = "";
    }
    if (mainImg && galleryDisplayedSrc) mainImg.src = galleryDisplayedSrc;
    if (mainImgNext) mainImgNext.removeAttribute("src");
  }

  function detachTrackTransitionEnd() {
    if (mainTrack && typeof mainTrack._cbcSlideEnd === "function") {
      mainTrack.removeEventListener("transitionend", mainTrack._cbcSlideEnd);
      mainTrack._cbcSlideEnd = null;
    }
  }

  function detachNextImgLoad() {
    if (mainImgNext && typeof mainImgNext._cbcSlideLoad === "function") {
      mainImgNext.removeEventListener("load", mainImgNext._cbcSlideLoad);
      mainImgNext.removeEventListener("error", mainImgNext._cbcSlideErr);
      mainImgNext._cbcSlideLoad = null;
      mainImgNext._cbcSlideErr = null;
    }
  }

  function swapMainSrcAnimated(src, onDone, slideDir) {
    if (!mainImg || !src) {
      if (onDone) onDone();
      return;
    }
    if (sameImageUrl(galleryDisplayedSrc || mainImg.src, src)) {
      resetPan();
      restartCarousel();
      if (onDone) onDone();
      return;
    }
    var dir = slideDir === -1 ? -1 : 1;
    if (prefersReducedMotion() || !mainImgNext || !mainTrack) {
      detachTrackTransitionEnd();
      detachNextImgLoad();
      resetGalleryTrackToIdle();
      mainImg.src = src;
      galleryDisplayedSrc = src;
      resetPan();
      restartCarousel();
      if (onDone) onDone();
      return;
    }

    gallerySwapSeq += 1;
    var token = gallerySwapSeq;
    detachTrackTransitionEnd();
    detachNextImgLoad();
    resetGalleryTrackToIdle();

    function finish() {
      if (token !== gallerySwapSeq) return;
      galleryDisplayedSrc = src;
      resetPan();
      restartCarousel();
      if (onDone) onDone();
    }

    function settleAfterSlide() {
      if (token !== gallerySwapSeq) return;
      detachTrackTransitionEnd();
      mainImg.src = src;
      if (mainImgNext) mainImgNext.removeAttribute("src");
      if (mainTrack) {
        mainTrack.style.transition = "none";
        mainTrack.style.transform = "translateX(0)";
        void mainTrack.offsetWidth;
        mainTrack.style.transition = "";
      }
      finish();
    }

    function onTrackEnd(e) {
      if (token !== gallerySwapSeq) return;
      if (e.propertyName !== "transform") return;
      settleAfterSlide();
    }

    function runSlideAfterLoad() {
      if (token !== gallerySwapSeq) return;
      mainTrack._cbcSlideEnd = onTrackEnd;
      mainTrack.addEventListener("transitionend", onTrackEnd);
      requestAnimationFrame(function () {
        if (token !== gallerySwapSeq) return;
        if (dir === 1) {
          mainTrack.style.transform = "translateX(-50%)";
        } else {
          mainTrack.style.transform = "translateX(0)";
        }
      });
    }

    function onNextImgReady() {
      if (token !== gallerySwapSeq) return;
      detachNextImgLoad();
      runSlideAfterLoad();
    }

    function onNextImgFail() {
      if (token !== gallerySwapSeq) return;
      detachNextImgLoad();
      mainImg.src = src;
      if (mainImgNext) mainImgNext.removeAttribute("src");
      if (mainTrack) {
        mainTrack.style.transition = "none";
        mainTrack.style.transform = "translateX(0)";
        void mainTrack.offsetWidth;
        mainTrack.style.transition = "";
      }
      galleryDisplayedSrc = src;
      finish();
    }

    if (dir === 1) {
      mainImgNext.src = src;
      mainImgNext._cbcSlideLoad = onNextImgReady;
      mainImgNext._cbcSlideErr = onNextImgFail;
      if (mainImgNext.complete) {
        onNextImgReady();
      } else {
        mainImgNext.addEventListener("load", onNextImgReady);
        mainImgNext.addEventListener("error", onNextImgFail);
      }
    } else {
      mainImgNext.src = galleryDisplayedSrc || mainImg.src;
      if (mainTrack) {
        mainTrack.style.transition = "none";
        mainTrack.style.transform = "translateX(-50%)";
        void mainTrack.offsetWidth;
        mainTrack.style.transition = "";
      }
      mainImg.src = src;
      mainImgNext._cbcSlideLoad = onNextImgReady;
      mainImgNext._cbcSlideErr = onNextImgFail;
      if (mainImgNext.complete) {
        onNextImgReady();
      } else {
        mainImgNext.addEventListener("load", onNextImgReady);
        mainImgNext.addEventListener("error", onNextImgFail);
      }
    }
  }

  function goToIndex(index, slideHint) {
    var btn = thumbs[index];
    if (!btn || !btn.getAttribute("data-src")) return;
    var oldIndex = currentThumbIndex();
    var order = orderedIndicesWithSrc();
    var a = order.indexOf(oldIndex);
    var b = order.indexOf(index);
    var dir = slideHint;
    if (dir !== 1 && dir !== -1) {
      if (a >= 0 && b >= 0) {
        if (b > a) dir = 1;
        else if (b < a) dir = -1;
        else dir = 1;
      } else {
        dir = 1;
      }
    }
    thumbs.forEach(function (t) {
      var on = t === btn;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (main) {
      main.setAttribute("data-variant", btn.getAttribute("data-thumb") || "0");
    }
    var src = btn.getAttribute("data-src");
    swapMainSrcAnimated(src, null, dir);
  }

  function step(delta) {
    var order = orderedIndicesWithSrc();
    if (order.length <= 1) return;
    var cur = currentThumbIndex();
    var pos = order.indexOf(cur);
    if (pos < 0) pos = 0;
    var nextPos = (pos + delta + order.length * 10) % order.length;
    goToIndex(order[nextPos], delta < 0 ? -1 : 1);
  }

  var carouselTimer = null;
  var carouselHoverPause = false;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clearCarousel() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  }

  function startCarousel() {
    clearCarousel();
    if (prefersReducedMotion()) return;
    var order = orderedIndicesWithSrc();
    if (order.length <= 1) return;
    carouselTimer = setInterval(function () {
      if (document.hidden || carouselHoverPause) return;
      step(1);
    }, 3000);
  }

  function restartCarousel() {
    clearCarousel();
    startCarousel();
  }

  thumbs.forEach(function (btn, index) {
    btn.addEventListener("click", function () {
      goToIndex(index);
    });
  });

  if (btnGalleryPrev) {
    btnGalleryPrev.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      step(-1);
    });
    btnGalleryPrev.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
  }
  if (btnGalleryNext) {
    btnGalleryNext.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      step(1);
    });
    btnGalleryNext.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
  }

  if (galleryRoot) {
    galleryRoot.addEventListener("mouseenter", function () {
      carouselHoverPause = true;
    });
    galleryRoot.addEventListener("mouseleave", function () {
      carouselHoverPause = false;
    });
  }

  syncGalleryNav();
  startCarousel();

  /* ── Drag-to-pan main image ────────────────────────── */

  if (panImg) {
    var dragging = false;
    var dragStartX;
    var dragStartY;

    function clampPan(v) {
      return Math.max(0, Math.min(100, v));
    }

    function applyPan() {
      var v = panX + "% " + panY + "%";
      panImg.style.objectPosition = v;
      if (mainImgNext) mainImgNext.style.objectPosition = v;
    }

    panImg.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panImg.style.cursor = "grabbing";
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var rect = panImg.getBoundingClientRect();
      panX = clampPan(panX - ((e.clientX - dragStartX) / rect.width) * 100);
      panY = clampPan(panY - ((e.clientY - dragStartY) / rect.height) * 100);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      applyPan();
    });

    document.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      panImg.style.cursor = "grab";
    });

    panImg.addEventListener(
      "touchstart",
      function (e) {
        dragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    panImg.addEventListener(
      "touchmove",
      function (e) {
        if (!dragging) return;
        var rect = panImg.getBoundingClientRect();
        panX = clampPan(panX - ((e.touches[0].clientX - dragStartX) / rect.width) * 100);
        panY = clampPan(panY - ((e.touches[0].clientY - dragStartY) / rect.height) * 100);
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        applyPan();
      },
      { passive: true }
    );

    panImg.addEventListener("touchend", function () {
      dragging = false;
    });
  }

  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightbox-img");
  var lbClose = document.getElementById("lightbox-close");
  var lbBackdrop = document.getElementById("lightbox-backdrop");
  var lbPrev = document.getElementById("lightbox-prev");
  var lbNext = document.getElementById("lightbox-next");

  var lbSrcs = [];
  var lbIndex = 0;

  function buildSrcList() {
    lbSrcs = [];
    thumbs.forEach(function (btn) {
      var src = btn.getAttribute("data-src");
      if (src) lbSrcs.push(src);
    });
  }

  function lbOpen(index) {
    buildSrcList();
    if (!lbSrcs.length || !lightbox) return;
    lbIndex = Math.max(0, Math.min(index, lbSrcs.length - 1));
    lbImg.src = lbSrcs[lbIndex];
    lbImg.alt = mainImg ? mainImg.alt : "";
    lbPrev.disabled = lbIndex === 0;
    lbNext.disabled = lbIndex === lbSrcs.length - 1;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function lbClose_fn() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (mainImg) mainImg.focus();
  }

  function lbGo(dir) {
    var next = lbIndex + dir;
    if (next < 0 || next >= lbSrcs.length) return;
    lbIndex = next;
    lbImg.style.animation = "none";
    lbImg.offsetHeight;
    lbImg.style.animation = "";
    lbImg.src = lbSrcs[lbIndex];
    lbPrev.disabled = lbIndex === 0;
    lbNext.disabled = lbIndex === lbSrcs.length - 1;
  }

  if (mainImg) {
    mainImg.addEventListener("click", function () {
      var currentSrc = mainImg.src;
      buildSrcList();
      var idx = lbSrcs.indexOf(
        currentSrc.replace(window.location.origin + window.location.pathname.replace(/[^/]*$/, ""), "")
      );
      if (idx < 0) {
        var tail = currentSrc.split("/images/")[1];
        idx = lbSrcs.findIndex(function (s) {
          return s.indexOf(tail) >= 0;
        });
      }
      lbOpen(idx >= 0 ? idx : 0);
    });
  }

  if (lbClose) lbClose.addEventListener("click", lbClose_fn);
  if (lbBackdrop) lbBackdrop.addEventListener("click", lbClose_fn);
  if (lbPrev) lbPrev.addEventListener("click", function () { lbGo(-1); });
  if (lbNext) lbNext.addEventListener("click", function () { lbGo(1); });

  document.addEventListener("keydown", function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") lbClose_fn();
    if (e.key === "ArrowLeft") lbGo(-1);
    if (e.key === "ArrowRight") lbGo(1);
  });

  var touchStartX = 0;
  if (lightbox) {
    lightbox.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    lightbox.addEventListener(
      "touchend",
      function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
      },
      { passive: true }
    );
  }
})();
