// Dino mascot (ported from the page-mascot package to plain JS).
// It follows the pointer using the 3x3 "directions" sheet and reacts to clicks
// with the 3x3 "reactions" sheet.
const DIRECTIONS = ['up-left', 'up', 'up-right', 'left', 'center', 'right', 'down-left', 'down', 'down-right'];
const REACTIONS = ['blink', 'heart', 'sparkle', 'surprised', 'wink', 'bashful', 'sleepy', 'dizzy', 'delighted'];
const CLOCKWISE = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
const SECTOR = (Math.PI * 2) / CLOCKWISE.length;
const HYSTERESIS = 0.12;
const DEAD_ZONE = 70;
const PAYOFFS = ['heart', 'sparkle', 'delighted'];
const BOOP_PAYOFF = 120;
const BOOP_END = 560;
const SQUASH_MS = 420;
const DIZZY_AFTER = 4;
const DIZZY_WINDOW = 1600;
const DIZZY_END = 1100;
const SQUASH = [
    { transform: 'scale(1, 1)', easing: 'ease-in' },
    { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
    { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
    { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
    { transform: 'scale(1, 1)' },
];

const cellPos = (i) => `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function initDino() {
    document.querySelectorAll('[data-dino]').forEach(mount);
}

function mount(host) {
    const { directions, reactions } = host.dataset;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dino';
    button.setAttribute('aria-label', 'Boop the dino');

    const squash = document.createElement('span');
    squash.className = 'dino__squash';
    const makeLayer = (url) => {
        const layer = document.createElement('span');
        layer.className = 'dino__layer';
        layer.style.backgroundImage = `url(${url})`;
        squash.appendChild(layer);
        return layer;
    };
    const dirLayer = makeLayer(directions);
    const reactLayer = makeLayer(reactions);
    button.appendChild(squash);
    host.appendChild(button);

    let direction = 'center';
    let reaction = null;
    let locked = false;
    const render = () => {
        dirLayer.style.backgroundPosition = cellPos(DIRECTIONS.indexOf(direction));
        dirLayer.style.opacity = reaction ? 0 : 1;
        reactLayer.style.backgroundPosition = cellPos(REACTIONS.indexOf(reaction ?? 'blink'));
        reactLayer.style.opacity = reaction ? 1 : 0;
    };
    render();

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let sector = -1;
        let pointer = null;
        const aim = () => {
            if (!pointer || locked) return;
            const box = button.getBoundingClientRect();
            const dx = pointer.x - (box.left + box.width / 2);
            const dy = pointer.y - (box.top + box.height / 2);
            if (Math.hypot(dx, dy) < DEAD_ZONE) {
                sector = -1;
                direction = 'center';
                render();
                return;
            }
            const angle = Math.atan2(dy, dx);
            if (sector !== -1 && Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) return;
            sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
            direction = CLOCKWISE[sector];
            render();
        };
        window.addEventListener('pointermove', (e) => {
            pointer = { x: e.clientX, y: e.clientY };
            aim();
        }, { passive: true });
        window.addEventListener('scroll', aim, { passive: true });
    }

    let timers = [];
    const boops = { count: 0, at: 0 };
    const later = (ms, next) => timers.push(setTimeout(() => { reaction = next; render(); }, ms));

    host.dino = {
        setDirection(name) { direction = name; render(); },
        setReaction(name) { reaction = name; render(); },
        lock(value) {
            locked = value;
            if (!value) { direction = 'center'; reaction = null; render(); }
        },
        bounce() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            squash.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' });
        },
    };

    button.addEventListener('click', () => {
        if (locked) return;
        timers.forEach(clearTimeout);
        timers = [];
        const now = Date.now();
        boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1;
        boops.at = now;
        if (boops.count >= DIZZY_AFTER) {
            boops.count = 0;
            reaction = 'dizzy';
            render();
            later(DIZZY_END, null);
        } else {
            reaction = 'blink';
            render();
            later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
            later(BOOP_END, null);
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        squash.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' });
    });
}
