/* Кнопка «Бесплатная диагностика с Ником»: личка Ника в Telegram с готовым текстом и источником.
   utm_source / utm_campaign / utm_content берём из URL и храним в sessionStorage (переход по странице и перезагрузка не теряют источник).
   Ссылка на личку t.me/Okay_Houston подтверждена Ником 24.11. */
(function () {
  var TG = 'https://t.me/Okay_Houston';
  var KEY = 'sprint_utm';
  var FIELDS = ['utm_source', 'utm_campaign', 'utm_content'];

  function clean(v) {
    return String(v || '').replace(/[\u0000-\u001F\u007F<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 64);
  }

  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { utm = {}; }

  var fresh = {}, hasFresh = false;
  try {
    var q = new URLSearchParams(window.location.search);
    FIELDS.forEach(function (k) {
      var v = clean(q.get(k));
      if (v) { fresh[k] = v; hasFresh = true; }
    });
  } catch (e) {}
  if (hasFresh) {               // новый заход с метками: считаем по последнему источнику
    utm = fresh;
    try { sessionStorage.setItem(KEY, JSON.stringify(utm)); } catch (e) {}
  }

  // Текст из launch-texts/landing-sprint.md: «Здравствуйте! Хочу на диагностику, пришёл с сайта».
  // Есть utm_source — подставляем его вместо «сайта»: «…, пришёл из <utm_source>».
  var text = 'Здравствуйте! Хочу на диагностику, ' + (utm.utm_source ? 'пришёл из ' + utm.utm_source : 'пришёл с сайта');
  // «!» тоже кодируем (%21), чтобы ссылка без UTM совпадала с landing-sprint.md байт в байт
  var href = TG + '?text=' + encodeURIComponent(text).replace(/[!'()*]/g, function (c) { return '%' + c.charCodeAt(0).toString(16).toUpperCase(); });

  var links = document.querySelectorAll('a[data-cta]');
  for (var i = 0; i < links.length; i++) links[i].setAttribute('href', href);
  window.SPRINT_CTA = { href: href, text: text, utm: utm };
})();

/* Баннер cookie и Яндекс Метрика (решение Ника 24.11: «Метрику ставим вместе с баннером cookie»).
   Условия Юриста (LEGAL-mini-group-v1.md, раздел 6 п. 8; текст и код баннера — agents/lawyer/out/psy-landing-5529723/04-chekboks-i-cookie.md, вариант 1):
   сначала баннер; счётчик грузится только после «Принять»; при «Только необходимые» ничего не грузится; Вебвизор выключен;
   выбор хранится в localStorage ('cookie_consent_v1' = 'all' | 'necessary'); «Настройки cookie» в подвале сбрасывают выбор.
   METRIKA_ID — номер счётчика. Пока null, счётчик не грузится даже после «Принять». НОМЕР НУЖЕН ОТ НИКА. */
(function () {
  var METRIKA_ID = null;
  var KEY = 'cookie_consent_v1';
  var ROOT = document.documentElement.getAttribute('data-root') || '';

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadMetrika(id) {
    id = id || METRIKA_ID;
    if (!id || window.__ymLoaded) { return false; }
    window.__ymLoaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
    window.__ymId = id;
    return true;
  }

  function showBar() {
    if (document.getElementById('cookie-bar')) { return; }
    var bar = document.createElement('div');
    bar.id = 'cookie-bar';
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie');
    bar.innerHTML =
      '<p>Мы используем файлы cookie: технические — чтобы сайт работал, и аналитические (Яндекс Метрика) — чтобы понимать, как им пользуются. ' +
      'Аналитику мы включим только с вашего согласия. Подробнее в <a href="' + ROOT + 'politika/#cookie">Политике обработки персональных данных</a>.</p>' +
      '<div class="cookie-btns"><button type="button" class="cookie-accept">Принять</button>' +
      '<button type="button" class="cookie-reject">Только необходимые</button></div>';
    document.body.appendChild(bar);
    bar.querySelector('.cookie-accept').onclick = function () { set('all'); bar.remove(); loadMetrika(); };
    bar.querySelector('.cookie-reject').onclick = function () { set('necessary'); bar.remove(); };
  }

  var saved = get();
  if (saved === 'all') { loadMetrika(); }
  else if (saved !== 'necessary') { showBar(); }

  var links = document.querySelectorAll('[data-cookie-settings]');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function (ev) {
      ev.preventDefault();
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.reload();
    });
  }
  /* Цель Метрики (26.11.2026, пакет прокачки Директора: «Метрика с целями»): клик по любой кнопке «Бесплатная диагностика с Ником».
     Идентификатор цели cta_diagnostika (тип «JavaScript-событие»), параметр place: hero | price | final.
     Срабатывает только если счётчик загружен (есть номер и «Принять»). В кабинете Метрики цель с этим идентификатором создаёт Ник или ЛендМейкер с доступом. */
  var ctas = document.querySelectorAll('a[data-cta]');
  for (var c = 0; c < ctas.length; c++) {
    ctas[c].addEventListener('click', function () {
      if (!window.__ymId || typeof window.ym !== 'function') { return; }
      var sec = this.closest('section');
      var place = !sec ? 'other' : sec.classList.contains('hero') ? 'hero' : sec.classList.contains('final') ? 'final' : 'price';
      try { window.ym(window.__ymId, 'reachGoal', 'cta_diagnostika', { place: place }); } catch (e) {}
    });
  }
  window.SPRINT_CONSENT = { key: KEY, get: get, loadMetrika: loadMetrika, metrikaId: METRIKA_ID };
})();
