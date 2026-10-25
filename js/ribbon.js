// The pink ribbon: one zigzag path behind the sections that draws itself
// as you scroll, with a bow riding its leading tip.
const SVG_NS = 'http://www.w3.org/2000/svg';
const SAMPLES = 400;

export function initRibbon({ reduced }) {
    const host = document.querySelector('.ribbon');
    const page = document.querySelector('.page');
    if (!host || !page) return;

    const svg = document.createElementNS(SVG_NS, 'svg');
    const layers = ['ribbon__edge', 'ribbon__band', 'ribbon__sheen'].map((cls) => {
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('class', cls);
        svg.appendChild(p);
        return p;
    });
    const [edge, band, sheen] = layers;

    const bow = document.createElementNS(SVG_NS, 'g');
    bow.setAttribute('class', 'ribbon__bow');
    const bowUse = document.createElementNS(SVG_NS, 'use');
    bowUse.setAttribute('href', '#i-bow');
    bow.appendChild(bowUse);
    svg.appendChild(bow);
    host.appendChild(svg);

    let total = 0;
    let lookup = [];      // [{ y, len }] sampled along the path; y only increases
    let width = 0;
    let stroke = 0;
    let current = 0;
    let target = 0;
    let pageTop = 0;

    function build() {
        width = page.clientWidth;
        const height = page.scrollHeight;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        pageTop = page.getBoundingClientRect().top + window.scrollY;

        const narrow = width < 700;
        stroke = Math.max(narrow ? 34 : 48, Math.min(140, width * 0.085));
        const left = narrow ? -0.12 * width : -0.04 * width;
        const right = narrow ? 1.12 * width : 1.04 * width;

        // Bends sit at the boundaries between sections, alternating sides
        const sections = [...page.querySelectorAll(':scope > section')];
        const hero = sections[0];
        const points = [{ x: right, y: hero.offsetTop + hero.offsetHeight * 0.72 }];
        sections.slice(1).forEach((section, i) => {
            points.push({
                x: i % 2 === 0 ? left : right,
                y: section.offsetTop + Math.min(section.offsetHeight * 0.45, 420),
            });
        });
        points.push({ x: width * 0.5, y: height - stroke * 0.6 });

        // Horizontal tangents at every point keep y monotonic and the sweeps wide
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const pull = Math.abs(b.x - a.x) * 0.55;
            const dir = Math.sign(b.x - a.x) || 1;
            d += ` C${a.x + dir * pull},${a.y} ${b.x - dir * pull},${b.y} ${b.x},${b.y}`;
        }

        layers.forEach((p) => p.setAttribute('d', d));
        edge.style.strokeWidth = stroke;
        band.style.strokeWidth = stroke * 0.86;
        sheen.style.strokeWidth = stroke * 0.18;
        edge.setAttribute('transform', `translate(0 ${stroke * 0.1})`);
        sheen.setAttribute('transform', `translate(0 ${-stroke * 0.2})`);

        total = band.getTotalLength();
        lookup = [];
        for (let i = 0; i <= SAMPLES; i++) {
            const len = (total * i) / SAMPLES;
            lookup.push({ y: band.getPointAtLength(len).y, len });
        }

        if (reduced) {
            current = total;
            layers.forEach((p) => { p.style.strokeDasharray = 'none'; });
        } else {
            layers.forEach((p) => { p.style.strokeDasharray = `${total} ${total + stroke * 2}`; });
            updateTarget();
            current = target;
        }
        render(true);
    }

    // Path length whose point is at a given page y
    function lengthAtY(y) {
        if (y <= lookup[0].y) return 0;
        const last = lookup[lookup.length - 1];
        if (y >= last.y) return total;
        let lo = 0;
        let hi = lookup.length - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (lookup[mid].y < y) lo = mid; else hi = mid;
        }
        const a = lookup[lo];
        const b = lookup[hi];
        const t = (y - a.y) / (b.y - a.y || 1);
        return a.len + (b.len - a.len) * t;
    }

    function updateTarget() {
        // The tip leads a little below the middle of the viewport
        const tipY = window.scrollY + window.innerHeight * 0.62 - pageTop;
        target = lengthAtY(tipY);
    }

    let lastDrawn = -1;
    function render(force = false) {
        if (!force && Math.abs(current - lastDrawn) < 0.5) return;
        lastDrawn = current;

        const visible = current > 1;
        svg.style.visibility = visible ? 'visible' : 'hidden';
        if (!reduced) {
            const offset = total - current;
            layers.forEach((p) => { p.style.strokeDashoffset = offset; });
        }

        // Bow at the tip, rotated along the path
        const len = Math.max(0.01, Math.min(current, total));
        const p = band.getPointAtLength(len);
        const q = band.getPointAtLength(Math.max(0, len - 2));
        // Keep the bow mostly upright, just leaning into the direction of travel
        const lean = (Math.atan2(p.y - q.y, Math.abs(p.x - q.x)) * 180) / Math.PI;
        const angle = Math.sign(p.x - q.x || 1) * lean * 0.3;
        const size = stroke * 1.5;
        bowUse.setAttribute('width', size);
        bowUse.setAttribute('height', size * 0.83);
        bowUse.setAttribute('x', -size / 2);
        bowUse.setAttribute('y', -size * 0.42);
        bow.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
    }

    build();

    let resizeTimer;
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 120);
    }).observe(page);

    if (reduced) return;

    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget);
    gsap.ticker.add(() => {
        // Ease toward the target so the ribbon glides like satin rather than snapping
        current += (target - current) * 0.12;
        if (Math.abs(target - current) < 0.2) current = target;
        render();
    });
}
