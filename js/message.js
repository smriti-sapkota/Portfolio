// Footer message box: posts to FormSubmit, which forwards it to the inbox.
const ENDPOINT = 'https://formsubmit.co/ajax/sapkotasmriti56@gmail.com';

export function initMessageForm() {
    const form = document.querySelector('.message-form');
    if (!form) return;
    const status = form.querySelector('.message-form__status');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        if (data.get('_honey')) return;
        const message = String(data.get('message') || '').trim();
        if (!message) return;

        button.disabled = true;
        status.textContent = 'sending…';
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    name: String(data.get('name') || '').trim() || 'Anonymous',
                    message,
                    _subject: 'New message from your portfolio ♡',
                    _template: 'box',
                    _captcha: 'false',
                }),
            });
            if (!res.ok) throw new Error(String(res.status));
            form.reset();
            status.textContent = 'sent! thank you ♡';
        } catch {
            status.textContent = "couldn't send, try again or email me directly";
        } finally {
            button.disabled = false;
        }
    });
}
