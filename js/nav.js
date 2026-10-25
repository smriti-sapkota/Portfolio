// Header: gains a background once scrolled, hides while scrolling down,
// highlights the section in view, and routes anchor clicks through Lenis.
export function initNav({ lenis }) {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastY = window.scrollY;
    const onScroll = () => {
        const y = window.scrollY;
        header.classList.toggle('is-scrolled', y > 40);
        const goingDown = y > lastY;
        const focusInside = header.contains(document.activeElement);
        header.classList.toggle('is-hidden', goingDown && y > 160 && !focusInside);
        lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    onScroll();

    const links = [...header.querySelectorAll('.nav a')];
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const link = byId.get(entry.target.id);
            if (!link) return;
            if (entry.isIntersecting) {
                links.forEach((a) => {
                    a.classList.remove('is-active');
                    a.removeAttribute('aria-current');
                });
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'true');
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
    });

    if (!lenis) return;
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href');
            const target = id === '#' ? null : document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
            // Move focus for keyboard and screen-reader users
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
            history.replaceState(null, '', id);
        });
    });
}
