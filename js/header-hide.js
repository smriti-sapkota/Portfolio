// Inner pages: the navbar hides while scrolling down and returns when scrolling up.
const header = document.querySelector('.site-header');
if (header) {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const goingDown = y > lastY;
        const focusInside = header.contains(document.activeElement);
        header.classList.toggle('is-hidden', goingDown && y > 120 && !focusInside);
        lastY = y;
    }, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}
