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

  // 4) Panel (Do Not Sell/Share / Targeted Ads opt-out) — Shadow DOM to isolate from theme CSS
  function injectPrivacyUI() {
    if (d.getElementById("privacy-choices-panel")) return;

    // Host element (positioned container)
    var panel = d.createElement("div");
    panel.id = "privacy-choices-panel";
    panel.style.cssText = [
      "position:fixed",
      "left:50%",
      "transform:translateX(-50%)",
      "bottom:56px",
      "display:none",
      "z-index:2147483647"
    ].join(";") + ";";
    d.body.appendChild(panel);

    // Shadow root (theme-safe)
    var root = panel.attachShadow({ mode: "open" });

    // Styles inside shadow root
    var style = d.createElement("style");
    style.textContent = `
      :host{
        box-sizing:border-box !important;
        background:#fff !important;
        color:#222 !important;
        border:1px solid #ccc !important;
        border-radius:12px !important;
        box-shadow:0 6px 24px rgba(0,0,0,.15) !important;
        max-width:360px !important;

        /* Height controls to prevent tiny pill clamp */
        min-height:160px !important;
        max-height:calc(100vh - 120px) !important;
        overflow:auto !important;
        -webkit-overflow-scrolling:touch;
      }
      @media (max-width:600px){
        :host{
          left:5px !important;
          right:5px !important;
          transform:none !important;
          max-width:none !important;
          width:auto !important;
        }
      }
      *, *::before, *::after{ box-sizing:border-box; }
      .wrap{ padding:12px 14px; font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
      h1{ margin:0 0 6px 0; font-size:14px; font-weight:600; }
      label{ display:flex; gap:8px; align-items:flex-start; margin:6px 0 10px; }
      input[type="checkbox"]{ all:revert; margin-top:3px; }
      .row{ display:flex; gap:8px; margin-bottom:8px; }
      button{
        padding:6px 10px; border:1px solid currentColor; border-radius:8px;
        background:#fff; color:inherit; cursor:pointer;
      }
      button:hover, button:active, button:focus{
        background:#fff; box-shadow:none; outline:none; transition:none;
      }
      details{ font-size:12px; color:#555; }
      summary{ cursor:pointer; }
    `;
    root.appendChild(style);

    // Markup inside shadow
    var wrap = d.createElement("div");
    wrap.className = "wrap";
    wrap.innerHTML = `
      <h1>Your Privacy Choices</h1>
      <label>
        <input id="privacy-optout" type="checkbox" ${isOptedOut() ? "checked" : ""}>
        <span>Do not sell or share my personal information / opt out of targeted advertising. We also honor browser signals like Global Privacy Control.</span>
      </label>
      <div class="row">
        <button id="privacy-save">Save</button>
        <button id="privacy-close">Close</button>
      </div>
      <details>
        <summary>Privacy Notice (summary)</summary>
        <div style="margin-top:8px;">
          This site collects site-activity data (pages viewed, clicks, scrolls, time on page, and technical identifiers) and shares it with our analytics/identity vendor to measure performance and provide interest-based services. Use the control above to opt out of sale/share or targeted advertising. We honor Global Privacy Control signals. We do not knowingly sell/share personal information of consumers under 16. For a full policy, see the website’s Privacy Policy.
        </div>
      </details>
    `;
    root.appendChild(wrap);

    // Wire actions
    root.getElementById("privacy-close").onclick = function(){ panel.style.display = "none"; };
    root.getElementById("privacy-save").onclick = function(){
      var checked = root.getElementById("privacy-optout").checked;
      setOptOut(checked);
      panel.style.display = "none";
    };

    // Footer link to open/close panel
    try {
      var linkWrap = d.createElement("div");
      linkWrap.style.cssText = "width:100%;text-align:center;margin-top:2px;margin-bottom:6px;";

      var footerLink = d.createElement("a");
      footerLink.href = "javascript:void(0)";
      footerLink.textContent = "Do Not Sell or Share My Personal Information";
      footerLink.style.cssText = "color:#666;font-size:12px;text-decoration:none;cursor:pointer;";
      footerLink.onclick = function(){
        panel.style.display = (panel.style.display === "none" ? "block" : "none");
      };

      linkWrap.appendChild(footerLink);

      var footers = d.getElementsByTagName("footer");
      if (footers && footers[0]) {
        footers[0].appendChild(linkWrap);
      } else {
        d.body.appendChild(linkWrap);
      }
    } catch(e){}
  }

  // 5) Expose a minimal API for sites that also want a footer link
  w.PrivacyChoices = {
    optOut: function(){ setOptOut(true); },
    optIn:  function(){ setOptOut(false); },
    status: function(){ return { gpc: hasGPC, optedOut: isOptedOut() }; }
  };

  // 6) Boot
  function boot(){ injectPrivacyUI(); loadPixel(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();

  // (Optional) Handle SPA soft navigations
  var _push = history.pushState; history.pushState = function(){ _push.apply(this, arguments); loadPixel(); };
  w.addEventListener("popstate", loadPixel);
})(window, document);
