// Splits an element's text into per-letter spans for animation while keeping
// the original text available to screen readers.
export function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';

    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;

    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    for (const ch of text) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        visual.appendChild(span);
    }

    el.append(label, visual);
    return visual.querySelectorAll('.char');
}
