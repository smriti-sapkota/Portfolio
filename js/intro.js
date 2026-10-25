import { splitChars } from './split.js';

const SEEN_KEY = 'smriti-intro-seen';

// Name splash: letters pop in, the camera dives into the dot of the "i",
// the screen floods pink and the overlay wipes up to reveal the page.
export function playIntro() {
    const root = document.documentElement;
    const intro = document.querySelector('.intro');
    if (!intro || !root.classList.contains('is-intro')) return Promise.resolve();

    // Scripts arrived in time, so the CSS failsafe is no longer needed
    intro.style.animation = 'none';

    const word = intro.querySelector('.intro__word');
    const fill = intro.querySelector('.intro__fill');
    const skip = intro.querySelector('.intro__skip');
    const chars = splitChars(word);
    const short = readSeen();

    return new Promise((resolve) => {
        const finish = () => {
            intro.remove();
            root.classList.remove('is-intro');
            writeSeen();
            resolve();
        };

        const tl = gsap.timeline();

        tl.from(chars, {
            yPercent: 120,
            scale: 0.3,
            rotation: () => gsap.utils.random(-25, 25),
            opacity: 0,
            duration: short ? 0.4 : 0.75,
            ease: 'back.out(2.2)',
            stagger: short ? 0.03 : 0.07,
        });

        if (!short) {
            // Aim the zoom at the dot of the first "i" so the screen fills with its pink
            tl.add(() => {
                const dotChar = chars[3];
                const w = word.getBoundingClientRect();
                const c = dotChar.getBoundingClientRect();
                const x = c.left + c.width * 0.5 - w.left;
                const y = c.top + c.height * 0.17 - w.top;
                gsap.set(word, { transformOrigin: `${x}px ${y}px` });
            }, '+=0.25')
                .to(word, { scale: 60, duration: 1, ease: 'expo.in' })
                .to(fill, { opacity: 1, duration: 0.25, ease: 'none' }, '-=0.3');
        }

        tl.to(intro, {
            yPercent: -100,
            duration: short ? 0.55 : 0.8,
            ease: 'expo.inOut',
        }, short ? '+=0.15' : '-=0.05');

        // The overlay is aria-hidden, so keyboard users skip with Esc rather than a focusable button
        const onKey = (e) => { if (e.key === 'Escape') tl.progress(1); };
        skip.addEventListener('click', () => tl.progress(1), { once: true });
        window.addEventListener('keydown', onKey);
        tl.eventCallback('onComplete', () => {
            window.removeEventListener('keydown', onKey);
            finish();
        });
    });
}

function readSeen() {
    try {
        return sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
        return false;
    }
}

function writeSeen() {
    try {
        sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
        // Storage can be blocked; the full intro will simply play again
    }
}
