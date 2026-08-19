/* Equip Solutions Group — navigation behavior.
   Dropdowns open on hover (pointer) and on click/keyboard (all devices).
   Below 900px the nav becomes a panel and dropdowns become accordions. */

(function () {
  'use strict';

  var mq = window.matchMedia('(max-width: 900px)');
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var items = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-dropdown'));

  function closeAll(except) {
    items.forEach(function (item) {
      if (item === except) return;
      item.classList.remove('open');
      var t = item.querySelector('.nav-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  items.forEach(function (item) {
    var trigger = item.querySelector('.nav-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = item.classList.contains('open');
      closeAll(item);
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });

    // Hover only on pointer devices at desktop width
    item.addEventListener('mouseenter', function () {
      if (mq.matches || !window.matchMedia('(hover: hover)').matches) return;
      closeAll(item);
      item.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('mouseleave', function () {
      if (mq.matches || !window.matchMedia('(hover: hover)').matches) return;
      item.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    // Close when focus leaves the whole item (keyboard users tabbing through)
    item.addEventListener('focusout', function (e) {
      if (mq.matches) return;
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Mobile panel
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item')) closeAll(null);
    if (nav && nav.classList.contains('is-open') && !e.target.closest('.site-header')) {
      nav.classList.remove('is-open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAll(null);
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; }
      toggle.focus();
    }
  });

  mq.addEventListener('change', function () {
    closeAll(null);
    if (nav) nav.classList.remove('is-open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; }
  });

  // Quote form — no backend yet. Hand off to email so nothing is silently lost.
  var form = document.querySelector('[data-quote-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var lines = [];
      data.forEach(function (value, key) {
        if (String(value).trim()) lines.push(key.replace(/_/g, ' ') + ': ' + value);
      });
      var subject = 'Quote request — ' + (data.get('interest') || 'General');
      window.location.href =
        'mailto:paul@equipsolutionsgroup.com?subject=' +
        encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    });
  }
})();
