(function () {
  "use strict";
  var D = document, W = window;
  var reduce = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || D).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- live counts ---------- */
  function daysTo(iso) { var p = iso.split("-"), t = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((t - n) / 864e5); }
  function counts() {
    $$("[data-count]").forEach(function (el) {
      var iso = el.getAttribute("data-count"); if (!iso) return;
      var n = daysTo(iso), end = el.getAttribute("data-end"), m = end ? daysTo(end) : n;
      if (el.classList.contains("status")) {
        el.textContent = "";
        if (n > 1 && m >= 0) { var big = D.createElement("span"); big.className = "big"; big.textContent = n; el.appendChild(big); }
        el.appendChild(D.createTextNode(m < 0 ? "This date has passed." : n <= 0 ? "Happening now." : n === 1 ? "Tomorrow." : n + " days out"));
      }
      else if (el.hasAttribute("data-raw")) el.textContent = n;
      else if (el.classList.contains("la28")) el.textContent = n + " days to LA28";
      else if (m < 0) el.textContent = "date passed";
      else el.textContent = n <= 0 ? "now" : n === 1 ? "1 day" : n + " days";
    });
    $$(".strip[data-date]").forEach(function (s) {
      var iso = s.getAttribute("data-date"); if (!iso) return;
      var n = daysTo(iso), e = s.getAttribute("data-end"), m = e ? daysTo(e) : n, out = $("[data-out]", s);
      if (out) out.textContent = m < 0 ? "date passed" : n <= 0 ? "happening now" : n === 1 ? "tomorrow" : n + " days";
    });
  }
  counts();

  /* ---------- sound: an original in-browser synth, off until armed ---------- */
  var AC = null, master = null, busA = null, busB = null, armed = false, voices = [];
  var SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function hz(semi) { return 110 * Math.pow(2, semi / 12); }
  function chordFor(i) { var r = SCALE[i % SCALE.length] + (i % 3 === 0 ? 0 : 12); return [r, r + 7, r + 16, r + 19]; }
  function ensureAC() {
    if (AC) return AC;
    var C = W.AudioContext || W.webkitAudioContext; if (!C) return null;
    AC = new C(); master = AC.createGain(); master.gain.value = 0.0001;
    var lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800; lp.Q.value = 0.7;
    master.connect(lp); lp.connect(AC.destination);
    busA = AC.createGain(); busB = AC.createGain(); busA.connect(master); busB.connect(master);
    return AC;
  }
  function pad(bus, i) {
    if (!AC) return;
    (bus._v || []).forEach(function (o) { try { o.g.gain.setTargetAtTime(0, AC.currentTime, 0.3); o.o.stop(AC.currentTime + 1.5); } catch (e) {} });
    bus._v = chordFor(i).map(function (s, k) {
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = k % 2 ? "triangle" : "sawtooth"; o.frequency.value = hz(s); o.detune.value = (k - 1.5) * 6;
      g.gain.value = 0; g.gain.setTargetAtTime(k % 2 ? 0.05 : 0.018, AC.currentTime, 0.4);
      o.connect(g); g.connect(bus); o.start(); return { o: o, g: g };
    });
  }
  function blip(semi, len) {
    if (!armed || !AC) return;
    var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = "square"; o.frequency.value = hz(semi + 24);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.18));
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + (len || 0.18) + 0.05);
  }
  var arm = $("#arm");
  function setArmed(on) {
    armed = on; if (arm) { arm.setAttribute("aria-pressed", on); $(".arm-l", arm).textContent = on ? "Sound on" : "Sound off"; }
    if (on) { if (!ensureAC()) return; if (AC.state === "suspended") AC.resume(); master.gain.setTargetAtTime(0.9, AC.currentTime, 0.2); if (deck) deck.sound(); blip(12, 0.25); }
    else if (AC) master.gain.setTargetAtTime(0.0001, AC.currentTime, 0.15);
  }
  if (arm) arm.addEventListener("click", function () { setArmed(!armed); });

  /* ---------- faders: a little lift and a note per friend ---------- */
  $$(".fader").forEach(function (f) {
    var v = f.getAttribute("data-voice") || "", s = 0; for (var i = 0; i < v.length; i++) s = (s * 31 + v.charCodeAt(i)) % 10;
    f.addEventListener("pointerenter", function () { f.classList.add("up"); blip(SCALE[s]); });
    f.addEventListener("pointerleave", function () { f.classList.remove("up"); });
    f.addEventListener("focus", function () { blip(SCALE[s]); });
  });

  /* ---------- the deck: cue A/B and crossfade ---------- */
  var EV = W.MIXER_EVENTS || null, deck = null;
  if (EV && $("#deck")) {
    var byId = {}; EV.forEach(function (e, i) { e.i = i; byId[e.id] = e; });
    var selA = $("#deckA"), selB = $("#deckB"), xf = $("#xfader"), pA = $("#plateA"), pB = $("#plateB"), rd = $("#xfread");
    var ahead = EV.filter(function (e) { return e.date && daysTo(e.endDate || e.date) >= 0; });
    var a0 = store("mx_a") || (ahead[0] || EV[0]).id, b0 = store("mx_b") || (ahead[1] || EV[1]).id;
    selA.value = byId[a0] ? a0 : EV[0].id; selB.value = byId[b0] ? b0 : EV[1].id;
    function plate(el, e, nameEl) {
      el.classList.toggle("none", !e.art);
      el.style.backgroundImage = e.art ? "url(" + e.art + ")" : "";
      el.setAttribute("data-l", e.art ? e.artl : "NO PICTURE YET");
      $(nameEl).textContent = e.name + " · " + (e.stamp || "TBD") + " · " + (e.names.length ? e.names.join(", ") : "");
    }
    function mark() {
      $$(".strip").forEach(function (s) { var id = s.getAttribute("data-id"); s.classList.toggle("cuedA", id === selA.value); s.classList.toggle("cuedB", id === selB.value); });
    }
    function mix() {
      var x = +xf.value / 100, a = Math.cos(x * Math.PI / 2), b = Math.cos((1 - x) * Math.PI / 2);
      pA.style.opacity = (0.25 + 0.75 * a).toFixed(2); pB.style.opacity = (0.25 + 0.75 * b).toFixed(2);
      rd.textContent = "A " + Math.round(a * a * 100) + " · B " + Math.round(b * b * 100);
      if (AC && busA) { busA.gain.setTargetAtTime(a, AC.currentTime, 0.05); busB.gain.setTargetAtTime(b, AC.currentTime, 0.05); }
    }
    function load() {
      var A = byId[selA.value], B = byId[selB.value];
      plate(pA, A, "#nameA"); plate(pB, B, "#nameB");
      xf.style.setProperty("--ca", A.color || "#9dcaff"); xf.style.setProperty("--cb", B.color || "#ff6aa8");
      store("mx_a", A.id); store("mx_b", B.id); mark(); mix(); if (armed) deck.sound();
    }
    deck = { sound: function () { if (!AC) return; pad(busA, byId[selA.value].i); pad(busB, byId[selB.value].i); mix(); } };
    selA.addEventListener("change", load); selB.addEventListener("change", load); xf.addEventListener("input", mix);
    $$(".cue").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.closest(".strip").getAttribute("data-id"), side = b.getAttribute("data-cue");
        (side === "A" ? selA : selB).value = id; load(); blip(side === "A" ? 0 : 7, 0.12);
        if (!reduce) $("#deck").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    load();
  }

  /* ---------- open the rack on the next live channel ---------- */
  var rk = $(".rack"), first = rk && $(".strip.cued, .strip.live", rk);
  if (rk && first && rk.scrollWidth > rk.clientWidth) rk.scrollLeft = first.offsetLeft - rk.offsetLeft - 4;

  /* ---------- rack filters ---------- */
  $$(".filters button").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-f");
      $$(".filters button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      $$(".rack .strip").forEach(function (s) {
        var e = EV && EV.filter(function (x) { return x.id === s.getAttribute("data-id"); })[0], ok = true;
        if (f === "cued") ok = !s.classList.contains("played"); else if (f === "played") ok = s.classList.contains("played");
        else if (f !== "all") ok = e && e.kind === f;
        s.hidden = !ok;
      });
    });
  });

  /* ---------- share ---------- */
  $$("[data-share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var data = { title: D.title, text: b.getAttribute("data-text") || D.title, url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { b.textContent = "Link copied"; });
    });
  });

  /* ---------- Portola planner ---------- */
  var sets = $$(".set");
  if (sets.length) {
    var saved = store("mx_portola");
    if (saved) { try { var on = JSON.parse(saved); sets.forEach(function (s) { s.setAttribute("aria-pressed", on.indexOf(s.getAttribute("data-a")) > -1); }); } catch (e) {} }
    function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return ((h - 1) % 12 + 1) + ":" + (mm < 10 ? "0" : "") + mm; }
    function plan() {
      var on = sets.filter(function (s) { return s.getAttribute("aria-pressed") === "true"; })
        .map(function (s) { return { el: s, a: s.getAttribute("data-a"), s: +s.getAttribute("data-s"), e: +s.getAttribute("data-e"), st: s.closest(".stage").querySelector("h4").textContent }; })
        .sort(function (x, y) { return x.s - y.s; });
      sets.forEach(function (s) { s.classList.remove("clash"); });
      var clashes = [];
      for (var i = 0; i < on.length; i++) for (var j = i + 1; j < on.length; j++)
        if (on[j].s < on[i].e && on[i].s < on[j].e && on[i].a !== "Despacio" && on[j].a !== "Despacio") { on[i].el.classList.add("clash"); on[j].el.classList.add("clash"); clashes.push(on[i].a + " / " + on[j].a); }
      $("#clash").classList.toggle("ok", !clashes.length);
      $("#clash").textContent = clashes.length ? "Clash: " + clashes.join(", ") + ". Pick one, or split up and meet after." : on.length ? "No clashes. " + on.length + " sets starred." : "Tap sets to build the day.";
      $("#planText").textContent = "Our Portola Saturday (Pier 80, doors 1 PM):\n" + on.map(function (o) { return fmt(o.s) + " " + o.a + " @ " + o.st; }).join("\n");
      var sm = $("#smsPlan"); if (sm) sm.href = "sms:?&body=" + encodeURIComponent($("#planText").textContent);
      store("mx_portola", JSON.stringify(on.map(function (o) { return o.a; })));
    }
    sets.forEach(function (s, k) { s.addEventListener("click", function () { s.setAttribute("aria-pressed", s.getAttribute("aria-pressed") !== "true"); blip(SCALE[k % 10], 0.12); plan(); }); });
    var cp = $("#copyPlan");
    if (cp) cp.addEventListener("click", function () { if (navigator.clipboard) navigator.clipboard.writeText($("#planText").textContent).then(function () { cp.textContent = "Copied. Paste it in the chat."; }); });
    plan();
  }

  /* ---------- path to LA28: scrub the months ---------- */
  var track = $("#track"), ph = $("#playhead");
  if (track && ph) {
    var ticks = $$(".tick", track), max = +ph.getAttribute("aria-valuemax"), sp = (ph.getAttribute("data-start") || "2026-09-13").split("-"), start = new Date(+sp[0], +sp[1] - 1, +sp[2]), rdo = $("#readout"), last = null, fin = $("#finale");
    function at(pct) {
      pct = Math.max(0, Math.min(1, pct)); ph.style.left = (pct * 100) + "%"; ph.setAttribute("aria-valuenow", Math.round(pct * max));
      var day = new Date(start.getTime() + pct * max * 864e5);
      $("#phl").textContent = day.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      var near = null, best = 1e9;
      ticks.forEach(function (t) { var tp = parseFloat(t.style.left) / 100, dd = Math.abs(tp - pct); t.classList.toggle("lit", tp <= pct + 0.004); if (tp >= pct - 0.004 && tp - pct < best) { best = tp - pct; near = t; } });
      if (fin) fin.hidden = pct < 0.995; if (fin && pct >= 0.995 && !fin._done) { fin._done = 1; blip(12, 0.3); setTimeout(function () { blip(19, 0.4); }, 180); }
      if (near && near !== last) { last = near; var e = near.getAttribute("data-who");
        rdo.innerHTML = ""; var b = D.createElement("b"); b.textContent = near.getAttribute("data-t"); var s = D.createElement("span"); s.textContent = e || "Up next on the track."; rdo.appendChild(b); rdo.appendChild(s); blip(SCALE[ticks.indexOf(near) % 10], 0.14); }
    }
    function fromEvt(ev) { var r = track.getBoundingClientRect(); at((ev.clientX - r.left) / r.width); }
    var drag = false;
    track.addEventListener("pointerdown", function (ev) { if (ev.target.closest(".tick")) return; drag = true; track.setPointerCapture(ev.pointerId); fromEvt(ev); });
    track.addEventListener("pointermove", function (ev) { if (drag) fromEvt(ev); });
    track.addEventListener("pointerup", function () { drag = false; });
    ph.addEventListener("keydown", function (ev) { var v = +ph.getAttribute("aria-valuenow"); if (ev.key === "ArrowRight") { at((v + 14) / max); ev.preventDefault(); } if (ev.key === "ArrowLeft") { at((v - 14) / max); ev.preventDefault(); } });
    var tp = parseFloat(($(".today", track) || {style:{left:"0"}}).style.left) / 100 || 0; at(tp);
  }

  /* ================= EDITION 2 ================= */
  function slugv(el) { return el.getAttribute("data-voice") || ""; }
  /* light up a friend's nights in the rack */
  var litBtns = $$(".light"), note = $("#litNote");
  litBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var who = b.getAttribute("data-light"), on = b.getAttribute("aria-pressed") !== "true";
      litBtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); x.closest(".crewcard").classList.remove("on"); });
      var strips = $$(".rack .strip"), hit = 0;
      strips.forEach(function (s) { var m = on && (" " + s.getAttribute("data-who") + " ").indexOf(" " + who + " ") > -1; s.classList.toggle("glow", m); s.classList.toggle("dim", on && !m); if (m) hit++; });
      if (on) { b.setAttribute("aria-pressed", "true"); b.closest(".crewcard").classList.add("on"); var nm = b.closest(".crewcard").querySelector("b").textContent;
        if (note) { note.hidden = false; note.textContent = nm + ": " + hit + " night" + (hit === 1 ? "" : "s") + " lit. Tap again to clear."; }
        var s0 = D.getElementById("rack"); if (s0) s0.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        var h = 0; for (var i = 0; i < who.length; i++) h = (h * 31 + who.charCodeAt(i)) % 10; blip(SCALE[h], 0.2);
        var first = $(".rack .strip.glow"); if (first && rk) rk.scrollLeft = first.offsetLeft - rk.offsetLeft - 4;
      } else if (note) note.hidden = true;
    });
  });
  /* filters for open seats and solo nights */
  $$(".filters button").forEach(function (b) {
    var f = b.getAttribute("data-f"); if (f !== "open" && f !== "solo") return;
    b.addEventListener("click", function () { $$(".rack .strip").forEach(function (s) { s.hidden = !s.getAttribute(f === "open" ? "data-open" : "data-solo"); }); });
  });
  $$(".filters button").forEach(function (b) {
    var f = b.getAttribute("data-f"); if (f === "open" || f === "solo") return;
    b.addEventListener("click", function () { $$(".rack .strip").forEach(function (s) { if (f === "all") s.hidden = false; else s.hidden = s.getAttribute("data-kind") !== f; }); });
  });
  /* surprise me */
  var sur = $("#surprise");
  if (sur && EV) sur.addEventListener("click", function () {
    var pool = EV.filter(function (e) { return e.date && daysTo(e.endDate || e.date) >= 0; }), a = pool[Math.floor(Math.random() * pool.length)], b;
    do { b = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && b === a);
    $("#deckA").value = a.id; $("#deckB").value = b.id; $("#deckA").dispatchEvent(new Event("change")); var x = $("#xfader"); x.value = 50; x.dispatchEvent(new Event("input"));
    blip(0, 0.1); setTimeout(function () { blip(7, 0.14); }, 120);
  });
  /* wristbands: nights you have opened */
  var seen = []; try { seen = JSON.parse(store("mx_seen") || "[]"); } catch (e) {}
  var nightEl = $("article.night[data-id]");
  if (nightEl) { var id = nightEl.getAttribute("data-id"); if (seen.indexOf(id) < 0) { seen.push(id); store("mx_seen", JSON.stringify(seen)); } }
  var bands = $("#bands"), row = $("#bandRow");
  if (bands && row && EV) {
    var got = EV.filter(function (e) { return seen.indexOf(e.id) > -1; }).length;
    if (got) {
      bands.hidden = false;
      $("#bandsNote").textContent = got + " of " + EV.length + " nights opened. Every night page you visit adds its band.";
      EV.forEach(function (e) { var a = D.createElement("a"); a.href = "night/" + e.id + ".html"; a.style.setProperty("--c", e.color || "#9dcaff"); if (seen.indexOf(e.id) < 0) a.className = "off";
        var s = D.createElement("span"); s.textContent = e.name; a.appendChild(s); a.title = e.name; row.appendChild(a); });
    }
  }
  /* on this day: the nearest photo anniversary */
  var AN = W.MIXER_ANNIV, otd = $("#onthisday");
  if (AN && otd) {
    var now = new Date(), best = null; now.setHours(0, 0, 0, 0);
    AN.forEach(function (p) { var q = p.date.split("-"), d = new Date(now.getFullYear(), +q[1] - 1, +q[2]); if (d < now) d.setFullYear(now.getFullYear() + 1);
      var gap = Math.round((d - now) / 864e5); if (!best || gap < best.gap) best = { p: p, gap: gap, yrs: d.getFullYear() - +q[0] }; });
    if (best) {
      otd.hidden = false; otd.textContent = "";
      var b = D.createElement("b"); b.textContent = best.gap === 0 ? "On this day, " + best.yrs + " years ago: " : "In " + best.gap + " day" + (best.gap === 1 ? "" : "s") + ", " + best.yrs + " years since ";
      otd.appendChild(b); otd.appendChild(D.createTextNode(best.p.title + ". " + best.p.line));
    }
  }
  /* night pages: arrow keys and swipe */
  if (nightEl) {
    var pv = nightEl.getAttribute("data-prev"), nx = nightEl.getAttribute("data-next");
    D.addEventListener("keydown", function (ev) { if (/input|select|textarea/i.test((ev.target.tagName || ""))) return;
      if (ev.key === "ArrowLeft" && pv) location.href = pv + ".html"; if (ev.key === "ArrowRight" && nx) location.href = nx + ".html"; });
    var hd = $(".nhead", nightEl), x0 = null, y0 = null;
    if (hd) { hd.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
      hd.addEventListener("touchend", function (ev) { if (x0 === null) return; var dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
        if (Math.abs(dx) > 80 && Math.abs(dy) < 50) { if (dx < 0 && nx) location.href = nx + ".html"; if (dx > 0 && pv) location.href = pv + ".html"; } }, { passive: true }); }
  }
  /* Portola: on the day, what is playing now */
  var nl = $("#nowline");
  if (nl && sets.length) {
    var tick2 = function () {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()), o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var day = o.year + "-" + o.month + "-" + o.day, mins = (+o.hour % 24) * 60 + +o.minute;
      var live = day === "2026-09-26" && mins >= 780 && mins <= 1380;
      nl.hidden = !live; sets.forEach(function (s) { s.classList.toggle("now", live && mins >= +s.getAttribute("data-s") && mins < +s.getAttribute("data-e")); });
      if (live) nl.style.top = ((mins - 780) / 600 * 100) + "%";
    };
    tick2(); setInterval(tick2, 60000);
  }

  /* ---------- the road 2.1: fly the year ---------- */
  var map = $("#roadmap"), dataEl = $("#tourData");
  if (map && dataEl) {
    var hops = JSON.parse(dataEl.textContent), comet = $("#comet", map), btn = $("#tourPlay"), rd = $("#tourRead"), odoN = $("#odoN");
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pre = D.body.getAttribute("data-pre") || "";
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { map.classList.add("drawn"); io.disconnect(); } }); }, { threshold: .25 });
      io.observe(map);
    } else map.classList.add("drawn");
    function light(sl) {
      $$(".pin.on, .stopcard.on").forEach(function (x) { x.classList.remove("on"); });
      if (!sl) return;
      $$('[data-stop="' + sl + '"]').forEach(function (x) { if (x.classList.contains("pin") || x.classList.contains("stopcard")) x.classList.add("on"); });
    }
    function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
    function place(pt) { comet.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")"); }
    function say(h, k) {
      rd.innerHTML = "<b>" + (k + 1) + " / " + hops.length + " · " + h.name + "</b><span>" + h.when + " · " + h.label + (h.who ? " · with " + h.who : "") + "</span>";
    }
    var odo = 0;
    function odoTo(target, ms, done) {
      var from = odo, t0 = performance.now();
      (function f(t) { var q = Math.min(1, (t - t0) / ms); odo = Math.round(from + (target - from) * q); odoN.textContent = odo.toLocaleString(); if (q < 1) requestAnimationFrame(f); else done && done(); })(t0);
    }
    function fly(legIdx, done) {
      var path = $("#leg" + legIdx, map);
      if (!path || still) { if (path) place(path.getPointAtLength(path.getTotalLength())); done(); return; }
      var L = path.getTotalLength(), ms = Math.max(700, Math.min(2200, L * 2.2)), t0 = performance.now();
      (function f(t) { var q = Math.min(1, (t - t0) / ms), e = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; place(path.getPointAtLength(L * e)); if (q < 1) requestAnimationFrame(f); else done(); })(t0);
    }
    var running = false, token = 0;
    function stop(msg) { running = false; token++; btn.textContent = "▶ Play the tour"; btn.setAttribute("aria-pressed", "false"); if (msg) rd.innerHTML = msg; }
    function play() {
      var my = ++token, k = 0, leg = 0; running = true; odo = 0; odoN.textContent = "0";
      btn.textContent = "■ Stop"; btn.setAttribute("aria-pressed", "true"); map.classList.add("touring", "drawn");
      var la = $('.ldot[data-stop="los-angeles"]', map) || $('[data-stop="los-angeles"] image', map);
      var legs = $$(".leg", map);
      place(legs[0].getPointAtLength(0));
      (function next() {
        if (my !== token) return;
        if (k >= hops.length) {
          var last = legs.length - 1;
          if (leg < last) { rd.innerHTML = "<b>Home to Los Angeles</b><span>Every road on this page ends back at home.</span>";
            var total = hops[hops.length - 1].miles + Math.round(parseFloat(map.getAttribute("data-lastleg") || "0"));
            fly(last, function () { odoTo(total, 600); light("los-angeles"); stop("<b>" + hops.length + " nights, all flown.</b><span>About " + total.toLocaleString() + " miles with the people in this mix. Press play to fly it again.</span>"); }); }
          else stop();
          return;
        }
        var h = hops[k];
        var go = function () { odoTo(h.miles, still ? 0 : 500); light(slugify(h.stop)); say(h, k); k++; setTimeout(next, still ? 1600 : 1500); };
        if (h.leg !== leg) { var target = h.leg; leg = target; fly(target - 1, go); } else go();
      })();
    }
    btn.addEventListener("click", function () { running ? stop() : play(); });
    $$(".pin", map).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var sl = a.getAttribute("data-stop"), card = $("#stop-" + sl);
        if (!card) return; ev.preventDefault(); light(sl);
        card.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "nearest" });
        if (history.replaceState) history.replaceState(null, "", "#stop-" + sl);
      });
    });
  }
})();
