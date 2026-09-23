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
      if (el.classList.contains("status")) el.textContent = m < 0 ? "Played. On the record." : n <= 0 ? "On air now." : n === 1 ? "Tomorrow." : n + " days out";
      else if (el.classList.contains("la28")) el.textContent = n + " days to LA28";
      else el.textContent = n <= 0 ? "now" : n === 1 ? "1 day" : n + " days";
    });
    $$(".strip[data-date]").forEach(function (s) {
      var iso = s.getAttribute("data-date"); if (!iso) return;
      var n = daysTo(iso), e = s.getAttribute("data-end"), m = e ? daysTo(e) : n, out = $("[data-out]", s);
      if (out) out.textContent = m < 0 ? "played" : n <= 0 ? "on air" : n + " days";
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
      var data = { title: D.title, url: location.href };
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
    var ticks = $$(".tick", track), max = +ph.getAttribute("aria-valuemax"), start = new Date(2026, 8, 23), rdo = $("#readout"), last = null;
    function at(pct) {
      pct = Math.max(0, Math.min(1, pct)); ph.style.left = (pct * 100) + "%"; ph.setAttribute("aria-valuenow", Math.round(pct * max));
      var day = new Date(start.getTime() + pct * max * 864e5);
      $("#phl").textContent = day.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      var near = null, best = 1e9;
      ticks.forEach(function (t) { var tp = parseFloat(t.style.left) / 100, dd = Math.abs(tp - pct); t.classList.toggle("lit", tp <= pct + 0.004); if (tp >= pct - 0.004 && tp - pct < best) { best = tp - pct; near = t; } });
      if (near && near !== last) { last = near; var e = near.getAttribute("data-who");
        rdo.innerHTML = ""; var b = D.createElement("b"); b.textContent = near.getAttribute("data-t"); var s = D.createElement("span"); s.textContent = e || "Up next on the track."; rdo.appendChild(b); rdo.appendChild(s); blip(SCALE[ticks.indexOf(near) % 10], 0.14); }
    }
    function fromEvt(ev) { var r = track.getBoundingClientRect(); at((ev.clientX - r.left) / r.width); }
    var drag = false;
    track.addEventListener("pointerdown", function (ev) { if (ev.target.closest(".tick")) return; drag = true; track.setPointerCapture(ev.pointerId); fromEvt(ev); });
    track.addEventListener("pointermove", function (ev) { if (drag) fromEvt(ev); });
    track.addEventListener("pointerup", function () { drag = false; });
    ph.addEventListener("keydown", function (ev) { var v = +ph.getAttribute("aria-valuenow"); if (ev.key === "ArrowRight") { at((v + 14) / max); ev.preventDefault(); } if (ev.key === "ArrowLeft") { at((v - 14) / max); ev.preventDefault(); } });
    at(0);
  }
})();
