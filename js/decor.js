// Floating decor parallax and a small pixel-sparkle pointer trail.
export function initDecor() {
    document.querySelectorAll('[data-speed]').forEach((el) => {
        const speed = parseFloat(el.dataset.speed) || 0.5;
        gsap.to(el, {
            y: () => -window.innerHeight * 0.35 * speed,
            ease: 'none',
            scrollTrigger: {
                trigger: el.closest('section'),
                start: 'top top',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
            },
        });
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        initTrail();
    }
}

function initTrail() {
    const colors = ['#E2458F', '#6FA8F5', '#F2C94C', '#FF9ACB'];
    const pool = Array.from({ length: 14 }, () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'trail');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = '<use href="#i-sparkle"/>';
        document.body.appendChild(svg);
        return svg;
    });

    let index = 0;
    let last = 0;
    let lastX = 0;
    let lastY = 0;
    window.addEventListener('pointermove', (e) => {
        const now = performance.now();
        const moved = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (now - last < 45 || moved < 18) return;
        last = now;
        lastX = e.clientX;
        lastY = e.clientY;

        const el = pool[index++ % pool.length];
        gsap.killTweensOf(el);
        el.style.color = colors[index % colors.length];
        gsap.fromTo(el, {
            x: e.clientX - 7,
            y: e.clientY - 7,
            scale: gsap.utils.random(0.6, 1.2),
            opacity: 1,
        }, {
            x: `+=${gsap.utils.random(-16, 16)}`,
            y: `+=${gsap.utils.random(10, 34)}`,
            scale: 0,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
        });
    }, { passive: true });
}
