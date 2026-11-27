// "Dino Says": the dino looks somewhere, you hit the matching arrow before time runs out.
const DIRS = ['up-left', 'up', 'up-right', 'left', 'right', 'down-left', 'down', 'down-right'];
const KEYS = {
    arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
    q: 'up-left', e: 'up-right', z: 'down-left', c: 'down-right',
};
const ROUNDS = 10;
const HAPPY = ['heart', 'sparkle', 'delighted'];
const BEST_KEY = 'dino-says-best';

export function initDinoGame() {
    const panel = document.querySelector('.dino-game');
    const host = document.querySelector('[data-dino]');
    if (!panel || !host) return;

    const startBtn = panel.querySelector('.dino-game__start');
    const status = panel.querySelector('.dino-game__status');
    const scoreEl = panel.querySelector('.dino-game__score');
    const bar = panel.querySelector('.dino-game__bar span');
    const padButtons = [...panel.querySelectorAll('.dino-game__pad button[data-dir]')];
    const dino = () => host.dino;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let playing = false;
    let accepting = false;
    let expecting = null;
    let round = 0;
    let score = 0;
    let last = null;
    let timer = null;

    const setPad = (on) => padButtons.forEach((b) => { b.disabled = !on; });
    const showScore = () => { scoreEl.textContent = `Score ${score} · Round ${Math.min(round, ROUNDS)}/${ROUNDS}`; };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
    const bestText = () => {
        const best = Number(localStorage.getItem(BEST_KEY) || 0);
        return best ? ` Best: ${best}.` : '';
    };
    const resetBar = () => { bar.style.animation = 'none'; };

    function start() {
        playing = true;
        round = 0;
        score = 0;
        last = null;
        dino().lock(true);
        startBtn.hidden = true;
        setPad(false);
        showScore();
        status.textContent = 'Get ready…';
        dino().setReaction('wink');
        later(900, nextRound);
    }

    function nextRound() {
        if (round >= ROUNDS) return finish();
        round += 1;
        showScore();
        let dir;
        do { dir = DIRS[Math.floor(Math.random() * DIRS.length)]; } while (dir === last);
        last = dir;
        expecting = dir;
        accepting = true;
        dino().setReaction(null);
        dino().setDirection(dir);
        status.textContent = 'Where is he looking?';
        setPad(true);
        const limit = Math.max(900, 2400 - round * 140);
        if (!reduced) {
            bar.style.animation = 'none';
            void bar.offsetWidth;
            bar.style.animation = `dino-timer ${limit}ms linear forwards`;
        }
        later(limit, () => resolve(null));
    }

    function resolve(choice) {
        if (!accepting) return;
        accepting = false;
        setPad(false);
        resetBar();
        if (choice === null) {
            dino().setReaction('sleepy');
            status.textContent = 'Too slow! zzz…';
        } else if (choice === expecting) {
            score += 1;
            dino().setReaction(HAPPY[score % HAPPY.length]);
            dino().bounce();
            status.textContent = 'Yes!';
        } else {
            dino().setReaction('surprised');
            status.textContent = 'Oops!';
        }
        showScore();
        later(700, nextRound);
    }

    function finish() {
        playing = false;
        expecting = null;
        const prev = Number(localStorage.getItem(BEST_KEY) || 0);
        if (score > prev) localStorage.setItem(BEST_KEY, String(score));
        let face = 'dizzy';
        let msg = 'Dino is dizzy… try again!';
        if (score >= 9) { face = 'delighted'; msg = 'Dino adores you!'; }
        else if (score >= 6) { face = 'heart'; msg = 'Nice reflexes!'; }
        else if (score >= 3) { face = 'wink'; msg = 'Not bad!'; }
        dino().setReaction(face);
        dino().bounce();
        status.textContent = `${msg} You got ${score}/${ROUNDS}.${bestText()}`;
        startBtn.textContent = 'Play again';
        startBtn.hidden = false;
        later(2500, () => { if (!playing) dino().lock(false); });
    }

    padButtons.forEach((b) => b.addEventListener('click', () => resolve(b.dataset.dir)));
    window.addEventListener('keydown', (e) => {
        if (!playing || !accepting) return;
        const dir = KEYS[String(e.key).toLowerCase()];
        if (!dir) return;
        e.preventDefault();
        resolve(dir);
    });
    startBtn.addEventListener('click', start);
    setPad(false);
    status.textContent = `Press start, then click or use arrow keys (Q E Z C for diagonals).${bestText()}`;
}
