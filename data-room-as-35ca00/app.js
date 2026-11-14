/* GGP: The Data Room. Interactions and two small games. Darby, 2026-11-13. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sound (off until asked) ---------- */
  var soundOn = false, aW = $("#aW"), aM = $("#aM");
  function sfx(name, vol) {
    if (!soundOn) return;
    try { var a = new Audio("audio/" + name + ".mp3"); a.volume = vol || 0.6; a.play().catch(function () {}); } catch (e) {}
  }
  var snd = $("#snd");
  snd.addEventListener("click", function () {
    soundOn = !soundOn;
    snd.setAttribute("aria-pressed", String(soundOn));
    snd.textContent = soundOn ? "Sound off" : "Sound on: hear the welcome";
    if (soundOn) {
      aM.volume = 0.12; aW.volume = 0.95;
      aW.currentTime = 0; aW.play().catch(function () {});
      aW.onended = function () { if (soundOn) { aM.volume = 0.22; } };
      aM.play().catch(function () {});
    } else { aW.pause(); aM.pause(); }
  });

  /* ---------- KPI count-up ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, n = +el.dataset.n, s = el.dataset.s || "", t0 = performance.now();
        (function tick(t) {
          var p = Math.min(1, (t - t0) / 900), v = Math.round(n * (1 - Math.pow(1 - p, 3)));
          el.textContent = v + (p === 1 ? s : "");
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".kpi b[data-n]").forEach(function (b) { io.observe(b); });
  }

  /* ---------- Exhibit D: return on an hour ---------- */
  var MODEL = [
    { n: "21", l: "graduate scholars in the room", t: "60 to 90 minutes", w: "online", s: "2025 to 2026 class size", x: "A banker who became a studio COO can explain a greenlight from both sides of the table. Graduate students almost never hear that." },
    { n: "1", l: "scholar, and it is the one that counts", t: "45 minutes", w: "online", s: "one review, one person", x: "You have signed off on headcount and relocated hires across borders. One honest review from you can change how someone applies for years." },
    { n: "602", l: "guests came to the last one", t: "one evening", w: "The Foundry, San Francisco", s: "GDC 2026 door count", x: "No panel, no badge scan. You sit down, you play, and a scholar learns that the COO across the table is a person." },
    { n: "150", l: "seats at the breakfast", t: "90 minutes", w: "San Francisco, GDC week", s: "2026 room capacity", x: "Scholars from both programs in one room, the morning after game night. The easiest place to meet the whole class at once." },
    { n: "2", l: "programs made steadier", t: "60 minutes", w: "online", s: "the two scholar programs", x: "A CPA with deal experience looking at a nonprofit's budget and supporter agreements for one hour. Nobody else on this list can do that." }
  ];
  var ways = Array.prototype.slice.call(document.querySelectorAll(".way"));
  function pick(k, rolled) {
    ways.forEach(function (w, i) { w.setAttribute("aria-pressed", String(i === k)); w.classList.toggle("rolled", !!rolled && i === k); });
    var m = MODEL[k];
    $("#oN").textContent = m.n; $("#oL").textContent = m.l; $("#oT").textContent = m.t;
    $("#oW").textContent = m.w; $("#oS").textContent = m.s; $("#oX").textContent = m.x;
  }
  ways.forEach(function (w, i) { w.addEventListener("click", function () { pick(i, false); sfx("catch", 0.5); }); });

  /* ---------- Exhibit E: term sheet ---------- */
  var TERMS = ["one session on the business of a studio for CYSTEM Scholars", "one portfolio review", "Zero Proof Board Game Night on March 1", "the Scholars Breakfast on March 2", "an hour as GGP's finance sounding board"];
  function reply() {
    var got = TERMS.filter(function (_, i) { return $("#t" + i).checked; });
    var body = got.length ? "Put me down for: " + got.join("; ") + ". Tell me what dates work." : "I would love to talk about where I fit.";
    $("#reply").value = "Gordon, I read the data room. " + body + " Anthony";
  }
  TERMS.forEach(function (_, i) { $("#t" + i).addEventListener("change", reply); });
  $("#doStamp").addEventListener("click", function () {
    var st = $("#stamp"); st.classList.remove("on"); void st.offsetWidth; st.classList.add("on");
    sfx("stamp", 0.8); reply();
  });
  $("#copy").addEventListener("click", function () {
    var ta = $("#reply"), done = function () { $("#copied").textContent = "Copied. Paste it into a reply to Gordon."; };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand("copy"); done(); }); }
    else { ta.select(); document.execCommand("copy"); done(); }
  });

  /* ---------- the d20 (three.js) ---------- */
  function bootDie() {
    if (!window.THREE) return;
    var cv = $("#die"), T = window.THREE;
    var r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(35, 2, 0.1, 50); cam.position.set(0, 0, 6.2);
    var g = new T.IcosahedronGeometry(1.55, 0).toNonIndexed();
    var inks = [0xc2338a, 0xe2711d, 0xb98612, 0x2f8f5b, 0x177e89, 0x5b3fa0], cols = [], c = new T.Color();
    for (var f = 0; f < 20; f++) { c.setHex(inks[f % 6]); for (var v = 0; v < 3; v++) cols.push(c.r, c.g, c.b); }
    g.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
    var mesh = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0.1 }));
    var edges = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x1d1a3a }));
    mesh.add(edges); sc.add(mesh);
    sc.add(new T.AmbientLight(0xffffff, 0.75)); var dl = new T.DirectionalLight(0xffffff, 0.9); dl.position.set(3, 4, 5); sc.add(dl);
    function size() { var w = cv.clientWidth, h = cv.clientHeight; r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    size(); window.addEventListener("resize", size);
    var spin = 0, t0 = 0, from = new T.Vector3(), to = new T.Vector3(), rolling = false, result = 0;
    function frame(t) {
      if (rolling) {
        var p = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - p, 3);
        mesh.rotation.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e, from.z + (to.z - from.z) * e);
        mesh.position.y = Math.sin(p * Math.PI) * 0.7;
        if (p === 1) { rolling = false; var k = (result - 1) % 5; $("#dieout").textContent = "You rolled " + result + ": way " + (k + 1) + "."; pick(k, true); }
      } else if (!reduce) { mesh.rotation.y += 0.004; mesh.rotation.x += 0.0015; }
      r.render(sc, cam); requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    $("#roll").addEventListener("click", function () {
      if (rolling) return;
      result = 1 + Math.floor(Math.random() * 20); window.__die = result;
      from.set(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
      to.set(from.x + Math.PI * (4 + Math.random() * 2), from.y + Math.PI * (5 + Math.random() * 2), from.z + Math.PI * (2 + Math.random()));
      t0 = performance.now(); rolling = true; $("#dieout").textContent = "Rolling..."; sfx("dice", 0.8);
      if (reduce) { t0 -= 1300; }
    });
  }

  /* ---------- Make Room (Phaser) ---------- */
  function bootGame() {
    if (!window.Phaser) return;
    var box = $("#mr"); box.innerHTML = "";
    var W = 360, H = 480;
    var ROUNDS = [
      { name: "Round 1 of 3", target: 25, per: 1, gap: 520, fall: 120, secs: 20, label: "25 schools sent scholars" },
      { name: "Round 2 of 3", target: 150, per: 6, gap: 460, fall: 185, secs: 18, label: "150 seats at breakfast" },
      { name: "Round 3 of 3", target: 602, per: 10, gap: 400, fall: 215, secs: 20, label: "602 came to game night" }
    ];
    var S = { round: 0, seats: 0, total: 0, streak: 0, state: "title", caught: 0, spawned: 0 };
    window.__mr = S;
    function hud() {
      var R = ROUNDS[Math.min(S.round, 2)];
      $("#mrR").textContent = S.state === "done" ? "Final" : R.name;
      $("#mrS").textContent = "Seats " + S.seats;
      $("#mrT").textContent = S.state === "done" ? "Real night: 602" : "Target " + R.target;
    }
    var scene = {
      preload: function () {
        this.load.image("table", "art/table-cut.png");
        this.load.image("meeple", "art/meeple-cut.png");
        this.load.image("gold", "art/gold-cut.png");
      },
      create: function () {
        var s = this;
        s.cameras.main.setBackgroundColor("#1d1a3a");
        var gfx = s.add.graphics();
        gfx.lineStyle(1, 0x5b3fa0, 0.35);
        for (var i = 1; i < 14; i++) gfx.strokeCircle(W / 2, -40, i * 44);
        s.table = s.physics.add.image(W / 2, H - 46, "table").setDisplaySize(132, 97).setImmovable(true);
        s.table.body.allowGravity = false; s.table.body.setSize(s.table.width * 0.92, s.table.height * 0.3).setOffset(s.table.width * 0.04, 0);
        s.guests = s.physics.add.group();
        var st = { fontFamily: '"Bodoni Moda", Didot, Georgia, serif', fontSize: "30px", color: "#f3ead2", align: "center", fontStyle: "bold", wordWrap: { width: 320 } };
        s.big = s.add.text(W / 2, 150, "Make Room", st).setOrigin(0.5).setDepth(5);
        s.small = s.add.text(W / 2, 228, "Tap or press Space to open the doors", { fontFamily: '"IBM Plex Mono", Menlo, monospace', fontSize: "14px", color: "#f2c14e", align: "center", wordWrap: { width: 300 } }).setOrigin(0.5).setDepth(5);
        s.mult = s.add.text(W - 10, 10, "", { fontFamily: '"IBM Plex Mono", Menlo, monospace', fontSize: "14px", color: "#f2c14e" }).setOrigin(1, 0).setDepth(5);
        s.clock = s.add.text(10, 10, "", { fontFamily: '"IBM Plex Mono", Menlo, monospace', fontSize: "14px", color: "#f3ead2" }).setDepth(5);
        s.cur = s.input.keyboard.createCursorKeys();
        s.input.on("pointermove", function (p) { if (S.state === "play") s.tx = p.x; });
        s.input.on("pointerdown", function (p) { s.tx = p.x; s.advance(); });
        s.input.keyboard.on("keydown-SPACE", function () { s.advance(); });
        s.tx = W / 2;
        s.physics.add.overlap(s.table, s.guests, function (t, g) {
          if (!g.active) return;
          var R = ROUNDS[S.round], gold = g.texture.key === "gold";
          S.streak += 1; var m = Math.min(3, 1 + Math.floor(S.streak / 5));
          var add = R.per * (gold ? 3 : 1) * m; S.seats += add; S.caught += 1;
          var pop = s.add.text(g.x, g.y - 8, "+" + add, { fontFamily: '"IBM Plex Mono", monospace', fontSize: gold ? "20px" : "15px", color: gold ? "#f2c14e" : "#f3ead2", fontStyle: "bold" }).setOrigin(0.5).setDepth(6);
          s.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 600, onComplete: function () { pop.destroy(); } });
          s.tweens.add({ targets: s.table, scaleY: s.table.scaleY * 0.9, duration: 60, yoyo: true });
          g.destroy(); sfx("catch", gold ? 0.7 : 0.4); hud();
        });
        s.advance = function () {
          if (S.state === "title" || S.state === "between") { s.startRound(); }
          else if (S.state === "done") { S.round = 0; S.total = 0; s.startRound(); }
        };
        s.startRound = function () {
          var R = ROUNDS[S.round]; S.state = "play"; S.seats = 0; S.streak = 0; s.left = R.secs; s.acc = 0;
          s.big.setText(""); s.small.setText(""); hud();
        };
        s.endRound = function () {
          var R = ROUNDS[S.round], hit = S.seats >= R.target; S.total += S.seats;
          s.guests.clear(true, true);
          if (S.round < 2) {
            S.state = "between";
            s.big.setText(hit ? "Room made." : "Good hosting.");
            s.small.setText(S.seats + " seats. " + R.label + ".\nTap or Space for the next room.");
            S.round += 1;
          } else {
            S.state = "done";
            s.big.setText("You made room\nfor " + S.seats + ".");
            s.small.setText((S.seats >= 602 ? "That beats the real door count: 602 guests in March 2026." : "The real night in March 2026 had 602 guests.") + "\nCome to the next one, March 1, 2027.\nTap to play again.");
            sfx("stamp", 0.7);
          }
          hud();
        };
        hud();
      },
      update: function (time, dt) {
        var s = this; if (S.state !== "play") return;
        var R = ROUNDS[S.round];
        if (s.cur.left.isDown) s.tx = Math.max(40, s.table.x - 7 * (dt / 16.7));
        if (s.cur.right.isDown) s.tx = Math.min(W - 40, s.table.x + 7 * (dt / 16.7));
        s.table.x += (Phaser.Math.Clamp(s.tx, 50, W - 50) - s.table.x) * 0.35;
        s.table.body.updateFromGameObject();
        s.acc += dt;
        if (s.acc >= R.gap) {
          s.acc = 0; S.spawned += 1;
          var n = (S.round === 2 && Math.random() < 0.35) ? 3 : 1, x0 = 40 + Math.random() * (W - 80);
          for (var i = 0; i < n; i++) {
            var gold = Math.random() < 0.16, x = Phaser.Math.Clamp(x0 + (i - (n - 1) / 2) * 46, 24, W - 24);
            var g = s.guests.create(x, -30 - i * 26, gold ? "gold" : "meeple");
            g.setDisplaySize(gold ? 34 : 32, gold ? 42 : 34); g.body.allowGravity = false; g.setVelocityY(R.fall + Math.random() * 40);
            if (!reduce) s.tweens.add({ targets: g, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1 });
          }
        }
        s.guests.children.each(function (g) { if (g && g.y > H + 30) { g.destroy(); S.streak = 0; } });
        s.left -= dt / 1000;
        s.clock.setText(Math.max(0, Math.ceil(s.left)) + "s  " + R.label);
        s.mult.setText("x" + Math.min(3, 1 + Math.floor(S.streak / 5)));
        if (s.left <= 0) s.endRound();
      }
    };
    new Phaser.Game({ type: Phaser.AUTO, parent: box, width: W, height: H, backgroundColor: "#1d1a3a", audio: { noAudio: true },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, physics: { default: "arcade", arcade: { gravity: { y: 0 } } }, scene: scene });
  }

  function boot() { try { bootDie(); } catch (e) { console.error(e); } try { bootGame(); } catch (e) { console.error(e); } }
  if (document.readyState === "complete") boot(); else window.addEventListener("load", boot);
})();
