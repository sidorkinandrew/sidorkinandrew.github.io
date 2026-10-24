/* Debug panel for the widget geo test page. Loaded at the end of <body>. */
(function () {
  "use strict";
  var S = window.__geoTest;
  if (!S) return;

  var DOMAIN_ID = (document.querySelector('script[src*="app.secureprivacy.ai/script/"]') || {}).src;
  DOMAIN_ID = DOMAIN_ID ? DOMAIN_ID.match(/script\/([0-9a-f]{24})\.js/)[1] : null;

  var panel = document.getElementById("geo-panel");
  var stateEl = panel.querySelector("[data-state]");
  var logEl = panel.querySelector("[data-log]");
  var cfgEl = panel.querySelector("[data-config]");
  var esc = S.escapeHTML;

  // --- Event log -------------------------------------------------------
  function renderEntry(e) {
    var li = document.createElement("li");
    li.className = "geo-log__item geo-log__item--" + e.kind.replace(/\W/g, "");
    li.innerHTML = '<span class="geo-log__t">' + (e.t / 1000).toFixed(2) + "s</span>" +
      '<span class="geo-log__k">' + esc(e.kind) + "</span>" +
      '<span class="geo-log__d">' + esc(e.detail) + "</span>";
    logEl.appendChild(li);
  }
  S.log.forEach(renderEntry);
  window.__geoTestRenderLog = renderEntry;

  // --- Live state --------------------------------------------------------
  function yesNo(v) { return v ? '<b class="geo-yes">yes</b>' : '<b class="geo-no">no</b>'; }
  function renderState() {
    var s = S.snapshot();
    stateEl.innerHTML =
      row("Scenario", esc(s.scenario)) +
      row("CMP loaded", yesNo(s.spLoaded)) +
      row("sp_init fired", yesNo(s.spInitFired)) +
      row("sp.location", "<code>" + esc(s.location) + "</code>") +
      row("Consent saved", yesNo(s.consentSaved)) +
      row("Banner visible", yesNo(s.bannerVisible)) +
      row("Link in DOM", yesNo(s.linkInDom)) +
      row("Link visible", yesNo(s.linkVisible)) +
      row("Link text", s.linkText ? "<code>" + esc(s.linkText) + "</code>" : "(empty)") +
      row("Footer HTML", "<code class='geo-wrap'>" + esc(s.slotHTML) + "</code>");
  }
  function row(k, v) { return '<div class="geo-row"><span>' + k + "</span><span>" + v + "</span></div>"; }
  renderState();
  setInterval(renderState, 500);

  // --- Config check (JSON-format URLs only: separate cache keys, never
  //     the URLs the CMP script itself requests) ---------------------------
  panel.querySelector("[data-check-config]").addEventListener("click", function () {
    var loc = (window.sp && window.sp.location) || (S.geo !== "real" ? S.geo : "");
    if (!DOMAIN_ID || !loc) { cfgEl.textContent = "Location not known yet."; return; }
    cfgEl.textContent = "Checking " + loc + "...";
    var base = "https://api-prod.secureprivacy.ai/api/banner/v2/";
    var q = "?Language=" + encodeURIComponent((window.sp && window.sp.language) || "en") +
            "&Location=" + encodeURIComponent(loc) + "&format=json&_=" + Date.now();
    Promise.all(["template", "widget"].map(function (ep) {
      return fetch(base + ep + "/" + DOMAIN_ID + q).then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) {}
          return { ep: ep, status: r.status, json: j };
        });
      });
    })).then(function (res) {
      var tpl = res[0], wid = res[1];
      var t = tpl.json || {};
      var w = (wid.json && wid.json.template) || {};
      cfgEl.innerHTML =
        row("Checked location", "<code>" + esc(loc) + "</code>") +
        row("template status", tpl.status) +
        row("template.widgetText", "<code>" + esc(JSON.stringify(t.widgetText)) + "</code>") +
        row("template.widgetType", "<code>" + esc(JSON.stringify(t.widgetType)) + "</code>") +
        row("banner layout", t.template ? yesNo(!!t.template.Layout) : "-") +
        row("consent type", t.template ? esc(t.template.ConsentType) : "-") +
        row("widget status", wid.status) +
        row("widget type", "<code>" + esc(JSON.stringify(w.Settings && w.Settings.Type)) + "</code>") +
        row("widget text", "<code>" + esc(JSON.stringify(w.Translation && w.Translation.Text)) + "</code>");
    }).catch(function (e) { cfgEl.textContent = "Check failed: " + e.message; });
  });

  // --- Reset ---------------------------------------------------------------
  panel.querySelector("[data-reset]").addEventListener("click", function () {
    Object.keys(localStorage).forEach(function (k) {
      if (/^(sp_|s_e_c_u_r_e_k_e_y$|secure_privacy_consents$|TCString$|GPPString$)/.test(k)) localStorage.removeItem(k);
    });
    location.href = location.pathname;
  });

  panel.querySelector("[data-toggle]").addEventListener("click", function () {
    panel.classList.toggle("geo-panel--collapsed");
  });
})();
