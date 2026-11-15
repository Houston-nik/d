/* Приглашение на юбилей: пошаговый опрос и отправка ответа. Без зависимостей. */
(function () {
  "use strict";
  var CFG = window.INVITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ATTEND = { yes: "Да, буду", maybe: "Пока под вопросом", no: "К сожалению, не смогу" };
  var COUNT = { 1: "Один (только я)", 2: "Вдвоём", 3: "Втроём", 4: "Вчетвером" };
  var NONE = "Алкоголь не пью";
  var ORDER = ["cover", "hello", "program", "attend", "count", "drinks", "form"];
  var NAMES = ["", "Привет", "Программа", "Присутствие", "Гости", "Напитки", "Готово"];

  var params = new URLSearchParams(location.search);
  var guestId = (params.get("g") || "").trim().slice(0, 64).replace(/[^\w\-.]/g, "");
  var guest = null;
  var state = { attend: "", count: 1, drinks: [] };
  var current = "cover";
  var lastAnswer = null;

  function anonId() {
    var k = "invite:anon-id", v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v) { v = "open-" + Math.random().toString(36).slice(2, 10); try { localStorage.setItem(k, v); } catch (e) {} }
    return v;
  }
  function fetchJson(url, opts, ms) {
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms || 8000) : null;
    opts = opts || {}; if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) {
      if (t) clearTimeout(t);
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, json: j }; });
    }, function (e) { if (t) clearTimeout(t); throw e; });
  }
  function base() { return String(CFG.ENDPOINT || "").replace(/\/+$/, ""); }

  /* ---------- гость по личной ссылке ?g=<id> ---------- */
  function loadGuest() {
    if (!guestId) return Promise.resolve(null);
    if (base()) {   // боевой режим: сервер отдаёт только одного гостя
      return fetchJson(base() + "/guest?g=" + encodeURIComponent(guestId), {}, 6000)
        .then(function (r) { return (r.ok && r.json && r.json.guest) || null; }, function () { return null; });
    }
    return fetchJson(CFG.GUESTS_URL || "guests.json", { cache: "no-cache" }, 6000).then(function (r) {
      var list = Array.isArray(r.json) ? r.json : (r.json && r.json.guests) || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === guestId) return list[i];
      return null;
    }, function () { return null; });
  }
  function applyGuest(g) {
    guest = g;
    if (!g) return;
    var to = $("helloTo");
    to.textContent = (g.name || g.first || "") + ", вы приглашены!";
    to.hidden = !(g.name || g.first);
    if (g.first) $("first").value = g.first;
    if (g.last) $("last").value = g.last;
    var seats = Math.max(2, Math.min(4, parseInt(g.seats, 10) || 2));
    buildCountOptions(seats);
    var wh = $("whoHi");
    if (g.name) { wh.textContent = "Приглашение для: " + g.name; wh.hidden = false; }
  }

  /* ---------- навигация ---------- */
  function buildNav() {
    qa(".screen[data-name]").forEach(function (s) {
      var n = +s.getAttribute("data-n");
      var nav = document.createElement("div"); nav.className = "nav";
      var b = document.createElement("button"); b.type = "button"; b.className = "back"; b.textContent = "← Назад";
      b.addEventListener("click", function () { history.back(); });
      var st = document.createElement("div"); st.className = "steps"; st.setAttribute("role", "img");
      st.setAttribute("aria-label", "Шаг " + (n - 1) + " из 6");
      for (var i = 2; i <= 7; i++) { var d = document.createElement("i"); d.className = i < n ? "d" : (i === n ? "c" : ""); st.appendChild(d); }
      var nm = document.createElement("span"); nm.className = "stepname"; nm.textContent = (n - 1) + "/6";
      var right = document.createElement("div"); right.style.cssText = "display:flex;gap:10px;align-items:center"; right.appendChild(st); right.appendChild(nm);
      nav.appendChild(b); nav.appendChild(right);
      s.insertBefore(nav, s.firstChild);
    });
  }
  function show(id, push) {
    qa(".screen").forEach(function (s) { s.classList.toggle("on", s.id === id); });
    current = id;
    if (push !== false) { try { history.pushState({ s: id }, "", "#" + id); } catch (e) {} }
    window.scrollTo(0, 0);
    if (id === "form") renderSummary();
    var h = $(id).querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) {} }
    prefetchNext(id);
  }
  window.addEventListener("popstate", function (e) {
    var s = (e.state && e.state.s) || "cover";
    if (s === "result") s = "form";
    show(s, false);
  });
  var routeFrom = "program";
  function prefetchNext(id) {
    var i = ORDER.indexOf(id); var next = { cover: "img/city.webp", hello: "img/route.webp" }[id];
    if (next && "requestIdleCallback" in window) requestIdleCallback(function () { var im = new Image(); im.src = next; });
  }

  /* ---------- опрос ---------- */
  function buildCountOptions(max) {
    var box = $("countOpts"); box.textContent = "";
    var labels = { 1: ["Буду один", "только я", "user"], 2: ["Будем вдвоём", "я и ещё один гость", "users"], 3: ["Будем втроём", "я и ещё двое", "users"], 4: ["Будем вчетвером", "я и ещё трое", "users"] };
    for (var n = 1; n <= max; n++) {
      var b = document.createElement("button"); b.type = "button"; b.className = "opt" + (n === 1 ? " first" : ""); b.setAttribute("data-count", n);
      b.innerHTML = '<span class="ic"></span><span class="tx"></span><span class="ch"></span>';
      b.querySelector(".ic").innerHTML = n === 1
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.5-4 3.5-6 7.5-6s7 2 7.5 6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8.5" r="3.4"/><path d="M2.5 20c.4-3.6 3-5.3 6.5-5.3s6.1 1.7 6.5 5.3"/><circle cx="17" cy="9.5" r="2.8"/><path d="M17.5 14.8c2.4.1 3.8 1.6 4 4.2"/></svg>';
      var tx = b.querySelector(".tx"); tx.textContent = labels[n][0];
      var sm = document.createElement("small"); sm.textContent = labels[n][1]; tx.appendChild(sm);
      b.addEventListener("click", (function (k) { return function () { state.count = k; show("drinks"); }; })(n));
      box.appendChild(b);
    }
  }
  function setupSurvey() {
    qa("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { var t = b.getAttribute("data-go"); if (t === "route") routeFrom = current; show(t); });
    });
    $("routeBack").addEventListener("click", function () { history.back(); });
    qa("[data-attend]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.attend = b.getAttribute("data-attend");
        if (state.attend === "no") { state.count = 0; state.drinks = []; show("form"); }
        else { if (!state.count) state.count = 1; show("count"); }
      });
    });
    buildCountOptions(2);
    qa(".dr").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-d"), on = b.getAttribute("aria-pressed") !== "true";
        if (v === NONE && on) state.drinks = [NONE];
        else if (on) state.drinks = state.drinks.filter(function (x) { return x !== NONE; }).concat([v]);
        else state.drinks = state.drinks.filter(function (x) { return x !== v; });
        qa(".dr").forEach(function (x) { x.setAttribute("aria-pressed", state.drinks.indexOf(x.getAttribute("data-d")) >= 0 ? "true" : "false"); });
      });
    });
    $("drinksNext").addEventListener("click", function () { show("form"); });
    $("editAnswers").addEventListener("click", function () { show("attend"); });
    $("rsvpForm").addEventListener("submit", onSubmit);
  }
  function renderSummary() {
    $("sAttend").textContent = state.attend ? ATTEND[state.attend] : "Не выбрано";
    var no = state.attend === "no";
    $("rCount").hidden = no; $("rDrinks").hidden = no;
    $("sCount").textContent = COUNT[state.count] || (state.count + " чел.");
    $("sDrinks").textContent = state.drinks.join(", ") || "не указаны";
    setErr("");
  }
  function setErr(t) { var e = $("formErr"); e.textContent = t || ""; e.hidden = !t; }

  /* ---------- отправка ---------- */
  function buildAnswer() {
    return {
      guestId: guest ? guest.id : (guestId || anonId()),
      known: !!guest,
      first: $("first").value.trim(), last: $("last").value.trim(),
      attend: state.attend,
      count: state.attend === "no" ? 0 : state.count,
      drinks: state.attend === "no" ? [] : state.drinks.slice(),
      comment: $("comment").value.trim().slice(0, 300),
      website: $("website").value
    };
  }
  /* Успехом считается ТОЛЬКО ответ сервера 2xx с телом {ok:true}. Всё остальное: честная ошибка. */
  function send(answer) {
    if (!base()) return Promise.reject({ code: "no_endpoint" });
    return fetchJson(base() + "/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answer) }, 12000)
      .then(function (r) {
        if (r.ok && r.json && r.json.ok === true) return r.json;
        throw { code: "server", status: r.status, error: r.json && r.json.error };
      }, function (e) { throw { code: "network", err: e }; });
  }
  function onSubmit(ev) {
    ev.preventDefault();
    if (!state.attend) { setErr("Выберите, придёте ли вы."); return; }
    var a = buildAnswer();
    if (!a.first) { setErr("Укажите имя."); $("first").focus(); return; }
    if (!a.last) { setErr("Укажите фамилию."); $("last").focus(); return; }
    setErr(""); lastAnswer = a; doSend();
  }
  function doSend() {
    var btn = $("submitBtn"); btn.disabled = true; btn.firstChild.textContent = "Отправляем… ";
    send(lastAnswer).then(function () { btn.disabled = false; btn.firstChild.textContent = "Подтвердить ответ "; showResult(true); },
      function (e) { btn.disabled = false; btn.firstChild.textContent = "Подтвердить ответ "; showResult(false, e); });
  }

  function summaryRows(a) {
    var s = $("resSum"); s.textContent = "";
    function row(k, v) { var d = document.createElement("div"); d.className = "row"; var sp = document.createElement("span"), st = document.createElement("strong"); sp.textContent = k; st.textContent = v; d.appendChild(sp); d.appendChild(st); s.appendChild(d); }
    row("Гость", a.first + " " + a.last);
    row("Присутствие", ATTEND[a.attend]);
    if (a.attend !== "no") { row("Гостей", COUNT[a.count] || String(a.count)); row("Напитки", a.drinks.join(", ") || "не указаны"); }
  }
  function btn(txt, cls, fn) { var b = document.createElement("button"); b.type = "button"; b.className = "btn " + (cls || ""); b.textContent = txt; b.addEventListener("click", fn); return b; }
  function showResult(okay, err) {
    var a = lastAnswer, seal = $("seal"), acts = $("resActions"), note = $("resNote");
    acts.textContent = ""; note.hidden = true; summaryRows(a);
    seal.className = "seal" + (okay ? "" : " bad");
    seal.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (okay ? '<path d="M5 12.5l4.5 4.5L19 7.5"/>' : '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.5v.2"/>') + '</svg>';
    if (okay) {
      $("resTitle").textContent = "Спасибо!";
      $("resText").textContent = a.attend === "no" ? "Жаль, что в этот раз не получится. Ваш ответ передан Андрею." : "Ваш ответ отправлен Андрею. До встречи 21 декабря!";
      if (a.attend !== "no") acts.appendChild(btn("Добавить в календарь", "", calendar));
      acts.appendChild(btn("Изменить ответ", "ghost", function () { show("attend"); }));
    } else {
      $("resTitle").textContent = "Ответ пока не отправлен";
      var why = err && err.code === "no_endpoint"
        ? "Приём ответов ещё не подключён (это демо-версия приглашения)."
        : (err && err.code === "server" ? (err.status >= 400 && err.status < 500 ? "Сервер не принял ответ (проверьте имя и фамилию)." : "Сервер сейчас не отвечает. Повторите чуть позже.") : "Нет связи с сервером. Проверьте интернет и повторите.");
      $("resText").textContent = why + " Андрей этот ответ пока не получил.";
      acts.appendChild(btn("Повторить отправку", "", function () { show("form"); setTimeout(doSend, 0); }));
      acts.appendChild(btn("Скопировать ответ и отправить Андрею", "ghost", shareAnswer));
      acts.appendChild(btn("Исправить ответ", "ghost", function () { show("form"); }));
      note.textContent = "Если отправка не получается, скопируйте ответ и перешлите его Андрею в личном сообщении.";
      note.hidden = false;
    }
    show("result");
  }
  function message() {
    var a = lastAnswer;
    return "Юбилей Андрея Белинского, 21 декабря 2026\nИмя: " + a.first + " " + a.last + "\nПрисутствие: " + ATTEND[a.attend] +
      "\nКоличество гостей: " + a.count + "\nНапитки: " + (a.drinks.join(", ") || "не указаны") + (a.comment ? "\nКомментарий: " + a.comment : "");
  }
  function shareAnswer() {
    var t = message();
    if (navigator.share) { navigator.share({ title: "Ответ на приглашение", text: t }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { alert("Ответ скопирован. Отправьте его Андрею в сообщении."); }, function () { prompt("Скопируйте ответ:", t); });
    else prompt("Скопируйте ответ:", t);
  }
  function calendar() {
    var c = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invite//RU", "BEGIN:VEVENT", "UID:andrey50-20261221@invitation", "DTSTAMP:20261029T090000Z",
      "DTSTART:20261221T143000Z", "DTEND:20261221T200000Z", "SUMMARY:Юбилей Андрея Белинского — 50 лет",
      "LOCATION:ЦМТ, Краснопресненская наб. 12, зал Дорчестер, подъезд 10", "DESCRIPTION:Сбор гостей 17:30, банкет 18:00", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([c], { type: "text/calendar;charset=utf-8" }));
    a.download = "yubiley-andreya-21-dekabrya.ics"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  /* ---------- снег (редкий, только обложка) ---------- */
  function snow() {
    if (reduce) return;
    var box = $("snow"), n = 16;
    for (var i = 0; i < n; i++) {
      var f = document.createElement("i"), s = 2 + Math.random() * 3.5;
      f.style.cssText = "left:" + (Math.random() * 100) + "%;width:" + s + "px;height:" + s + "px;opacity:" + (0.5 + Math.random() * .45) +
        ";animation-duration:" + (11 + Math.random() * 12) + "s;animation-delay:-" + (Math.random() * 20) + "s;--dx:" + (Math.random() * 60 - 30) + "px";
      box.appendChild(f);
    }
  }

  buildNav(); setupSurvey(); snow();
  try { history.replaceState({ s: "cover" }, "", location.pathname + location.search); } catch (e) {}
  loadGuest().then(applyGuest);
})();
