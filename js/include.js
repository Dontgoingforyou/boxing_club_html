(function () {
  function resolveIncludeUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (e) {
      return path;
    }
  }

  function injectPartial(target, html) {
    var trimmed = html.trim();
    if (!trimmed) return;
    var parent = target.parentNode;
    if (!parent) return;
    target.insertAdjacentHTML("beforebegin", trimmed);
    parent.removeChild(target);
  }

  function loadIncludes() {
    var nodes = document.querySelectorAll("[data-include]");
    var total = nodes.length;
    if (total === 0) {
      document.dispatchEvent(new CustomEvent("cbc:partials-ready"));
      return;
    }
    var finished = 0;
    function checkDone() {
      finished += 1;
      if (finished >= total) {
        document.dispatchEvent(new CustomEvent("cbc:partials-ready"));
      }
    }
    nodes.forEach(function (el) {
      var path = el.getAttribute("data-include");
      if (!path) {
        checkDone();
        return;
      }
      fetch(resolveIncludeUrl(path))
        .then(function (res) {
          if (!res.ok) throw new Error(res.statusText);
          return res.text();
        })
        .then(function (html) {
          injectPartial(el, html);
        })
        .catch(function () {})
        .then(checkDone, checkDone);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadIncludes);
  } else {
    loadIncludes();
  }
})();
