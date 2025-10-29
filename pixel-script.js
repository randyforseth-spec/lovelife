(function (w, d) {
  // 1) Your Pixel Express pixel URL (default-on unless GPC/UOOM or user opt-out)
  var PIXEL_URL = "https://cdn.v3.identitypxl.app/pixels/60162b0b-db55-4393-96b5-f134c36ca853/p.js";
  var PIXEL_ID  = "pixelexpress-superpixel";

  // 2) Simple local opt-out key (persisted per browser)
  var OPT_KEY = "us_privacy_optout"; // "1"=opted-out, otherwise allowed

  // 3) Honor Universal Opt-Out / Global Privacy Control if present
  var hasGPC = !!(w.navigator && w.navigator.globalPrivacyControl === true);

  function isOptedOut() { return hasGPC || (w.localStorage && localStorage.getItem(OPT_KEY) === "1"); }

  function loadPixel() {
    if (isOptedOut() || d.getElementById(PIXEL_ID)) return;
    var s = d.createElement("script");
    s.src = PIXEL_URL; s.async = true; s.id = PIXEL_ID;
    d.head.appendChild(s);
  }
  function removePixel() {
    var s = d.getElementById(PIXEL_ID);
    if (s) s.remove();
    // If the vendor sets first-party cookies and you know their names, clear them here.
  }
  function setOptOut(on) {
    try { localStorage.setItem(OPT_KEY, on ? "1" : "0"); } catch (e) {}
    if (on) removePixel(); else if (!hasGPC) loadPixel();
  }

  // 4) Shadow-DOM Panel (stable across themes)
  function injectPrivacyUI() {
    if (d.getElementById("px-privacy-host")) return;

    // Shadow host sits at top-level; very high z-index to sit above WP headers/menus
    var host = d.createElement("div");
    host.id = "px-privacy-host";
    host.style.position = "fixed";
    host.style.left = "50%";
    host.style.transform = "translateX(-50%)";
    host.style.bottom = "56px";
    host.style.zIndex = "2147483647"; // max-ish
    host.style.display = "none";      // hidden until toggled
    d.body.appendChild(host);

    // Attach shadow root to isolate styles from any WordPress theme/CSS
    var root = host.attachShadow({ mode: "open" });
    var style = d.createElement("style");
    style.textContent = `
      :host {
        all: initial; /* isolate from page CSS */
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: 56px;
        z-index: 2147483647;
      }
      @media (max-width: 600px) {
        :host {
          left: 5px !important;
          right: 5px !important;
          transform: none !important;
        }
      }

      /* Base reset inside shadow */
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      button { -webkit-appearance: none; appearance: none; }

      .panel {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 12px;
        box-shadow: 0 6px 24px rgba(0,0,0,.15);
        padding: 12px 14px;
        max-width: 360px;
        font: 14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        color: #222;
      }
      @media (max-width: 600px) {
        .panel { width: 100%; max-width: none; }
      }

      .title { font-weight: 600; margin: 0 0 6px 0; }
      .row { display: flex; gap: 8px; align-items: flex-start; margin: 6px 0 10px; }
      .row input { margin-top: 2px; }

      .actions { display: flex; gap: 8px; margin-bottom: 8px; }

      .btn {
        padding: 6px 10px;
        border: 1px solid currentColor;
        border-radius: 8px;
        background: #fff;
        color: inherit;
        cursor: pointer;
        line-height: 1.2;
        outline: none;
        box-shadow: none;
        transition: none;
        user-select: none;
      }
      /* Freeze hover/active/focus so themes can't restyle */
      .btn:hover, .btn:active, .btn:focus {
        background: #fff;
        color: inherit;
        border-color: currentColor;
        outline: none;
        box-shadow: none;
      }

      details { font-size: 12px; color: #555; }
      details > summary { cursor: pointer; list-style: none; }
      details > summary::-webkit-details-marker { display: none; }
    `;

    var wrap = d.createElement("div");
    wrap.className = "panel";
    wrap.innerHTML = `
      <div class="title">Your Privacy Choices</div>
      <label class="row">
        <input id="privacy-optout" type="checkbox" />
        <span>Do not sell or share my personal information / opt out of targeted advertising. We also honor browser signals like Global Privacy Control.</span>
      </label>
      <div class="actions">
        <button id="privacy-save" class="btn">Save</button>
        <button id="privacy-close" class="btn">Close</button>
      </div>
      <details>
        <summary>Privacy Notice (summary)</summary>
        <div style="margin-top:8px;">
          This site collects site-activity data (pages viewed, clicks, scrolls, time on page, and technical identifiers) and shares it with our analytics/identity vendor to measure performance and provide interest-based services. Use the control above to opt out of sale/share or targeted advertising. We honor Global Privacy Control signals. We do not knowingly sell/share personal information of consumers under 16. For a full policy, see the website’s Privacy Policy.
        </div>
      </details>
    `;

    root.appendChild(style);
    root.appendChild(wrap);

    // Initialize checkbox state
    var cb = wrap.querySelector("#privacy-optout");
    cb.checked = isOptedOut();

    // Wire actions
    wrap.querySelector("#privacy-close").onclick = function () { host.style.display = "none"; };
    wrap.querySelector("#privacy-save").onclick  = function () {
      setOptOut(cb.checked);
      host.style.display = "none";
    };

    // Expose minimal UI API for external links to open/close/status
    w.PrivacyChoicesUI = {
      open:  function(){ cb.checked = isOptedOut(); host.style.display = "block"; },
      close: function(){ host.style.display = "none"; },
      toggle:function(){ (host.style.display === "none" || !host.style.display) ? this.open() : this.close(); }
    };

    // Also add a centered footer link on the page (outside shadow)
    try {
      var linkWrap = d.createElement("div");
      linkWrap.style.cssText = "width:100%;text-align:center;margin-top:2px;margin-bottom:6px;";
      var footerLink = d.createElement("a");
      footerLink.href = "javascript:void(0)";
      footerLink.textContent = "Do Not Sell or Share My Personal Information";
      footerLink.style.cssText = "color:#666;font-size:12px;text-decoration:none;cursor:pointer;";
      footerLink.onclick = function(){ w.PrivacyChoicesUI.toggle(); };

      linkWrap.appendChild(footerLink);
      var footers = d.getElementsByTagName("footer");
      if (footers && footers[0]) { footers[0].appendChild(linkWrap); }
      else { d.body.appendChild(linkWrap); }
    } catch(e){}
  }

  // 5) Expose a minimal API for scripts: status/opt-in/opt-out
  w.PrivacyChoices = {
    optOut: function(){ setOptOut(true);  if (w.PrivacyChoicesUI) w.PrivacyChoicesUI.close(); },
    optIn:  function(){ setOptOut(false); if (!hasGPC) loadPixel(); if (w.PrivacyChoicesUI) w.PrivacyChoicesUI.close(); },
    status: function(){ return { gpc: hasGPC, optedOut: isOptedOut() }; }
  };

  // 6) Boot
  function boot(){ injectPrivacyUI(); loadPixel(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();

  // (Optional) Handle SPA soft navigations
  var _push = history.pushState; history.pushState = function(){ _push.apply(this, arguments); loadPixel(); };
  w.addEventListener("popstate", loadPixel);
})(window, document);
