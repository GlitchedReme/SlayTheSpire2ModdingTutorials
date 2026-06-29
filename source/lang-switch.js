(function () {
  "use strict";

  // Language prefix used for the English mirror of the site (matches Hexo i18n_dir).
  var EN_PREFIX = "/en";
  var FLIP_MS = 520;

  // Decide whether we are currently on an English page.
  function isEnglish(pathname) {
    return pathname === EN_PREFIX || pathname.indexOf(EN_PREFIX + "/") === 0;
  }

  // Compute the counterpart URL in the other language.
  // Tool pages have no English mirror → redirect to home.
  function buildTarget(loc) {
    var path = loc.pathname || "/";

    // From Chinese tool page → English home
    if (!isEnglish(path) && (path.indexOf("/tools/") === 0 || path.indexOf("tools/") === 0)) {
      return "/en/" + loc.search + loc.hash;
    }
    // From English tool page → Chinese home
    if (isEnglish(path) && path.indexOf("/en/tools/") === 0) {
      return "/" + loc.search + loc.hash;
    }

    var rest;
    if (isEnglish(path)) {
      rest = path.slice(EN_PREFIX.length) || "/";
      if (rest.charAt(0) !== "/") rest = "/" + rest;
      return rest + loc.search + loc.hash;
    }
    rest = path === "/" ? "/" : path;
    return EN_PREFIX + rest + loc.search + loc.hash;
  }

  function configure(btn) {
    var english = isEnglish(window.location.pathname || "/");
    var label = english ? "\u4e2d\u6587" : "English"; // 中文 / English
    var title = english ? "\u5207\u6362\u4e3a\u4e2d\u6587" : "Switch to English";
    btn.title = title;
    var tip = btn.querySelector(".kira-lang-switch-tip");
    if (tip) tip.textContent = label;
    btn.classList.toggle("is-english", english);
  }

  function navigate(btn) {
    if (btn.classList.contains("is-flipping")) return;
    // Use data-target if set (overrides computed target for tool pages)
    var dt = btn.getAttribute("data-target");
    var target = dt || buildTarget(window.location);
    btn.classList.add("is-flipping");
    var done = false;
    var go = function () {
      if (done) return;
      done = true;
      window.location.href = target;
    };
    // Navigate once the flip finishes; guard with a timeout in case the
    // transitionend never fires (e.g. reduced-motion users).
    var inner = btn.querySelector(".kira-lang-switch-inner");
    if (inner) {
      inner.addEventListener("transitionend", go, { once: true });
    }
    window.setTimeout(go, FLIP_MS + 80);
  }

  function init() {
    var buttons = document.querySelectorAll(".kira-lang-switch");
    if (!buttons.length) return;
    Array.prototype.forEach.call(buttons, function (btn) {
      configure(btn);
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        navigate(btn);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
