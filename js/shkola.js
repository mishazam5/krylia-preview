/* ==========================================================================
   «Семейные классы»: движение.

   Правило то же, что на главной: у каждого приёма есть причина.
   - Первый экран собирается в порядке чтения (Kit.pageHero).
   - В сравнении две половины съезжаются к стыку: это две стороны
     одного вопроса, и глаз должен прочитать их парой.
   - Шкала дня заливается прокруткой: день и есть время, которое идёт.
   - Цифры мест и выпуска набегают: это главный аргумент страницы.
   - Эллипс со снимком аттестатов раскрывается: доказательство
     открывается целиком (раздел «Подход» у «Ники»).
   - Стопка карточек из набора.

   Закреплённых секций на странице нет, поэтому порядок создания
   ScrollTrigger здесь ни на что не влияет; держим его сверху вниз
   по привычке главной.

   Если движение отключено в системе, всё стоит на местах: шкала залита,
   цифры готовые, эллипс вписан. Вкладки переключает main.js.
   ========================================================================== */
(function () {
  'use strict';

  var K = window.Kit;
  if (!K) return;
  var G = K.G, ST = K.ST, MOTION = K.MOTION, EASE = K.EASE;


  /* 01. Первый экран */
  K.pageHero();


  /* Появление по ролям: подпись, заголовок, текст, карточка */
  K.rise([
    '.sk-seats__head .eyebrow, .sk-res__ask, .zk-fit__hint, .zk-meter',
    '.sk-teachers__head h2, .sk-two__head h2, .sk-groups__top h2, .sk-seats__head h2, .sk-res h2, .sk-nou__head h2, .sk-bytovoe__head h2, .sk-atm__head h2, .zk-fit__head h2',
    '.sk-teachers__head p, .u-mf-sign, .sk-two__head p, .sk-seats__head p:not(.eyebrow), .sk-tabs, .sk-res__lead, .sk-res__subj, .sk-atm__head p, .sk-nou__head > p, .sk-nou__jury, .sk-bytovoe__head p, .sk-atm__meter, .zk-fit__end',
    '.sk-teach, .sk-usp__nums li, .sk-panel__day, .sk-panel__side, .sk-seat, .sk-res__pic, .sk-res__f, .sk-nou__nums li, .sk-nou__pic, .sk-q, .sk-bytovoe__list li, .zk-picks > li'
  ]);


  /* ------------------------------------------------------------------------
     02. УТП: цифра кружков набегает.
     03. Два подхода: половины съезжаются к стыку, потому что это две
     стороны одного вопроса. Разово, по единой точке enter.
     Скрываем здесь, а не в стилях: без сценария всё видно сразу.
     ------------------------------------------------------------------------ */
  if (MOTION) {
    var split = document.querySelector('.sk-two__split');
    if (split) {
      var ha = split.querySelector('.sk-half--a'), hb = split.querySelector('.sk-half--b');
      var wide = window.matchMedia('(min-width: 761px)').matches;
      G.set(ha, { opacity: 0, x: wide ? -80 : 0, y: wide ? 0 : 40 });
      G.set(hb, { opacity: 0, x: wide ? 80 : 0, y: wide ? 0 : 40 });
      ST.create({
        trigger: split, start: K.enter, once: true,
        onEnter: function () { G.to([ha, hb], { opacity: 1, x: 0, y: 0, duration: .9, ease: EASE, stagger: wide ? 0 : .12 }); }
      });
    }
    var n30 = document.querySelector('.sk-usp__nums b[data-to]');
    if (n30) K.countScrub(n30);
  }


  /* ------------------------------------------------------------------------
     03. Группы.
     Шкала дня: заливка линии идёт за прокруткой, отметка загорается,
     когда заливка до неё дошла. У скрытой вкладки высота нулевая,
     main.js после переключения вызывает ScrollTrigger.refresh(), и точки
     пересчитываются под открытую половину.
     ------------------------------------------------------------------------ */
  if (MOTION) {
    G.utils.toArray('[data-time]').forEach(function (list) {
      var items = [].slice.call(list.querySelectorAll('li'));
      var paint = function (p) {
        list.style.setProperty('--p', p.toFixed(3));
        var lr = list.getBoundingClientRect();
        items.forEach(function (li) {
          var mid = (li.offsetTop + li.offsetHeight / 2) / (lr.height || 1);
          li.classList.toggle('on', p >= mid - .02);
        });
      };
      ST.create({
        trigger: list, start: K.scrubRange(list).start, end: K.scrubRange(list).end, scrub: true,
        onUpdate: function (self) { paint(self.progress); },
        onRefresh: function (self) { paint(self.progress); }
      });
    });

    /* Смена вкладки: приходящая половина собирается дистанцией.
       Класс снимаем и ставим заново, чтобы анимация проигралась
       при каждом клике, а не только при первом. */
    var groups = document.querySelector('.sk-groups');
    if (groups) {
      groups.querySelectorAll('.sk-tabs button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          groups.classList.remove('is-switch');
          void groups.offsetWidth;
          groups.classList.add('is-switch');
        });
      });
    }
  }


  /* ------------------------------------------------------------------------
     04 и 05. Цифры набегают, когда карточка доехала до глаз
     ------------------------------------------------------------------------ */
  if (MOTION) {
    G.utils.toArray('.sk-seat__num b[data-to], .sk-res__f b[data-to], .sk-nou__nums b[data-to]').forEach(K.countScrub);
  }


  /* 05. Первый выпуск (20.09): тёмная панель, своего движения нет,
     только появление по ролям и цифры выше. Эллипс снят вместе с разделом. */


  /* ------------------------------------------------------------------------
     06. Атмосфера (20.09): фотолента «Династии» (vera-landing, js/main.js,
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


  /* ------------------------------------------------------------------------
     10. Кому подходят (20.09): механика «Подготовки», код из js/zk.js
     без изменений. Движение только в ответ на нажатие.
     ------------------------------------------------------------------------ */
  var picks = document.querySelectorAll('.zk-pick');
  var zmeter = document.querySelector('.zk-meter');
  var say = document.querySelector('.zk-fit__say');
  if (picks.length && zmeter && say) {
    var num = zmeter.querySelector('.zk-meter__n');
    var segs = zmeter.querySelectorAll('.zk-meter__bar i');
    var SAY = [
      'Нажмите на карточки, которые про вашего ребёнка',
      'Одно совпадение. Остальное видно на пробном дне',
      'Похоже на вас. Проверьте на пробном дне',
      'Это про вас. Приходите на пробный день',
      'Это про вас. Приходите на пробный день'
    ];
    picks.forEach(function (t) {
      t.addEventListener('click', function () {
        t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        var n = document.querySelectorAll('.zk-pick[aria-pressed="true"]').length;
        num.textContent = n;
        segs.forEach(function (sg, i) { sg.classList.toggle('is-on', i < n); });
        say.textContent = SAY[n];
        zmeter.classList.remove('is-bump'); void zmeter.offsetWidth; zmeter.classList.add('is-bump');
      });
    });
  }


  /* 06. Стопка карточек */
  K.stack('.h-card');
})();
