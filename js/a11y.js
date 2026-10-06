/* ==========================================================================
   Версия для слабовидящих «Крыльев».

   Включается значком глаза в шапке, строкой в меню и ссылкой в подвале.
   Настройки лежат в памяти браузера (krylia-a11y) и переходят со страницы
   на страницу. Классы на <html> ставит маленький скрипт в <head> ещё до
   отрисовки, этот файл только управляет кнопками.

   Включение и выключение перезагружают страницу. Закрепления и анимации
   GSAP создаются один раз при загрузке, и снять их на ходу так, чтобы
   ничего не осталось сдвинутым, надёжнее перезагрузкой. Размер, цвет
   и остальное внутри режима меняются сразу, без перезагрузки.

   Память браузера может быть недоступна (приватный режим, запрет сайтам):
   тогда режим всё равно включается на текущей странице, просто не
   запоминается.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'krylia-a11y';
  var root = document.documentElement;
  var DEF = { on: false, size: 1, scheme: 'bw', space: 1, noimg: 0, serif: 0 };

  function load() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { s = {}; }
    for (var k in DEF) if (!(k in s)) s[k] = DEF[k];
    return s;
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }

  var state = load();
  /* Если память недоступна, а режим включён классом по кнопке,
     состояние берём с самой страницы */
  if (root.classList.contains('a11y')) state.on = true;

  function apply() {
    var c = root.classList;
    [].slice.call(c).forEach(function (n) { if (/^a11y-(size|scheme|space)-/.test(n)) c.remove(n); });
    c.add('a11y-size-' + state.size, 'a11y-scheme-' + state.scheme, 'a11y-space-' + state.space);
    c.toggle('a11y-noimg', !!+state.noimg);
    c.toggle('a11y-serif', !!+state.serif);
    document.querySelectorAll('.a11y-panel [data-a11y]').forEach(function (b) {
      var on = String(state[b.getAttribute('data-a11y')]) === b.getAttribute('data-v');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-a11y-toggle]').forEach(function (b) {
    b.setAttribute('aria-pressed', state.on ? 'true' : 'false');
    b.addEventListener('click', function () {
      state.on = !state.on;
      if (save(state)) {
        location.reload();
      } else if (state.on) {
        /* Без памяти: включаем здесь же, движение уже запущено,
           поэтому всё равно перезагрузка не поможет, просто ставим классы */
        root.classList.add('a11y');
        apply();
        window.scrollTo(0, 0);
      } else {
        root.classList.remove('a11y');
        location.reload();
      }
    });
  });

  document.querySelectorAll('.a11y-panel [data-a11y]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-a11y'), v = b.getAttribute('data-v');
      state[k] = (k === 'scheme') ? v : +v;
      save(state);
      apply();
    });
  });

  if (state.on) apply();
})();
