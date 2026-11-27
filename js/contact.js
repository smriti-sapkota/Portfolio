import { initMessageForm } from './message.js';
import { initDino } from './dino.js';
import { initDinoGame } from './dino-game.js';

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

initCopyButtons();
initMessageForm();
initDino();
initDinoGame();
