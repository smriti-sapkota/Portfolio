// Scroll reveals and the hero entrance. Initial hidden states are only applied
// here, so the page stays fully visible if scripts fail.

export function initReveals() {
    // Hero pieces wait behind the intro until playHero()
    gsap.set('.hero .line__inner', { yPercent: 110 });
    gsap.set('.hero .chip', { '--chip': 0 });
    gsap.set('.hero .sticker-text .char', { yPercent: 60, scale: 0.4, opacity: 0 });
    gsap.set(['.hero__hello', '.hero__sub', '.hero__cta'], { y: 24, opacity: 0 });
    gsap.set('.hero .sticker', { y: 140, opacity: 0, rotation: () => gsap.utils.random(-30, 30) });
    gsap.set('.hero .deco', { scale: 0, opacity: 0 });
    const scribble = document.querySelector('.scribble path');
    if (scribble) {
        const len = scribble.getTotalLength();
        gsap.set(scribble, { strokeDasharray: len, strokeDashoffset: len });
    }

    // Section titles: letters bounce in
    document.querySelectorAll('.section__title, .footer__title').forEach((title) => {
        gsap.from(title.querySelectorAll('.char'), {
            yPercent: 80,
            rotation: () => gsap.utils.random(-20, 20),
            scale: 0.5,
            opacity: 0,
            duration: 0.7,
            ease: 'back.out(2.4)',
            stagger: 0.045,
            scrollTrigger: { trigger: title, start: 'top 85%', once: true },
        });
    });

    document.querySelectorAll('.section__head .pixel-bubble').forEach((bubble) => {
        gsap.from(bubble, {
            scale: 0,
            rotation: -12,
            transformOrigin: '0% 100%',
            duration: 0.6,
            ease: 'back.out(3)',
            scrollTrigger: { trigger: bubble, start: 'top 88%', once: true },
        });
    });

    // Cards and text rise in, batched so rows stagger together
    gsap.set('[data-reveal]', { y: 48, opacity: 0 });
    ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.1,
            clearProps: 'transform,opacity',
        }),
    });

    // Window art drifts slightly inside its frame while scrolling
    document.querySelectorAll('.window__media .doodle, .feature__art .doodle').forEach((art) => {
        gsap.fromTo(art, { yPercent: 10, rotation: -3 }, {
            yPercent: -10,
            rotation: 3,
            ease: 'none',
            scrollTrigger: { trigger: art.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
    });
}

export function playHero() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__hello', { y: 0, opacity: 1, duration: 0.6 })
        .to('.hero .line__inner', { yPercent: 0, duration: 1, stagger: 0.1 }, '<0.05')
        .to('.hero .sticker-text .char', {
            yPercent: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2.6)', stagger: 0.05,
        }, '<0.25')
        .to('.hero .chip', { '--chip': 1, duration: 0.7, ease: 'power3.inOut', stagger: 0.15 }, '<0.2')
        .to('.scribble path', { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '<0.2')
        .to(['.hero__sub', '.hero__cta'], { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, '<0.1')
        .to('.hero .sticker', {
            y: 0,
            opacity: 1,
            rotation: 0,
            duration: 0.9,
            ease: 'back.out(1.6)',
            stagger: 0.12,
            clearProps: 'transform',
        }, '<0.1')
        .to('.hero .deco', { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(3)', stagger: 0.06 }, '<0.2');
    return tl;
}
