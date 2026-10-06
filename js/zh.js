/* ==========================================================================
   «Жизнь клуба»: движение. Пересобрано 20.09 вместе со страницей.
   - первый экран собирается в порядке чтения (Kit.pageHero);
   - год в клубе: экран закреплён, лента традиций едет вбок на столько,
     на сколько прокрутили вниз (приём «Атмосферы»);
   - остальное появляется по ролям.
   Прежний сценарий: git show 1008afc:js/zh.js.
   ========================================================================== */
(function () {
  'use strict';

  var K = window.Kit;
  if (!K) return;
  var G = K.G, ST = K.ST, MOTION = K.MOTION;

  K.pageHero();

  /* 26.09: в роли добавлены новые разделы (работы детей, награды, книги).
     Строки книг поимённо не появляются: их тридцать, и каждая со своим
     ходом читалась бы как рябь. Появляется раздел целиком. */
  K.rise([
    '.sk-res__ask, .zh-vk p, .zh-kn .eyebrow',
    '.sk-atm__head h2, .sk-res h2, .zh-chron__head h2, .zh-vk h2, .zh-vk .eyebrow, .zh-proof h2, .zh-kn__head h2',
    '.sk-atm__head p, .sk-atm__meter, .sk-res__lead, .zh-chron__head p, .zh-vk__text > p, .zh-vk__btn, .zh-proof__lead, .zh-proof .h-more, .zh-kn__intro p',
    '.sk-res__pic, .sk-res__f, .zh-ev, .zh-vk__pic, .zh-proof__pic, .zh-proof__cup, .zh-figs li, .zh-nag__i, .zh-kn__col, .zh-kn__tips'
  ]);



  /* ------------------------------------------------------------------------
     02. Год в клубе (20.09): лента «Атмосферы» «Школьной программы»,
     код из js/shkola.js без изменений. Там же: фотолента «Династии» (vera-landing, js/main.js,
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
