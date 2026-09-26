/* «Крылья» — интерактив и анимации.
   Движок: GSAP + ScrollTrigger, локальные копии в assets/vendor.

   Что перенесено из «Династии»: reveal-каскад, count-up, делегированные цели
   Метрики. Что сделано здесь заново: закреплённая лента возрастов
   и горизонтальная лента дня.

   ПРОКРУТКА НАТИВНАЯ, и это решение, а не недоделка. Сначала здесь стоял
   Lenis, как на «Династии». Там его уже снимали по жалобе клиента
   («листается с затормозкой»), потом вернули ослабленным — и на «Крыльях»
   он снова читался как чужеродная вязкость: полотно догоняет палец,
   а не идёт за ним. Убран целиком.

   Что это дало, кроме ощущения: минус 13 КБ, минус кадр задержки
   у ScrollTrigger (обновления больше не идут через чужой ticker)
   и одной причиной для расхождения между тем, что видит браузер,
   и тем, что считают анимации, меньше. Возвращать не нужно.

   Правило на весь файл: анимация обязана что-то сообщать. Лента возрастов
   рассказывает путь ребёнка, лента дня — что день идёт слева направо,
   reveal выстраивает порядок чтения. Ничего «просто чтобы двигалось» нет. */
(function () {
  "use strict";

  var REDUCE = window.matchMedia('(prefers-reduced-motion:reduce)').matches
    || document.documentElement.classList.contains('a11y')    // версия для слабовидящих
    || document.documentElement.classList.contains('adm');    // окно админки
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Цели Яндекс.Метрики ----------
     Счётчика на превью нет, window.ym не определён — вызовы ничего не делают.
     Завести в интерфейсе Метрики целями типа «JavaScript-событие»:
       lead · lead_error · phone_click · vk_click · stage_view · tour_click */
  function goal(name, params) {
    if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', name, params);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    goal(a.getAttribute('href').indexOf('tel:') === 0 ? 'phone_click' : 'email_click',
      { page: location.pathname });
  });

  var HEADER_OFFSET = 84;
  /* Доводка до якоря — родным window.scrollTo с behavior:'smooth'.
     Он есть во всех браузерах, которые нас интересуют, и сам умолкает
     при prefers-reduced-motion — но behavior задаём явно, чтобы это
     не зависело от настроек конкретного движка. */
  /* 21.09: на «Школьной программе» и «Жизни клуба» плавная прокрутка
     к записи застревала на полпути: по дороге догружаются снимки,
     ScrollTrigger пересчитывает закреплённые разделы, страница растёт
     и прокрутка обрывается. Поэтому доводим: если прокрутка встала,
     а цель не под шапкой, целимся заново (до шести раз). Колесо,
     касание или клавиша родителя доводку отменяют. */
  var aimId = 0;
  function scrollToEl(el) {
    if (!el) return;
    var id = ++aimId, tries = 0, lastY = -1, still = 0;
    var aim = function () {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET,
        behavior: REDUCE ? 'auto' : 'smooth'
      });
    };
    var stop = function () { aimId++; };
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) {
      window.addEventListener(t, stop, { once: true, passive: true });
    });
    var watch = function () {
      if (id !== aimId) return;
      var y = window.pageYOffset;
      still = Math.abs(y - lastY) < 1 ? still + 1 : 0;
      lastY = y;
      if (still >= 8) {
        var off = el.getBoundingClientRect().top - HEADER_OFFSET;
        var bottom = y + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (Math.abs(off) <= 4 || bottom || ++tries > 6) return;
        still = 0; aim();
      }
      requestAnimationFrame(watch);
    };
    aim();
    requestAnimationFrame(watch);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length <= 1) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToEl(target);
    });
  });

  /* ---------- Шапка по «Нике» (19.09) ----------
     На всех страницах как header_absolute у «Ники». Наверху шапка
     прозрачная и нарисована на первом экране вместе с крупным логотипом,
     уезжает вместе с ним. Ниже первого экрана она белая и fixed:
     при прокрутке вниз её нет, при прокрутке вверх выезжает. Когда
     на пути вверх верх окна дошёл до низа первого экрана, белая
     растворяется, и дальше видна только прозрачная на своём месте.
     Порог 8 px, чтобы дрожь колеса и тачпада не дёргала шапку. */
  var hdr = document.querySelector('[data-hdr]');
  var dim = document.querySelector('[data-hdr-dim]');
  var float = hdr && hdr.classList.contains('hdr--float');
  var first = document.querySelector('#main > *');
  if (hdr) {
    var lastY = window.scrollY, ticking = false, fade = 0;
    var instant = function (fn) {
      hdr.classList.add('no-tr'); fn();
      requestAnimationFrame(function () { requestAnimationFrame(function () { hdr.classList.remove('no-tr'); }); });
    };
    var toOver = function () {
      instant(function () { hdr.classList.add('is-over'); hdr.classList.remove('is-hidden', 'is-fading'); });
    };
    /* Низ первого экрана; если экран ниже шапки, то хотя бы шапка */
    var edge = function () {
      return first ? Math.max(hdr.offsetHeight, first.offsetTop + first.offsetHeight) : hdr.offsetHeight;
    };
    var onScroll = function () {
      ticking = false;
      var y = window.scrollY, h = hdr.offsetHeight;
      if (float) {
        var top = y < edge();
        var isOver = hdr.classList.contains('is-over');
        if (top && !isOver) {
          if (hdr.classList.contains('is-hidden')) { clearTimeout(fade); toOver(); }
          else if (!hdr.classList.contains('is-fading')) {
            hdr.classList.add('is-fading');
            fade = setTimeout(function () { if (window.scrollY < edge()) toOver(); }, 560);
          }
          lastY = y; return;
        }
        if (top) { lastY = y; return; }
        if (hdr.classList.contains('is-fading')) { clearTimeout(fade); hdr.classList.remove('is-fading'); }
        if (isOver) {
          /* 19.09 (клиент): первый экран ушёл, белая шапка сразу выезжает
             сверху и дальше висит всегда, в том числе при прокрутке вниз.
             Убирается только когда снова виден первый экран. */
          instant(function () { hdr.classList.remove('is-over'); hdr.classList.add('is-hidden'); });
          requestAnimationFrame(function () { requestAnimationFrame(function () { hdr.classList.remove('is-hidden'); }); });
        }
        lastY = y; return;
      }
      if (Math.abs(y - lastY) < 8) return;
      var down = y > lastY && (float || y > h * 2);
      if (down && hdr.querySelector('.nav__li.is-open')) closeSubs();
      hdr.classList.toggle('is-hidden', down);
      lastY = y;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  var setDim = function () {
    if (!dim) return;
    var on = !!document.querySelector('.nav__li.is-open') || !!document.querySelector('.mmenu.is-open');
    dim.classList.toggle('is-on', on);
  };

  /* ---------- Подменю «Обучение» ----------
     Мышью открывается наведением, пальцем и клавиатурой нажатием. */
  var subs = document.querySelectorAll('.nav__li.has-sub');
  var closeSubs = function () {
    subs.forEach(function (li) {
      li.classList.remove('is-open');
      li.querySelector('.nav__link').setAttribute('aria-expanded', 'false');
    });
    setDim();
  };
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  subs.forEach(function (li) {
    var btn = li.querySelector('.nav__link');
    var open = function (on) {
      if (on) closeSubs();
      li.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', String(on));
      setDim();
    };
    var t;
    if (fine) {
      li.addEventListener('mouseenter', function () { clearTimeout(t); open(true); });
      li.addEventListener('mouseleave', function () { t = setTimeout(function () { open(false); }, 120); });
    }
    btn.addEventListener('click', function () { open(!li.classList.contains('is-open')); });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) open(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSubs(); });

  /* ---------- Телефон в шапке (21.09) ----------
     Мышью нажатие открывает карточку с номером и записью: tel: на
     компьютере ничего не набирает. Пальцем кнопка звонит сразу. */
  var call = document.querySelector('.hcall');
  if (call && fine) {
    var callBtn = call.querySelector('.hcall__btn');
    var setCall = function (on) {
      call.classList.toggle('is-open', on);
      callBtn.setAttribute('aria-expanded', String(on));
    };
    callBtn.setAttribute('role', 'button');
    callBtn.setAttribute('aria-expanded', 'false');
    callBtn.addEventListener('click', function (e) {
      e.preventDefault();
      setCall(!call.classList.contains('is-open'));
    });
    call.querySelector('.hcall__go').addEventListener('click', function () { setCall(false); });
    document.addEventListener('click', function (e) { if (!call.contains(e.target)) setCall(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && call.classList.contains('is-open')) { setCall(false); callBtn.focus(); }
    });
    call.addEventListener('focusout', function (e) { if (e.relatedTarget && !call.contains(e.relatedTarget)) setCall(false); });
    window.addEventListener('scroll', function () { if (call.classList.contains('is-open') && hdr && hdr.classList.contains('is-hidden')) setCall(false); }, { passive: true });
  }

  /* ---------- Панель меню слева ---------- */
  var burger = document.querySelector('.burger');
  var mmenu = document.getElementById('mmenu');
  if (burger && mmenu) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      mmenu.classList.toggle('is-open', open);
      mmenu.setAttribute('aria-hidden', String(!open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
      setDim();
      if (open) { var c = mmenu.querySelector('[data-mmenu-close]'); if (c) c.focus(); }
      else burger.focus({ preventScroll: true });
    };
    burger.addEventListener('click', function () { setMenu(true); });
    mmenu.querySelector('[data-mmenu-close]').addEventListener('click', function () { setMenu(false); });
    mmenu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mmenu.classList.contains('is-open')) setMenu(false);
    });
    if (dim) dim.addEventListener('click', function () {
      if (mmenu.classList.contains('is-open')) setMenu(false); else closeSubs();
    });
  }

  if (!hasGSAP) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Появление первого экрана ----------
     Раньше первый экран просто был. Страница открывалась готовой, и первое
     движение случалось только когда родитель докручивал до второго блока —
     из-за этого весь сайт читался как статичная картинка, к которой потом
     зачем-то приделали анимации.

     Приём перенесён с «Династии»: заголовок, подзаголовок и кнопки въезжают
     каскадом с шагом 90 мс, снимок — следом и чуть иначе (не сдвигом, а
     приближением с 0.96), чтобы два движения не читались как одно.

     ease: 'power3.out' — та же характеристика, что у --ease в стилях:
     быстрый разгон, длинное торможение. Одна физика на CSS и на GSAP,
     иначе появление блока и появление шапки живут по разным законам,
     и это ровно то, что выглядит как «кривые анимации».

     ЗАЧЕМ delay: .12 — дать шрифту доехать. Без задержки каскад стартует
     на подменном системном шрифте и на середине пути подменяется на Onest:
     текст дёргается по ширине прямо во время движения.

     Скрываем элементы ЗДЕСЬ, а не в CSS: если этот файл не загрузился,
     первый экран останется видимым. Прятать текст стилем, а показывать
     скриптом — верный способ однажды показать родителю пустую страницу. */
  if (!REDUCE) {
    var heroEls = document.querySelectorAll(
      '.shero .flags, .shero h1, .shero__lead, .shero .quick, .shero .stat-row,' +
      '.hero__kicker, .hero h1, .hero .lead, .hero .btns');
    var heroMedia = document.querySelector('.hero__media');
    var heroPics = document.querySelectorAll('.shero__pic');

    if (heroEls.length) {
      gsap.set(heroEls, { opacity: 0, y: 22 });
      gsap.to(heroEls, {
        opacity: 1, y: 0,
        duration: .8, ease: 'power3.out', stagger: .09, delay: .12
      });
    }
    if (heroMedia) {
      gsap.set(heroMedia, { opacity: 0, scale: .96 });
      gsap.to(heroMedia, {
        opacity: 1, scale: 1,
        duration: .95, ease: 'power3.out', delay: .06
      });
    }
    /* Кадры по краям плашки приезжают из-за края, а не проявляются
       на месте: они и стоят там, будто заглядывают в экран. Поворот
       задан в стилях, поэтому здесь трогаем только x и opacity —
       иначе GSAP затрёт rotate своим transform. */
    if (heroPics.length) {
      gsap.set(heroPics, {
        opacity: 0,
        xPercent: function (i) { return i === 0 ? -22 : 22; },
        rotation: function (i) { return i === 0 ? -6 : 5; }
      });
      gsap.to(heroPics, {
        opacity: 1, xPercent: 0,
        duration: 1, ease: 'power3.out', delay: .2, stagger: .08
      });
    }
  }

  /* ---------- Появление при прокрутке ----------
     Класс reveal-on ставит скрипт, а не разметка: если файл не загрузился,
     содержимое останется видимым. Скрывать текст стилем, а показывать
     скриптом — верный способ однажды показать родителю пустую страницу.

     Задержка внутри группы задаётся переменной --d, чтобы каскад шёл
     по порядку, а не всем скопом. */
  if (!REDUCE) {
    document.documentElement.classList.add('reveal-on');

    /* Шапка раздела появляется каскадом сама, без разметки: надзаголовок,
       заголовок и подводка — это всегда одни и те же три роли, и просить
       верстальщика расставлять там классы значит однажды забыть.
       Дистанция у каждой роли своя, задаётся в стилях (см. блок
       «ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ»), поэтому здесь только пометка. */
    document.querySelectorAll('.sec__head').forEach(function (head) {
      head.querySelectorAll(':scope > *').forEach(function (el) {
        el.classList.add('reveal');
      });
    });

    /* Задержка внутри группы — только для РАВНОПРАВНЫХ элементов: шести
       карточек педагогов, четырёх плиток, трёх отзывов. Им ехать одинаково,
       и очередь там читается как порядок, а не как ожидание. Роли внутри
       шапки раздела разводятся дистанцией, а не задержкой. */
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var kids = group.querySelectorAll(':scope > *');
      for (var i = 0; i < kids.length; i++) {
        kids[i].classList.add('reveal');
        kids[i].style.setProperty('--d', (i * 0.07) + 's');
      }
    });

    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: function (els) {
        els.forEach(function (el) { el.classList.add('is-in'); });
      }
    });
  }

  /* ---------- Счётчики ----------
     Цифры школы — её главный аргумент, поэтому они не появляются готовыми,
     а набегают: глаз задерживается ровно там, где нужно.
     Дробные и «около» пишем в data-suffix, чтобы счётчик не ломал «≈30». */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (isNaN(to)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    if (REDUCE) return;                 // в разметке уже стоит готовая цифра
    var obj = { v: 0 };
    /* Обнуляем ТОЛЬКО в момент срабатывания, а не при загрузке.
       Первая версия ставила ноль сразу — и четыре факта первого экрана
       висели как «0 детей в клубе», пока родитель не доскроллит до них
       на 90 % высоты окна. На ноутбуке они попадают в первый экран
       и до триггера не доезжают вовсе. */
    ScrollTrigger.create({
      trigger: el, start: 'top 96%', once: true,
      onEnter: function () {
        el.textContent = prefix + '0' + suffix;
        gsap.to(obj, {
          v: to, duration: 1.5, ease: 'power2.out',
          onUpdate: function () { el.textContent = prefix + Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  var mm = gsap.matchMedia();

  /* ================================================================
     ЛЕНТА ВОЗРАСТОВ
     ================================================================
     Секция закрепляется, и по прогрессу прокрутки сменяются четыре
     состояния — 0 класс, начальная, средняя, кружки. Смена
     последовательная, без перетекания: так же сделано у «Ники»,
     и школе понравился именно этот характер.

     Почему start: 'top top'. Первый вариант ставил 'top center' —
     смена начиналась, когда секция ещё не доехала до верха, и первый
     слайд родитель проскакивал не читая.

     Почему только с 901 px. На телефоне высота окна меняется на ходу
     (адресная строка Safari), закрепление на этом рвётся. Там тот же
     материал разложен лентой карточек со снапом — чистым CSS,
     без всякого скрипта.
     ================================================================ */
  (function ribbon() {
    var sec = document.querySelector('.ribbon');
    if (!sec) return;
    var slides = [].slice.call(sec.querySelectorAll('.rslide'));
    var tabs = [].slice.call(sec.querySelectorAll('.rscale__row button'));
    var fill = sec.querySelector('.rscale__fill');
    if (slides.length < 2) return;

    var current = -1;
    function show(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (i === current) return;
      current = i;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); });
      if (fill) {
        /* Делим на (n−1), а не на n: крайние точки шкалы стоят ровно
           на краях линии, и при делении на n заливка не доезжала
           до последней отметки — шкала выглядела недосчитанной. */
        fill.style.width = (i / (slides.length - 1) * 100) + '%';
        /* Заливка красится в цвет ступени: шкала внизу и метка вверху
           говорят об одном и том же одним цветом. */
        fill.style.backgroundColor = getComputedStyle(slides[i]).getPropertyValue('--stage') || '';
      }
      goal('stage_view', { stage: slides[i].getAttribute('data-stage') || i });
    }
    show(0);

    mm.add('(min-width: 901px)', function () {
      if (REDUCE) return;                       // без движения — просто первый слайд
      var st = ScrollTrigger.create({
        trigger: sec,
        start: 'top top',
        end: function () { return '+=' + window.innerHeight * (slides.length - 1) * 0.95; },
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          show(Math.floor(self.progress * slides.length * 0.999));
        }
      });

      /* Клик по отметке шкалы — перевод в нужное место закрепления,
         иначе шкала выглядит как кнопки, которые ничего не делают. */
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () {
          var span = st.end - st.start;
          var y = st.start + span * ((i + 0.5) / slides.length);
          window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
        });
      });

      return function () { st.kill(); };
    });
  })();

  /* ================================================================
     ОДИН ДЕНЬ — горизонтальной ленты больше нет
     ================================================================
     Здесь стоял сдвиг .day__track по scrub: день ехал слева направо,
     пока секция проходила мимо. Раздел пересобран по приёму «Династии» —
     заголовок прилипает по середине экрана, карточки проезжают мимо него
     обычной вертикальной прокруткой. Отдельная анимация для этого
     не нужна: липкий заголовок делает CSS (position: sticky),
     появление карточек — общий каскад reveal.

     Заодно ушла причина для лишнего пересчёта ScrollTrigger при смене
     ширины окна: горизонтальный сдвиг считался от scrollWidth ленты.
     ================================================================ */

  /* ================================================================
     ПЕРЕКЛЮЧАТЕЛЬ СТУПЕНЕЙ на странице школы
     ================================================================
     Начальная и средняя меняются на месте, без перезагрузки. Выбор
     пишем в адрес (#nachalnaya / #srednyaya), чтобы ссылку с главной
     можно было дать сразу на нужную половину и чтобы кнопка «назад»
     возвращала туда же.
     ================================================================ */
  (function tabs() {
    var box = document.querySelector('[data-tabs]');
    if (!box) return;
    var btns = [].slice.call(box.querySelectorAll('.tabs button'));
    var panels = btns.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });

    function open(i, push) {
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
      if (push && history.replaceState) history.replaceState(null, '', '#' + panels[i].id);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    btns.forEach(function (b, i) { b.addEventListener('click', function () { open(i, true); }); });

    var hash = location.hash.slice(1);
    var found = panels.findIndex(function (p) { return p.id === hash; });
    open(found > -1 ? found : 0, false);
  })();

  /* ---------- «Пропустить» в ленте возрастов ---------- */
  var skip = document.querySelector('.rskip');
  if (skip) {
    skip.addEventListener('click', function (e) {
      e.preventDefault();
      scrollToEl(document.querySelector(skip.getAttribute('href')));
    });
  }

  /* ---------- Про кольцо в первом экране ----------
     Здесь стоял медленный доворот кольца при прокрутке. Убран, и вот почему.

     Кольцо — идеальная окружность с равномерной обводкой. Повернуть такую
     фигуру значит не изменить ровным счётом ничего: анимация была не видна
     вообще. Зато поворот раздувал габаритный прямоугольник элемента — квадрат
     под углом 26° занимает заметно больше места, чем без поворота, — и на
     ширине 960 px страница из-за этого числилась шире окна на 40 px.
     Спасал только overflow-x: hidden у body, то есть баг был спрятан,
     а не исправлен.

     Итого: невидимый эффект ценой поломанной раскладки. Ровно тот случай,
     про который написано в шапке файла — анимация обязана что-то сообщать. */

  ScrollTrigger.refresh();
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

