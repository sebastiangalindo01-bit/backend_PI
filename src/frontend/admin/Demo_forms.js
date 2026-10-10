/* SAICI · Motor de formularios de demostración (crear/editar -> revisar -> confirmar).
   No hace fetch ni escribe en ningún sitio: todo vive en memoria. */
(function () {
  'use strict';
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  window.DemoCrud = function (cfg) {
    var root = document.querySelector(cfg.root), values = {}, editing = null, mode = 'create';
    var notice = el('div'); notice.setAttribute('aria-live', 'polite');
    var panel = el('section', 'df-panel'); panel.hidden = true;
    var list = el('div');
    root.append(notice, panel, list);
    document.querySelector(cfg.newBtn).addEventListener('click', function () { openForm('create', null); });

    function say(msg, kind) {
      notice.className = msg ? 'prototype-notice is-' + kind : '';
      notice.textContent = msg || '';
    }
    function focusPanel() {
      var h = panel.querySelector('h2'); h.tabIndex = -1; panel.scrollIntoView({ block: 'start' }); h.focus({ preventScroll: true });
    }

    function renderList() {
      var t = el('table', 'df-table'), hr = el('tr');
      cfg.columns.concat([{ key: '_a', label: 'Acciones' }]).forEach(function (c) { hr.appendChild(el('th', null, c.label)); });
      t.appendChild(el('thead')).appendChild(hr);
      var body = el('tbody');
      cfg.rows.forEach(function (r) {
        var tr = el('tr');
        cfg.columns.forEach(function (c) {
          var td = el('td'); td.dataset.label = c.label;
          if (c.badge) td.appendChild(el('span', 'df-badge' + (r[c.key] === 'Inactivo' ? ' is-off' : ''), r[c.key]));
          else td.textContent = r[c.key];
          tr.appendChild(td);
        });
        var ta = el('td'); ta.dataset.label = 'Acciones';
        var b = el('button', 'demo-link is-secondary', 'Editar'); b.type = 'button';
        b.setAttribute('aria-label', 'Editar ' + cfg.rowName(r));
        b.addEventListener('click', function () { openForm('edit', r); });
        ta.appendChild(b); tr.appendChild(ta); body.appendChild(tr);
      });
      t.appendChild(body); list.innerHTML = ''; list.appendChild(t);
    }

    function openForm(m, row) {
      mode = m; editing = row; say('');
      values = {};
      cfg.fields.forEach(function (f) { values[f.id] = row && row[f.id] != null ? String(row[f.id]) : ''; });
      buildForm(); focusPanel();
    }

    function setErr(f, msg) {
      var w = panel.querySelector('[data-f="' + f.id + '"]'); if (!w) return;
      var i = w.querySelector('.df-input'), e = w.querySelector('.df-error');
      w.classList.toggle('has-error', !!msg); e.textContent = msg || '';
      if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
    }
    function check(f) {
      var v = (values[f.id] || '').trim(), msg = '';
      if (!v) { if (f.required) msg = 'Completa «' + f.label + '»: es obligatorio.'; }
      else if (f.validate) msg = f.validate(v, values, editing) || '';
      setErr(f, msg); return !msg;
    }

    function buildForm() {
      panel.hidden = false; panel.innerHTML = '';
      panel.appendChild(el('h2', null, (mode === 'edit' ? 'Editar ' : 'Crear ') + cfg.noun));
      panel.appendChild(el('p', 'screen-muted', 'Los campos con * son obligatorios. Es una demostración: no se guardará ningún dato real.'));
      var form = el('form'); form.noValidate = true;
      var summary = el('div'); summary.setAttribute('role', 'alert');
      form.appendChild(summary);
      var grid = el('div', 'df-grid');
      cfg.fields.forEach(function (f) {
        var w = el('div', 'df-field' + (f.wide ? ' is-wide' : '')); w.dataset.f = f.id;
        var lab = el('label', null, f.label + (f.required ? ' *' : '')); lab.htmlFor = 'f-' + f.id;
        var i;
        if (f.type === 'select') {
          i = el('select'); i.appendChild(new Option('Selecciona una opción', ''));
          f.options.forEach(function (o) { i.appendChild(new Option(o, o)); });
        } else if (f.type === 'textarea') { i = el('textarea'); i.rows = 3; }
        else { i = el('input'); i.type = f.type || 'text'; if (f.type === 'number') i.inputMode = 'numeric'; }
        i.id = 'f-' + f.id; i.name = f.id; i.className = 'df-input'; i.value = values[f.id];
        if (f.required) i.setAttribute('aria-required', 'true');
        var hint = el('div', 'df-hint', f.hint || ''), err = el('div', 'df-error'); err.id = 'e-' + f.id;
        i.setAttribute('aria-describedby', err.id);
        i.addEventListener('blur', function () { check(f); });
        i.addEventListener('input', function () {
          values[f.id] = i.value;
          if (w.classList.contains('has-error')) check(f);
          (f.deps || []).forEach(function (d) { var df = cfg.fields.filter(function (x) { return x.id === d; })[0]; if (values[d]) check(df); });
        });
        w.append(lab, i, hint, err); grid.appendChild(w);
      });
      form.appendChild(grid);
      var act = el('div', 'df-actions');
      var ok = el('button', 'demo-link', 'Revisar datos'); ok.type = 'submit';
      var no = el('button', 'demo-link is-secondary', 'Cancelar'); no.type = 'button';
      no.addEventListener('click', function () { panel.hidden = true; say('Edición cancelada. No se guardó nada.', 'error'); });
      act.append(ok, no); form.appendChild(act);
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var bad = cfg.fields.filter(function (f) { return !check(f); });
        if (bad.length) {
          summary.className = 'prototype-notice is-error';
          summary.textContent = 'Hay ' + bad.length + (bad.length === 1 ? ' campo' : ' campos') + ' por corregir: ' + bad.map(function (f) { return f.label; }).join(', ') + '.';
          document.getElementById('f-' + bad[0].id).focus();
        } else review();
      });
      panel.appendChild(form);
    }

    function review() {
      panel.innerHTML = '';
      panel.appendChild(el('h2', null, 'Revisa antes de confirmar'));
      panel.appendChild(el('p', 'screen-muted', 'Verifica que los datos sean correctos. Demostración: al confirmar no se guardará nada real.'));
      var dl = el('dl', 'df-review');
      cfg.fields.forEach(function (f) {
        var d = el('div', f.wide ? 'is-wide' : '');
        d.append(el('dt', null, f.label), el('dd', null, (values[f.id] || '').trim() || 'Sin especificar'));
        dl.appendChild(d);
      });
      panel.appendChild(dl);
      var act = el('div', 'df-actions');
      var ok = el('button', 'demo-link', 'Confirmar (demostración)'); ok.type = 'button';
      var back = el('button', 'demo-link is-secondary', 'Volver a editar'); back.type = 'button';
      back.addEventListener('click', function () { buildForm(); focusPanel(); });
      ok.addEventListener('click', function () {
        panel.hidden = true;
        say('Demostración: ' + cfg.noun + ' «' + cfg.rowName(values) + '» se habría ' + (mode === 'edit' ? 'actualizado' : 'creado') + ' correctamente. No se modificó información real.', 'success');
        notice.scrollIntoView({ block: 'start' });
      });
      act.append(ok, back); panel.appendChild(act); focusPanel();
    }

    renderList();
  };
})();