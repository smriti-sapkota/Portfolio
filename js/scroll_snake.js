/*!
 * scroll-snake.js — giant pink scroll-driven snake (SVG + GSAP ScrollTrigger)
 *
 * USAGE: add ONE line before </body> (or in <head> with `defer`):
 *     <script src="scroll-snake.js"></script>
 *
 * - Loads GSAP + ScrollTrigger from cdnjs automatically if your page doesn't already have them.
 * - Injects its own fixed SVG layer (z-index:-1, pointer-events:none). Touches nothing else.
 * - Fully deterministic: the trajectory is hand-authored (no Math.random), and scroll position
 *   is the ONLY thing that moves it. Scroll up = exact reverse, stop = instant freeze.
 *
 * NOTE: it sits behind everything. If one of your sections has an opaque background colour,
 * it will cover the snake; give that section a transparent background (or set BEHIND:false
 * below to draw the snake above content instead).
 */
(function () {
  "use strict";

  /* ───────────── CONFIG ───────────── */
  var CONFIG = {
    COLOR: "#FF69C9",
    BORDER_COLOR: "#E0369F",   // outline colour around the body
    BORDER: 0.05,              // outline thickness as a fraction of head width (per side)
    BEHIND: true,              // true = z-index -1 (behind page content)
    REDUCED_MOTION: "static",  // "static" = still snake, no scroll motion | "hide" = no snake
    GSAP_URL: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
    ST_URL: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
  };

  /* ───────────── TRAJECTORY (deterministic) ─────────────
     Points are in viewport units: x = fraction of width, y = fraction of height.
     Values outside 0..1 are OFF-SCREEN, which is how the snake leaves the viewport,
     disappears completely, and re-enters from another side. */
  // Full circle of points; dir = +1 clockwise on screen, -1 counter-clockwise
  function loop(cx, cy, r, a0, dir) {
    var out = [], n = 7;
    for (var i = 0; i <= n; i++) {
      var a = a0 + dir * 2 * Math.PI * (i / n);
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
  }

  var PTS = [].concat(
    // 1: enters from the LEFT edge low on screen, one long rolling swell, climbs the right side
    [[-0.40, 0.80], [-0.10, 0.74], [0.20, 0.84], [0.50, 0.98], [0.80, 0.90],
     [1.00, 0.62], [1.00, 0.34]],
    // 2: figure-eight in the upper half (two opposite loops)
    loop(0.74, 0.24, 0.13, 0.2, -1).slice(1),
    [[0.50, 0.36], [0.36, 0.30]],
    loop(0.22, 0.26, 0.12, 0.0, 1).slice(1),
    // 3: drops off the left edge and makes a huge detour BELOW the page (vanishes completely)
    [[0.05, 0.58], [-0.18, 0.84], [-0.45, 1.12], [-0.30, 1.50], [0.10, 1.72],
     [0.70, 1.70], [1.20, 1.45], [1.38, 1.05]],
    // 4: re-enters from the RIGHT edge, long lazy wave leftwards, then a steep climb out the top
    [[1.25, 0.68], [1.00, 0.52], [0.72, 0.60], [0.46, 0.52], [0.22, 0.62],
     [0.04, 0.48], [-0.02, 0.20], [0.20, 0.00], [0.50, -0.15], [0.82, -0.42],
     [1.10, -0.85], [1.30, -1.30]]
  );

  /* ───────────── HELPERS ───────────── */
  var NS = "http://www.w3.org/2000/svg";
  var state = { W: 0, H: 0, L: 0, body: 0, p: 0 };
  var svg, layers = [], face, tween;
  var LAYERS = 9, TAIL_WIDTH = 0.38;   // body tapers from 100% (head) to 38% (tail)

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Uniform Catmull-Rom -> cubic Bézier path string, scaled to the current viewport
  function buildD(W, H) {
    var n = PTS.length, d = "";
    function P(i) { i = clamp(i, 0, n - 1); return [PTS[i][0] * W, PTS[i][1] * H]; }
    var s = P(0);
    d = "M" + s[0].toFixed(1) + " " + s[1].toFixed(1);
    for (var i = 0; i < n - 1; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += "C" +
        (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " +
        p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }

  function layout() {
    var W = window.innerWidth, H = window.innerHeight;
    state.W = W; state.H = H;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var d = buildD(W, H), base = clamp(W * 0.17 + 20, 70, 300);
    var bw = Math.max(3, base * CONFIG.BORDER);
    state.base = base;
    for (var i = 0; i < layers.length; i++) {
      layers[i].el.setAttribute("d", d);
      layers[i].el.setAttribute("stroke-width", (base * layers[i].w + (layers[i].outline ? 2 * bw : 0)).toFixed(1));
    }
    face.eyes.forEach(function (e) {
      e.r.setAttribute("rx", base * 0.13); e.r.setAttribute("ry", base * 0.15);
      e.r.setAttribute("stroke-width", bw * 0.8);
      e.p.setAttribute("r", base * 0.07); e.p.setAttribute("cx", base * 0.04);
    });
    state.L = layers[0].el.getTotalLength();
    state.body = 1.5 * W + 0.9 * H;   // visible snake length
    render(state.p);
  }

  // Head advances along the path; body is the trailing slice of the SAME path.
  function render(p) {
    state.p = p;
    var total = state.L + state.body;       // head travels until the tail has also left
    var head = p * total;
    var b = Math.min(state.L, head);
    for (var i = 0; i < layers.length; i++) {
      var ly = layers[i];
      // narrower layers reach further back along the body => smooth taper toward the tail
      var a = Math.max(0, head - state.body * ly.c);
      var len = b - a;
      if (len < 1) { ly.el.style.visibility = "hidden"; continue; }
      ly.el.style.visibility = "visible";
      ly.el.style.strokeDasharray = len + " " + (state.L + 1000);
      ly.el.style.strokeDashoffset = -a;
    }
    updateFace(head, b);
  }

  // Face: everything is a pure function of how far the head has travelled (scroll-driven, reversible)
  function updateFace(head, b) {
    var base = state.base, g = face.g;
    if (b < 2) { g.style.visibility = "hidden"; return; }
    g.style.visibility = "visible";
    var L = state.L, path = layers[0].el;
    var p1 = path.getPointAtLength(b), p0 = path.getPointAtLength(Math.max(0, b - 8));
    var ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
    var ph = head / (base * 1.6);                         // phase: advances only with scroll
    var wob = Math.sin(ph * 1.3) * 5;                     // slight head sway (degrees)
    g.setAttribute("transform", "translate(" + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + ") rotate(" + (ang + wob).toFixed(1) + ")");

    // blink: brief squash of the eyes once per cycle
    var f = ph / 5 - Math.floor(ph / 5);
    var blink = f > 0.92 ? 1 - Math.sin((f - 0.92) / 0.08 * Math.PI) * 0.92 : 1;
    var ex = base * 0.12, ey = base * 0.23;
    face.eyes[0].g.setAttribute("transform", "translate(" + ex + " " + (-ey) + ") scale(1 " + blink.toFixed(2) + ")");
    face.eyes[1].g.setAttribute("transform", "translate(" + ex + " " + ey + ") scale(1 " + blink.toFixed(2) + ")");

    // tongue flick: darts out and back in, repeating as the snake travels
    var t = Math.sin(ph * 2.1); t = t > 0 ? t * t * t : 0;
    var ext = t * base * 0.5;
    if (ext < 2) { face.tongue.style.visibility = "hidden"; return; }
    face.tongue.style.visibility = "visible";
    var x0 = base * 0.42, x1 = base * 0.5 + ext, fk = Math.min(ext, base * 0.14);
    face.tongue.setAttribute("d",
      "M" + x0 + " 0L" + x1 + " 0M" + x1 + " 0L" + (x1 + fk) + " " + (-fk * 0.55) +
      "M" + x1 + " 0L" + (x1 + fk) + " " + (fk * 0.55));
    face.tongue.setAttribute("stroke-width", Math.max(2.5, base * 0.045));
  }

  function injectSVG() {
    svg = document.createElementNS(NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("data-scroll-snake", "");
    var s = svg.style;
    s.position = "fixed"; s.top = "0"; s.left = "0";
    s.width = "100%"; s.height = "100%";
    s.overflow = "hidden"; s.pointerEvents = "none";
    s.zIndex = CONFIG.BEHIND ? "-1" : "2147483000";
    s.display = "block"; s.margin = "0"; s.padding = "0"; s.border = "0";
    s.contain = "strict";

    // Pass 1: outline layers (all underneath). Pass 2: fill layers on top, so the border
    // only shows around the outer silhouette. Widest layer = head end, narrowest = whole body.
    [true, false].forEach(function (outline) {
      for (var i = LAYERS - 1; i >= 0; i--) {
        var t = i / (LAYERS - 1);
        var el = document.createElementNS(NS, "path");
        el.setAttribute("fill", "none");
        el.setAttribute("stroke", outline ? CONFIG.BORDER_COLOR : CONFIG.COLOR);
        el.setAttribute("stroke-linecap", "round");
        el.setAttribute("stroke-linejoin", "round");
        el.style.visibility = "hidden";
        svg.appendChild(el);
        layers.push({ el: el, outline: outline, w: 1 - (1 - TAIL_WIDTH) * t, c: Math.pow((i + 1) / LAYERS, 0.85) });
      }
    });

    // Face (head-local coords: +x = direction of travel)
    var g = document.createElementNS(NS, "g");
    g.style.visibility = "hidden";
    var tongue = document.createElementNS(NS, "path");
    tongue.setAttribute("fill", "none");
    tongue.setAttribute("stroke", "#D81B60");
    tongue.setAttribute("stroke-linecap", "round");
    tongue.setAttribute("stroke-linejoin", "round");
    g.appendChild(tongue);
    var eyes = [0, 1].map(function () {
      var eg = document.createElementNS(NS, "g");
      var white = document.createElementNS(NS, "ellipse");
      white.setAttribute("fill", "#fff");
      white.setAttribute("stroke", CONFIG.BORDER_COLOR);
      var pupil = document.createElementNS(NS, "circle");
      pupil.setAttribute("fill", "#2a0a1f");
      eg.appendChild(white); eg.appendChild(pupil); g.appendChild(eg);
      return { g: eg, r: white, p: pupil };
    });
    face = { g: g, tongue: tongue, eyes: eyes };
    svg.appendChild(g);
    document.body.appendChild(svg);
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var el = document.createElement("script");
      el.src = src; el.async = false;
      el.onload = res; el.onerror = function () { rej(new Error("Failed to load " + src)); };
      document.head.appendChild(el);
    });
  }

  function ensureGSAP() {
    var p = window.gsap ? Promise.resolve() : loadScript(CONFIG.GSAP_URL);
    return p.then(function () {
      return window.ScrollTrigger ? null : loadScript(CONFIG.ST_URL);
    });
  }

  /* ───────────── INIT ───────────── */
  function start() {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mq.matches) {
      if (CONFIG.REDUCED_MOTION === "hide") return;
      injectSVG(); layout();
      render(0.42); // fixed, non-animated pose
      var rt;
      window.addEventListener("resize", function () {
        clearTimeout(rt); rt = setTimeout(function () { layout(); render(0.42); }, 120);
      });
      return;
    }

    ensureGSAP().then(function () {
      var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      injectSVG();
      layout();

      // Scroll is the ONLY driver. scrub:true = zero smoothing, so stopping freezes instantly
      // and scrolling up plays the identical states in reverse.
      var proxy = { p: 0 };
      tween = gsap.to(proxy, {
        p: 1,
        ease: "none",
        onUpdate: function () { render(proxy.p); },
        scrollTrigger: {
          trigger: document.documentElement,
          start: 0,
          end: "max",
          scrub: true,
          invalidateOnRefresh: false
        }
      });

      // Rebuild geometry on resize (same deterministic path, same progress).
      var timer, lastW = window.innerWidth, lastH = window.innerHeight;
      window.addEventListener("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var w = window.innerWidth, h = window.innerHeight;
          // ignore small height-only changes (mobile URL bar show/hide)
          if (w === lastW && Math.abs(h - lastH) < 150) return;
          lastW = w; lastH = h;
          layout();
        }, 120);
      });

      // If the user switches reduced-motion on later, stop driving the snake.
      var onChange = function (e) {
        if (e.matches) {
          if (tween && tween.scrollTrigger) tween.scrollTrigger.kill();
          if (tween) tween.kill();
          render(0.42);
        }
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }).catch(function (err) {
      if (window.console) console.warn("[scroll-snake]", err.message);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();