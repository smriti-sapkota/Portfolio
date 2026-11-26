// A little butterfly that flutters around the page, landing on flowers, text and
// other components for a while before taking off again.
export function initButterfly() {
    const SIZE = 36;
    const SELECTORS = {
        flower: '.deco[src*="flower"]',
        text: 'h1, h2, h3, .about__lead, .pixel-bubble',
        component: '.sticker, .btn, .quickfact, .nav a, .window, .feature, .footer a',
    };
    const WEIGHTS = [['flower', 0.35], ['text', 0.35], ['component', 0.3]];

    const root = document.createElement('div');
    root.className = 'bfly';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="bfly__flap"><img src="assets/img/pixel_art/butterfly.png" alt="" width="64" height="64"></div>';
    document.body.appendChild(root);
    const flap = root.firstElementChild;

    const rnd = (a, b) => a + Math.random() * (b - a);
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const easeOut = (t) => 1 - Math.pow(1 - t, 2.2);

    let x = -80;
    let y = rnd(innerHeight * 0.2, innerHeight * 0.7);
    let lean = 0;
    let state = 'fly';
    let fly = null;
    let rest = null;
    let flapPhase = 0;
    let last = performance.now();

    function visible(el) {
        const r = el.getBoundingClientRect();
        if (r.width < 16 || r.height < 8) return null;
        if (r.top < 70 || r.bottom > innerHeight - 60) return null;
        if (parseFloat(getComputedStyle(el).opacity) < 0.6) return null;
        return r;
    }

    function chooseKind() {
        let roll = Math.random();
        for (const [kind, w] of WEIGHTS) {
            if ((roll -= w) < 0) return kind;
        }
        return 'text';
    }

    function pickTarget(exclude) {
        const order = [chooseKind(), 'flower', 'text', 'component'];
        for (const kind of order) {
            const list = [...document.querySelectorAll(SELECTORS[kind])].filter((el) => el !== exclude && visible(el));
            if (list.length) {
                return { el: list[Math.floor(Math.random() * list.length)], kind, fx: rnd(0.12, 0.88) };
            }
        }
        return null;
    }

    // Where the butterfly's centre should be when sitting on this target (viewport px).
    function targetPos(t) {
        const r = visible(t.el);
        if (!r) return null;
        if (t.kind === 'flower') return { x: r.left + r.width / 2, y: r.top + r.height * 0.35 };
        let box = r;
        if (t.kind === 'text') {
            const range = document.createRange();
            range.selectNodeContents(t.el);
            const tr = range.getBoundingClientRect();
            if (tr.width > 10) box = tr;
        }
        return { x: box.left + box.width * t.fx, y: box.top - SIZE * 0.22 };
    }

    function takeOff() {
        const free = Math.random() < 0.3;
        const target = free ? null : pickTarget(rest && rest.target.el);
        let from = { x, y };
        let to;
        if (target) {
            to = targetPos(target);
        } else {
            to = { x: rnd(40, innerWidth - 40), y: rnd(90, innerHeight - 100) };
        }
        if (!to) { to = { x: rnd(40, innerWidth - 40), y: rnd(90, innerHeight - 100) }; }
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        fly = {
            t0: performance.now(),
            dur: Math.max(1.2, dist / rnd(90, 140)) * 1000,
            from,
            target,
            to,
            arc: rnd(-1, 1) * Math.min(220, dist * 0.45),
            phase: rnd(0, 6.28),
        };
        state = 'fly';
    }

    function land(target) {
        state = 'rest';
        rest = { target, until: performance.now() + rnd(2500, 7000) };
    }

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        let vx = 0;
        let flapRate;
        let flapMin;

        if (state === 'fly' && fly) {
            let end = fly.target ? targetPos(fly.target) : fly.to;
            if (!end) { // target scrolled away mid-flight: wander on
                fly.target = null;
                end = fly.to;
            }
            fly.to = end;
            const u = Math.min(1, (now - fly.t0) / fly.dur);
            const p = easeInOut(u);
            const dx = end.x - fly.from.x;
            const dy = end.y - fly.from.y;
            const len = Math.hypot(dx, dy) || 1;
            const arc = Math.sin(Math.PI * u) * fly.arc;
            const calm = 1 - easeOut(Math.max(0, (u - 0.75) / 0.25)); // settle gently near the landing spot
            const wobble = Math.sin(now / 1000 * 1.6 + fly.phase) * 7 * calm;
            const bob = Math.sin(now / 1000 * 2.4 + fly.phase) * 4 * calm;
            const nx = lerp(fly.from.x, end.x, p) + (-dy / len) * arc + wobble;
            const ny = lerp(fly.from.y, end.y, p) + (dx / len) * arc + bob;
            vx = (nx - x) / Math.max(dt, 0.001);
            x = nx;
            y = ny;
            flapRate = 2.6;
            flapMin = 0.4;
            if (u >= 1) {
                if (fly.target) land(fly.target);
                else if (Math.random() < 0.5) takeOff();
                else land(pickTarget(null) || { el: document.body, kind: 'free', fx: 0.5, free: true });
            }
        } else if (state === 'rest' && rest) {
            const end = rest.target.free ? null : targetPos(rest.target);
            if (end) { x = end.x; y = end.y; }
            flapRate = 0.7;
            flapMin = 0.82;
            if (!end || now > rest.until) takeOff();
        } else {
            takeOff();
        }

        // lean into the direction of travel, upright when resting
        const targetLean = state === 'fly' ? Math.max(-28, Math.min(28, vx * 0.04)) : 0;
        lean += (targetLean - lean) * Math.min(1, dt * 3);

        flapPhase += dt * flapRate * Math.PI * 2;
        const s = flapMin + (1 - flapMin) * (0.5 + 0.5 * Math.cos(flapPhase));
        flap.style.transform = `scaleX(${s.toFixed(3)})`;
        root.style.transform = `translate(${(x - SIZE / 2).toFixed(1)}px, ${(y - SIZE / 2).toFixed(1)}px) rotate(${lean.toFixed(1)}deg)`;
        requestAnimationFrame(frame);
    }

    takeOff();
    requestAnimationFrame(frame);
}
