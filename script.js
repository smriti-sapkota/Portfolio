// Entry point. GSAP, ScrollTrigger and Lenis load as deferred classic scripts
// before this module runs, so they are available as globals here.
import { splitChars } from './js/split.js';
import { playIntro } from './js/intro.js';
import { initRibbon } from './js/ribbon.js';
import { initReveals, playHero } from './js/reveal.js';
import { initNav } from './js/nav.js';
import { initDecor } from './js/decor.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

document.querySelectorAll('[data-split]').forEach(splitChars);

let lenis = null;

if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    if (!reduceMotion && typeof window.Lenis !== 'undefined') {
        lenis = new Lenis({ lerp: 0.11 });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }
}

initNav({ lenis });
initCopyButtons();

if (hasGsap && !reduceMotion) {
    initReveals();
    initDecor();
    initRibbon({ reduced: false });

    lenis?.stop();
    playIntro().then(() => {
        lenis?.start();
        playHero();
        ScrollTrigger.refresh();
    });
} else {
    document.documentElement.classList.remove('is-intro');
    initRibbon({ reduced: true });
}

function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach((button) => {
        const status = button.parentElement.querySelector('.copy-status');
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy);
                if (status) status.textContent = 'copied! ♡';
            } catch {
                if (status) status.textContent = 'press ctrl+c to copy';
            }
            setTimeout(() => { if (status) status.textContent = ''; }, 2200);
        });
    });
}
