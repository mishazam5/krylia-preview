/* ==========================================================================
   Общий набор движения «Крыльев»: главная и внутренние страницы.
   Вынесен из js/home.js 17 сентября 2026.

   Подключается раньше сценария страницы и кладёт инструменты в window.Kit:
   кривую, разбивку на слова, счётчик, появление по ролям, стопку карточек,
   закраску слов прокруткой. Сам файл запускает только магнит у круглых
   кнопок: у него нет ScrollTrigger, и порядок ему не важен.

   Всё, что создаёт ScrollTrigger, страница вызывает сама и в порядке
   блоков сверху вниз. Закреплённые секции сдвигают точки срабатывания
   всего, что ниже, и GSAP считает их в порядке создания: вызов стопки
   раньше закрепления над ней дал бы съехавшие границы.

   Если движение отключено в системе или GSAP не загрузился, Kit.MOTION
   ложно, ничего не прячется, и страница остаётся полностью рабочей.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  /* Версия для слабовидящих (класс a11y ставит скрипт в <head>) тоже
     выключает движение: без закреплений страница читается сверху вниз */
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || root.classList.contains('a11y') || root.classList.contains('adm');
  var G = window.gsap, ST = window.ScrollTrigger;
  var MOTION = !!(!REDUCE && G && ST);

  if (MOTION) {
    G.registerPlugin(ST);
    root.classList.add('js-anim');
  }

  /* ------------------------------------------------------------------------
     ЕДИНАЯ СХЕМА ТОЧЕК СРАБАТЫВАНИЯ (17.09, замечание клиента: анимации
     шли хорошо, но начинались и заканчивались в разные моменты: одна
     слишком низко, другая уже за верхним краем). Все сценарии страниц
     берут точки только отсюда.

     enter: разовое появление, счётчики, стулья. Верх элемента на 85 %
       высоты окна, но не позже, чем раздел-экран встал на место (иначе
       элемент у низа раздела, с верхом на 86-97 %, в покое оставался
       пустым местом: подпись анонсов на «Жизни клуба», примечания) и не
       раньше, чем элемент показался снизу.
     scrubRange(el): анимация, которую ведёт прокрутка.
       ГЛАВНОЕ ПРАВИЛО (клиент, 18.09): родитель листает, останавливается
       на разделе и читает его. К этому моменту движение обязано быть
       закончено. Момент остановки — это место покоя раздела-экрана:
       его верх под шапкой. Значит, финиш там, а не позже.
       Блок не выше окна: финиш — раздел-экран встал на место (у блока
       вне такого раздела — когда он сам встал серединой в середину окна),
       но не позже, чем его верх подошёл к шапке. Старт — как только верх
       блока показался снизу (88 % высоты окна): ход получается длинный,
       движение видно и без рывка у нижнего края.
       Блок выше окна (хроника, длинные списки): кончик идёт по линии 70 %
       высоты окна, то есть всё, что читают, уже нарисовано.
     READ: переключение «текущего» пункта (номер шага): линия середины окна.
     Закрепления стартуют, когда раздел дошёл до шапки ('top ' + hdr()),
     уход первого экрана идёт от 'top top' до 'bottom top'.
     Фон (осколки, shards): всё время, пока раздел в окне, от 'top bottom'
     до 'bottom top': это не событие, а медленный дрейф.
     ------------------------------------------------------------------------ */
  var ENTER = 'top 85%';
  /* Абсолютный верх по раскладке: offsetTop не видит сдвига transform
     (у появления это 18-56 px), но видит поля закреплений выше */
  function absTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function enter(self) {
    var el = self.trigger, vh = window.innerHeight, top = absTop(el);
    var s = top - .85 * vh;
    var screen = el.closest('.u-screen, .u-pair');
    if (screen) s = Math.min(s, absTop(screen) - hdr() - 40);
    return Math.max(s, top - vh);
  }
  var READ = { start: 'top center', end: 'bottom center' };
  /* Финиш короткого блока: раздел-экран дошёл до места покоя (верх под
     шапкой). Прежние схемы считали финиш по самому блоку («центр на 45 %»)
     и доигрывали, когда раздел уже уходил вверх: родитель успевал
     остановиться и начать читать, а линия при нём ещё дорисовывалась.
     Второй ограничитель — верх блока не заходит под шапку: он нужен
     блокам в длинных сценах без раздела-экрана.
     Старт: верх блока на 88 % высоты окна, но ход не короче пятой доли
     экрана и не длиннее девяти десятых.
     Моменты считают вспомогательные срабатывания без анимации; они
     создаются раньше основного и пересчитываются раньше него, поэтому
     основной берёт уже готовые числа. */
  function scrubRange(el) {
    if (el._kitRange) return el._kitRange;
    var tall = function () { return el.offsetHeight > window.innerHeight; };
    var screen = el.closest('.u-screen, .u-pair');
    var rest = screen ? ST.create({ trigger: screen, start: function () { return 'top ' + hdr() + 'px'; } }) : null;
    var mid = ST.create({ trigger: el, start: 'center 50%' });
    var under = ST.create({ trigger: el, start: function () { return 'top ' + (hdr() + 64) + 'px'; } });
    /* Появление снизу тоже вспомогательным срабатыванием: длину закреплений
       выше GSAP учитывает в своих расчётах, а не в раскладке, и счёт по
       offsetTop дал бы петле «Не подошло?» старт на 4 экрана раньше */
    var appear = ST.create({ trigger: el, start: 'top 88%' });
    var rangeEnd = function () {
      if (tall()) return 'bottom 70%';
      return Math.min(rest ? rest.start : mid.start, under.start);
    };
    var rangeStart = function () {
      if (tall()) return 'top 70%';
      var e = rangeEnd(), vh = window.innerHeight;
      return Math.min(Math.max(appear.start, e - vh * .9), e - vh * .2);
    };
    el._kitRange = { start: rangeStart, end: rangeEnd };
    return el._kitRange;
  }


  function hdr() {
    return parseFloat(getComputedStyle(root).getPropertyValue('--hdr')) || 84;
  }

  /* Кривая «Ники» и «Водороя» для GSAP. В ядре GSAP нет cubic-bezier,
     а CustomEase платный плагин отдельным файлом: считаем кривую сами,
     методом Ньютона, как это делает браузер для CSS. */
  function bezier(x1, y1, x2, y2) {
    function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; }
    function b(p1, p2) { return 3 * p2 - 6 * p1; }
    function c(p1) { return 3 * p1; }
    function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
    function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 6; i++) {
        var s = slope(t, x1, x2);
        if (s === 0) break;
        t -= (at(t, x1, x2) - x) / s;
      }
      return at(t, y1, y2);
    };
  }
  var EASE = bezier(.36, .3, 0, 1);

  /* Разбить текст на слова-спаны, сохранив пробелы между ними.
     Вложенные элементы (если появятся в тексте) не разбираются
     на слова, а встают в очередь целиком: закраска доходит до капсулы,
     и та получает класс on вместе со словами, то есть раскрывается
     в тот момент, когда её читают */
  function splitWords(el, accent) {
    var items = [];
    var nodes = [].slice.call(el.childNodes);
    el.textContent = '';
    nodes.forEach(function (node) {
      if (node.nodeType === 1) {
        if (items.length) el.appendChild(document.createTextNode(' '));
        el.appendChild(node);
        items.push(node);
        return;
      }
      node.textContent.trim().split(/\s+/).filter(Boolean).forEach(function (w) {
        if (items.length) el.appendChild(document.createTextNode(' '));
        var s = document.createElement('span');
        s.className = 'w';
        if (accent && accent.test(w)) s.classList.add('hl');
        s.textContent = w;
        el.appendChild(s);
        items.push(s);
      });
    });
    return items;
  }

  function countUp(el, dur) {
    if (!el) return;
    var to = parseFloat(el.getAttribute('data-to'));
    if (isNaN(to) || !G) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var o = { v: 0 };
    G.to(o, {
      v: to, duration: dur || 1.4, ease: EASE,
      onUpdate: function () { el.textContent = Math.round(o.v) + suffix; }
    });
  }

  /* 21.09 (аудит): счётчик, который ведёт прокрутка. countUp по времени
     стартовал с появлением и шёл 1,2-1,4 с, а при обычной скорости
     листания раздел вставал раньше, и родитель читал «6» вместо «7».
     Здесь число привязано к той же точке, что и все scrub-анимации:
     к покою раздела оно уже итоговое (правило 4 из CLAUDE.md).
     countUp остаётся для первых экранов, где счёт идёт при загрузке. */
  function countScrub(el) {
    if (!el || !G || !ST) return;
    var to = parseFloat(el.getAttribute('data-to'));
    if (isNaN(to)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var ease = G.parseEase('power2.out');
    var set = function (p) { el.textContent = Math.round(to * ease(p)) + suffix; };
    var r = scrubRange(el);
    var st = ST.create({
      trigger: el, start: r.start, end: r.end,
      onUpdate: function (self) { set(self.progress); },
      onLeave: function () { set(1); },
      onLeaveBack: function () { set(0); }
    });
    set(st.progress);
  }

  /* Слова закрашиваются по ходу прокрутки: приём для текста, который
     нужно дочитать. Класс on получают слова, до которых дошла прокрутка.
     Точки по единой схеме (scrubRange). */
  function scrubWords(el, accent) {
    if (!el) return;
    /* Без движения (версия для слабовидящих, системная настройка, окно
       админки) слова сразу в конечном виде: ключевые окрашены, как
       после прокрутки. Раньше тут был ранний выход, и акцента не было */
    if (!MOTION) { splitWords(el, accent).forEach(function (w) { w.classList.add('on'); }); return; }
    var words = splitWords(el, accent);
    var r = scrubRange(el);
    ST.create({
      trigger: el, start: r.start, end: r.end, scrub: true,
      onUpdate: function (self) {
        var n = Math.round(self.progress * words.length);
        words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
      }
    });
  }


  /* ------------------------------------------------------------------------
     Магнитная круглая кнопка. У «Ники» круглая кнопка заявки главный
     жест страницы; здесь она ещё и тянется к курсору, чтобы её заметили.
     ------------------------------------------------------------------------ */
  if (MOTION && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-magnet]').forEach(function (el) {
      var qx = G.quickTo(el, 'x', { duration: .6, ease: 'power3.out' });
      var qy = G.quickTo(el, 'y', { duration: .6, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * .35);
        qy((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }


  /* ------------------------------------------------------------------------
     Появление при прокрутке. Дистанция зависит от роли: подпись едет
     меньше всех, заголовок чуть больше, текст больше, карточка ещё больше.
     Стартуют вместе, приезжают в разное время: каскад дистанцией, а не
     задержкой (замер vodoroy.ru). Задержка только у равноправных соседей.

     Страница передаёт свои селекторы по четырём ролям, набор добавляет
     к ним свои блоки (стопку, отзывы, запись, вопросы). Всё уходит
     в одну пачку, чтобы соседи из разных ролей не ждали друг друга.
     ------------------------------------------------------------------------ */
  /* 18.09, разгрузка ради читаемости (клиент: «убрать анимации, которые
     не дают вау, а мешают понимать»). Дистанции срезаны почти вдвое:
     22/30/44/56 → 14/18/26/32. Блок приезжает на место быстрее и не
     тянет взгляд снизу вверх, пока его читают. Размытие при появлении
     (6 px у заголовков) убрано совсем: размытый текст нельзя читать,
     а «вау» он не добавляет — это было заимствование у vodoroy.ru,
     и там оно лежит на картинках, а не на заголовках. */
  var ROLES = [
    [14, 0, ''],
    [18, 0, '.h-diff__head h2, .h-voices__title, .h-invite__text h2, .h-faq__side h2'],
    [26, 0, '.h-diff__head p, .h-contacts'],
    [32, 0, '.h-voice, .h-ways li, .h-faq__list details, .h-invite__form, .h-diff__stack .h-card']
  ];
  function rise(page) {
    if (!MOTION) return;
    var marked = [];
    ROLES.forEach(function (r, k) {
      var sel = [page && page[k], r[2]].filter(Boolean).join(', ');
      if (!sel) return;
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.hasAttribute('data-rise')) return;
        el.setAttribute('data-rise', '');
        el.style.setProperty('--rise', r[0] + 'px');
        if (r[1]) el.style.setProperty('--blur-in', r[1] + 'px');
        marked.push(el);
      });
    });
    if (!marked.length) return;
    /* Пакет создаётся после сценария страницы (setTimeout 0), то есть после
       всех закреплений. Страницы зовут rise() в начале, а GSAP считает точки
       в порядке создания: появления ниже закреплённых разделов срабатывали
       на 1-7 экранов раньше, чем элемент доезжал до окна, и анимации никто
       не видел (замер 17.09 на главной, «Подготовке» и «Семейном обучении»). */
    setTimeout(function () {
      ST.batch(marked, {
        start: enter, once: true,
        onEnter: function (batch) {
          batch.forEach(function (el, i) {
            el.style.setProperty('--d', (i * .07) + 's');
            el.classList.add('is-in');
          });
        }
      });
      ST.refresh();
    }, 0);
  }


  /* ------------------------------------------------------------------------
     Фон из осколков: каждый плывёт вверх со своей скоростью и чуть
     поворачивается, пока раздел в окне. Точки по схеме «фон»: от входа
     верха раздела в окно до ухода низа за верхний край. Скорость
     и поворот в data-speed и data-turn у осколка.
     ------------------------------------------------------------------------ */
  /* Лента карточек, которая едет сама. Двигаем родной scrollLeft, а не
     transform: тогда работают и палец, и трекпад, и стрелки, а сценарию
     остаётся только подталкивать. Список дублируется в разметке налету,
     и на половине хода мы прыгаем в начало — шва не видно.
     Ход стоит, пока курсор или палец на ленте: карточку надо успеть
     прочитать. При отключённом движении в системе лента просто стоит. */
  function carousel(root) {
    if (!root) return;
    var vp = root.querySelector('.h-car__viewport');
    var track = root.querySelector('.h-car__track');
    var prev = root.querySelector('.h-car__nav--prev');
    var next = root.querySelector('.h-car__nav--next');
    if (!vp || !track) return;

    var step = function () {
      var card = track.querySelector('li');
      return card ? (card.offsetWidth + 22) * 2 : vp.clientWidth * .8;
    };
    if (prev) prev.addEventListener('click', function () { vp.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { vp.scrollBy({ left: step(), behavior: 'smooth' }); });
    if (REDUCE) return;

    /* Двойник списка нужен только для бесшовной петли, читать его
       второй раз ни человеку, ни экранному диктору незачем */
    var copy = track.cloneNode(true);
    [].forEach.call(copy.children, function (li) { li.setAttribute('aria-hidden', 'true'); });
    while (copy.firstChild) track.appendChild(copy.firstChild);

    var half = function () { return track.scrollWidth / 2; };
    /* Признак, а не счётчик: счётчик входов-выходов однажды разъезжается
       (браузер шлёт pointerenter при прокрутке под курсором), и лента
       встаёт навсегда — так и случилось на первом прогоне. */
    var hold = false, last = 0, acc = 0;
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (e) {
      root.addEventListener(e, function () { hold = true; }, { passive: true });
    });
    ['pointerleave', 'focusout', 'touchend', 'touchcancel'].forEach(function (e) {
      root.addEventListener(e, function () { hold = false; }, { passive: true });
    });

    var SPEED = 52; /* px в секунду; 26 клиенту показалось вялым */
    function frame(t) {
      var dt = last ? Math.min(64, t - last) : 0;
      last = t;
      /* Копим дробные пиксели и двигаем целыми: scrollLeft округляется,
         и прибавка по 0,4 px за кадр не накапливалась вовсе */
      if (!hold && dt) {
        acc += SPEED * dt / 1000;
        if (acc >= 1) {
          var n = Math.floor(acc); acc -= n;
          vp.scrollLeft += n;
          if (vp.scrollLeft >= half()) vp.scrollLeft -= half();
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }


  function shards(section) {
    if (!section || !MOTION) return;
    section.querySelectorAll('.u-shard, .u-bird').forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-speed')) || 20;
      var turn = parseFloat(el.getAttribute('data-turn')) || 0;
      G.fromTo(el, { yPercent: sp, rotation: -turn / 2 }, {
        yPercent: -sp, rotation: turn / 2, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }


  /* ------------------------------------------------------------------------
     Стопка карточек: предыдущая уходит вглубь, когда поверх приезжает
     следующая. Прилипание делает CSS (position: sticky), скрипт только
     утапливает то, что уже закрыто.
     ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------
     Разделы «Четыре вещи», «Одинаково для всех групп», «С чем ребёнок
     придёт в первый класс».

     21.09, четвёртый заход (клиент: «оформи анимацию, как „Что отличает
     нашу продлёнку“ на „Династии“»). Стопки больше нет: ни закрепления,
     ни наезда карточек. Заголовок слева прилипает посередине экрана
     (css/kit.css), карточки справа идут обычным столбиком, и каждая
     появляется, когда доезжает до окна: это общее появление Kit.rise
     (роль «карточка», список ROLES выше). Прежние заходы: прилипание
     карточек (b24111b) и закрепление раздела (e5a3b65).
     Функция оставлена: её зовут три страницы.
     ------------------------------------------------------------------------ */
  function stack() {
    /* Высота заголовка для середины экрана (css/kit.css, --head-h) */
    var heads = [].slice.call(document.querySelectorAll('.h-diff__head'));
    if (!heads.length) return;
    var fit = function () { heads.forEach(function (h) { h.style.setProperty('--head-h', h.offsetHeight + 'px'); }); };
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  /* ------------------------------------------------------------------------
     Первый экран внутренней страницы (.h-page). Тот же язык, что на главной:
     строки заголовка поднимаются из маски, маркер проводится, когда слово
     встало, фигуры собираются приближением и идут за курсором с разной
     глубиной, круг с цифрой и круглая кнопка выскакивают последними.
     Причина движения одна: родитель открыл страницу, и она собирается
     у него на глазах в порядке чтения.
     ------------------------------------------------------------------------ */
  function pageHero() {
    var hero = document.querySelector('.h-page');
    if (!hero || !MOTION) return;
    var lines = hero.querySelectorAll('.h-line > span');
    var flags = hero.querySelectorAll('.h-crumbs, .h-flag');
    var tail = hero.querySelectorAll('.h-page__lead, .h-checks li, .h-page__btns, .h-page__brand');
    var shots = hero.querySelectorAll('.h-page__shot');
    var bubble = hero.querySelector('.h-bubble');
    var round = hero.querySelector('.h-page__duo .h-round');
    var blob = hero.querySelector('.h-page__blob');
    /* Первый экран со снимком на фоне: у него нет ни пятна, ни кадров,
       зато есть сам снимок — он медленно отъезжает от увеличения */
    var bg = hero.querySelector('.h-page__bg img');

    G.set(lines, { yPercent: 115 });
    G.set(flags, { opacity: 0, y: -14 });
    G.set(tail, { opacity: 0, y: 36 });
    if (shots.length) G.set(shots, { opacity: 0, scale: .82, filter: 'blur(10px)' });
    if (blob) G.set(blob, { opacity: 0, scale: .7 });
    if (bg) G.set(bg, { scale: 1.08 });
    G.set([bubble, round].filter(Boolean), { scale: 0 });

    var go = function () {
      var tl = G.timeline({ defaults: { ease: EASE } });
      if (bg) tl.to(bg, { scale: 1, duration: 2.2 }, 0);
      if (blob) tl.to(blob, { opacity: 1, scale: 1, duration: 1.4 }, 0);
      tl
        .to(flags, { opacity: 1, y: 0, duration: .7, stagger: .06 }, .05)
        .to(lines, { yPercent: 0, duration: 1.1, stagger: .1 }, .12)
        .add(function () { hero.classList.add('is-in'); }, .2)
        .to(tail, { opacity: 1, y: 0, duration: .9, stagger: .06 }, .5)
        .to(bubble, { scale: 1, duration: .9, ease: 'back.out(1.6)' }, .85)
        .add(function () { if (bubble) countUp(bubble.querySelector('[data-to]'), 1.4); }, .9)
        .to(round, { scale: 1, duration: .9, ease: 'back.out(1.8)' }, 1)
        .add(function () { if (round) countUp(round.querySelector('[data-to]'), 1.4); }, 1.05);
      if (shots.length) tl.to(shots, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: .12 }, .25);
    };
    /* Ждём шрифт: иначе строки поедут на системном шрифте и дёрнутся
       по ширине, когда подменится Onest */
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);

    if (window.matchMedia('(pointer: fine) and (min-width: 981px)').matches) {
      var layers = [].slice.call(hero.querySelectorAll('[data-depth]')).map(function (el) {
        return {
          d: parseFloat(el.getAttribute('data-depth')),
          x: G.quickTo(el, 'x', { duration: .9, ease: 'power3.out' }),
          y: G.quickTo(el, 'y', { duration: .9, ease: 'power3.out' })
        };
      });
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5;
        var ny = (e.clientY - r.top) / r.height - .5;
        layers.forEach(function (l) { l.x(nx * 40 * l.d); l.y(ny * 30 * l.d); });
      });
      hero.addEventListener('pointerleave', function () {
        layers.forEach(function (l) { l.x(0); l.y(0); });
      });
    }

    /* Уход первого экрана: композиция расходится с разной скоростью */
    G.utils.toArray(hero.querySelectorAll('.h-page__shot, .h-page__duo')).forEach(function (el, i) {
      G.to(el, {
        yPercent: -(14 + i * 9), ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  /* Раздел-манифест внутренних страниц (19.09): закраска слов как на
     главной. Ключевые слова из data-accent, знаки препинания не мешают. */
  [].forEach.call(document.querySelectorAll('.u-mf[data-accent]'), function (el) {
    var acc = new RegExp('^[«„"]?(' + el.getAttribute('data-accent') + ')[.,!?:;…»"]*$', 'i');
    scrubWords(el, acc);
  });

  /* Картинки догружаются лениво и меняют высоту страницы: пересчитываем
     точки закрепления, когда всё легло */
  if (MOTION) {
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* «Спросите заранее» (19.09, клиент): раздел-экран держит содержимое
     по центру, и раскрытый ответ рос в обе стороны, весь раздел прыгал
     вверх. Верх содержимого закрепляем там, где он стоит при закрытых
     вопросах: ответ сдвигает вниз только то, что ниже. Замер только при
     всех закрытых, иначе запомнили бы уже сдвинутое место. */
  function pinFaq() {
    [].forEach.call(document.querySelectorAll('.h-faq.u-screen'), function (s) {
      if (s.querySelector('details[open]')) return;
      var inner = s.firstElementChild;
      s.classList.remove('is-pinned');
      var top = inner.getBoundingClientRect().top - s.getBoundingClientRect().top;
      s.style.setProperty('--faq-top', top + 'px');
      s.classList.add('is-pinned');
    });
  }
  pinFaq();
  if (document.fonts) document.fonts.ready.then(pinFaq);
  window.addEventListener('load', pinFaq);
  window.addEventListener('resize', pinFaq);

  /* ------------------------------------------------------------------------
     Фрагменты фильма о клубе (21.09). Кнопка [data-film="имя"] открывает
     окно с роликом assets/video/film/имя.mp4, субтитры имя.vtt включены
     сразу: половина родителей смотрит без звука. До нажатия грузится
     только обложка. Подпись окна берётся из data-title и data-note.
     ------------------------------------------------------------------------ */
  (function film() {
    var btns = document.querySelectorAll('[data-film]');
    if (!btns.length) return;
    var dlg, video, cap, last;
    var make = function () {
      dlg = document.createElement('dialog');
      dlg.className = 'u-film-dlg';
      dlg.setAttribute('aria-label', 'Фрагмент фильма о клубе');
      dlg.innerHTML =
        '<div class="u-film-dlg__box">' +
          '<button class="u-film-dlg__x" type="button" aria-label="Закрыть">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
          '<video controls playsinline preload="none"></video>' +
          '<p class="u-film-dlg__cap"></p>' +
        '</div>';
      document.body.appendChild(dlg);
      video = dlg.querySelector('video');
      cap = dlg.querySelector('.u-film-dlg__cap');
      var close = function () { if (dlg.open) dlg.close(); };
      dlg.querySelector('.u-film-dlg__x').addEventListener('click', close);
      /* Щелчок мимо ролика, по затемнению, закрывает окно */
      dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
      dlg.addEventListener('close', function () {
        video.pause();
        document.documentElement.classList.remove('is-film');
        if (last) last.focus({ preventScroll: true });
      });
    };
    var open = function (btn) {
      if (!dlg) make();
      last = btn;
      var name = btn.getAttribute('data-film'), base = '/krylia-preview/assets/video/film/' + name;
      video.innerHTML = '';
      video.poster = base + '.webp';
      video.src = base + '.mp4?v=4';
      var tr = document.createElement('track');
      tr.kind = 'captions'; tr.srclang = 'ru'; tr.label = 'Русские субтитры';
      tr.src = base + '.vtt?v=4';
      /* 22.09 (клиент): субтитры сами не включаются, их можно включить в плеере */
      video.appendChild(tr);
      var t = btn.getAttribute('data-title') || '', n = btn.getAttribute('data-note') || '';
      cap.innerHTML = '<b></b><span></span>';
      cap.firstChild.textContent = t; cap.lastChild.textContent = n;
      document.documentElement.classList.add('is-film');
      dlg.showModal();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    /* 22.09 (клиент): обложка-плитка (.u-film) играет прямо на месте,
       без окна, перемотки и полного экрана: нажал, пошло; нажал, пауза.
       Окно осталось только у маленьких кнопок (.u-film-pill), им негде
       показывать видео внутри раздела. */
    var inline = function (b) {
      var v = b.querySelector('video');
      if (v) { if (v.paused) v.play(); else v.pause(); return; }
      var name = b.getAttribute('data-film'), base = '/krylia-preview/assets/video/film/' + name;
      v = document.createElement('video');
      v.setAttribute('playsinline', ''); v.setAttribute('disablepictureinpicture', '');
      v.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
      v.poster = base + '.webp'; v.src = base + '.mp4?v=4'; v.preload = 'auto';
      /* 22.09 (клиент): без субтитров, только видео и звук */
      var sync = function () { b.classList.toggle('is-playing', !v.paused && !v.ended); };
      ['play', 'pause', 'ended'].forEach(function (ev) { v.addEventListener(ev, sync); });
      v.addEventListener('ended', function () { v.currentTime = 0; });
      b.insertBefore(v, b.firstChild);
      b.classList.add('has-video');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    };
    /* Играет один ролик за раз */
    document.addEventListener('play', function (e) {
      if (!e.target.closest || !e.target.closest('.u-film')) return;
      [].forEach.call(document.querySelectorAll('.u-film video'), function (o) { if (o !== e.target) o.pause(); });
    }, true);
    [].forEach.call(btns, function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (b.classList.contains('u-film')) inline(b); else open(b);  /* .u-film-card и .u-film-pill открывают окно */
      });
    });
  })();

  window.Kit = {
    REDUCE: REDUCE, MOTION: MOTION, G: G, ST: ST, EASE: EASE,
    ENTER: ENTER, enter: enter, READ: READ, scrubRange: scrubRange, shards: shards,
    hdr: hdr, bezier: bezier, splitWords: splitWords, countUp: countUp, countScrub: countScrub,
    scrubWords: scrubWords, rise: rise, stack: stack, pageHero: pageHero, carousel: carousel
  };
})();
