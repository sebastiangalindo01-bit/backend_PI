(function () {
  'use strict';

  var spaces = {
    sistemas: 'Laboratorio de Sistemas 1',
    redes: 'Laboratorio de Redes',
    biblioteca: 'Sala de estudio biblioteca'
  };
  var slots = {
    manana: { label: '08:00–09:00' },
    mediaManana: { label: '11:00–13:00' },
    tarde: { label: '14:00–16:00' }
  };
  var conflictSlots = {
    ocupadaManana: '09:00–11:00',
    ocupadaTarde: '13:00–14:00'
  };
  var state = { space: '', date: '', slot: '', conflict: '', errors: {} };
  var flowFiles = [
    '04-asistente-reserva.html',
    '11-seleccionar-espacio.html',
    '12-seleccionar-fecha.html',
    '13-seleccionar-horario.html',
    '14-conflicto-horario.html',
    '15-validacion-reserva.html',
    '05-confirmacion-solicitud.html'
  ];

  function currentFile() {
    return decodeURIComponent(location.pathname.split('/').pop() || '');
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function values() {
    return {
      space: spaces[state.space] || '',
      date: formatDate(state.date),
      slot: slots[state.slot] ? slots[state.slot].label : '',
      conflict: conflictSlots[state.conflict] || ''
    };
  }

  function render() {
    var pageValues = values();
    document.querySelectorAll('[data-value]').forEach(function (node) {
      node.textContent = pageValues[node.getAttribute('data-value')] || 'Pendiente de selección';
    });
    document.querySelectorAll('[data-select-space]').forEach(function (button) {
      var selected = button.getAttribute('data-select-space') === state.space;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-select-date]').forEach(function (button) {
      var selected = button.getAttribute('data-select-date') === state.date;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-select-slot]').forEach(function (button) {
      var selected = button.getAttribute('data-select-slot') === state.slot;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-error]').forEach(function (node) {
      var message = state.errors[node.getAttribute('data-error')] || '';
      node.textContent = message;
      node.hidden = !message;
    });
    document.querySelectorAll('.demo-progress').forEach(function (progress) {
      var current = currentFile();
      var completed = state.space ? 1 : 0;
      if (state.date) completed = 2;
      if (state.slot) completed = 3;
      progress.querySelectorAll('li').forEach(function (item, index) {
        item.classList.toggle('is-complete', index < completed);
        item.classList.toggle('is-current',
          (index === 0 && current === '11-seleccionar-espacio.html') ||
          (index === 1 && current === '12-seleccionar-fecha.html') ||
          ((index === 2) && (current === '13-seleccionar-horario.html' || current === '14-conflicto-horario.html')) ||
          (index === 3 && (current === '15-validacion-reserva.html' || current === '05-confirmacion-solicitud.html'))
        );
      });
    });
  }

  function firstMissing() {
    if (!state.space) return { file: '11-seleccionar-espacio.html', error: 'space' };
    if (!state.date) return { file: '12-seleccionar-fecha.html', error: 'date' };
    if (!state.slot || state.conflict) return { file: '13-seleccionar-horario.html', error: 'slot' };
    return null;
  }

  function route(file, replace) {
    var missing = null;
    if (file === '12-seleccionar-fecha.html' && !state.space) {
      missing = { file: '11-seleccionar-espacio.html', error: 'space' };
    } else if ((file === '13-seleccionar-horario.html' || file === '14-conflicto-horario.html') && (!state.space || !state.date)) {
      missing = firstMissing();
    } else if (file === '15-validacion-reserva.html' || file === '05-confirmacion-solicitud.html') {
      missing = firstMissing();
    }
    if (missing) {
      state.errors[missing.error] = missing.error === 'slot'
        ? 'Elige un horario disponible antes de continuar.'
        : missing.error === 'date'
          ? 'Elige una fecha antes de continuar.'
          : 'Elige un espacio antes de continuar.';
      file = missing.file;
      replace = true;
    }
    var target = new URL(file, location.href);
    fetch(target.href).then(function (response) {
      if (!response.ok) throw new Error('No se pudo cargar el paso.');
      return response.text();
    }).then(function (html) {
      var page = new DOMParser().parseFromString(html, 'text/html');
      var nextContent = page.querySelector('.app-content');
      var currentContent = document.querySelector('.app-content');
      if (!nextContent || !currentContent) throw new Error('El paso no tiene contenido compatible.');
      currentContent.replaceWith(nextContent);
      document.title = page.title;
      if (replace) history.replaceState({ flow: true }, '', target.pathname);
      else history.pushState({ flow: true }, '', target.pathname);
      render();
      window.scrollTo(0, 0);
    }).catch(function () {
      var notice = document.querySelector('[data-navigation-error]');
      if (notice) {
        notice.textContent = 'No se pudo abrir el siguiente paso. Abre la demostración desde un servidor web local.';
        notice.hidden = false;
      }
    });
  }

  function showError(key, message) {
    state.errors[key] = message;
    render();
    var error = document.querySelector('[data-error="' + key + '"]');
    if (error) error.focus();
  }

  function validate(file) {
    if (file === '11-seleccionar-espacio.html' && !state.space) {
      showError('space', 'Selecciona un espacio para continuar.');
      return false;
    }
    if (file === '12-seleccionar-fecha.html' && !state.date) {
      showError('date', 'Selecciona una fecha para continuar.');
      return false;
    }
    if (file === '13-seleccionar-horario.html' && (!state.slot || state.conflict)) {
      showError('slot', state.conflict
        ? 'Ese intervalo está en conflicto. Selecciona uno de los horarios disponibles.'
        : 'Selecciona un horario disponible para continuar.');
      return false;
    }
    return true;
  }

  function isFlowUrl(href) {
    try {
      var url = new URL(href, location.href);
      return url.origin === location.origin && flowFiles.indexOf(decodeURIComponent(url.pathname.split('/').pop())) !== -1;
    } catch (error) {
      return false;
    }
  }

  document.addEventListener('click', function (event) {
    var control = event.target.closest('[data-select-space], [data-select-date], [data-select-slot], [data-conflict-slot], [data-alternative-slot], [data-next], [data-reset-demo]');
    if (control) {
      event.preventDefault();
      if (control.hasAttribute('data-select-space')) {
        var space = control.getAttribute('data-select-space');
        if (state.space !== space) {
          state.date = '';
          state.slot = '';
          state.conflict = '';
        }
        state.space = space;
        delete state.errors.space;
      } else if (control.hasAttribute('data-select-date')) {
        var date = control.getAttribute('data-select-date');
        if (state.date !== date) {
          state.slot = '';
          state.conflict = '';
        }
        state.date = date;
        delete state.errors.date;
      } else if (control.hasAttribute('data-select-slot')) {
        state.slot = control.getAttribute('data-select-slot');
        state.conflict = '';
        delete state.errors.slot;
      } else if (control.hasAttribute('data-conflict-slot')) {
        state.slot = '';
        state.conflict = control.getAttribute('data-conflict-slot');
        delete state.errors.slot;
        route('14-conflicto-horario.html');
        return;
      } else if (control.hasAttribute('data-alternative-slot')) {
        state.slot = control.getAttribute('data-alternative-slot');
        state.conflict = '';
        delete state.errors.slot;
        route('13-seleccionar-horario.html');
        return;
      } else if (control.hasAttribute('data-next')) {
        if (!validate(currentFile())) return;
        route(control.getAttribute('data-next'));
        return;
      } else if (control.hasAttribute('data-reset-demo')) {
        state.space = '';
        state.date = '';
        state.slot = '';
        state.conflict = '';
        state.errors = {};
        route('11-seleccionar-espacio.html');
        return;
      }
      render();
      return;
    }

    var link = event.target.closest('a[href]');
    if (link && isFlowUrl(link.href) && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      route(decodeURIComponent(new URL(link.href).pathname.split('/').pop()));
    }
  });

  window.addEventListener('popstate', function () {
    var file = currentFile();
    if (flowFiles.indexOf(file) !== -1) route(file, true);
  });

  var initialFile = currentFile();
  var initialMissing = null;
  if (initialFile === '12-seleccionar-fecha.html' && !state.space) {
    initialMissing = { file: '11-seleccionar-espacio.html', error: 'space' };
  } else if ((initialFile === '13-seleccionar-horario.html' || initialFile === '14-conflicto-horario.html') && (!state.space || !state.date)) {
    initialMissing = firstMissing();
  } else if (initialFile === '15-validacion-reserva.html' || initialFile === '05-confirmacion-solicitud.html') {
    initialMissing = firstMissing();
  }
  if (initialMissing) {
    state.errors[initialMissing.error] = initialMissing.error === 'space'
      ? 'Selecciona un espacio para continuar.'
      : initialMissing.error === 'date'
        ? 'Selecciona una fecha para continuar.'
        : 'Selecciona un horario disponible para continuar.';
    route(initialMissing.file, true);
  } else {
    render();
  }
}());