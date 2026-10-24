/*
 * Widget geo test harness.
 * Loaded synchronously BEFORE the CMP script so it can prepare storage and
 * install the snippet under test, exactly like a snippet placed in <head>.
 *
 * URL parameters
 *   mode   = baseline | v1 | v2        (default baseline)
 *   geo    = real | US-NY | US-CA | PL | DE | ...  (default real)
 *   mount  = now | late | rerender      (default now)
 *   listen = early | late               (default early; v1/v2 only)
 *   keep   = 1                          (keep stored consent and location)
 *   label  = text used by v1/v2 for the link (default "Your Privacy Choices")
 */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var S = {
    mode: params.get("mode") || "baseline",
    geo: params.get("geo") || "real",
    mount: params.get("mount") || "now",
    listen: params.get("listen") || "early",
    keep: params.get("keep") === "1",
    label: params.get("label") || "Your Privacy Choices"
  };

  var t0 = Date.now();
  var log = [];
  function add(kind, detail) {
    var entry = { t: Date.now() - t0, kind: kind, detail: detail };
    log.push(entry);
    if (window.__geoTestRenderLog) window.__geoTestRenderLog(entry);
  }

  // ---------------------------------------------------------------------
  // 1. Storage: simulate a fresh visitor (default) or a seeded location.
  // ---------------------------------------------------------------------
  var SP_KEYS = /^(sp_|s_e_c_u_r_e_k_e_y$|secure_privacy_consents$|TCString$|GPPString$)/;
  try {
    if (!S.keep) {
      Object.keys(localStorage).forEach(function (k) {
        if (SP_KEYS.test(k)) localStorage.removeItem(k);
      });
      if (S.geo !== "real") {
        // Same shape the CMP script caches after its /dynamic call. While this
        // cache is fresh the script skips the call and uses this location.
        localStorage.setItem("sp_dynamic", JSON.stringify({
          data: { location: S.geo, subConsents: [], isConsentRecordingAllowed: true, g: false, c: false },
          timestamp: Date.now(),
          saved: false,
          localOnly: false
        }));
      }
      add("storage", S.geo === "real" ? "cleared, real geolocation" : "cleared, seeded location " + S.geo);
    } else {
      add("storage", "kept (returning visitor)");
    }
  } catch (e) {
    add("error", "localStorage unavailable: " + e.message);
  }

  // ---------------------------------------------------------------------
  // 2. Observe the CMP: events, API calls, errors.
  // ---------------------------------------------------------------------
  ["sp_init", "sp_cookie_banner_shown", "sp_cookie_banner_click", "sp_cookie_banner_save",
   "sp_privacy_banner_shown", "sp_trust_badge_shown", "sp_consent_withdrawn"].forEach(function (name) {
    window.addEventListener(name, function (e) {
      add("event", name + (e && e.detail !== undefined ? " " + JSON.stringify(e.detail) : ""));
      if (name === "sp_init") S.spInitFired = true;
    });
  });

  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (en) {
        if (en.name.indexOf("api-prod.secureprivacy.ai") === -1) return;
        var path = en.name.replace(/^https:\/\/api-prod\.secureprivacy\.ai/, "").replace(/[0-9a-f]{24}/, "{domain}");
        add("api", path + (en.responseStatus ? " -> " + en.responseStatus : ""));
      });
    }).observe({ type: "resource", buffered: true });
  } catch (e) { /* older browsers */ }

  window.addEventListener("error", function (e) { add("error", e.message); });
  window.addEventListener("unhandledrejection", function (e) {
    add("error", "unhandled rejection: " + (e.reason && e.reason.message || e.reason));
  });
  var origConsoleError = console.error;
  console.error = function () {
    try { add("console.error", Array.prototype.map.call(arguments, String).join(" ")); } catch (e) {}
    return origConsoleError.apply(console, arguments);
  };

  // ---------------------------------------------------------------------
  // 3. Snippets under test (copied from the support write-up).
  // ---------------------------------------------------------------------
  function injectStyle(css) {
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  // v1: first workaround (hide span, reveal on sp_init for non-US).
  function installV1() {
    injectStyle(
      "#sp-tb-embed-widget { display: none; }\n" +
      "#sp-tb-embed-widget.sp-show-link { display: inline; }"
    );
    window.addEventListener("sp_init", function () {
      var loc = (window.sp && window.sp.location) || "";
      if (/^US(-|$)/i.test(loc)) return; // US visitor: keep the link hidden
      var holder = document.getElementById("sp-tb-embed-widget");
      if (!holder) return;
      var link = holder.querySelector("#sp-tb-embed-widget-link");
      if (link) link.textContent = S.label;
      holder.classList.add("sp-show-link");
    });
    add("snippet", "v1 installed (" + S.listen + ")");
  }

  // v2: hardened workaround (own link, class on <html>, delegated click).
  function installV2() {
    injectStyle(
      ".privacy-choices-link { display: none !important; }\n" +
      "html.show-privacy-choices .privacy-choices-link { display: inline !important; }"
    );
    function decide() {
      var loc = (window.sp && window.sp.location) || "";
      if (/^US(-|$)/i.test(loc)) return; // US visitor: keep hidden
      document.documentElement.classList.add("show-privacy-choices");
    }
    if (window.sp && typeof window.sp.location === "string") decide();
    else window.addEventListener("sp_init", decide, { once: true });

    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest(".privacy-choices-link");
      if (!link) return;
      e.preventDefault();
      if (window.sp && window.sp.openPreferenceCenter) window.sp.openPreferenceCenter();
    });
    add("snippet", "v2 installed (" + S.listen + ")");
  }

  var installer = S.mode === "v1" ? installV1 : S.mode === "v2" ? installV2 : null;
  if (installer) {
    if (S.listen === "late") setTimeout(installer, 6000);
    else installer();
  }

  // ---------------------------------------------------------------------
  // 4. Footer slot: what the site renders where the privacy link lives.
  // ---------------------------------------------------------------------
  function slotHTML() {
    if (S.mode === "v2") {
      return '<a href="#" class="privacy-choices-link">' + escapeHTML(S.label) + "</a>";
    }
    // The exact embed snippet from the CMP documentation.
    return '<span id="sp-tb-embed-widget" onclick="window.parent.sp.openPreferenceCenter();"></span>';
  }

  function renderSlot(reason) {
    var slot = document.getElementById("privacy-slot");
    if (!slot) return;
    slot.innerHTML = slotHTML();
    add("mount", reason);
  }

  // Called inline from the footer while the page is still parsing.
  S.renderSlotNow = function () {
    if (S.mount === "late") {
      add("mount", "footer link deferred (late mount, 3 s)");
      setTimeout(function () { renderSlot("footer link mounted late"); }, 3000);
      return;
    }
    renderSlot("footer link rendered during parse");
    if (S.mount === "rerender") {
      setTimeout(function () { renderSlot("footer re-rendered (route change)"); }, 4000);
    }
  };

  // ---------------------------------------------------------------------
  // 5. Snapshot for the panel and for automated checks.
  // ---------------------------------------------------------------------
  function isShown(el) {
    if (!el) return false;
    var cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && el.getClientRects().length > 0;
  }

  S.snapshot = function () {
    var sp = window.sp;
    var slot = document.getElementById("privacy-slot");
    var target = slot && (slot.querySelector(".privacy-choices-link") || slot.querySelector("#sp-tb-embed-widget"));
    var dyn = null;
    try { dyn = JSON.parse(localStorage.getItem("sp_dynamic") || "null"); } catch (e) {}
    var text = target ? target.textContent.trim() : "";
    return {
      scenario: S.mode + " | geo=" + S.geo + " | mount=" + S.mount + " | listen=" + S.listen + (S.keep ? " | keep" : ""),
      spLoaded: !!sp,
      spInitFired: !!S.spInitFired,
      location: sp ? (sp.location === undefined ? "(unset)" : sp.location) : "(no sp)",
      consentSaved: !!(dyn && dyn.saved),
      bannerVisible: !!(sp && sp.cookieBannerVisible && sp.cookieBannerVisible()),
      linkInDom: !!target,
      linkVisible: isShown(target) && text.length > 0,
      linkText: text,
      slotHTML: slot ? slot.innerHTML : "(no slot)"
    };
  };

  S.log = log;
  S.add = add;
  window.__geoTest = S;

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  S.escapeHTML = escapeHTML;

  add("start", "harness ready: " + S.mode + ", geo=" + S.geo + ", mount=" + S.mount + ", listen=" + S.listen);
})();
