(function (w, d) {
  // =========================
  // Pixel Express Privacy + Loader (WP-safe, style-isolated)
  // =========================

  // 1) Pixel URL & script tag id
  var PIXEL_URL = "https://cdn.v3.identitypxl.app/pixels/60162b0b-db55-4393-96b5-f134c36ca853/p.js";
  var PIXEL_ID  = "pixelexpress-superpixel";

  // 2) Local opt-out key (persisted per browser)
  var OPT_KEY = "us_privacy_optout"; // "1" = opted-out

  // 3) GPC / UOOM
  var hasGPC = !!(w.navigator && w.navigator.globalPrivacyControl === true);

  function isOptedOut() {
    try { return hasGPC || (w.localStorage && localStorage.getItem(OPT_KEY) === "1"); }
    catch(e){ return hasGPC; }
  }

  function loadPixel() {
    if (isOptedOut() || d.getElementById(PIXEL_ID)) return;
    var s = d.createElement("script");
    s.src = PIXEL_URL; s.async = true; s.id = PIXEL_ID;
    d.head.appendChild(s);
  }

  function removePixel() {
    var s = d.getElementById(PIXEL_ID);
    if (s) s.remove();
    // If the vendor sets first-party cookies and you know names, clear them here.
  }

  function setOptOut(on) {
    try { localStorage.setItem(OPT_KEY, on ? "1" : "0"); } catch (e) {}
    if (on) { removePixel(); } else if (!hasGPC) { loadPixel(); }
  }

  // 4) UI (Do Not Sell/Share / Targeted Ads opt-out) — style-encapsulated via Shadow DOM
  function injectPrivacyUI() {
    if (d.getElementById("pxx-privacy-widget")) return;

    // Host container anchored to viewport, immune to site layouts
    var host = d.createElement("div");
    host.id = "pxx-privacy-widget";
    // Prevent site CSS from affecting placement; pointer-events to let clicks through except our children
    host.style.cssText = "position:fixed;left:0;bottom:0;width:100%;z-index:2147483647;pointer-events:none;";
    d.body.appendChild(host);

    // Shadow root for style isolation (fallback to light DOM if unsupported)
    var root = host.attachShadow ? host.attachShadow({mode:"open"}) : host;

    // Build styles (reset + our UI). Everything is self-contained and unaffected by theme CSS.
    var style = d.createElement("style");
    style.textContent = [
      /* Baseline reset inside shadow */
      "*{all:initial;box-sizing:border-box;} :host{all:initial;}",
      /* Re-enable pointer events for our UI */
      ".pxx-wrap{pointer-events:auto;}",
      /* Base typography/colors */
      ".pxx{font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222;}",
      /* Footer link bar (fixed, centered) */
      ".pxx-linkbar{position:fixed;left:0;bottom:6px;width:100%;text-align:center;}",
      ".pxx-link{display:inline-block;text-decoration:none;cursor:pointer;color:#666;font-size:12px;padding:4px 8px;border-radius:6px;}",
      ".pxx-link:hover,.pxx-link:active,.pxx-link:focus{color:#666;}",

      /* Panel container (bottom centered by default) */
      ".pxx-panel{position:fixed;left:50%;transform:translateX(-50%);bottom:56px;max-width:360px;",
      "  background:#fff;border:1px solid #ccc;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.15);",
      "  padding:12px 14px;display:none;}",

      /* Mobile: span to 5px from edges */
      "@media (max-width:600px){",
      "  .pxx-panel{left:5px;right:5px;transform:none;max-width:none;width:auto;}",
      "}",

      /* Header & text */
      ".pxx-title{font-weight:600;margin:0 0 6px 0;}",
      ".pxx-row{display:flex;gap:8px;align-items:flex-start;margin:6px 0 10px;}",
      ".pxx-note{font-size:12px;color:#555;margin-top:8px;}",

      /* Buttons: fixed look, no hover/active change; border matches current text color */
      ".pxx-actions{display:flex;gap:8px;margin-bottom:8px;}",
      ".pxx-btn{padding:6px 10px;border:1px solid currentColor;border-radius:8px;background:#fff;cursor:pointer;color:inherit;}",
      ".pxx-btn:hover,.pxx-btn:active,.pxx-btn:focus{background:#fff;outline:none;box-shadow:none;}",

      /* Checkbox alignment */
      ".pxx-checkbox{margin-top:2px;}",

      /* Details summary (uses our base font) */
      "details{font-size:12px;color:#555;}",
      "summary{cursor:pointer;}"
    ].join("");

    // Build HTML
    var wrap = d.createElement("div");
    wrap.className = "pxx-wrap pxx";
    wrap.innerHTML = [
      // Footer link (fixed, consistent across themes)
      '<div class="pxx-linkbar"><a class="pxx-link" id="pxx-open" role="button">Do Not Sell or Share My Personal Information</a></div>',
      // Panel
      '<div class="pxx-panel" id="pxx-panel">',
      '  <div class="pxx-title">Your Privacy Choices</div>',
      '  <label class="pxx-row"><input class="pxx-checkbox" id="privacy-optout" type="checkbox" />',
      '    <span>Do not sell or share my personal information / opt out of targeted advertising. We also honor browser signals like Global Privacy Control.</span>',
      '  </label>',
      '  <div class="pxx-actions">',
      '    <button class="pxx-btn" id="privacy-save">Save</button>',
      '    <button class="pxx-btn" id="privacy-close">Close</button>',
      '  </div>',
      '  <details><summary>Privacy Notice (summary)</summary>',
      '    <div class="pxx-note">This site collects site-activity data (pages viewed, clicks, scrolls, time on page, and technical identifiers) and shares it with our analytics/identity vendor to measure performance and provide interest-based services. Use the control above to opt out of sale/share or targeted advertising. We honor Global Privacy Control signals. We do not knowingly sell/share personal information of consumers under 16. For a full policy, see the website’s Privacy Policy.</div>',
      '  </details>',
      '</div>'
    ].join("");

    // Mount into shadow root
    root.appendChild(style);
    root.appendChild(wrap);

    // Hook up behavior (query within shadow)
    var panel = (root.getElementById ? root.getElementById("pxx-panel") : wrap.querySelector("#pxx-panel"));
    var open  = (root.getElementById ? root.getElementById("pxx-open") : wrap.querySelector("#pxx-open"));
    var save  = (root.getElementById ? root.getElementById("privacy-save") : wrap.querySelector("#privacy-save"));
    var close = (root.getElementById ? root.getElementById("privacy-close") : wrap.querySelector("#privacy-close"));
    var box   = (root.getElementById ? root.getElementById("privacy-optout") : wrap.querySelector("#privacy-optout"));

    // Initialize checkbox from current status
    try { box.checked = !!isOptedOut(); } catch(e){}

    open.onclick = function(){
      panel.style.display = (panel.style.display === "none" || !panel.style.display) ? "block" : "none";
    };
    close.onclick = function(){ panel.style.display = "none"; };
    save.onclick  = function(){
      setOptOut(!!box.checked);
      panel.style.display = "none";
    };
  }

  // 5) Public API
  w.PrivacyChoices = {
    optOut: function(){ setOptOut(true); },
    optIn:  function(){ setOptOut(false); },
    status: function(){ return { gpc: hasGPC, optedOut: isOptedOut() }; }
  };

  // 6) Boot
  function boot(){ injectPrivacyUI(); loadPixel(); }
  if (d.readyState === "loading") { d.addEventListener("DOMContentLoaded", boot); } else { boot(); }

  // (Optional) SPA soft navigations
  var _push = history.pushState;
  history.pushState = function(){ _push.apply(this, arguments); loadPixel(); };
  w.addEventListener("popstate", loadPixel);
})(window, document);
