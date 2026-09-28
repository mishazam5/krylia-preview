/* ==========================================================================
   СЛОЙ ТЕЛЕФОНА (25.09.2026)

   Всё, что на телефоне должно работать иначе, а не просто выглядеть иначе.
   Выполняется до js/home.js и js/kit.js, поэтому успевает снять у них
   работу: метка снимается с элемента, и страничный скрипт его не трогает.

   Правило: ничего не делаем, если окно шире 900. Компьютер живёт как жил.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.matchMedia('(max-width: 900px)').matches) return;

  /* ------------------------------------------------------------------------
     0. НОВАЯ СТРАНИЦА ОТКРЫВАЕТСЯ СВЕРХУ
     Замечание клиента 25.09: переход по ссылке открывал следующую
     страницу на той же глубине, что и предыдущую. Так ведёт себя
     восстановление прокрутки в браузере вместе с длинными страницами:
     возвращаем его себе и уводим страницу наверх, если в адресе нет якоря.
     ------------------------------------------------------------------------ */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) {
    addEventListener('load', function () { scrollTo(0, 0); });
    scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------------
     1. ОТЗЫВЫ: лента стоит, листает палец
     На компьютере три колонки едут вверх с разной скоростью. На телефоне
     колонка одна, и текст уезжает из-под глаз, пока его читаешь. Поэтому
     отзывы становятся полосой, которую листает человек.
     ------------------------------------------------------------------------ */
  var revs = document.querySelector('[data-revs]');
  if (revs) {
    revs.removeAttribute('data-revs');       /* home.js эту ленту не заводит */
    revs.classList.add('is-still', 'm-strip');
    /* Все отзывы в одну полосу: на телефоне видна только первая колонка,
       остальные скрыты стилями, и половина голосов пропадала */
    var first = revs.querySelector('.h-revs__track');
    if (first) {
      [].slice.call(revs.querySelectorAll('.h-revs__track')).slice(1).forEach(function (track) {
        while (track.firstChild) first.appendChild(track.firstChild);
      });
    }
  }

  /* ------------------------------------------------------------------------
     2. РАЗДЕЛЫ-СКЛАДКИ
     Длинная страница-справочник («Сведения»: четырнадцать разделов, почти
     тридцать экранов на телефоне). Каждый раздел сворачивается: виден
     перечень заголовков, нужный раскрывается нажатием. Содержимое
     остаётся в разметке, поэтому поиск и требования к раскрытию
     информации не страдают.
     ------------------------------------------------------------------------ */
  var folds = document.querySelectorAll('[data-m-fold] > section');
  if (folds.length) {
    [].slice.call(folds).forEach(function (sec) {
      var head = sec.querySelector('h2, h3');
      if (!head) return;
      var det = document.createElement('details');
      det.className = 'm-fold ' + sec.className;
      if (sec.id) { det.id = sec.id; sec.removeAttribute('id'); }
      var sum = document.createElement('summary');
      while (head.firstChild) sum.appendChild(head.firstChild);
      head.parentNode.removeChild(head);
      det.appendChild(sum);
      var body = document.createElement('div');
      body.className = 'm-fold__body';
      while (sec.firstChild) body.appendChild(sec.firstChild);
      det.appendChild(body);
      sec.parentNode.replaceChild(det, sec);
    });
    /* Переход по ссылке из оглавления раскрывает нужный раздел */
    var openByHash = function () {
      var t = location.hash && document.querySelector(location.hash);
      if (t && t.tagName === 'DETAILS') { t.open = true; t.scrollIntoView(); }
    };
    addEventListener('hashchange', openByHash);
    openByHash();
  }

  /* ------------------------------------------------------------------------
     3. АККОРДЕОНЫ ИЗ ДЛИННЫХ ТЕКСТОВ
     Ценности школы написаны дословно и длинно: три таких абзаца подряд
     это полтора экрана сплошного текста. На телефоне виден заголовок,
     текст раскрывается нажатием. В разметке ничего не дублируется:
     существующие узлы переставляются.
     ------------------------------------------------------------------------ */
  [].slice.call(document.querySelectorAll('[data-m-acc] > li, [data-m-acc] > div, [data-m-acc] > article')).forEach(function (item, i) {
    var head = item.querySelector('h3, h4');
    if (!head) return;
    var det = document.createElement('details');
    det.className = 'm-acc ' + item.className;
    var sum = document.createElement('summary');
    /* Номер карточки (01, 02) остаётся в шапке складки: по нему видно,
       что это перечень, а не случайные строки. */
    var n = item.querySelector('.h-card__n');
    if (n) { n.parentNode.removeChild(n); sum.appendChild(n); }
    /* Заголовок переносим узлами, а не текстом: внутри бывает <em>,
       а копия текста при этом оставляла бы второй заголовок в теле. */
    var t = document.createElement('span');
    t.className = 'm-acc__t';
    while (head.firstChild) t.appendChild(head.firstChild);
    head.parentNode.removeChild(head);
    sum.appendChild(t);
    det.appendChild(sum);
    var body = document.createElement('div');
    body.className = 'm-acc__body';
    [].slice.call(item.childNodes).forEach(function (node) {
      /* пустые обёртки от заголовка и номера в тело не тащим */
      if (node.nodeType === 1 && !node.textContent.trim() && !node.querySelector('img, svg')) return;
      body.appendChild(node);
    });
    det.appendChild(body);
    if (i === 0 && item.parentNode.getAttribute('data-m-acc') === 'open-first') det.open = true;
    item.parentNode.replaceChild(det, item);
  });

  /* ------------------------------------------------------------------------
     4. ОДИНОЧНАЯ СКЛАДКА: data-m-fold-one="Подпись"
     Кусок раздела, который на телефоне не нужен сразу: баллы по каждому
     предмету, темы исследований, пояснение к награде. Заголовок раздела
     и главная цифра остаются на виду, подробность открывается нажатием.
     ------------------------------------------------------------------------ */
  [].slice.call(document.querySelectorAll('[data-m-fold-one]')).forEach(function (el) {
    var label = el.getAttribute('data-m-fold-one');
    var det = document.createElement('details');
    det.className = 'm-fold1';
    var sum = document.createElement('summary');
    sum.textContent = label;
    det.appendChild(sum);
    el.parentNode.insertBefore(det, el);
    det.appendChild(el);
  });

  /* ------------------------------------------------------------------------
     5. ХВОСТ СПИСКА: data-m-more="3"
     Список, где первых трёх хватает, чтобы понять, о чём речь: хроника,
     новости, награды. Остальное лежит в разметке и открывается кнопкой,
     то есть ничего не пропадает ни для человека, ни для поиска.
     ------------------------------------------------------------------------ */
  [].slice.call(document.querySelectorAll('[data-m-more]')).forEach(function (list) {
    var keep = Number(list.getAttribute('data-m-more')) || 3;
    var items = [].slice.call(list.children);
    if (items.length <= keep + 1) return;
    list.classList.add('m-more');
    list.style.setProperty('--m-keep', keep);
    items.forEach(function (it, i) { if (i >= keep) it.classList.add('m-more__hid'); });
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'm-more__btn';
    var rest = items.length - keep;
    btn.textContent = 'Показать ещё ' + rest;
    btn.addEventListener('click', function () {
      var open = list.classList.toggle('is-open');
      btn.textContent = open ? 'Свернуть' : 'Показать ещё ' + rest;
      if (!open) list.scrollIntoView({ block: 'start' });
    });
    list.parentNode.insertBefore(btn, list.nextSibling);
  });
})();
