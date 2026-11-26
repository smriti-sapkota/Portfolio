// One deterministic brushstroke anchored at the left edge; scrolling reveals its tip.
const SVG_NS = 'http://www.w3.org/2000/svg';
const BRUSH_COLOR = '#FF69C9';

export function initRibbon({ reduced }) {
    const host = document.querySelector('.ribbon');
    const page = document.querySelector('.page');
    if (!host || !page) return;

    const svg = document.createElementNS(SVG_NS, 'svg');
    const brush = document.createElementNS(SVG_NS, 'path');
    svg.setAttribute('aria-hidden', 'true');
    brush.setAttribute('class', 'ribbon__band');
    brush.setAttribute('stroke', BRUSH_COLOR);
    svg.appendChild(brush);
    host.appendChild(svg);

    let width = 0;
    let height = 0;
    let pathLength = 0;
    let resizeTimer;

    function makeOrganicPath() {
        const x = (ratio) => (width * ratio).toFixed(1);
        const y = (ratio) => (height * ratio).toFixed(1);

        return [
            // Curve 1: upper-left entry, shallow center wave, right exit.
            `M${x(-0.04)},${y(0.08)}`,
            `C${x(0.08)},${y(0.12)} ${x(0.12)},${y(0.25)} ${x(0.25)},${y(0.29)}`,
            `C${x(0.38)},${y(0.33)} ${x(0.46)},${y(0.28)} ${x(0.57)},${y(0.34)}`,
            `C${x(0.68)},${y(0.40)} ${x(0.70)},${y(0.48)} ${x(0.80)},${y(0.44)}`,
            `C${x(0.90)},${y(0.40)} ${x(0.98)},${y(0.38)} ${x(1.04)},${y(0.42)}`,

            // Curve 2: right entry, broad leftward drop, left exit.
            `M${x(1.04)},${y(0.54)}`,
            `C${x(0.91)},${y(0.53)} ${x(0.83)},${y(0.57)} ${x(0.72)},${y(0.62)}`,
            `C${x(0.58)},${y(0.68)} ${x(0.42)},${y(0.70)} ${x(0.29)},${y(0.77)}`,
            `C${x(0.18)},${y(0.83)} ${x(0.12)},${y(0.90)} ${x(-0.04)},${y(0.90)}`,

            // Curve 3: left entry, shallow dip, right exit.
            `M${x(-0.04)},${y(1.00)}`,
            `C${x(0.08)},${y(0.99)} ${x(0.13)},${y(0.91)} ${x(0.25)},${y(0.94)}`,
            `C${x(0.37)},${y(0.97)} ${x(0.40)},${y(1.04)} ${x(0.54)},${y(1.04)}`,
            `C${x(0.69)},${y(1.04)} ${x(0.81)},${y(1.04)} ${x(1.04)},${y(1.05)}`,

            // Curve 4: bottom-left diagonal rise, broad arch, right exit.
            `M${x(-0.04)},${y(1.42)}`,
            `C${x(0.12)},${y(1.30)} ${x(0.26)},${y(1.18)} ${x(0.42)},${y(1.11)}`,
            `C${x(0.57)},${y(1.04)} ${x(0.66)},${y(1.08)} ${x(0.76)},${y(1.13)}`,
            `C${x(0.86)},${y(1.18)} ${x(0.96)},${y(1.22)} ${x(1.05)},${y(1.22)}`,
        ].join(' ');
    }

    function reveal(progress) {
        brush.style.strokeDashoffset = `${(1 - progress) * pathLength}`;
    }

    function build() {
        width = page.clientWidth;
        height = page.scrollHeight;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        brush.setAttribute('d', makeOrganicPath());
        pathLength = brush.getTotalLength();
        brush.style.strokeDasharray = `${pathLength}`;
        reveal(reduced ? 1 : 0);
    }

    build();

    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            build();
            if (!reduced && typeof window.ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        }, 120);
    }).observe(page);

    if (reduced || typeof window.ScrollTrigger === 'undefined') return;

    window.addEventListener('scroll', ScrollTrigger.update, { passive: true });

    ScrollTrigger.create({
        trigger: page,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: (self) => reveal(self.progress),
    });
}
