let toastEl = null;
let hideTimer = null;

export function mountToastHost(container) {
  toastEl = document.createElement('div');
  toastEl.id = 'toast';
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.hidden = true;
  container.appendChild(toastEl);
}

export function showToastUI(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.remove('is-visible');
  // eslint-disable-next-line no-unused-expressions
  toastEl.offsetHeight;
  toastEl.classList.add('is-visible');
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toastEl.hidden = true;
    toastEl.classList.remove('is-visible');
  }, 3200);
}
