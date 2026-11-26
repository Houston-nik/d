/* Анимированный первый экран лендинга «Практикум». Работает только внутри .ahero.
   Кнопку, UTM и цель Метрики обрабатывает js/main.js. */
/* Hero «Практикум», демо. Анимация по tests/hero-motion-spec.md (v5). */

/* 1. Десктоп 768–1439 px: сцена 1440×900 масштабируется целиком, чтобы финальный кадр оставался v5. */
(function () {
  var hero = document.querySelector('.ahero');
  var stage = hero && hero.querySelector('.stage');
  if (!hero || !stage) return;
  function fit() {
    var w = document.documentElement.clientWidth;
    if (w < 768 || w >= 1440) { stage.classList.remove('scaled'); hero.style.removeProperty('--s'); return; }
    hero.style.setProperty('--s', (w / 1440).toFixed(5));
    stage.classList.add('scaled');
  }
  fit(); addEventListener('resize', fit);
})();

/* На мобиле скрыть текст карточки, если заголовок или подпись режется краем другой карточки,
   низом .pic, стрелкой или маскотом. Замер — по финальным позициям (класс .measuring). */
(function () {
  var hero = document.querySelector('.ahero');
  if (!hero) return;
  var pic = hero.querySelector('.pic');
  var av = hero.querySelector('.av');
  var arr = hero.querySelector('.arr');
  if (!pic) return;
  var slack = 1;

  function overlaps(a, b) {
    return a.left < b.right - slack && a.right > b.left + slack && a.top < b.bottom - slack && a.bottom > b.top + slack;
  }
  function fullyInside(r, box) {
    return r.top >= box.top - slack && r.bottom <= box.bottom + slack && r.left >= box.left - slack && r.right <= box.right + slack;
  }
  function boxAt(c, el) {
    /* финальная позиция без transform анимации: offset* не учитывает translate/rotate */
    var picR = pic.getBoundingClientRect();
    var x = picR.left + c.offsetLeft + el.offsetLeft;
    var y = picR.top + c.offsetTop + el.offsetTop;
    return { left: x, top: y, right: x + el.offsetWidth, bottom: y + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight };
  }
  function fitLabels() {
    if (!matchMedia('(max-width: 767px)').matches) return;
    var cards = [].slice.call(hero.querySelectorAll('.tc.mob-only'));
    var picR = pic.getBoundingClientRect();
    var blockers = [av, arr].filter(Boolean).map(function (el) { return el.getBoundingClientRect(); });
    cards.forEach(function (c) {
      var b = c.querySelector('b');
      var s = c.querySelector('span');
      if (!b) return;
      var br = boxAt(c, b);
      var fitsX = b.scrollWidth <= b.clientWidth + 1;
      var titleOk = br.width > 0 && br.height > 0 && fitsX && fullyInside(br, picR) && !blockers.some(function (blk) { return overlaps(br, blk); });
      b.style.visibility = titleOk ? 'visible' : 'hidden';
      if (s) {
        var sr = boxAt(c, s);
        var subOk = titleOk && sr.width > 0 && fullyInside(sr, picR) && !blockers.some(function (blk) { return overlaps(sr, blk); });
        s.style.visibility = subOk ? 'visible' : 'hidden';
      }
    });
  }
  window.__aheroFitLabels = fitLabels;
  function go() { fitLabels(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  addEventListener('resize', function () { fitLabels(); });
})();

/* 3. Анимация (v2, правка Дизайнера 26.11): слова стоят ровно, пока стопка до них не дошла.
   Десктоп: стопка растёт снизу (новая карточка въезжает под стопку и поднимает её), верх стопки
   физически упирается в хвост «у» и толкает слово: 6-я карточка ≈ 40 % финального наклона, 7-я 100 %.
   Слово сидит на карточке (контакт ≤ 2 px), после толчка пружинит вверх и возвращается на карточку.
   «рутину» повторяет движение «сотруднику» с задержкой 60 мс. Финал = статичный v5.
   Мобильный (< 768, стопка под кнопкой, контакта со словом нет): строки заголовка всегда ровные;
   куча из 12 карточек (mob-only) ступенькой: новая падает сверху и накрывает подпись, не заголовок;
   падение быстрее, общая длина ≈ 2,8 с. Подписи, которые не влезают целиком, скрываются.
   Отладка: ?t=1234 замораживает кадр на 1234 мс от старта (для кадров и замеров). */
(function () {
  var root = document.documentElement;
  var hero = document.querySelector('.ahero');
  if (!hero || !root.classList.contains('ahero-anim')) return;               // reduced-motion: статичный v5
  var mobile = matchMedia('(max-width: 767px)').matches;
  var K = 1;                                                       // наклон только на десктопе; на мобильном слова не крутим
  var W2 = { y: -2 * K, r: -3.5 * K }, W1 = { y: -3 * K, r: -2.8 * K }, LAG = 60;
  var N = mobile ? 12 : 7, STEP = mobile ? 160 : 180, START = mobile ? 120 : 200, RISE = mobile ? 200 : 320, FLY = 400, ARROW = 600;
  var P_LAST2 = 0.4;                                              // предпоследняя карточка: 40 % финала
  var tower = hero.querySelector('.tower'), pic = hero.querySelector('.pic');
  var w1 = hero.querySelector('.w1'), w2 = hero.querySelector('.w2'), contact = hero.querySelector('.contact');
  var cards = [].slice.call(tower.querySelectorAll(mobile ? '.tc.mob-only' : '.tc:not(.mob-only)')).sort(function (a, b) { return a.style.getPropertyValue('--i') - b.style.getPropertyValue('--i'); });
  var freeze = (function () { var m = /[?&]t=(\d+)/.exec(location.search); return m ? +m[1] : null; })();

  function bez(x1, y1, x2, y2) {                                   // cubic-bezier как в CSS
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x; for (var j = 0; j < 8; j++) { var cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        var d = 3 * x1 * (1 - t) * (1 - 3 * t) + 3 * x2 * t * (2 - 3 * t) + 3 * t * t; if (Math.abs(d) < 1e-6) break; t -= cx / d; t = Math.min(1, Math.max(0, t)); }
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  var ease = bez(.2, .8, .2, 1), easeLift = bez(.25, .46, .45, .94);
  /* Последний толчок отделён от предпоследнего паузой (HOLD), чтобы читались две ступени 40 % → 100 %,
     и идёт мягче (LIFT7), иначе «сотруднику» догоняет отстающую на 60 мс «рутину» ближе 14 px. */
  var HOLD = 300, LIFT7 = 480;
  function tk(k) { return k === N && !mobile ? START + (N - 2) * STEP + HOLD : START + (k - 1) * STEP; }   // старт k-й карточки
  function ek(k, t) { return ease((t - tk(k)) / RISE); }           // въезд карточки (спек: 320 мс)
  function lift(k, t) { return k === N && !mobile ? easeLift((t - tk(k)) / LIFT7) : ek(k, t); }   // подъём стопки
  function liftEnd(k) { return tk(k) + (k === N && !mobile ? LIFT7 : RISE); }

  /* Геометрия контакта (замер по чернилам в google-chrome, tools/record.py):
     верх верхней карточки = 408 + s; хвост «у» касается её при s = S0·(1 − p), где p — доля финального наклона. */
  var S0 = 29.55, GAP = 46.33;
  var S = [];                                                     // сдвиг стопки после k-й карточки
  S[7] = 0; S[6] = S0 * (1 - P_LAST2);
  for (var k = 5; k >= 1; k--) S[k] = S[k + 1] + GAP;
  function shift(t) { var s = S[1]; for (var k = 2; k <= 7; k++) s += (S[k] - S[k - 1]) * lift(k, t); return s; }

  function pushTarget(t) {                                         // куда упор толкает слово (0…1)
    if (!mobile) return Math.min(1, Math.max(0, (S0 - shift(t)) / S0));
    function ramp(k) { var x = (t - tk(k) - RISE * 0.5) / (RISE * 0.5); x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
    function ramp2(k, d) { var x = (t - tk(k) - RISE * 0.5) / d; x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); }
    return P_LAST2 * ramp(3) + (1 - P_LAST2) * ramp2(4, 420);
  }

  /* Пружинка: слово сидит на упоре (pushTarget), а в конце каждого толчка по инерции уходит выше упора
     на BUMP × (прирост толчка) и опускается обратно на карточку. Ниже упора слово не бывает: наезда нет. */
  var TEND = liftEnd(N) + Math.max(FLY, ARROW) + 120, BT = 300;
  /* [карточка, прирост, сила пружинки]: на 40 % пружинка заметная, на 100 % мягкая — выше v5 слово почти не уходит,
     иначе строки сближаются меньше 14 px (замер в tools/record.py). */
  var pushes = mobile ? [[3, P_LAST2, 0.3], [4, 1 - P_LAST2, 0.08]] : [[6, P_LAST2, 0.3], [7, 1 - P_LAST2, 0.08]];
  var X = new Float32Array(TEND + 2);
  for (var t = 0; t <= TEND + 1; t++) {
    var x = pushTarget(t);
    pushes.forEach(function (q) { var u = (t - (tk(q[0]) + (liftEnd(q[0]) - tk(q[0])) * 0.6)) / BT; if (u > 0 && u < 1) x += q[2] * q[1] * Math.sin(Math.PI * u) * (1 - u); });
    X[t] = x;
  }
  function wx(t) { t = Math.round(t); return t < 0 ? 0 : t > TEND ? X[TEND] : X[t]; }

  function tf(el, f, p) { el.style.transform = 'translateY(' + (f.y * p).toFixed(3) + 'px) rotate(' + (f.r * p).toFixed(4) + 'deg)'; }
  function frame(t) {
    if (!mobile) {
      tf(w2, W2, wx(t)); tf(w1, W1, wx(t - LAG));
      var s = shift(t);
      cards.forEach(function (c, i) {
        var k = i + 1, raw = (t - tk(k)) / RISE;
        if (raw <= 0) { c.style.opacity = 0; return; }
        c.style.opacity = Math.min(1, raw * 1.6).toFixed(3);
        c.style.transform = 'translateY(' + (s + 60 * (1 - ek(k, t))).toFixed(3) + 'px) rotate(' + c.style.getPropertyValue('--r') + ')';
      });
      contact.style.opacity = ek(7, t).toFixed(3);
    }
    window.__hero = { t: t, shift: mobile ? null : shift(t), p2: mobile ? 0 : wx(t), p1: mobile ? 0 : wx(t - LAG), push: mobile ? 0 : pushTarget(t) };
  }
  function finish() {
    root.classList.remove('ahero-anim');
    [w1, w2, contact].concat(cards).forEach(function (e) { e.style.removeProperty('transform'); e.style.removeProperty('opacity'); });
    tower.classList.remove('play'); pic.classList.remove('play-fly');
    /* пересобрать слои картинки (карточки, стрелка, маскот) в том же кадре: иначе Chrome оставляет растр от анимации и края расходятся с v5 на 1 тон */
    pic.style.display = 'none'; void pic.offsetHeight; pic.style.removeProperty('display');
    if (typeof window.__aheroFitLabels === 'function') window.__aheroFitLabels();
    document.body.dataset.done = '1';
  }

  function run() {
    var LANDED = liftEnd(N);                                       // последняя карточка встала, стопка остановилась
    if (mobile) tower.classList.add('play');                       // мобильные карточки: CSS-анимация (спек)
    if (freeze !== null) {                                         // отладочный стоп-кадр
      if (freeze >= LANDED) pic.classList.add('play-fly');
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        document.getAnimations().forEach(function (an) {
          var el = an.effect && an.effect.target, own = 0;
          if (el && el.closest && !el.closest('.tower') && el.closest('.pic')) own = LANDED;   // летящая карточка и стрелка стартуют после посадки
          an.currentTime = Math.max(0, freeze - own); an.pause();
        });
        frame(freeze); if (typeof window.__aheroFitLabels === 'function') window.__aheroFitLabels(); document.body.dataset.frozen = '1';
      }); });
      return;
    }
    var t0 = performance.now(), flew = false;
    (function loop(now) {
      var t = now - t0;
      if (!flew && t >= LANDED) { pic.classList.add('play-fly'); flew = true; }
      if (t >= TEND) { finish(); return; }
      frame(t); requestAnimationFrame(loop);
    })(t0);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
})();
