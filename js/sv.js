/* ==========================================================================
   «Сведения»: подсветка текущего подраздела в оглавлении.

   Единственное движение раздела и у него есть причина: раздел длинный,
   проверяющий должен видеть, в каком из четырнадцати подразделов он
   сейчас. Работает и без GSAP, на IntersectionObserver: подсветка
   нужна и тем, у кого движение отключено в системе.
   ========================================================================== */
(function () {
  'use strict';

  var links = [].slice.call(document.querySelectorAll('.sv-nav a'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var visible = new Map();

  function mark(id) {
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null); });
    /* Текущим считаем первый сверху подраздел, который пересекает
       верхнюю треть окна */
    var best = null, bestTop = Infinity;
    sections.forEach(function (s) {
      var top = visible.get(s.id);
      if (top !== null && top !== undefined && top < bestTop) { best = s.id; bestTop = top; }
    });
    if (best) mark(best);
  }, { rootMargin: '-20% 0px -65% 0px' });

  sections.forEach(function (s) { if (s) io.observe(s); });
  mark(sections[0].id);
})();
