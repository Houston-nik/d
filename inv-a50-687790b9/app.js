/* Приглашение на юбилей: конверт, обратный отсчёт, карта, форма ответа. Без зависимостей. */
(function () {
  "use strict";
  var CFG = window.INVITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ATTEND = { yes: "Да, буду", maybe: "Пока под вопросом", no: "К сожалению, не смогу" };
  var COUNT = { 1: "Один", 2: "Вдвоём", 3: "Втроём", 4: "Вчетвером" };

  var params = new URLSearchParams(location.search);
  var guestId = (params.get("g") || "").trim().slice(0, 64).replace(/[^\w\-.]/g, "");
  var guest = null;
  var storeKey = null;      // ключ localStorage для этого гостя
  var lastSaved = null;     // последний принятый ответ

  /* ---------- вспомогательное ---------- */
  function plural(n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return a;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b;
    return c;
  }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function anonId() {
    var k = "invite:anon-id", v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v) {
      v = "open-" + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }
  function fetchJson(url, opts, ms) {
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms || 8000) : null;
    opts = opts || {};
    if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) {
      if (t) clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }, function (e) { if (t) clearTimeout(t); throw e; });
  }

  /* ---------- гость по личной ссылке ---------- */
  function loadGuest() {
    if (!guestId) return Promise.resolve(null);
    var base = (CFG.ENDPOINT || "").replace(/\/+$/, "");
    if (base) {  // боевой режим: сервер отдаёт только одного гостя, список не публичен
      return fetchJson(base + "/guest?g=" + encodeURIComponent(guestId), {}, 6000)
        .then(function (r) { return (r && r.guest) || null; })
        .catch(function () { return null; });
    }
    return fetchJson(CFG.GUESTS_URL || "guests.json", { cache: "no-cache" }, 6000)
      .then(function (list) {
        for (var i = 0; i < list.length; i++) if (list[i].id === guestId) return list[i];
        return null;
      })
      .catch(function () { return null; });
  }
  function applyGuest(g) {
    guest = g;
    if (!g) return;
    $("introFor").textContent = g.name;
    var cf = $("coverFor");
    cf.textContent = "Для: " + g.name;
    cf.hidden = false;
    if (g.first) $("first").value = g.first;
    if (g.last) $("last").value = g.last;
    if (g.seats) {
      var h = $("seatsHint");
      h.textContent = "В приглашении указано гостей: " + g.seats + ".";
      h.hidden = false;
    }
  }

  /* ---------- конверт ---------- */
  function setupIntro() {
    var intro = $("intro"), seal = $("seal");
    document.documentElement.classList.add("locked");
    var done = false;
    function open() {
      if (done) return;
      done = true;
      intro.classList.add("is-open");
      setTimeout(function () {
        intro.classList.add("is-gone");
        document.documentElement.classList.remove("locked");
        intro.setAttribute("aria-hidden", "true");
        updateSticky();
        window.scrollTo(0, 0);
      }, reduce ? 60 : 1500);
    }
    seal.addEventListener("click", open);
    $("envelope").addEventListener("click", function (e) { if (e.target !== seal) open(); });
    seal.focus({ preventScroll: true });
  }

  /* ---------- обратный отсчёт ---------- */
  function setupCountdown() {
    var start = new Date(CFG.EVENT_START_ISO).getTime();
    var end = CFG.EVENT_END_ISO ? new Date(CFG.EVENT_END_ISO).getTime() : start + 6 * 3600e3;
    function tick() {
      var now = Date.now(), left = start - now;
      if (isNaN(start)) { $("countdown").hidden = true; return; }
      if (left <= 0) {
        $("countdownLabel").textContent = now < end ? "Праздник уже начался" : "Спасибо, что были рядом";
        $("cdDays").textContent = "0"; $("cdHours").textContent = "0"; $("cdMins").textContent = "0";
        return;
      }
      var mins = Math.floor(left / 60000);
      var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
      $("cdDays").textContent = d; $("cdDaysL").textContent = plural(d, "день", "дня", "дней");
      $("cdHours").textContent = h; $("cdHoursL").textContent = plural(h, "час", "часа", "часов");
      $("cdMins").textContent = m; $("cdMinsL").textContent = plural(m, "минута", "минуты", "минут");
    }
    tick();
    setInterval(tick, 20000);
  }

  /* ---------- карта ---------- */
  function setupMap() {
    var M = CFG.MAP || { lat: 55.7548, lon: 37.5568, zoom: 16 };
    var ll = M.lon + "," + M.lat;
    $("mapFrame").src = "https://yandex.ru/map-widget/v1/?ll=" + encodeURIComponent(ll) +
      "&z=" + M.zoom + "&pt=" + ll + ",pm2dgl";
    $("mapOpen").href = "https://yandex.ru/maps/?ll=" + encodeURIComponent(ll) + "&z=" + M.zoom +
      "&pt=" + encodeURIComponent(ll);
    $("mapRoute").href = "https://yandex.ru/maps/?rtext=~" + M.lat + "," + M.lon + "&rtt=auto";
  }

  /* ---------- календарь ---------- */
  function setupCalendar() {
    $("calBtn").addEventListener("click", function () {
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invite//RU", "BEGIN:VEVENT",
        "UID:andrey50-20261221@invite", "DTSTAMP:20261029T090000Z",
        "DTSTART:20261221T143000Z", "DTEND:20261221T200000Z",
        "SUMMARY:Юбилей Андрея Белинского — 50 лет",
        "LOCATION:ЦМТ\\, Краснопресненская наб. 12\\, зал Дорчестер\\, подъезд 10",
        "DESCRIPTION:Сбор гостей 17:30\\, банкет 18:00", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      a.download = "Yubiley_Andreya_21_dekabrya.ics";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  }

  /* ---------- форма ---------- */
  var form, moreBlock, nameBlock;
  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function drinks() {
    return Array.prototype.map.call(form.querySelectorAll('input[name="drink"]:checked'), function (i) { return i.value; });
  }
  function syncVisibility() {
    var a = val("attend");
    moreBlock.hidden = !(a === "yes" || a === "maybe");
    nameBlock.hidden = !a;
  }
  function setError(msg, el) {
    var e = $("formError");
    e.textContent = msg || ""; e.hidden = !msg;
    ["first", "last"].forEach(function (id) { $(id).parentNode.classList.remove("is-error"); });
    if (el) { el.parentNode.classList.add("is-error"); el.focus(); }
  }
  function fillForm(a) {
    if (!a) return;
    var r = form.querySelector('input[name="attend"][value="' + a.attend + '"]'); if (r) r.checked = true;
    var c = form.querySelector('input[name="count"][value="' + a.count + '"]'); if (c) c.checked = true;
    Array.prototype.forEach.call(form.querySelectorAll('input[name="drink"]'), function (i) {
      i.checked = (a.drinks || []).indexOf(i.value) !== -1;
    });
    if (a.first) $("first").value = a.first;
    if (a.last) $("last").value = a.last;
    $("comment").value = a.comment || "";
    syncVisibility();
  }
  function showThanks(a, note, quiet) {
    $("rsvpForm").hidden = true;
    $("thanks").hidden = false;
    var t = a.attend === "no"
      ? "Спасибо, что ответили. Жаль, что в этот раз не получится."
      : "Ваш ответ получен. До встречи 21 декабря!";
    $("thanksText").textContent = t;
    var s = $("summary"); s.textContent = "";
    function row(k, v) {
      var d = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = k; dd.textContent = v; d.appendChild(dt); d.appendChild(dd); s.appendChild(d);
    }
    row("Присутствие", ATTEND[a.attend]);
    if (a.attend !== "no") {
      row("Гостей", COUNT[a.count] || String(a.count));
      row("Напитки", (a.drinks && a.drinks.length) ? a.drinks.join(", ") : "не указаны");
    }
    var n = $("thanksNote");
    n.hidden = !note; n.textContent = note || "";
    $("calBtn").hidden = a.attend === "no";
    if (!quiet) $("rsvp").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function endpointUrl() { return (CFG.ENDPOINT || "").replace(/\/+$/, ""); }
  function send(answer) {
    var base = endpointUrl();
    if (!base) return Promise.resolve({ local: true });
    return fetchJson(base + "/rsvp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answer)
    }, 10000);
  }
  function onSubmit(ev) {
    ev.preventDefault();
    var a = val("attend");
    if (!a) { setError("Выберите ответ."); return; }
    var first = $("first").value.trim(), last = $("last").value.trim();
    var count = (a === "no") ? 0 : parseInt(val("count") || "0", 10);
    if (a !== "no" && !count) { setError("Укажите, сколько человек будет от вас."); form.querySelector('input[name="count"]').focus(); return; }
    if (!first) { setError("Укажите имя.", $("first")); return; }
    if (!last) { setError("Укажите фамилию.", $("last")); return; }
    setError("");
    var answer = {
      guestId: guest ? guest.id : (guestId || anonId()),
      known: !!guest,
      first: first, last: last,
      attend: a, count: count,
      drinks: a === "no" ? [] : drinks(),
      comment: $("comment").value.trim().slice(0, 300),
      updatedAt: new Date().toISOString()
    };
    var btn = $("submitBtn"); btn.disabled = true; btn.textContent = "Отправляем…";
    send(answer).then(function (res) {
      lsSet(storeKey, answer); lsDel(storeKey + ":pending");
      lastSaved = answer;
      showThanks(answer, res && res.local
        ? "Демо-режим: ответ сохранён только на этом устройстве, организатору он пока не уходит."
        : "");
    }).catch(function () {
      lsSet(storeKey, answer); lsSet(storeKey + ":pending", answer);
      lastSaved = answer;
      showThanks(answer, "Ответ сохранён на этом устройстве, но связи нет. Откройте приглашение позже, и мы отправим его снова.");
    }).then(function () { btn.disabled = false; btn.textContent = "Подтвердить ответ\u00A0→"; });
  }
  function exclusiveDrinks(ev) {
    var t = ev.target;
    if (t.name !== "drink" || !t.checked) return;
    var none = form.querySelector('input[data-exclusive]');
    if (t === none) {
      Array.prototype.forEach.call(form.querySelectorAll('input[name="drink"]'), function (i) { if (i !== none) i.checked = false; });
    } else if (none.checked) none.checked = false;
  }
  function retryPending() {
    var p = lsGet(storeKey + ":pending");
    if (p && endpointUrl()) send(p).then(function () { lsDel(storeKey + ":pending"); }).catch(function () {});
  }
  function restoreAnswer() {
    var local = lsGet(storeKey);
    var base = endpointUrl();
    var p = Promise.resolve(local);
    if (base && guest) {
      p = fetchJson(base + "/rsvp?g=" + encodeURIComponent(guest.id), {}, 5000)
        .then(function (r) { return (r && r.answer) || local; }, function () { return local; });
    }
    return p.then(function (a) {
      if (a && a.attend) { lastSaved = a; fillForm(a); showThanks(a, "", true); }
    });
  }
  function setupForm() {
    form = $("form"); moreBlock = $("moreBlock"); nameBlock = $("nameBlock");
    form.addEventListener("change", function (ev) { exclusiveDrinks(ev); syncVisibility(); setError(""); });
    form.addEventListener("submit", onSubmit);
    $("editBtn").addEventListener("click", function () {
      $("thanks").hidden = true; $("rsvpForm").hidden = false; fillForm(lastSaved);
      $("rsvp").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
    syncVisibility();
  }

  /* ---------- плавающая кнопка ---------- */
  var sticky;
  function updateSticky() {
    if (!sticky) return;
    var introOn = !$("intro").classList.contains("is-gone");
    var cover = $("cover").getBoundingClientRect();
    var rs = $("rsvp").getBoundingClientRect();
    var vh = window.innerHeight;
    var pastCover = cover.bottom < vh * 0.4;
    var inRsvp = rs.top < vh * 0.7;
    var show = !introOn && pastCover && !inRsvp;
    sticky.hidden = false;
    sticky.classList.toggle("is-off", !show);
    sticky.tabIndex = show ? 0 : -1;
  }


  /* ---------- декор: огоньки гирлянды и лёгкий снег (только обложка) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function addDot(box, r, x, y, size, o) {
    var i = document.createElement("i");
    i.style.cssText = "left:" + x.toFixed(1) + "%;top:" + y.toFixed(1) + "px;width:" + size + "px;height:" + size + "px;" +
      "margin:" + (-size / 2) + "px 0 0 " + (-size / 2) + "px;--o:" + Math.min(o * 1.5, .8).toFixed(2) + ";--d:" + (5 + r() * 6).toFixed(1) + "s;--dl:-" + (r() * 8).toFixed(1) + "s";
    box.appendChild(i);
  }
  function setupBokeh() {
    var boxes = document.querySelectorAll("[data-bokeh]");
    Array.prototype.forEach.call(boxes, function (box, n) {
      var kind = box.getAttribute("data-bokeh"), r = rng(11 + n * 7), k;
      if (kind === "cover") {
        // две провисающие гирлянды вдоль верха и редкие пятна по бокам
        var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 100 230"); svg.setAttribute("preserveAspectRatio", "none");
        [[26, 34], [92, 46]].forEach(function (c) {
          var d = "M-2 " + c[0], p = document.createElementNS(NS, "path");
          for (var q = 0; q <= 104; q += 4) d += " L" + (q - 2) + " " + (c[0] + c[1] * Math.sin(Math.PI * ((q - 2) / 100))).toFixed(1);
          p.setAttribute("d", d); svg.appendChild(p);
        });
        box.appendChild(svg);
        for (k = 0; k <= 12; k++) { var x = k * 8.4 - 2; addDot(box, r, x, 26 + 34 * Math.sin(Math.PI * (x / 100)), 18 + r() * 22, .4 + r() * .25); }
        for (k = 0; k <= 9; k++) { var x2 = k * 11 + 4; addDot(box, r, x2, 92 + 46 * Math.sin(Math.PI * (x2 / 100)), 14 + r() * 18, .3 + r() * .22); }
        for (k = 0; k < 7; k++) addDot(box, r, r() < .5 ? r() * 14 : 86 + r() * 14, 300 + r() * 700, 30 + r() * 46, .14 + r() * .14);
      } else if (kind === "intro") {
        for (k = 0; k < 18; k++) addDot(box, r, r() * 100, r() * 320, 26 + r() * 54, .16 + r() * .26);
        for (k = 0; k < 8; k++) addDot(box, r, r() * 100, 520 + r() * 300, 30 + r() * 50, .12 + r() * .18);
      } else if (kind === "strip") {
        for (k = 0; k < 9; k++) addDot(box, r, 4 + r() * 92, 10 + r() * 150, 22 + r() * 40, .2 + r() * .2);
      } else {
        for (k = 0; k < 8; k++) addDot(box, r, 8 + r() * 84, 20 + r() * 90, 24 + r() * 40, .16 + r() * .22);
      }
    });
  }
  function setupSnow() {
    var cv = $("snow");
    if (!cv || reduce || !cv.getContext) return;
    var inView = true, ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, flakes = [], raf = 0, last = 0, running = false, r = rng(5);
    function size() {
      var b = cv.parentNode.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(b.width)); H = Math.max(1, Math.round(b.height));
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(34, Math.round(W / 11));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push({ x: r() * W, y: r() * H, rad: .8 + r() * 1.9, vy: 14 + r() * 26, ph: r() * 6.28, sw: 8 + r() * 14, a: .28 + r() * .42 });
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return;          // не чаще ~30 кадров в секунду
      var dt = Math.min((t - last) / 1000, .1); last = t;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f6ecd8";
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.vy * dt; f.ph += dt * .6;
        if (f.y - f.rad > H) { f.y = -4; f.x = r() * W; }
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(f.x + Math.sin(f.ph) * f.sw, f.y, f.rad, 0, 6.2832); ctx.fill();
      }
    }
    function start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    var rt = 0; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; inView ? start() : stop(); }, { threshold: 0 }).observe($("cover"));
    } else start();
    document.addEventListener("visibilitychange", function () { (document.hidden || !inView) ? stop() : start(); });
  }

  /* ---------- запуск ---------- */
  function init() {
    sticky = $("stickyCta");
    setupBokeh(); setupSnow(); setupIntro(); setupCountdown(); setupMap(); setupCalendar(); setupForm();
    window.addEventListener("scroll", updateSticky, { passive: true });
    window.addEventListener("resize", updateSticky);
    loadGuest().then(function (g) {
      applyGuest(g);
      storeKey = "invite:answer:" + (g ? g.id : (guestId || anonId()));
      retryPending();
      return restoreAnswer();
    }).then(updateSticky);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
