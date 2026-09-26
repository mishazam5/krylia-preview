/* ==========================================================================
   «Стоимость и поступление»: движение и список «что взять».

   У каждого приёма причина:
   - первый экран собирается в порядке чтения (Kit.pageHero);
   - цена набегает до 33 000: это главный ответ страницы;
   - карточки скидок выпрямляются из наклона, как ярлыки, которые
     кладут на стол: условия приходят одно за другим;
   - стулья свободных мест загораются по одному: места считаются поштучно;
   - номер шага слева меняется, когда шаг доезжает до середины экрана:
     родитель видит, на каком он шаге из четырёх;
   - галочки в списке ставит сам родитель, отметки помнит его браузер.

   Закреплённых секций нет, липкие колонки делает CSS.
   ========================================================================== */
(function () {
  'use strict';

  var K = window.Kit;
  if (!K) return;
  var G = K.G, ST = K.ST, MOTION = K.MOTION, EASE = K.EASE;

  /* Стулья собирает сборщик из content/data/mesta.json (tools/mesta.mjs):
     их столько, сколько мест, и без сценария они тоже на месте */


  /* 01. Первый экран */
  K.pageHero();


  /* Появление по ролям */
  K.rise([
    '.pv-full__ask, .pv-seats .eyebrow, .pv-steps .eyebrow, .pv-seats__wait',
    '.pv-full__big, .pv-full__inc h2, .pv-seats__head h2, .so-steps__head h2, .pv-bring__head h2, .pv-paths__head h2, .pv-pay__text h2',
    '.pv-full__note, .pv-full__price .btn, .pv-seats__total span, .pv-bring__head p, .pv-paths__head p, .pv-pay__lead, .pv-pay__note',
    '.pv-full__list li, .pv-groups li, .so-step, .pv-check li, .pv-path, .pv-pay__rows li'
  ]);


  /* ------------------------------------------------------------------------
     02. Цена «Полного дня» и итог мест (23.09, клиент: «не при скролле,
     просто анимация появления счётчика»). Раньше число вела прокрутка
     (countScrub): оно менялось, пока листаешь. Теперь раздел показался,
     и число один раз набегает за 1,2 с; стулья загораются по одному.
     ------------------------------------------------------------------------ */
  function spaced(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }
  function countOnce(el, from) {
    if (!el) return;
    var to = parseFloat(el.getAttribute('data-to'));
    if (isNaN(to)) return;
    var o = { v: to * from };
    el.textContent = spaced(o.v);
    ST.create({
      trigger: el, start: K.enter, once: true,
      onEnter: function () {
        G.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: function () { el.textContent = spaced(o.v); } });
      }
    });
  }

  if (MOTION) {
    countOnce(document.querySelector('.pv-full__big b'), .6);
    countOnce(document.querySelector('.pv-seats__total b'), 0);

    document.querySelectorAll('.pv-groups li').forEach(function (li) {
      var chairs = li.querySelectorAll('.pv-chairs i');
      if (!chairs.length) return;
      ST.create({
        trigger: li, start: K.enter, once: true,
        onEnter: function () {
          chairs.forEach(function (c, i) {
            setTimeout(function () { c.classList.add('is-lit'); }, 350 + i * 140);
          });
        }
      });
    });
  } else {
    document.querySelectorAll('.pv-chairs i').forEach(function (c) { c.classList.add('is-lit'); });
  }


  /* ------------------------------------------------------------------------
     04. Шаги (20.09): линия пути над карточками, код из js/so.js
     ------------------------------------------------------------------------ */
  var path = document.querySelector('.so-steps__path');
  if (path && MOTION) {
    var dots = [].slice.call(path.querySelectorAll('li'));
    var paintPath = function (self) {
      var p = self.progress;
      path.style.setProperty('--p', p.toFixed(3));
      dots.forEach(function (d, i) { d.classList.toggle('on', p >= i / (dots.length - 1) - .01); });
    };
    var pr = K.scrubRange(path);
    ST.create({ trigger: path, start: pr.start, end: pr.end, scrub: true, onUpdate: paintPath, onRefresh: paintPath });
  }


  /* ------------------------------------------------------------------------
     05. Список «что взять»: отметки в памяти браузера.
     Хранилище может быть недоступно (приватный режим): тогда список
     просто работает без памяти.
     ------------------------------------------------------------------------ */
  var list = document.querySelector('[data-checklist]');
  if (list) {
    var KEY = 'krylia-postuplenie-checklist';
    var boxes = [].slice.call(list.querySelectorAll('input[type="checkbox"]'));
    var done = document.querySelector('.pv-bring__done');
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

    var refresh = function () {
      var all = boxes.every(function (b) { return b.checked; });
      if (done) done.hidden = !all;
    };
    boxes.forEach(function (b) {
      b.checked = !!saved[b.name];
      b.addEventListener('change', function () {
        saved[b.name] = b.checked;
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* без памяти */ }
        refresh();
        if (b.checked && MOTION) {
          G.fromTo(b.closest('li'), { x: 0 }, { x: 6, duration: .12, yoyo: true, repeat: 1, ease: 'power1.inOut' });
        }
      });
    });
    refresh();
  }
})();
