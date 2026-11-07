/* Выбор действует на всех публичных страницах Drinknit. */
(() => {
  const key = 'drinknit-analytics-consent-v1';
  function savedChoice() {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  let choice = savedChoice();
  const accepted = () => choice === 'accepted';
  window.DrinknitCookies = { accepted };

  const banner = document.createElement('section');
  banner.className = 'cookie-notice';
  banner.setAttribute('aria-label', 'Настройки cookie');
  banner.innerHTML = `
    <p>С вашего согласия Яндекс Метрика использует cookie для статистики посещений.
      <a href="/privacy/">Подробнее</a></p>
    <div class="cookie-notice-actions">
      <button type="button" data-choice="accepted">Принять</button>
      <button type="button" data-choice="declined">Отклонить</button>
    </div>`;
  banner.hidden = choice === 'accepted' || choice === 'declined';
  document.body.append(banner);

  function syncChoice() {
    const saved = savedChoice();
    if (!saved || saved === choice) return;
    if (accepted() && saved !== 'accepted') {
      location.reload();
      return;
    }
    choice = saved;
    banner.hidden = true;
    if (accepted()) window.dispatchEvent(new Event('drinknit:analytics-accepted'));
  }
  window.addEventListener('storage', event => { if (event.key === key) syncChoice(); });
  window.addEventListener('pageshow', event => { if (event.persisted) syncChoice(); });

  let opener;
  document.querySelectorAll('[data-cookie-settings]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      banner.hidden = false;
      banner.querySelector('button').focus();
    });
  });

  banner.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      const wasAccepted = accepted();
      choice = button.dataset.choice;
      try { localStorage.setItem(key, choice); } catch { /* Выбор действует до перезагрузки. */ }
      banner.hidden = true;
      opener?.focus();
      if (accepted()) window.dispatchEvent(new Event('drinknit:analytics-accepted'));
      if (wasAccepted && !accepted()) location.reload();
    });
  });
})();
