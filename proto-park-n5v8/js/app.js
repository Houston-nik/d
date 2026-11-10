(function () {
  var KEY = "kometa-concept";
  var root = document.documentElement;

  function concept() {
    return root.getAttribute("data-concept") === "b" ? "b" : "a";
  }

  function setConcept(value) {
    var next = value === "b" ? "b" : "a";
    root.setAttribute("data-concept", next);
    root.setAttribute("data-concept-tick", String(Date.now()));
    var n = (parseInt(root.getAttribute("data-concept-n") || "0", 10) + 1);
    root.setAttribute("data-concept-n", String(n));
    try { localStorage.setItem(KEY, next); } catch (e) {}
    document.querySelectorAll("[data-concept-btn]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-concept-btn") === next ? "true" : "false");
    });
    var live = document.querySelector("[data-concept-live]");
    if (live) live.textContent = "Сейчас концепция " + next.toUpperCase() + " · " + n;
  }

  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "a" || saved === "b") setConcept(saved);
    else setConcept(concept());
  } catch (e) {
    setConcept(concept());
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-concept-btn]");
    if (btn) {
      ev.preventDefault();
      setConcept(btn.getAttribute("data-concept-btn"));
    }
    var menu = ev.target.closest("[data-menu]");
    if (menu) {
      var drawer = document.querySelector(".drawer");
      if (drawer) drawer.classList.toggle("open");
    }
    var closer = ev.target.closest("[data-close], .close");
    if (closer) {
      var modal = closer.closest(".modal, [data-modal], dialog");
      if (modal) modal.classList.remove("open");
    }
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      document.querySelectorAll(".drawer.open").forEach(function (el) { el.classList.remove("open"); });
    }
  });

  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = form.querySelector(".okmsg");
      if (ok) ok.classList.add("show");
      form.reset();
    });
  });

  var params = new URLSearchParams(location.search);
  var hash = (location.hash || "").replace("#", "");
  document.querySelectorAll("[data-detail]").forEach(function (panel) {
    var id = panel.getAttribute("data-detail");
    var active = hash || params.get("id") || "karting";
    panel.hidden = id !== active;
  });

  var book = document.querySelector("[data-book]");
  if (book) initBooking(book, params.get("attr") || hash || "karting");

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    var heroImg = document.querySelector(".hero-visual img");
    if (heroImg) {
      window.addEventListener("scroll", function () {
        var y = Math.min(window.scrollY, 400);
        heroImg.style.transform = "scale(1.08) translateY(" + (y * 0.12) + "px)";
      }, { passive: true });
    }
  }

  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target) return;
    var started = false;
    function run() {
      if (started) return;
      started = true;
      var cur = 0;
      var step = Math.max(1, Math.round(target / 28));
      var t = setInterval(function () {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(t); }
        el.textContent = String(cur);
      }, 30);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) run();
      }, { threshold: 0.4 });
      io.observe(el);
    } else run();
  });

  function initBooking(rootEl, preset) {
    var state = { attr: preset, date: "", time: "", people: 4, duration: "60" };
    var catalog = {
      karting: { name: "Голографический картинг", unit: 1800 },
      mrcs: { name: "MRCS-арена", unit: 4000 },
      vr: { name: "VR-аттракционы", unit: 900 },
      ps5: { name: "PlayStation 5", unit: 600 },
      birthday: { name: "День рождения", unit: 18000 },
      events: { name: "Групповое мероприятие", unit: 25000 }
    };
    var busy = { "13:00": true, "16:00": true };
    function money(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
    }
    function estimate() {
      var item = catalog[state.attr];
      if (!item) return 0;
      var dur = parseInt(state.duration, 10) || 60;
      var people = state.people || 1;
      if (state.attr === "birthday" || state.attr === "events") return item.unit;
      if (state.attr === "mrcs") return item.unit * Math.max(1, Math.round(dur / 30));
      if (state.attr === "ps5") return item.unit * Math.max(1, Math.round(dur / 60));
      return item.unit * people * Math.max(1, Math.round(dur / 15));
    }
    function renderSummary() {
      var item = catalog[state.attr] || { name: "Не выбрано" };
      var map = {
        attr: item.name,
        date: state.date || "не выбрана",
        time: state.time || "не выбрано",
        people: String(state.people),
        duration: state.duration + " мин",
        total: money(estimate())
      };
      Object.keys(map).forEach(function (k) {
        rootEl.querySelectorAll("[data-sum='" + k + "']").forEach(function (n) { n.textContent = map[k]; });
      });
    }
    function markChoices() {
      rootEl.querySelectorAll("[data-attr]").forEach(function (el) {
        el.classList.toggle("selected", el.getAttribute("data-attr") === state.attr);
      });
      rootEl.querySelectorAll("[data-slot]").forEach(function (el) {
        el.classList.toggle("selected", el.getAttribute("data-slot") === state.time);
      });
      var peopleOut = rootEl.querySelector("[data-people]");
      if (peopleOut) peopleOut.textContent = state.people;
      var dur = rootEl.querySelector("[name=duration]");
      if (dur) dur.value = state.duration;
    }
    function setStep(n) {
      rootEl.querySelectorAll("[data-step-label]").forEach(function (el, i) {
        el.classList.toggle("on", i < n);
      });
    }
    rootEl.querySelectorAll("[data-attr]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.attr = el.getAttribute("data-attr");
        markChoices(); renderSummary(); setStep(2);
      });
    });
    rootEl.querySelectorAll("[data-slot]").forEach(function (el) {
      var t = el.getAttribute("data-slot");
      if (busy[t]) {
        el.disabled = true;
        el.setAttribute("aria-disabled", "true");
      }
      el.addEventListener("click", function () {
        if (el.disabled) return;
        state.time = t;
        markChoices(); renderSummary(); setStep(4);
      });
    });
    var dateInput = rootEl.querySelector("[name=date]");
    if (dateInput) {
      dateInput.min = new Date().toISOString().slice(0, 10);
      dateInput.addEventListener("change", function () {
        state.date = dateInput.value;
        renderSummary(); setStep(3);
      });
    }
    rootEl.querySelectorAll("[data-people-btn]").forEach(function (el) {
      el.addEventListener("click", function () {
        var d = parseInt(el.getAttribute("data-people-btn"), 10);
        state.people = Math.min(12, Math.max(1, state.people + d));
        markChoices(); renderSummary();
      });
    });
    var dur = rootEl.querySelector("[name=duration]");
    if (dur) dur.addEventListener("change", function () {
      state.duration = dur.value; renderSummary();
    });
    var form = rootEl.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        if (!state.attr || !state.date || !state.time) {
          var warn = rootEl.querySelector("[data-warn]");
          if (warn) {
            warn.textContent = "Выберите развлечение, дату и свободное время.";
            warn.classList.add("show");
          }
          return;
        }
        rootEl.querySelector(".book-main").classList.add("hide");
        var box = rootEl.querySelector(".success");
        if (box) box.classList.add("show");
        renderSummary(); setStep(6);
      });
    }
    markChoices(); renderSummary(); setStep(1);
  }
})();
