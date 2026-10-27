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

  var form = document.querySelector('[data-quote-form]');
  if (form) {
    var live = form.querySelector('.form-live');
    var submit = form.querySelector('[data-submit]');
    var branches = Array.prototype.slice.call(form.querySelectorAll('[data-branch]'));

    function selectedIntent() {
      var checked = form.querySelector('[name="intent"]:checked');
      return checked ? checked.value : '';
    }

    function syncBranches() {
      var intent = selectedIntent();
      branches.forEach(function (fs) {
        var key = fs.getAttribute('data-branch');
        var show = !!intent && (key === intent || key === 'contact');
        fs.hidden = !show;
        fs.disabled = !show;
      });
      var actions = form.querySelector('.form-actions');
      if (actions) actions.hidden = !intent;
    }

    function clearErrors() {
      Array.prototype.forEach.call(form.querySelectorAll('.field-error'), function (el) {
        el.hidden = true;
        el.textContent = '';
      });
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) {
        el.removeAttribute('aria-invalid');
      });
      if (live) {
        live.className = 'form-live';
        live.textContent = '';
      }
    }

    function showErrors(errors) {
      var first = null;
      (errors || []).forEach(function (err) {
        var el = null;
        Array.prototype.forEach.call(form.querySelectorAll('[data-error-for="' + err.field + '"]'), function (node) {
          if (!node.closest('[hidden]')) el = node;
        });
        if (el) {
          el.hidden = false;
          el.textContent = err.message;
          if (!first) first = el;
        }
        var field = null;
        Array.prototype.forEach.call(form.querySelectorAll('[name="' + err.field + '"]'), function (node) {
          if (!node.closest('[hidden]')) field = node;
        });
        if (field) {
          field.setAttribute('aria-invalid', 'true');
        }
      });
      if (live) {
        live.className = 'form-live form-live--error';
        live.textContent = (errors && errors[0] && errors[0].message) || 'Fix the highlighted fields and send again.';
      }
      if (first && first.previousElementSibling) {
        var focusable = first.parentElement && first.parentElement.querySelector('input, select, textarea');
        if (focusable) focusable.focus();
      }
    }

    function payloadFromForm() {
      var data = new FormData(form);
      var out = { source: 'quote-form' };
      data.forEach(function (value, key) {
        if (typeof value !== 'string') return;
        if (key === 'mixTypes') {
          if (!Array.isArray(out.mixTypes)) out.mixTypes = [];
          out.mixTypes.push(value);
          return;
        }
        out[key] = value;
      });
      return out;
    }

    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'intent') {
        clearErrors();
        syncBranches();
      }
    });

    syncBranches();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      if (!selectedIntent()) {
        showErrors([{ field: 'intent', message: 'Choose what we can help with.' }]);
        return;
      }
      if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-busy', 'true');
      }
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payloadFromForm()),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          });
        })
        .then(function (result) {
          if (result.body && result.body.ok) {
            if (live) {
              live.className = 'form-live form-live--ok';
              live.textContent = 'Request sent. Paul follows up within one business day.';
            }
            form.querySelectorAll('fieldset').forEach(function (fs) {
              if (!fs.classList.contains('branch--contact') && fs.getAttribute('data-branch') !== null) {
                fs.disabled = true;
              }
            });
            var intentSet = form.querySelector('fieldset');
            if (intentSet) intentSet.disabled = true;
            var contact = form.querySelector('.branch--contact');
            if (contact) contact.disabled = true;
            if (submit) submit.hidden = true;
            return;
          }
          var errors = (result.body && result.body.errors) || [{ field: 'form', message: 'The request could not be sent. Call or email instead.' }];
          showErrors(errors);
          if (submit) {
            submit.disabled = false;
            submit.removeAttribute('aria-busy');
          }
        })
        .catch(function () {
          showErrors([{ field: 'form', message: 'The request could not be sent. Call or email instead.' }]);
          if (submit) {
            submit.disabled = false;
            submit.removeAttribute('aria-busy');
          }
        });
    });
  }
})();
