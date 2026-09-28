/* ==========================================================================
   «Кружки»: фильтр каталога и движение.

   У каждого приёма причина:
   - первый экран собирается в порядке чтения (Kit.pageHero);
   - фильтр по направлениям: оставшиеся карточки переезжают на новые
     места (приём FLIP: запомнить, где стояли, переставить, доехать),
     новые проявляются, лишние гаснут. Глаз видит, что осталось,
     а сетка не мигает. Число занятий пересчитывается;
   - в «Как записаться» линия через номера заливается, номера
     загораются по очереди: последовательность.

   Фильтр работает и без движения (просто скрывает карточки). Без
   сценария кнопки фильтра не показываются, видны все карточки.
   ========================================================================== */
(function () {
  'use strict';

  var K = window.Kit;
  var G = K && K.G, ST = K && K.ST, MOTION = K && K.MOTION, EASE = K && K.EASE;


  /* ------------------------------------------------------------------------
     02. Фильтр каталога
     ------------------------------------------------------------------------ */
  var filter = document.querySelector('.kr-filter');
  var cards = [].slice.call(document.querySelectorAll('.kr-card'));
  var countEl = document.querySelector('.kr-cat__count b');
  var countWord = document.querySelector('.kr-cat__count span');

  function plural(n) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'кружок';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'кружка';
    return 'кружков';
  }

  if (filter && cards.length) {
    filter.hidden = false;
    var buttons = [].slice.call(filter.querySelectorAll('button'));

    var apply = function (f) {
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === f)); });
      var show = function (c) { return f === 'all' || c.getAttribute('data-dir') === f; };

      /* FLIP: первые положения видимых карточек */
      var first = new Map();
      if (MOTION) cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });

      cards.forEach(function (c) { c.hidden = !show(c); });
      var visible = cards.filter(function (c) { return !c.hidden; });
      if (countEl) countEl.textContent = visible.length;
      if (countWord) countWord.textContent = plural(visible.length);

      /* Каталог после фильтра короче. Если родитель нажал фильтр,
         прокрутив карточки, поднимаем начало каталога под липкую строку,
         иначе на экране окажется следующий блок, а не найденное.
         Пересчёт ScrollTrigger откладываем до конца прокрутки: вызванный
         сразу, он сбивал плавную прокрутку. */
      var head = document.querySelector('.kr-cat__head');
      var hdr = K && K.hdr ? K.hdr() : 84;
      var target = head.getBoundingClientRect().top + window.scrollY - hdr - 16;
      if (window.scrollY > target + 2) {
        window.scrollTo({ top: target, behavior: MOTION ? 'smooth' : 'auto' });
      }
      if (ST) setTimeout(function () { ST.refresh(); }, 700);

      if (!MOTION) return;
      visible.forEach(function (c, i) {
        var was = first.get(c);
        var now = c.getBoundingClientRect();
        G.killTweensOf(c);
        if (was) {
          G.fromTo(c, { x: was.left - now.left, y: was.top - now.top, opacity: 1 }, { x: 0, y: 0, duration: .6, ease: EASE });
        } else {
          G.fromTo(c, { opacity: 0, y: 30, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: EASE, delay: Math.min(i, 8) * .035 });
        }
      });
      if (countEl) G.fromTo(countEl, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: EASE });
    };

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-f')); });
    });
  }

  if (!K) return;


  /* 01. Первый экран */
  K.pageHero();


  /* Появление по ролям */
  K.rise([
    '.kr-cat__note, .zh-rab .eyebrow',
    '.kr-cat__head h2, .kr-how h2, .kr-why__head h2, .sk-atm__head h2, .zh-rab__head h2',
    '.kr-filter, .kr-how__head p, .kr-why__head p, .kr-call, .sk-atm__head p, .sk-atm__meter, .zh-rab__lead',
    '.kr-steps li, .kr-why__nums li, .zh-rab__works > li'
  ]);

  /* Карточки каталога проявляются рядами при первом показе */
  if (MOTION) {
    G.set(cards, { opacity: 0, y: 40 });
    ST.batch(cards, {
      start: K.enter, once: true,
      onEnter: function (batch) {
        G.to(batch, { opacity: 1, y: 0, duration: .8, ease: EASE, stagger: .06 });
      }
    });
  }


  /* ------------------------------------------------------------------------
     04. Как записаться (20.09): линия пути над шагами, код из js/so.js
     ------------------------------------------------------------------------ */
  var path = document.querySelector('.kr-path');
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

  /* 02. Число занятий набегает */
  var n30 = document.querySelector('.kr-why__nums b[data-to]');
  if (n30 && MOTION) K.countScrub(n30);


  /* ------------------------------------------------------------------------
     04а. «Как это выглядит» (21.09): лента «Атмосферы» «Школьной
     программы», код из js/shkola.js без изменений. Там же: фотолента «Династии» (vera-landing, js/main.js,
     «горизонтальный проезд»). Экран закрепляется, лента едет вбок ровно
     на столько, на сколько прокрутили вниз: длина закрепления = ход ленты.
     Счётчик и полоса показывают, где мы. Закрепление создаётся здесь,
     до стопки ниже: GSAP считает точки в порядке создания.
     На телефоне и без движения лента листается пальцем (класс is-swipe),
     счётчик следит за scrollLeft.
     ------------------------------------------------------------------------ */
  var atm = document.querySelector('.sk-atm');
  if (atm) {
    var aView = atm.querySelector('.sk-atm__view');
    var aTrack = atm.querySelector('.sk-atm__track');
    var aBar = atm.querySelector('.sk-atm__bar i');
    var aNum = atm.querySelector('.sk-atm__count b');
    var aN = aTrack.children.length;
    var meter = function (p) {
      aBar.style.width = (p * 100).toFixed(1) + '%';
      var n = Math.min(aN, Math.round(p * (aN - 1)) + 1);
      aNum.textContent = n < 10 ? '0' + n : String(n);
    };
    var aRun = function () { return Math.max(0, aTrack.scrollWidth - aView.clientWidth); };
    var swipe = function () {
      atm.classList.add('is-swipe');
      var tick = false;
      aView.addEventListener('scroll', function () {
        if (tick) return; tick = true;
        requestAnimationFrame(function () {
          tick = false;
          var max = aView.scrollWidth - aView.clientWidth;
          meter(max > 8 ? aView.scrollLeft / max : 0);
        });
      }, { passive: true });
    };
    if (!MOTION) swipe();
    else {
      G.matchMedia().add('(min-width: 901px)', function () {
        atm.classList.remove('is-swipe');
        var tw = G.to(aTrack, {
          x: function () { return -aRun(); }, ease: 'none',
          scrollTrigger: {
            trigger: atm,
            start: function () { return 'top ' + K.hdr() + 'px'; },
            end: function () { return '+=' + aRun(); },
            pin: true, scrub: .4, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: function (self) { meter(self.progress); }
          }
        });
        return function () { tw.scrollTrigger && tw.scrollTrigger.kill(); G.set(aTrack, { clearProps: 'all' }); };
      });
      G.matchMedia().add('(max-width: 900px)', function () { swipe(); });
    }
    /* Снимки приезжают позже разметки: ход ленты пересчитываем по загрузке */
    [].forEach.call(atm.querySelectorAll('img'), function (img) {
      if (!img.complete) img.addEventListener('load', function () { if (ST) ST.refresh(); }, { once: true });
    });
  }

})();
