/* ==========================================================================
   «Подготовка к школе»: движение.

   У каждого приёма причина:
   - первый экран собирается в порядке чтения (Kit.pageHero);
   - текст о разрыве между садом и школой закрашивается словами:
     его нужно дочитать;
   - четыре довода: секция закреплена, карточки всплывают с разной
     скоростью и оседают вокруг снимка в эллипсе, эллипс растёт. Приём
     «Подхода» со страниц ступеней «Ники»: доводы собираются вокруг ребёнка;
   - точки недели заполняются одна за другой: это счёт занятий;
   - дорожка возрастов прорисовывается прокруткой: путь через годы;
   - цифра мест набегает, аватары педагогов сходятся внахлёст,
     слово педагога появляется целиком.

   ScrollTrigger создаются сверху вниз: закреплённая секция доводов
   сдвигает всё, что ниже, и GSAP считает точки в порядке создания.
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
    '.zk-week__note',
    '.zk-fit__hint, .zk-meter, .zk-week__side h2, .zk-fit__head h2, .zk-day__list h2, .h-boss__who',
    '.zk-fit__end, .u-mf-sign, .zk-week__head p, .zk-week__meta, .h-boss__quote, .h-hum__title',
    '.zk-picks > li, .zk-grp, .zk-day__steps li, .zk-day__price, .h-boss__facts, .h-hum__lead, .h-hum__note, .h-hum__pic, .h-boss__pic img'
  ]);


  /* 02а. Кому подходит: родитель нажимает карточки, шкала и вывод
     меняются. Движение только в ответ на нажатие, прокрутка его
     не запускает: к моменту чтения раздел стоит (правило 4) */
  var picks = document.querySelectorAll('.zk-pick');
  var meter = document.querySelector('.zk-meter');
  var say = document.querySelector('.zk-fit__say');
  if (picks.length && meter && say) {
    var num = meter.querySelector('.zk-meter__n');
    var segs = meter.querySelectorAll('.zk-meter__bar i');
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
        meter.classList.remove('is-bump'); void meter.offsetWidth; meter.classList.add('is-bump');
      });
    });
  }


  /* 02. Разрыв между садом и школой */
  /* 19.09 (клиент): раздел оформлен как манифест главной, закраска
     слов вернулась (была снята 18.09). Подключает kit.js по data-accent. */

  /* ------------------------------------------------------------------------
     03. Почему год (20.09): сцена по образцу «Бережно. Интересно. Всерьёз.»
     главной, код скопирован из js/home.js без изменений (там история
     каждой доли хода). Прежний снимок в арке: 0b8f127.
     ------------------------------------------------------------------------ */
  var hdr = K.hdr, countUp = K.countUp;
  var why = document.querySelector('.h-why');
  /* Снимок в эллипсе: после загрузки перерисовать маску (см. home.css) */
  var whyImg = why && why.querySelector('.h-why__photo img');
  if (whyImg) {
    var repaint = function () {
      var ph = whyImg.parentNode;
      ph.style.transform = 'translateZ(0)';
      requestAnimationFrame(function () { ph.style.transform = ''; });
    };
    if (whyImg.complete && whyImg.naturalWidth) repaint();
    else whyImg.addEventListener('load', repaint, { once: true });
  }
  if (why && MOTION) {
    var photo = why.querySelector('.h-why__photo');
    var pimg = photo.querySelector('img');
    var cardsBox = why.querySelector('.h-why__cards');
    var facts = G.utils.toArray(why.querySelectorAll('.h-fact'));
    var wtitle = why.querySelector('.h-why__title');
    var final = why.querySelector('.h-why__final');
    var veil = why.querySelector('.h-why__veil');
    var bigT = why.querySelector('.h-why__big');
    var rooms = G.utils.toArray(why.querySelectorAll('.h-rooms li'));
    var goBox = why.querySelector('.h-why__go');
    var counted = false;

    G.matchMedia().add('(min-width: 901px)', function () {
      var H = function () { return why.querySelector('.h-why__stage').offsetHeight; };

      /* 18.09 (клиент): эллипс раскрывался больше экрана прокрутки, а после
         «Тысячи метров» стояла ещё треть экрана паузы. Скорость списка
         карточек оставлена прежней (те же ~2 экрана), раскрытие сжато
         с 0,3 до 0,17 доли хода, «Тысяча метров» проявляется уже во время
         раскрытия (кадр без текста давал ту самую паузу), хвост 0,03.
         Итого 0,69 доли вместо 0,96, и закрепление 2,4 экрана вместо 3,4.
         Второй заход того же дня: 0,12 доли (0,18 экрана) клиент назвал
         «скачком», 0,17 с разгоном и торможением дают около 0,6 экрана,
         инерция scrub .8 сглаживает рывки колеса. */
      var tl = G.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: why,
          start: function () { return 'top ' + hdr() + 'px'; },
          end: function () { return '+=' + window.innerHeight * 2.4; },
          pin: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (!counted && self.progress > .08) {
              counted = true;
              facts.forEach(function (f, i) {
                var b = f.querySelector('[data-to]');
                if (b) setTimeout(function () { countUp(b, 1.3); }, i * 120);
              });
            }
          }
        }
      });

      /* Список проезжает весь экран, как у «Ники»: снизу за кадром
         и до ухода за верхний край */
      tl.fromTo(cardsBox, { y: function () { return H(); } },
                          { y: function () { return -H() * 1.05; }, duration: .56 }, 0);
      /* Добавочная скорость у каждой карточки своя: глубина */
      facts.forEach(function (f) {
        var sp = parseFloat(f.getAttribute('data-speed')) || 0;
        tl.fromTo(f, { y: 0 }, { y: function () { return -H() * sp; }, duration: .56 }, 0);
      });

      tl.to(wtitle, { y: -80, opacity: 0, duration: .12, ease: 'power1.in' }, .36)
        /* 19.09 (клиент: «кружок иногда пропадает, фото вылезает сбоку»):
           было .to — начало раскрытия GSAP читал из текущего стиля, и после
           пересчёта (обновление с середины страницы, смена размера окна,
           догрузка картинок) началом становилось уже раскрытое состояние.
           Теперь начало задано явно, а центр овала не сдвигается: снимок
           всегда растёт из кружка. 125 %/140 % от центра 60/58 закрывают
           экран целиком. */
        /* 22.09: арка вместо эллипса (css/zk.css), растёт до полного экрана */
        .fromTo(photo, { '--t': '4%', '--r': '11%', '--b': '6%', '--l': '51%', '--rad': '280px' },
                       { '--t': '0%', '--r': '0%', '--b': '0%', '--l': '0%', '--rad': '0px', duration: .17, ease: 'power2.inOut' }, .46)
        .fromTo(pimg, { scale: 1.12 }, { scale: 1, duration: .17, ease: 'power2.inOut' }, .46)
        .to(veil, { opacity: 1, duration: .1, ease: 'power2.out' }, .54)
        .fromTo(final, { opacity: 0 }, { opacity: 1, duration: .06 }, .56)
        .fromTo(bigT, { y: -40 }, { y: 0, duration: .1, ease: 'power2.out' }, .56)
        .fromTo(rooms, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .08, stagger: .012, ease: 'power2.out' }, .57)
        .fromTo(goBox, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .08, ease: 'power2.out' }, .6)
        .to({}, { duration: .03 });

      return function () { G.set([cardsBox, facts, wtitle, final, photo, pimg, veil, bigT, rooms, goBox], { clearProps: 'all' }); };
    });
  }


  /* 04. Неделя: строки по частоте появляются по ролям, своего движения нет (20.09) */


  /* 05. «С чем ребёнок придёт в первый класс»: стопка карточек из набора */
  K.stack('.h-card');


  /* 05а. Схема здания «Что дальше».
     21.09 (клиент): «дом строился по мере прокрутки, выглядит не очень».
     Было: этажи загорались scrub'ом, и дом собирался ровно настолько,
     насколько прокрутили, а при прокрутке назад разбирался. Стало:
     обычная анимация, один раз при появлении раздела. Этаж подъезжает
     снизу на своё место и загорается, следующий встаёт на него,
     последней ложится крыша, выноски проявляются вместе со своим этажом.
     Прокрутка на неё больше не влияет. */
  var sch = document.querySelector('#dalshe .zk-scheme');
  if (sch) {
    var parts = [].slice.call(sch.querySelectorAll('[data-i]'));
    var lit = function (el) { el.classList.add('on'); };
    if (!MOTION) parts.forEach(lit);
    else {
      /* Этажи и выноски по ярусам, снизу вверх: 0 — первый, 3 — крыша */
      var tiers = [0, 1, 2, 3].map(function (i) {
        return parts.filter(function (el) { return +el.getAttribute('data-i') === i; });
      });
      var svgUp = 26;       /* на сколько этаж подъезжает, в единицах viewBox */
      tiers.forEach(function (tier) {
        tier.forEach(function (el) {
          G.set(el, { opacity: 0, y: el.tagName.toLowerCase() === 'li' ? 14 : svgUp });
        });
      });
      var tl = G.timeline({ scrollTrigger: { trigger: sch, start: K.enter, once: true } });
      tiers.forEach(function (tier, i) {
        var at = i * .22;
        tier.forEach(function (el) {
          tl.to(el, { opacity: 1, y: 0, duration: .9, ease: EASE, onStart: function () { lit(el); } }, at);
        });
      });
    }
  }


  /* ------------------------------------------------------------------------
     05а. Что дальше (20.09): цепочка возрастов по образцу «Кто учит
     педагогов» главной, код из js/home.js без изменений.
     ------------------------------------------------------------------------ */
  function fitLines() {
    var ch = document.querySelector('.h-chain');
    if (ch) {
      var li = ch.querySelectorAll('li'), last = li[li.length - 1];
      var dot = last.getBoundingClientRect(), box = ch.getBoundingClientRect();
      var cs = getComputedStyle(last, '::before');
      var dl = parseFloat(cs.left) || 0, dt = parseFloat(cs.top) || 0, dw = parseFloat(cs.width) || 16;
      ch.style.setProperty('--c-right', (box.right - (dot.left + dl + dw / 2)) + 'px');
      ch.style.setProperty('--c-bottom', (box.bottom - (dot.top + dt + dw / 2)) + 'px');
    }
  }
  fitLines();
  window.addEventListener('resize', fitLines);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLines);
  if (ST) ST.addEventListener('refresh', fitLines);


  /* ------------------------------------------------------------------------
     05а. Гуманная педагогика: цепочка «от Амонашвили до вашего ребёнка».
     Линия дорисовывается прокруткой, точка звена загорается, когда линия
     до неё дошла. Точки по единой схеме: к покою раздела всё нарисовано.
     ------------------------------------------------------------------------ */
  var chain = document.querySelector('.h-chain');
  if (chain && MOTION) {
    var links = [].slice.call(chain.querySelectorAll('li'));
    var vertical = function () { return window.matchMedia('(max-width: 900px)').matches; };
    var paintChain = function (p) {
      chain.style.setProperty('--p', p.toFixed(3));
      var first = links[0], last = links[links.length - 1];
      links.forEach(function (li) {
        var at = vertical()
          ? (li.offsetTop - first.offsetTop) / ((last.offsetTop - first.offsetTop) || 1)
          : (li.offsetLeft - first.offsetLeft) / ((last.offsetLeft - first.offsetLeft) || 1);
        li.classList.toggle('on', p >= at - .01);
      });
    };
    var cr = K.scrubRange(chain);
    ST.create({
      trigger: chain, start: cr.start, end: cr.end, scrub: true,
      onUpdate: function (self) { paintChain(self.progress); },
      onRefresh: function (self) { paintChain(self.progress); }
    });

  }

  /* ------------------------------------------------------------------------
     07. Аватары сходятся внахлёст из одной точки
     ------------------------------------------------------------------------ */
  var avatars = document.querySelectorAll('.zk-avatars img');
  if (avatars.length && MOTION) {
    G.set(avatars, { x: function (i) { return (1 - i) * 30; }, scale: .6, opacity: 0 });
    ST.create({
      trigger: '.zk-avatars', start: K.enter, once: true,
      onEnter: function () {
        G.to(avatars, { x: 0, scale: 1, opacity: 1, duration: .9, ease: EASE, stagger: .08 });
      }
    });
  }


  /* 08. Слово педагога просто появляется целиком (клиент, 18.09):
     закраска по словам заставляла дочитывать её прокруткой, а это
     короткая фраза, а не манифест. Появление берёт K.rise выше. */
})();
