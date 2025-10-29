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

  // 4) Panel (Do Not Sell/Share / Targeted Ads opt-out)
function injectPrivacyUI() {
  if (d.getElementById("privacy-choices-panel")) return;

// Create centered privacy panel (desktop), with mobile full-width minus 10px
var panel = d.createElement("div");
panel.id = "privacy-choices-panel";
panel.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:2147483647;background:#fff;border:1px solid #ccc;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.15);padding:12px 14px;max-width:360px;max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;display:none;font:14px/1.45 system-ui,sans-serif;";

// Mobile override: 5px margins on left/right
(function(){
  var css = [
    /* Ensure it's always above theme elements and never clipped */
    "#privacy-choices-panel{",
    "  position:fixed !important;",
    "  z-index:2147483647 !important;",
    "  max-height:calc(100vh - 24px) !important;",
    "  overflow:auto !important;",
    "  box-sizing:border-box !important;",
    "}",

    /* Mobile: full width with safe margins; keep within viewport bottom */
    "@media (max-width: 600px){",
    "  #privacy-choices-panel{",
    "    left:8px !important;",
    "    right:8px !important;",
    "    transform:none !important;",
    "    width:auto !important;",
    "    max-width:none !important;",
    "    bottom:12px !important;",
    "  }",
    "}",

    /* iOS safe-area support */
    "@supports (padding: max(0px)){",
    "  #privacy-choices-panel{ padding-bottom: max(12px, env(safe-area-inset-bottom)); }",
    "}"
  ].join("\n");
  var st = d.createElement("style"); st.textContent = css; d.head.appendChild(st);
})();


  // Freeze hover/active/focus styles for Save/Close and inherit panel text color
  (function(){
    var css = [
      "#privacy-save, #privacy-close,",
      "#privacy-save:hover, #privacy-close:hover,",
      "#privacy-save:active, #privacy-close:active,",
      "#privacy-save:focus, #privacy-close:focus {",
      "  color: inherit !important;",
      "  border-color: currentColor !important;",
      "  background: #fff !important;",
      "  outline: none !important;",
      "  box-shadow: none !important;",
      "  transition: none !important;",
      "}"
    ].join("\n");
    var st = d.createElement("style"); st.textContent = css; d.head.appendChild(st);
  })();

  panel.innerHTML =
    '<div style="font-weight:600;margin-bottom:6px;">Your Privacy Choices</div>'+
    '<label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0 10px;">'+
    '<input id="privacy-optout" type="checkbox" '+(isOptedOut()?'checked':'')+' />'+
    '<span>Do not sell or share my personal information / opt out of targeted advertising. We also honor browser signals like Global Privacy Control.</span>'+
    '</label>'+
    '<div style="display:flex;gap:8px;margin-bottom:8px;">'+
    // Buttons: text & border use panel text color; backgrounds fixed; no hover change
    '<button id="privacy-save" style="padding:6px 10px;border:1px solid currentColor;border-radius:8px;background:#fff;cursor:pointer;color:inherit;">Save</button>'+
    '<button id="privacy-close" style="padding:6px 10px;border:1px solid currentColor;border-radius:8px;background:#fff;cursor:pointer;color:inherit;">Close</button>'+
    '</div>'+
    '<details style="font-size:12px;color:#555;"><summary style="cursor:pointer">Privacy Notice (summary)</summary>'+
    '<div style="margin-top:8px;">This site collects site-activity data (pages viewed, clicks, scrolls, time on page, and technical identifiers) and shares it with our analytics/identity vendor to measure performance and provide interest-based services. Use the control above to opt out of sale/share or targeted advertising. We honor Global Privacy Control signals. We do not knowingly sell/share personal information of consumers under 16. For a full policy, see the website’s Privacy Policy.</div>'+
    '</details>';
  d.body.appendChild(panel);

  // Wire panel actions
  panel.querySelector("#privacy-close").onclick = function(){ panel.style.display = "none"; };
  panel.querySelector("#privacy-save").onclick = function(){
    var checked = panel.querySelector("#privacy-optout").checked;
    setOptOut(checked);
    panel.style.display = "none";
  };

  // Inject centered, grey footer link that opens the panel
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
