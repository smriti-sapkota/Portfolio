// Entry point. GSAP, ScrollTrigger and Lenis load as deferred classic scripts
// before this module runs, so they are available as globals here.
import { splitChars } from './js/split.js';
import { playIntro } from './js/intro.js';
import './js/scroll_snake.js';
import { initReveals, playHero } from './js/reveal.js';
import { initNav } from './js/nav.js';
import { initDecor } from './js/decor.js';
import { initMarquee } from './js/marquee.js';
import { initMusic } from './js/music.js';
import { initButterfly } from './js/butterfly.js';

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

initMarquee({ reduced: reduceMotion });
initNav({ lenis });
initMusic();

if (hasGsap && !reduceMotion) {
    initReveals();
    initDecor();

    lenis?.stop();
    playIntro().then(() => {
        lenis?.start();
        playHero();
        initButterfly();
        ScrollTrigger.refresh();
    });
} else {
    document.documentElement.classList.remove('is-intro');
}

