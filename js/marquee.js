// Work rows: each card gets a shadow colour (pink, neon green or yellow), and each
// row's cards are cloned so the track loops seamlessly.
const ROW_COLOURS = [
    ['pink', 'neon', 'pink'],
    ['yellow', 'pink'],
];

export function initMarquee({ reduced }) {
    document.querySelectorAll('.marquee__track').forEach((track, row) => {
        const originals = [...track.children];
        const colours = ROW_COLOURS[row] || ROW_COLOURS[0];
        originals.forEach((card, i) => card.classList.add(`work-card--${colours[i % colours.length]}`));
        if (reduced) return;

        const copies = 6;
        for (let i = 1; i < copies; i++) {
            originals.forEach((card) => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                clone.setAttribute('tabindex', '-1');
                track.appendChild(clone);
            });
        }
        track.style.setProperty('--copies', copies);
        track.closest('.marquee').classList.add('is-looping');
    });
}
