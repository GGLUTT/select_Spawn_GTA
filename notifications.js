// Themed Notifications (GTA/Neon) - lightweight manager
(function () {
  const ICONS = {
    success:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    warn:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
  };

  class NotificationManager {
    constructor() {
      this.root = document.createElement('div');
      this.root.className = 'notify-root';
      document.body.appendChild(this.root);
      this.defaultDuration = 4000; // ms
    }

    show({ type = 'info', title = 'Повідомлення', message = '', duration }) {
      const d = typeof duration === 'number' ? duration : this.defaultDuration;
      const el = document.createElement('div');
      el.className = `notify ${type}`;
      el.style.setProperty('--duration', `${Math.max(800, d)}ms`);

      el.innerHTML = `
        <span class="accent"></span>
        <div class="icon">${ICONS[type] || ICONS.info}</div>
        <div class="content">
          <div class="title">${this.escape(title)}</div>
          <div class="message">${this.escape(message)}</div>
        </div>
        <button class="close" aria-label="Закрити" title="Закрити">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
        </button>
        <div class="progress"></div>
      `;

      const remove = () => {
        el.style.animation = 'notify-out 200ms ease forwards';
        setTimeout(() => el.remove(), 180);
      };

      el.querySelector('.close')?.addEventListener('click', remove);
      const timer = setTimeout(remove, d);
      el.addEventListener('mouseenter', () => clearTimeout(timer));
      el.addEventListener('mouseleave', () => setTimeout(remove, 1200));

      this.root.appendChild(el);
      return el;
    }

    success(message, title = 'Успішно', duration) {
      return this.show({ type: 'success', title, message, duration });
    }
    info(message, title = 'Інфо', duration) {
      return this.show({ type: 'info', title, message, duration });
    }
    warning(message, title = 'Попередження', duration) {
      return this.show({ type: 'warn', title, message, duration });
    }
    error(message, title = 'Помилка', duration) {
      return this.show({ type: 'error', title, message, duration });
    }

    escape(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }

  // Expose global API
  const manager = new NotificationManager();
  window.Notify = manager;
})();