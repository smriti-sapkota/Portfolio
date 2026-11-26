// Chill lo-fi loop generated live with the Web Audio API (no audio file needed).
// Browsers block autoplay, so it starts only when the visitor taps the button.
export function initMusic() {
    const btn = document.createElement('button');
    btn.className = 'music-btn';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Play chill music');
    btn.innerHTML = '<span class="music-btn__icon" aria-hidden="true">♪</span><span class="music-btn__text">music</span>';
    document.body.appendChild(btn);

    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { btn.hidden = true; return; }

    let ctx = null;
    let master = null;
    let timer = null;
    let nextTime = 0;
    let step = 0;
    let on = false;

    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // Fmaj7 - Em7 - Dm7 - Cmaj7 (one chord per bar), plus a bass root
    const chords = [
        { bass: 41, notes: [57, 60, 64, 67] },
        { bass: 40, notes: [55, 59, 62, 67] },
        { bass: 38, notes: [53, 57, 60, 64] },
        { bass: 36, notes: [55, 59, 64, 67] },
    ];
    const scale = [72, 74, 76, 79, 81, 84]; // C pentatonic melody pool
    const BEAT = 0.75; // ~80 bpm

    function tone(freq, t, dur, type, gain, dest) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(dest);
        o.start(t);
        o.stop(t + dur + 0.05);
    }

    function scheduleBar(t, barIndex) {
        const c = chords[barIndex % chords.length];
        const bar = BEAT * 4;
        c.notes.forEach((n, i) => tone(hz(n), t + i * 0.012, bar * 0.95, 'triangle', 0.07, master));
        tone(hz(c.bass), t, BEAT * 1.8, 'sine', 0.2, master);
        tone(hz(c.bass), t + BEAT * 2, BEAT * 1.6, 'sine', 0.16, master);
        // soft kick-ish thump and hat on the beat
        for (let b = 0; b < 4; b++) {
            const bt = t + b * BEAT;
            if (b % 2 === 0) tone(60, bt, 0.25, 'sine', 0.22, master);
            hat(bt + BEAT / 2);
        }
        // sparse melody
        for (let b = 0; b < 8; b++) {
            if (Math.random() < 0.45) {
                const n = scale[Math.floor(Math.random() * scale.length)];
                tone(hz(n), t + b * (BEAT / 2), BEAT * 1.4, 'sine', 0.05, master);
            }
        }
    }

    function hat(t) {
        const len = ctx.sampleRate * 0.04;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const s = ctx.createBufferSource();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        f.type = 'highpass';
        f.frequency.value = 7000;
        g.gain.value = 0.05;
        s.buffer = buf;
        s.connect(f).connect(g).connect(master);
        s.start(t);
    }

    function pump() {
        while (nextTime < ctx.currentTime + 1.5) {
            scheduleBar(nextTime, step++);
            nextTime += BEAT * 4;
        }
    }

    function start() {
        if (!ctx) {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0;
            const lp = ctx.createBiquadFilter(); // muffled lo-fi warmth
            lp.type = 'lowpass';
            lp.frequency.value = 1800;
            master.connect(lp).connect(ctx.destination);
        }
        ctx.resume();
        nextTime = ctx.currentTime + 0.1;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
        pump();
        timer = setInterval(pump, 400);
    }

    function stop() {
        clearInterval(timer);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        setTimeout(() => { if (!on) ctx.suspend(); }, 700);
    }

    btn.addEventListener('click', () => {
        on = !on;
        on ? start() : stop();
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', on ? 'Pause chill music' : 'Play chill music');
        btn.classList.toggle('is-on', on);
    });
}
