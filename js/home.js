/* ==========================================================================
   Главная «Крыльев»: движение.

   Устройство снято замером с живых сайтов (design/refs-2026-09-17/):
   - nika-school.ru: закреплённая лента возрастов; секция «почему нас
     выбирают» закреплена на несколько экранов, снимок виден через эллипс,
     список карточек едет снизу вверх (у «Ники» с +900 до −990 px),
     а у каждой карточки своя добавочная скорость (−36, −450, −81, −387),
     поэтому они всплывают на разной глубине;
   - vodoroy.ru и nika-school.ru: одна кривая cubic-bezier(.36,.3,0,1);
   - impuls-ivc.ru: липкая стопка карточек и приглушённые слова в тексте.

   Правило, по которому здесь добавлялось движение: у каждого приёма есть
   причина. Закрепление там, где показывается последовательность (возрасты,
   день), маска там, где раскрывается пространство, закраска слов там,
   где текст нужно дочитать. Ради красоты ничего не двигается.

   Если движение отключено в системе или GSAP не загрузился, страница
   остаётся полностью рабочей: ничего не скрыто, вкладки переключаются.
   ========================================================================== */
(function () {
  'use strict';

  /* Кривая, разбивка на слова, счётчик, появление и стопка живут
     в js/kit.js: они нужны и внутренним страницам */
  var K = window.Kit;
  if (!K) return;
  var G = K.G, ST = K.ST, MOTION = K.MOTION, EASE = K.EASE;
  var hdr = K.hdr, countUp = K.countUp;


  /* ------------------------------------------------------------------------
     01. Первый экран
     Небо с голубем, арка с видео снизу справа, заголовок строками из маски,
     круг с цифрой и круглая кнопка на стыке слоёв (приём «Ники», 19.09).
     ------------------------------------------------------------------------ */
  var hero = document.querySelector('.h-hero');
  var video = hero && hero.querySelector('.h-arch__video');

  /* Видео крутится, только пока первый экран виден, и не крутится вовсе
     при просьбе системы уменьшить движение: тогда стоит кадр-заставка. */
  if (video) {
    if (MOTION && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      }, { threshold: .05 }).observe(hero);
    } else {
      video.removeAttribute('preload');
    }
  }

  if (hero && MOTION) {
    var sky = hero.querySelector('.h-hero__sky img');
    var arch = hero.querySelector('.h-arch');
    var birds = hero.querySelector('.h-hero__birds');
    var lines = hero.querySelectorAll('.h-line > span');
    var tail = hero.querySelectorAll('.h-quick, .h-hero__where');
    var bubble = hero.querySelector('.h-bubble');
    var fact = hero.querySelector('.h-round--fact');
    var wide = window.matchMedia('(min-width: 981px)').matches;

    G.set(lines, { yPercent: 115 });
    G.set(tail, { opacity: 0, y: 36 });
    G.set(sky, { scale: 1.12 });
    /* Голуби (19.09): прилетают вместе с заголовком, чуть снизу слева */
    if (birds) G.set(birds, { opacity: 0, x: -40, y: 30 });
    if (wide) G.set(arch, { yPercent: 38, opacity: 0 });
    G.set([bubble, fact], { scale: 0 });

    /* Порядок «Ники»: небо оседает, из-под нижнего края встаёт второй
       слой, следом заголовок строками и круги на стыке. */
    var go = function () {
      var tl = G.timeline({ defaults: { ease: EASE } });
      tl.to(sky, { scale: 1, duration: 2.2 }, 0)
        .to(arch, { yPercent: 0, opacity: 1, duration: 1.5 }, .1)
        .to(lines, { yPercent: 0, duration: 1.1, stagger: .12 }, .25)
        .to(birds, { opacity: 1, x: 0, y: 0, duration: 1.6 }, .3)
        .add(function () { hero.classList.add('is-in'); }, .3)
        .to(tail, { opacity: 1, y: 0, duration: .9, stagger: .08 }, .65)
        .to(bubble, { scale: 1, duration: .9, ease: 'back.out(1.6)' }, .95)
        .add(function () { countUp(bubble.querySelector('[data-to]'), 1.6); }, 1)
        .to(fact, { scale: 1, duration: .9, ease: 'back.out(1.8)' }, 1.1)
        .add(function () { countUp(fact.querySelector('[data-to]'), 1.2); }, 1.15);
    };
    /* Ждём шрифт: иначе строки поедут на системном шрифте и дёрнутся
       по ширине, когда подменится основной. */
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);

    /* Уход экрана: небо отстаёт, арка и круги уходят быстрее. Только на
       широком экране: на телефоне видео и есть фон, сдвигать его некуда. */
    if (wide) {
      var out = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
      /* Логотип без замедления: он едет вместе с прозрачной шапкой */
      G.to(hero.querySelectorAll('.h-hero__sky, .h-hero__birds'), { yPercent: 12, ease: 'none', scrollTrigger: out });
      G.to(arch, { y: function () { return -hero.offsetHeight * .12; }, ease: 'none', scrollTrigger: out });
      G.to(hero.querySelector('.h-duo'), { yPercent: -60, ease: 'none', scrollTrigger: out });
    }
  }


  /* ------------------------------------------------------------------------
     Появление при прокрутке по ролям: подпись, заголовок, текст, карточка.
     Отзывы, запись и вопросы набор добавляет сам.
     ------------------------------------------------------------------------ */
  /* Лента педагогов, едет сама */
  K.carousel(document.querySelector('[data-car]'));

  K.rise([
    '.h-val__label, .h-manifest .u-mf-sign, .h-staff__head .eyebrow, .h-link, .h-boss__who, .h-law .eyebrow, .h-map .eyebrow',
    '.h-staff__head h2, .h-boss__quote, .h-hum__title, .h-law__head h2, .h-revs__head h2, .h-map__text h2',
    '.h-boss__facts, .h-hum__lead, .h-hum__note, .h-law__head p, .h-law__head .btn, .h-revs__head p, .h-map__lead, .h-map__facts, .h-map__text .btn',
    '.h-num, .h-val__it, .h-hum__pic, .h-boss__pic img, .h-tcard, .h-law__paper, .h-law__steps li, .h-map__frame'
  ]);


  /* ------------------------------------------------------------------------
     02. Манифест: слова закрашиваются по ходу прокрутки
     ------------------------------------------------------------------------ */
  /* 23.09: закраску манифеста ведёт kit.js по data-accent, как у всех u-mf.
     Цифра кружков набегает один раз при появлении, не прокруткой */
  if (MOTION) {
    var hn = document.querySelector('.h-num b[data-to]');
    if (hn) ST.create({ trigger: hn, start: K.enter, once: true, onEnter: function () { K.countUp(hn, 1.2); } });
  }

  /* Фон от утра к вечеру (20.09): прокрутка ведёт вечерний слой, от входа
     раздела в окно до его остановки под шапкой (правило 4). Следы детских
     ботинок клиент попросил убрать; до этого была птица с часами (f74ef55). */
  (function day() {
    var sec = document.querySelector('.h-manifest');
    var eve = sec && sec.querySelector('.h-day__eve');
    if (!eve) return;
    if (!MOTION) { eve.style.opacity = 1; return; }
    var hdr = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 84; };
    G.fromTo(eve, { opacity: 0 }, {
      opacity: 1, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: function () { return 'top ' + hdr() + 'px'; }, scrub: .6 }
    });
  })();
  /* Осколки больше не плывут (18.09): треугольники остаются фоном,
     но их медленный дрейф шёл всё время, пока читаешь манифест. */


  /* ------------------------------------------------------------------------
     03. Возрастные группы
     ------------------------------------------------------------------------ */
  var ages = document.querySelector('.h-ages');
  if (ages) {
    var slides = [].slice.call(ages.querySelectorAll('.h-age'));
    var tabs = [].slice.call(ages.querySelectorAll('.h-scale__row button'));
    var bar = ages.querySelector('.h-scale__fill');
    var ablob = ages.querySelector('.h-ages__blob');
    var cur = 0;

    /* Отрезок линии от первой точки до текущей, как у «Ники» */
    var fitFill = function () { fitFillTo(cur); };
    var fitFillTo = function (i) {
      if (!bar || i < 0) return;
      var dots = ages.querySelectorAll('.h-scale__dot');
      var tr = bar.parentNode.getBoundingClientRect();
      var a = dots[0].getBoundingClientRect(), b = dots[i].getBoundingClientRect();
      bar.style.setProperty('--fill-from', (a.left + a.width / 2 - tr.left) + 'px');
      bar.style.setProperty('--fill-w', (b.left - a.left) + 'px');
    };

    var show = function (i, force) {
      if (i === cur && !force) return;
      cur = i;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', String(k === i));
        t.classList.toggle('is-past', k < i);
      });
      /* Подложка чуть поворачивается при каждой смене: плашка под кадром
         живая, а не приклеенная. 26.09: эллипс стал скруглённой плашкой,
         поворот заметнее (клиент: «сделай поворот квадрата чуть больше»),
         от -13° до -3° по возрастам */
      if (ablob) ablob.style.transform = 'rotate(' + (-13 + i * 5) + 'deg) scale(' + (1 + (i % 2) * .03) + ')';
      fitFill();
    };
    show(0, true);
    window.addEventListener('resize', fitFill);

    var mm = MOTION ? G.matchMedia() : null;
    if (mm) {
      mm.add('(min-width: 901px)', function () {
        var n = slides.length;
        /* Техника «Ники» целиком (замер 19.09): обычная прокрутка, никакого
           перехвата колеса и доводки. Раздел закреплён, на каждый возраст
           полэкрана хода (у «Ники» 450 px при окне 900), возраст меняется
           на границе (у нас 0,4 экрана: клиент просил отзывчивее). Сильный
           взмах проматывает сразу несколько возрастов,
           после последнего раздел уезжает сам, ничего не держит. */
        /* 0,4 экрана оказалось слишком мало: сильный взмах перелетал через
           возрасты (клиент 19.09). 0,75 экрана: перелететь можно, но трудно */
        var STEP = function () { return window.innerHeight * .75; };
        /* Пока прокрутка идёт через возрасты, шкала отмечает их сразу,
           а сам возраст гаснет и не показывается. Новый возраст включается,
           когда прокрутка на нём задержалась на 140 мс: сильный взмах сразу
           приземляется на конечный возраст, без мелькания промежуточных */
        var aimT = 0, target = cur;
        var aim = function (i) {
          if (i === target) return;
          target = i;
          tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.classList.toggle('is-past', k < i); });
          slides.forEach(function (s) { s.classList.remove('is-on'); });
          cur = -1; fitFillTo(i);
          clearTimeout(aimT);
          aimT = setTimeout(function () { show(target, true); }, 140);
        };
        var st = ST.create({
          trigger: ages,
          start: function () { return 'top ' + hdr() + 'px'; },
          end: function () { return '+=' + STEP() * n; },
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var d = self.progress * (self.end - self.start);
            aim(Math.min(n - 1, Math.floor(d / STEP())));
          }
        });
        tabs.forEach(function (t, i) {
          t.onclick = function () {
            window.scrollTo({ top: st.start + STEP() * i + STEP() * .3, behavior: 'smooth' });
          };
        });
        /* Доводка в сторону прокрутки (своя, а не snap ScrollTrigger: тот
           ждёт конца прокрутки до полутора секунд). Через 80 мс тишины
           раздел доезжает до ближайшего возраста в сторону движения:
           чуть повёл, отпустил, и возраст сменился. За последним возрастом
           вниз и перед первым вверх доводки нет, раздел уходит свободно. */
        var pt = function (k) { return st.start + STEP() * (k + .3); };
        var idle = 0, lastY = window.scrollY, dir = 1, snapping = null, restK = 0;
        var onScroll = function () {
          var y = window.scrollY;
          if (y !== lastY) dir = y > lastY ? 1 : -1;
          lastY = y;
          if (snapping) return;
          clearTimeout(idle);
          idle = setTimeout(function () {
            var y = window.scrollY;
            if (y < st.start || y > st.end) return;
            var k, to = null;
            var nearK = Math.max(0, Math.min(n - 1, Math.round((y - st.start) / STEP() - .3)));
            if (Math.abs(pt(nearK) - y) < 3) { restK = nearK; return; }
            /* Ближайший возраст в сторону движения; если взмах унёс дальше
               соседнего от того, где стояли, то просто ближайший, без добавки */
            var cand = -1;
            if (dir > 0) { for (k = 0; k < n; k++) if (pt(k) > y + 2) { cand = k; break; } }
            else { for (k = n - 1; k >= 0; k--) if (pt(k) < y - 2) { cand = k; break; } }
            if (cand < 0) return;
            to = Math.abs(cand - restK) <= 1 ? pt(cand) : pt(nearK);
            var o = { y: y };
            snapping = G.to(o, { y: to, duration: .32, ease: 'power2.out',
              onUpdate: function () { window.scrollTo(0, o.y); },
              onComplete: function () { snapping = null; lastY = window.scrollY; restK = Math.max(0, Math.min(n - 1, Math.round((lastY - st.start) / STEP() - .3))); } });
          }, 80);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        /* Колесо или палец во время доводки её прерывают */
        var stop = function () { if (snapping) { snapping.kill(); snapping = null; } };
        window.addEventListener('wheel', stop, { passive: true });
        window.addEventListener('touchstart', stop, { passive: true });
        return function () {
          tabs.forEach(function (t) { t.onclick = null; });
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('wheel', stop);
          window.removeEventListener('touchstart', stop);
        };
      });
    }
    /* Без закрепления вкладки просто переключают состояние */
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (!mm || window.innerWidth <= 900) {
          show(i);
        }
      });
    });
  }


  /* ------------------------------------------------------------------------
     04. Почему выбирают: эллипс, всплывающие карточки, «Тысяча метров»
     ------------------------------------------------------------------------ */
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
        .fromTo(photo, { '--rx': '31%', '--ry': '30%', '--cx': '60%', '--cy': '58%' },
                       { '--rx': '125%', '--ry': '140%', '--cx': '60%', '--cy': '58%', duration: .17, ease: 'power2.inOut' }, .46)
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


  /* ------------------------------------------------------------------------
     05. Стопка карточек (kit.js)
     ------------------------------------------------------------------------ */
  K.stack('.h-card');


  /* ------------------------------------------------------------------------
     Линия цепочки кураторов идёт ровно от центра
     первой точки до центра последней (18.09, клиент: «линия идёт дальше
     кружка „Ваш ребёнок“»). Концы ставим переменными, раскладка тут
     ни при чём, поэтому и без движения тоже.
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
     08. Цитата: слова проявляются по ходу прокрутки
     ------------------------------------------------------------------------ */
  /* Цитата директора больше не закрашивается по словам: 18.09 раздел
     разделён надвое, и в блоке о директоре она короткая опора, а не
     манифест на весь экран. Появление берёт K.rise. */



  /* ------------------------------------------------------------------------
     10. Отзывы лентой (21.09): три колонки едут вверх с разной скоростью,
     приём отзывов «Династии» (vera-landing/js/main.js). Список в каждой
     колонке дублируется налету, на половине хода прыгаем в начало, шва
     не видно. Лента стоит под курсором и пальцем: отзыв надо дочитать.
     При отключённом движении колонки просто стоят.
     ------------------------------------------------------------------------ */
  var revs = document.querySelector('[data-revs]');
  if (revs) {
    var cols = [].slice.call(revs.querySelectorAll('.h-revs__track'));
    if (!MOTION) revs.classList.add('is-still');
    else {
      cols.forEach(function (track) {
        var copy = track.cloneNode(true);
        [].forEach.call(copy.children, function (n) { n.setAttribute('aria-hidden', 'true'); });
        while (copy.firstChild) track.appendChild(copy.firstChild);
      });
      /* 21.09 (клиент): лента больше не останавливается под курсором
         и пальцем, идёт всегда. Было: hold по pointerenter/touchstart. */
      var hold = false;
      var pos = cols.map(function () { return 0; });
      var last = 0;
      var step = function (t) {
        var dt = last ? Math.min(64, t - last) : 0;
        last = t;
        if (!hold && dt) {
          cols.forEach(function (track, i) {
            var speed = parseFloat(track.getAttribute('data-speed')) || 20;
            var half = track.scrollHeight / 2;
            pos[i] -= speed * dt / 1000;
            if (half && -pos[i] >= half) pos[i] += half;
            track.style.transform = 'translate3d(0,' + pos[i].toFixed(1) + 'px,0)';
          });
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }


  /* 11. Щит поверх живой карты снят 21.09: карта заменена картинкой
     (см. tools/map-static.py). Прежний код: git show <этот коммит>^. */


})();