/* ==========================================================================
   ФОРМА ЗАЯВКИ
   ==========================================================================
   Отдельный модуль: он должен работать, даже если анимации выше упали
   с ошибкой. Заявка важнее анимации.
   ========================================================================== */
(function () {
  "use strict";

  function digits(s) { return (s || '').replace(/\D/g, ''); }

  document.querySelectorAll('form.form').forEach(function (form) {
    var phone = form.querySelector('input[name="phone"]');

    /* Маска телефона. Не мешаем вставке из буфера: приводим к виду
       +7 (XXX) XXX-XX-XX любое написание, включая 8 в начале. */
    if (phone) {
      phone.addEventListener('input', function () {
        var d = digits(phone.value);
        if (d[0] === '8') d = '7' + d.slice(1);
        if (d[0] !== '7') d = '7' + d;
        d = d.slice(0, 11);
        var out = '+7';
        if (d.length > 1) out += ' (' + d.slice(1, 4);
        if (d.length >= 5) out += ') ' + d.slice(4, 7);
        if (d.length >= 8) out += '-' + d.slice(7, 9);
        if (d.length >= 10) out += '-' + d.slice(9, 11);
        phone.value = out;
      });
    }

    /* Обёртки .field может не быть — у галочки согласия её нет.
       Без проверки closest вернёт null и обработчик умрёт молча. */
    function bad(field, on) {
      var box = field.closest('.field');
      if (box) box.classList.toggle('is-bad', on);
    }

    /* Галочка согласия не стоит заранее (19.09): подсказка об ошибке
       гаснет сразу, как только родитель её поставил */
    var consentBox = form.querySelector('input[name="consent"]');
    if (consentBox) consentBox.addEventListener('change', function () {
      if (consentBox.checked) form.classList.remove('is-nocheck');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Имя есть только у большой формы: в первом экране одно поле
         телефона, чтобы заявка стоила родителю один жест. Сервер имя
         тоже не требует — в чат уходит «Имя: не указано». */
      var name = form.querySelector('input[name="name"]');
      var consent = form.querySelector('input[name="consent"]');
      var ok = true;
      if (name) { if (!name.value.trim()) { bad(name, true); ok = false; } else bad(name, false); }
      if (digits(phone.value).length !== 11) { bad(phone, true); ok = false; } else bad(phone, false);

      /* Согласие проверяем и здесь, и на сервере. Здесь — чтобы родитель
         сразу увидел, чего не хватает; на сервере — чтобы заявка без
         согласия не попала в чат клуба в обход браузера. */
      var noCheck = consent && !consent.checked;
      form.classList.toggle('is-nocheck', noCheck);
      if (noCheck) { ok = false; }

      if (!ok) {
        var first = form.querySelector('.is-bad input') || (noCheck ? consent : null);
        if (first) first.focus();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Отправляем…';

      var body = {};
      new FormData(form).forEach(function (v, k) { body[k] = v; });
      body.page = location.pathname;

      /* Предпросмотр по временной ссылке: обработчика заявок там нет.
         Показываем тот же экран «спасибо», чтобы было видно, как форма
         себя ведёт, и честно подписываем, что заявка никуда не ушла.
         Флаг ставит tools/pack-preview.mjs, на боевом сайте его нет. */
      if (window.PREVIEW_LEAD) {
        setTimeout(function () { form.classList.add('is-sent'); }, 450);
        return;
      }

      fetch('/krylia-preview/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.classList.add('is-sent');
        if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', 'lead');
      }).catch(function (err) {
        /* Честно говорим, что не дошло, и даём телефон. Показывать
           «спасибо» на неудачной отправке нельзя: родитель будет ждать
           звонка, которого не будет. */
        btn.disabled = false;
        btn.textContent = label;
        var box = form.querySelector('.form__fail');
        if (box) box.hidden = false;
        if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', 'lead_error');
        console.error('заявка не ушла:', err);
      });
    });
  });
})();
