/* ==========================================================================
   «Переход на семейное»: движение. Пересобрано 20.09 вместе со страницей.

   Только приёмы, принятые на «Школьной программе» и «Подготовке»:
   - первый экран собирается в порядке чтения (Kit.pageHero);
   - всё остальное появляется по ролям (каскад дистанцией);
   - линия пути над шагами дорисовывается прокруткой и к покою раздела
     стоит целиком (правило 4, точки из K.scrubRange);
   - мифы переворачиваются по нажатию, счётчик «проверено» растёт;
     прокрутка их не трогает.
   Закреплённых секций нет. Прежний сценарий: git show 6a8e523:js/so.js.
   ========================================================================== */
(function () {
  'use strict';

  var K = window.Kit;
  if (!K) return;
  var ST = K.ST, MOTION = K.MOTION;


  /* 01. Первый экран */
  K.pageHero();


  /* Появление по ролям: подпись, заголовок, текст, карточка */
  K.rise([
    '.sk-res__ask, .so-myths__hint, .so-myths__count, .sk-half__age',
    '.so-law__head h2, .so-steps__head h2, .so-myths__head h2, .sk-res h2, .sk-two__head h2, .so-note__head h2',
    '.so-law__head p, .so-steps__head p, .sk-res__lead, .so-exam__note, .sk-two__head p, .so-note__head p, .so-note__foot',
    '.so-art, .so-step, .so-myths__list > li, .sk-res__f, .sk-two__split, .so-note__paper, .so-note__notes li'
  ]);


  /* 03. Линия пути над шагами: точка загорается, когда линия до неё дошла */
  var path = document.querySelector('.so-steps__path');
  if (path && MOTION) {
    var dots = [].slice.call(path.querySelectorAll('li'));
    var paint = function (self) {
      var p = self.progress;
      path.style.setProperty('--p', p.toFixed(3));
      dots.forEach(function (d, i) { d.classList.toggle('on', p >= i / (dots.length - 1) - .01); });
    };
    var r = K.scrubRange(path);
    ST.create({ trigger: path, start: r.start, end: r.end, scrub: true, onUpdate: paint, onRefresh: paint });
  }


  /* 04. Мифы: нажатие переворачивает карточку, счётчик считает проверенные */
  var myths = document.querySelectorAll('.so-myth');
  var count = document.querySelector('.so-myths__count');
  if (myths.length && count) {
    var n = count.querySelector('.so-myths__n');
    myths.forEach(function (m) {
      m.addEventListener('click', function () {
        m.setAttribute('aria-pressed', m.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        n.textContent = document.querySelectorAll('.so-myth[aria-pressed="true"]').length;
        count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump');
      });
    });
  }
})();
