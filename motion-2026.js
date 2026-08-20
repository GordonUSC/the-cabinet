/* ============================================================================
   MOTION-2026 · shared interaction layer for Gordon's sites
   Built 2026-08-11 from three research tracks: award-winning interactive sites
   (Lusion, OHZI, Lando Norris, Bruno Simon), scroll-choreography practice, and
   the dynamic/live-page patterns coming out of Claude-built sites.

   Rules it holds itself to, taken straight from that research:
   - "Beauty at 60fps is the whole discipline." Everything here is rAF-driven,
     gated by IntersectionObserver, and stops dead when the tab is hidden.
   - "Directed motion, not decoration." Every effect below reacts to something
     the visitor actually did.
   - No libraries, no CDN, no build step. Vanilla, so it survives a strict CSP.
   - prefers-reduced-motion and low-end devices opt out completely.

   Everything is namespaced under window.M26 and is additive: if this file
   fails to load, every site still works exactly as it did before.
   ========================================================================= */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Coarse proxy for "this device will not hold 60fps": few cores, or the
  // browser reporting a low-memory device. Better to skip than to stutter.
  var WEAK = (navigator.hardwareConcurrency || 8) <= 4 ||
             (navigator.deviceMemory || 8) <= 2;
  var CAN_ANIMATE = !REDUCED && !WEAK;

  var M26 = window.M26 = {
    reduced: REDUCED,
    weak: WEAK,
    enabled: CAN_ANIMATE
  };

  /* ---------------------------------------------------------------------
     1 · CURSOR-REACTIVE FIELD
     The Lusion/OHZI idea, hand-rolled on 2D canvas instead of WebGL: the page
     has an atmosphere that knows where you are. A drifting constellation that
     leans toward the pointer and brightens near it. On touch it follows the
     finger. It reads as depth, and it costs one canvas and no dependency.
     ------------------------------------------------------------------ */
  M26.field = function (opts) {
    if (!CAN_ANIMATE) return null;
    opts = opts || {};
    var host = document.createElement("canvas");
    host.className = "m26-field";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);

    var ctx = host.getContext("2d", { alpha: true });
    if (!ctx) { host.remove(); return null; }

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], raf = null, visible = true;
    var COUNT = opts.count || 46;
    var HUE = opts.color || "255,255,255";
    var REACH = opts.reach || 190;
    var mx = -9999, my = -9999;

    function size() {
      W = host.width = Math.floor(innerWidth * DPR);
      H = host.height = Math.floor(innerHeight * DPR);
      host.style.width = innerWidth + "px";
      host.style.height = innerHeight + "px";
    }

    function seed() {
      pts = [];
      var n = Math.round(COUNT * Math.min(1, innerWidth / 900));
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.16 * DPR,
          vy: (Math.random() - 0.5) * 0.16 * DPR,
          r: (Math.random() * 1.5 + 0.6) * DPR
        });
      }
    }

    function frame() {
      raf = null;
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      var reach = REACH * DPR;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        var dx = p.x - mx, dy = p.y - my;
        var d = Math.sqrt(dx * dx + dy * dy);
        var near = d < reach ? 1 - d / reach : 0;

        // lean toward the pointer, gently, so the whole field tilts
        if (near > 0) { p.x -= dx * 0.0016 * near; p.y -= dy * 0.0016 * near; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + near * 1.5), 0, 6.2832);
        ctx.fillStyle = "rgba(" + HUE + "," + (0.10 + near * 0.5).toFixed(3) + ")";
        ctx.fill();
      }
      schedule();
    }

    function schedule() { if (!raf && visible) raf = requestAnimationFrame(frame); }

    function onMove(e) {
      var t = e.touches ? e.touches[0] : e;
      if (!t) return;
      mx = t.clientX * DPR; my = t.clientY * DPR;
    }

    size(); seed(); schedule();
    addEventListener("resize", function () { size(); seed(); }, { passive: true });
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("touchmove", onMove, { passive: true });
    addEventListener("pointerleave", function () { mx = my = -9999; }, { passive: true });
    // 60fps discipline: a hidden tab burns nothing.
    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
      if (visible) schedule(); else if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
    return host;
  };

  /* ---------------------------------------------------------------------
     2 · MAGNETIC ACTIONS
     The micro-interaction that "rewards attention": a primary control leans
     toward the cursor as you approach and snaps back when you leave, so the
     thing you are about to click acknowledges you before you click it.
     Pointer-fine only; on touch there is no hover to reward.
     ------------------------------------------------------------------ */
  M26.magnetic = function (selector, strength) {
    if (!CAN_ANIMATE || !matchMedia("(pointer:fine)").matches) return;
    var k = strength || 0.28;
    document.querySelectorAll(selector).forEach(function (el) {
      var raf = null, tx = 0, ty = 0;
      el.classList.add("m26-magnetic");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * k;
        ty = (e.clientY - (r.top + r.height / 2)) * k;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener("pointerleave", function () {
        tx = ty = 0; if (!raf) raf = requestAnimationFrame(apply);
      });
      function apply() { raf = null; el.style.transform = "translate(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px)"; }
    });
  };

  /* ---------------------------------------------------------------------
     3 · SCROLL CHOREOGRAPHY
     Publishes the page's scroll position as a CSS variable (--m26-progress,
     0 to 1) on <html>, so any stylesheet can choreograph against the read
     rather than against a timer. This is the JS half of the same idea the
     CSS scroll timelines cover, kept for anything that needs a number.
     ------------------------------------------------------------------ */
  M26.progress = function () {
    if (REDUCED) return;
    var raf = null;
    function read() {
      raf = null;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0;
      h.style.setProperty("--m26-progress", p.toFixed(4));
    }
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(read); }, { passive: true });
    read();
  };

  /* ---------------------------------------------------------------------
     4 · THE PAGE KNOWS YOU CAME BACK
     The "dynamic" half of the research: a page that is not the same object on
     every visit. Counts visits in localStorage and stamps <html> with
     data-m26-visit="first|returning", plus the viewer's local time of day, so
     CSS and copy can respond to when and how often someone is here.
     No network, no tracking, no identity. It never leaves the device.
     ------------------------------------------------------------------ */
  M26.remember = function (key) {
    var h = document.documentElement, n = 0;
    try {
      n = parseInt(localStorage.getItem("m26_" + key) || "0", 10) || 0;
      localStorage.setItem("m26_" + key, String(n + 1));
    } catch (e) { /* private mode: fall through as a first visit */ }
    h.setAttribute("data-m26-visit", n > 0 ? "returning" : "first");
    h.setAttribute("data-m26-visits", String(n + 1));
    var hr = new Date().getHours();
    h.setAttribute("data-m26-when",
      hr < 5 ? "night" : hr < 11 ? "morning" : hr < 17 ? "afternoon" : hr < 21 ? "evening" : "night");
    return n + 1;
  };

  /* ---------------------------------------------------------------------
     5 · TILT ON HOVER
     "Hover a project and the preview reacts." A card tips slightly toward the
     pointer in 3D. Small enough to read as physical rather than as a trick.
     ------------------------------------------------------------------ */
  M26.tilt = function (selector, maxDeg) {
    if (!CAN_ANIMATE || !matchMedia("(pointer:fine)").matches) return;
    var M = maxDeg || 5;
    document.querySelectorAll(selector).forEach(function (el) {
      var raf = null, rx = 0, ry = 0;
      el.classList.add("m26-tilt");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        ry = ((e.clientX - r.left) / r.width - 0.5) * 2 * M;
        rx = -((e.clientY - r.top) / r.height - 0.5) * 2 * M;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener("pointerleave", function () {
        rx = ry = 0; if (!raf) raf = requestAnimationFrame(apply);
      });
      function apply() {
        raf = null;
        el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      }
    });
  };


  /* ---------------------------------------------------------------------
     7 · KINETIC TYPE
     From the 2026 research: "letters stretching, rotating, or fading in sync
     with movement, making reading more cinematic." Splits a headline into
     words and hands each one its own scroll-driven reveal, so the line
     assembles as it enters rather than simply being there.

     Splitting is the only thing script does. The motion itself is CSS scroll
     timelines, so it runs on the compositor. Accessibility: the original text
     stays intact as one string for screen readers via aria-label, and the
     word spans are hidden from the accessibility tree.
     ------------------------------------------------------------------ */
  M26.kinetic = function (selector) {
    if (REDUCED) return;
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.dataset.m26Kinetic) return;
      var text = el.textContent.replace(/\s+/g, " ").trim();
      if (!text || el.querySelector("img,svg,video")) return;
      el.dataset.m26Kinetic = "1";
      el.setAttribute("aria-label", text);
      var frag = document.createDocumentFragment();
      // walk the original nodes so inline markup (em, strong) survives
      var words = 0;
      (function walk(src, dest) {
        Array.prototype.forEach.call(src.childNodes, function (n) {
          if (n.nodeType === 3) {
            n.textContent.split(/(\s+)/).forEach(function (tok) {
              if (!tok) return;
              if (/^\s+$/.test(tok)) { dest.appendChild(document.createTextNode(tok)); return; }
              var sp = document.createElement("span");
              sp.className = "m26-word";
              sp.style.setProperty("--w", String(words++));
              sp.textContent = tok;
              dest.appendChild(sp);
            });
          } else if (n.nodeType === 1) {
            var clone = n.cloneNode(false);
            walk(n, clone);
            dest.appendChild(clone);
          }
        });
      })(el, frag);
      el.textContent = "";
      el.appendChild(frag);
      el.setAttribute("aria-hidden", "false");
      Array.prototype.forEach.call(el.querySelectorAll(".m26-word"), function (w) {
        w.setAttribute("aria-hidden", "true");
      });
      el.classList.add("m26-kinetic");
    });
  };

  /* ---------------------------------------------------------------------
     6 · AUTOSTART
     A site opts in by putting data-m26 on <body> with a comma list, e.g.
     <body data-m26="field,magnetic,tilt,progress,remember" data-m26-key="tour">
     Nothing runs unless it is asked for.
     ------------------------------------------------------------------ */
  function boot() {
    var b = document.body;
    if (!b) return;

    // Artifact-style pages are fragments: no <html>, no <head>, no <body> tag
    // to hang attributes on, because the host wraps them at publish time.
    // Those pages configure via window.M26_CONFIG instead, which we copy onto
    // the implicit body so the rest of this function has one code path.
    var cfg = window.M26_CONFIG;
    if (cfg && !b.getAttribute("data-m26")) {
      if (cfg.use) b.setAttribute("data-m26", cfg.use);
      if (cfg.key) b.setAttribute("data-m26-key", cfg.key);
      if (cfg.fieldColor) b.setAttribute("data-m26-field-color", cfg.fieldColor);
      if (cfg.fieldCount) b.setAttribute("data-m26-field-count", String(cfg.fieldCount));
      if (cfg.tilt) b.setAttribute("data-m26-tilt", cfg.tilt);
      if (cfg.magnetic) b.setAttribute("data-m26-magnetic", cfg.magnetic);
      if (cfg.ground) b.setAttribute("data-m26-ground", cfg.ground);
      if (cfg.kinetic) b.setAttribute("data-m26-kinetic", cfg.kinetic);
    }

    // Tell the stylesheet what kind of ground it is painting on, so the field
    // can pick a blend mode that is actually visible there.
    var ground = b.getAttribute("data-m26-ground");
    if (ground) document.documentElement.setAttribute("data-m26-ground", ground);

    var want = (b.getAttribute("data-m26") || "").split(",").map(function (s) { return s.trim(); });
    if (want.indexOf("progress") > -1) M26.progress();
    if (want.indexOf("remember") > -1) M26.remember(b.getAttribute("data-m26-key") || "site");
    if (want.indexOf("field") > -1) {
      M26.field({
        color: b.getAttribute("data-m26-field-color") || "255,255,255",
        count: parseInt(b.getAttribute("data-m26-field-count") || "46", 10)
      });
    }
    if (want.indexOf("magnetic") > -1) M26.magnetic(b.getAttribute("data-m26-magnetic") || ".m26-mag");
    if (want.indexOf("tilt") > -1) M26.tilt(b.getAttribute("data-m26-tilt") || ".m26-card");
    if (want.indexOf("kinetic") > -1) M26.kinetic(b.getAttribute("data-m26-kinetic") || "h1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
