/* ==========================================================================
   SAICI · Lógica de demostración para:
     06-mis-reservas.html · 07-historial-reservas.html · 08-perfil.html

   REGLAS DEL PROYECTO (se cumplen aquí):
     - Solo datos de ejemplo definidos en este archivo.
     - Sin fetch / XHR / APIs / backend.
     - Sin localStorage, sessionStorage, cookies ni IndexedDB.
       Los cambios viven solo en memoria: al recargar la página
       todo vuelve a los datos de ejemplo.
   La pantalla se elige con <body data-page="reservas|historial|perfil">.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------- Datos de ejemplo ---------------------------- */
  var ESPACIOS = [
    { nombre: 'Laboratorio de Sistemas 1', tipo: 'Laboratorio' },
    { nombre: 'Laboratorio de Redes', tipo: 'Laboratorio' },
    { nombre: 'Sala de estudio biblioteca', tipo: 'Biblioteca' }
  ];
  var MOTIVOS = ['Actividad académica', 'Trabajo remoto', 'Reunión de equipo', 'Estudio individual'];
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  // Reservas próximas (Mis reservas)
  var reservas = [
    { id: 1, espacio: 'Laboratorio de Sistemas 1', fecha: '2026-10-20', inicio: '10:00', fin: '12:00', estado: 'Confirmada', motivo: 'Actividad académica' },
    { id: 2, espacio: 'Sala de estudio biblioteca', fecha: '2026-10-24', inicio: '14:00', fin: '16:00', estado: 'Pendiente', motivo: 'Estudio individual' },
    { id: 3, espacio: 'Laboratorio de Redes', fecha: '2026-10-27', inicio: '08:00', fin: '10:00', estado: 'Confirmada', motivo: 'Trabajo remoto' },
    { id: 4, espacio: 'Laboratorio de Sistemas 1', fecha: '2026-11-03', inicio: '15:00', fin: '17:00', estado: 'Pendiente', motivo: 'Reunión de equipo' },
    { id: 5, espacio: 'Sala de estudio biblioteca', fecha: '2026-11-05', inicio: '09:00', fin: '11:00', estado: 'Confirmada', motivo: 'Trabajo remoto' },
    { id: 6, espacio: 'Laboratorio de Redes', fecha: '2026-10-14', inicio: '13:00', fin: '15:00', estado: 'Cancelada', motivo: 'Actividad académica' }
  ];

  // Historial (reservas pasadas)
  var historial = [
    { espacio: 'Sala de estudio biblioteca', fecha: '2026-10-02', inicio: '16:00', fin: '18:00', estado: 'Finalizada' },
    { espacio: 'Laboratorio de Redes', fecha: '2026-09-26', inicio: '10:00', fin: '12:00', estado: 'Finalizada' },
    { espacio: 'Laboratorio de Sistemas 1', fecha: '2026-09-12', inicio: '09:00', fin: '11:00', estado: 'Finalizada' },
    { espacio: 'Sala de estudio biblioteca', fecha: '2026-09-05', inicio: '13:00', fin: '14:00', estado: 'Cancelada' },
    { espacio: 'Laboratorio de Sistemas 1', fecha: '2026-08-28', inicio: '14:00', fin: '16:00', estado: 'Finalizada' },
    { espacio: 'Sala de estudio biblioteca', fecha: '2026-08-15', inicio: '08:00', fin: '10:00', estado: 'Finalizada' },
    { espacio: 'Laboratorio de Redes', fecha: '2026-08-07', inicio: '15:00', fin: '17:00', estado: 'Cancelada' },
    { espacio: 'Laboratorio de Sistemas 1', fecha: '2026-07-22', inicio: '09:00', fin: '12:00', estado: 'Finalizada' }
  ];

  // Perfil
  var perfil = {
    nombres: 'Nicolas', apellidos: 'Ceballos',
    correo: 'nicolas.ceballos@uceva.edu.co', telefono: '300 000 0000',
    tipo: 'Egresado', rol: 'Usuario'
  };

  /* ------------------------------- Utilidades ------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fmtFecha(iso) {
    var p = iso.split('-');
    return p[2] + ' ' + MESES[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function fmtHorario(r) { return r.inicio + ' – ' + r.fin; }
  function tipoDe(nombre) {
    for (var i = 0; i < ESPACIOS.length; i++) if (ESPACIOS[i].nombre === nombre) return ESPACIOS[i].tipo;
    return '';
  }
  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function badge(estado) {
    return el('span', 'rv-badge rv-badge--' + norm(estado), estado + ' · ejemplo');
  }

  // Aviso de demostración (role=status, lo leen los lectores de pantalla)
  var toastTimer = null;
  function toast(msg) {
    var zone = $('#rv-toast-zone');
    if (!zone) return;
    zone.textContent = '';
    var t = el('div', 'rv-toast');
    t.appendChild(el('span', 'rv-toast__tag', 'DEMOSTRACIÓN'));
    t.appendChild(el('span', 'rv-toast__msg', msg));
    var x = el('button', 'rv-toast__close', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Cerrar aviso');
    x.addEventListener('click', function () { zone.textContent = ''; });
    t.appendChild(x);
    zone.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { zone.textContent = ''; }, 9000);
  }

  function openDialog(dlg, returnFocusTo) {
    dlg._returnTo = returnFocusTo || document.activeElement;
    dlg.showModal();
  }
  function closeDialog(dlg) { if (dlg.open) dlg.close(); }
  function wireDialog(dlg, closeOnBackdrop) {
    dlg.addEventListener('close', function () {
      var t = dlg._returnTo;
      if (t && document.contains(t)) t.focus();
    });
    if (closeOnBackdrop) {
      dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(dlg); });
    }
    var cancels = dlg.querySelectorAll('[data-close]');
    for (var i = 0; i < cancels.length; i++) {
      cancels[i].addEventListener('click', function () { closeDialog(dlg); });
    }
  }

  function fillSelect(sel, values, withAll, allLabel) {
    sel.textContent = '';
    if (withAll) {
      var o = el('option', null, allLabel);
      o.value = '';
      sel.appendChild(o);
    }
    values.forEach(function (v) {
      var op = el('option', null, v);
      op.value = v;
      sel.appendChild(op);
    });
  }

  function setError(input, errEl, msg) {
    errEl.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function cell(label, content, extraCls) {
    var c = el('div', 'rv-cell' + (extraCls ? ' ' + extraCls : ''));
    c.setAttribute('role', 'cell');
    c.appendChild(el('span', 'rv-cell__label', label));
    if (typeof content === 'string') c.appendChild(document.createTextNode(content));
    else c.appendChild(content);
    return c;
  }

  function emptyState(title, text) {
    var d = el('div', 'rv-empty');
    d.appendChild(el('strong', null, title));
    d.appendChild(document.createTextNode(text));
    return d;
  }

  /* ------------------------------ MIS RESERVAS ------------------------------ */
  function initReservas() {
    var list = $('#rv-list');
    var count = $('#rv-count');
    var fText = $('#f-texto'), fEstado = $('#f-estado'), fTipo = $('#f-tipo');
    var editDlg = $('#dlg-editar'), confirmDlg = $('#dlg-cancelar'), viewDlg = $('#dlg-ver');
    var current = null; // reserva en edición / cancelación

    fillSelect(fEstado, ['Confirmada', 'Pendiente', 'Cancelada'], true, 'Todos');
    fillSelect(fTipo, ['Laboratorio', 'Biblioteca'], true, 'Todos');
    fillSelect($('#e-espacio'), ESPACIOS.map(function (e) { return e.nombre; }), false);
    fillSelect($('#e-motivo'), MOTIVOS, false);

    function filtradas() {
      var q = norm(fText.value.trim());
      return reservas.filter(function (r) {
        if (q && norm(r.espacio).indexOf(q) === -1) return false;
        if (fEstado.value && r.estado !== fEstado.value) return false;
        if (fTipo.value && tipoDe(r.espacio) !== fTipo.value) return false;
        return true;
      }).sort(function (a, b) {
        return (a.fecha + a.inicio) < (b.fecha + b.inicio) ? -1 : 1;
      });
    }

    function render() {
      var rows = filtradas();
      list.textContent = '';

      var head = el('div', 'rv-row rv-row--reservas rv-row--head');
      head.setAttribute('role', 'row');
      ['Espacio', 'Fecha', 'Horario', 'Estado', 'Acciones'].forEach(function (h) {
        var c = el('div', 'rv-cell', h);
        c.setAttribute('role', 'columnheader');
        head.appendChild(c);
      });
      list.appendChild(head);

      if (!rows.length) {
        list.appendChild(emptyState('No hay reservas con esos filtros.', 'Cambia o limpia los filtros para ver más resultados.'));
      }

      rows.forEach(function (r) {
        var row = el('div', 'rv-row rv-row--reservas');
        row.setAttribute('role', 'row');
        row.appendChild(cell('Espacio', r.espacio, 'rv-cell--name'));
        row.appendChild(cell('Fecha', fmtFecha(r.fecha)));
        row.appendChild(cell('Horario', fmtHorario(r)));
        row.appendChild(cell('Estado', badge(r.estado)));

        var acts = el('div', 'rv-actions');
        var ver = el('button', 'rv-btn rv-btn--sm', 'Ver');
        ver.type = 'button';
        ver.setAttribute('aria-label', 'Ver reserva de ' + r.espacio + ', ' + fmtFecha(r.fecha));
        ver.addEventListener('click', function () { abrirVer(r, ver); });
        acts.appendChild(ver);

        if (r.estado !== 'Cancelada') {
          var ed = el('button', 'rv-btn rv-btn--sm', 'Editar');
          ed.type = 'button';
          ed.id = 'btn-editar-' + r.id;
          ed.setAttribute('aria-label', 'Editar reserva de ' + r.espacio + ', ' + fmtFecha(r.fecha));
          ed.addEventListener('click', function () { abrirEditar(r, ed); });
          acts.appendChild(ed);

          var ca = el('button', 'rv-btn rv-btn--sm rv-btn--danger', 'Cancelar');
          ca.type = 'button';
          ca.setAttribute('aria-label', 'Cancelar reserva de ' + r.espacio + ', ' + fmtFecha(r.fecha));
          ca.addEventListener('click', function () { abrirCancelar(r, ca); });
          acts.appendChild(ca);
        }
        row.appendChild(cell('Acciones', acts, 'rv-cell--actions'));
        list.appendChild(row);
      });

      count.textContent = 'Mostrando ' + rows.length + ' de ' + reservas.length;
    }

    /* Ver */
    function abrirVer(r, trigger) {
      var dl = $('#ver-datos');
      dl.textContent = '';
      [['Espacio', r.espacio], ['Fecha', fmtFecha(r.fecha)], ['Horario', fmtHorario(r)],
       ['Motivo de uso', r.motivo], ['Estado', r.estado + ' (ejemplo)']].forEach(function (p) {
        var d = el('div');
        d.appendChild(el('dt', null, p[0]));
        d.appendChild(el('dd', null, p[1]));
        dl.appendChild(d);
      });
      openDialog(viewDlg, trigger);
    }

    /* Editar */
    function abrirEditar(r, trigger) {
      current = r;
      $('#e-espacio').value = r.espacio;
      $('#e-fecha').value = r.fecha;
      $('#e-inicio').value = r.inicio;
      $('#e-fin').value = r.fin;
      $('#e-motivo').value = r.motivo;
      ['e-fecha', 'e-inicio', 'e-fin'].forEach(function (id) { setError($('#' + id), $('#' + id + '-err'), ''); });
      openDialog(editDlg, trigger);
    }

    $('#form-editar').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fecha = $('#e-fecha'), ini = $('#e-inicio'), fin = $('#e-fin');
      var ok = true;
      setError(fecha, $('#e-fecha-err'), fecha.value ? '' : 'Selecciona una fecha.');
      if (!fecha.value) ok = false;
      var msgI = '', msgF = '';
      if (!ini.value) msgI = 'Indica la hora de inicio.';
      else if (!/^\d{2}:\d{2}$/.test(ini.value)) msgI = 'Indica una hora de inicio válida.';
      if (!fin.value) msgF = 'Indica la hora de finalización.';
      else if (!/^\d{2}:\d{2}$/.test(fin.value)) msgF = 'Indica una hora de finalización válida.';
      else if (ini.value && fin.value <= ini.value) msgF = 'La hora final debe ser posterior a la inicial.';
      setError(ini, $('#e-inicio-err'), msgI);
      setError(fin, $('#e-fin-err'), msgF);
      if (msgI || msgF) ok = false;
      if (!ok) {
        var first = editDlg.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }

      var r = current;
      r.espacio = $('#e-espacio').value;
      r.fecha = fecha.value;
      r.inicio = ini.value;
      r.fin = fin.value;
      r.motivo = $('#e-motivo').value;
      var btnId = 'btn-editar-' + r.id;
      closeDialog(editDlg);
      render();
      var again = document.getElementById(btnId);
      editDlg._returnTo = again || count;
      toast('Reserva editada de forma simulada. No se guardó nada: al recargar la página vuelven los datos de ejemplo.');
      (again || count).focus();
    });

    /* Cancelar (con confirmación) */
    function abrirCancelar(r, trigger) {
      current = r;
      $('#cancel-resumen').textContent =
        r.espacio + ' · ' + fmtFecha(r.fecha) + ' · ' + fmtHorario(r);
      openDialog(confirmDlg, trigger);
    }

    $('#btn-confirmar-cancelar').addEventListener('click', function () {
      current.estado = 'Cancelada';
      confirmDlg._returnTo = null;
      closeDialog(confirmDlg);
      render();
      toast('Reserva cancelada de forma simulada. No se guardó nada: al recargar la página vuelven los datos de ejemplo.');
      count.focus();
    });

    wireDialog(editDlg, false);
    wireDialog(confirmDlg, true);
    wireDialog(viewDlg, true);

    /* Filtros */
    $('#form-filtros').addEventListener('submit', function (e) { e.preventDefault(); render(); });
    fText.addEventListener('input', render);
    fEstado.addEventListener('change', render);
    fTipo.addEventListener('change', render);
    $('#btn-limpiar').addEventListener('click', function () {
      fText.value = ''; fEstado.value = ''; fTipo.value = '';
      render();
      fText.focus();
    });

    render();
  }

  /* --------------------------------- HISTORIAL --------------------------------- */
  function initHistorial() {
    var list = $('#rv-list'), count = $('#rv-count');
    var fDesde = $('#f-desde'), fHasta = $('#f-hasta'), fEstado = $('#f-estado'), fEspacio = $('#f-espacio');
    var err = $('#f-rango-err');

    fillSelect(fEstado, ['Finalizada', 'Cancelada'], true, 'Todos');
    fillSelect(fEspacio, ESPACIOS.map(function (e) { return e.nombre; }), true, 'Todos');

    function render() {
      var rangoInvalido = fDesde.value && fHasta.value && fDesde.value > fHasta.value;
      err.textContent = rangoInvalido ? 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".' : '';
      if (rangoInvalido) {
        fDesde.setAttribute('aria-invalid', 'true');
        fHasta.setAttribute('aria-invalid', 'true');
      } else {
        fDesde.removeAttribute('aria-invalid');
        fHasta.removeAttribute('aria-invalid');
      }

      var rows = rangoInvalido ? [] : historial.filter(function (r) {
        if (fDesde.value && r.fecha < fDesde.value) return false;
        if (fHasta.value && r.fecha > fHasta.value) return false;
        if (fEstado.value && r.estado !== fEstado.value) return false;
        if (fEspacio.value && r.espacio !== fEspacio.value) return false;
        return true;
      }).sort(function (a, b) {
        return b.fecha.localeCompare(a.fecha) || b.inicio.localeCompare(a.inicio);
      });

      list.textContent = '';
      var head = el('div', 'rv-row rv-row--historial rv-row--head');
      head.setAttribute('role', 'row');
      ['Espacio', 'Fecha', 'Horario', 'Estado'].forEach(function (h) {
        var c = el('div', 'rv-cell', h);
        c.setAttribute('role', 'columnheader');
        head.appendChild(c);
      });
      list.appendChild(head);

      if (!rows.length) {
        list.appendChild(emptyState(
          rangoInvalido ? 'Revisa el rango de fechas.' : 'No hay reservas con esos filtros.',
          rangoInvalido ? '' : 'Cambia o limpia los filtros para ver más resultados.'));
      }
      rows.forEach(function (r) {
        var row = el('div', 'rv-row rv-row--historial');
        row.setAttribute('role', 'row');
        row.appendChild(cell('Espacio', r.espacio, 'rv-cell--name'));
        row.appendChild(cell('Fecha', fmtFecha(r.fecha)));
        row.appendChild(cell('Horario', fmtHorario(r)));
        row.appendChild(cell('Estado', badge(r.estado)));
        list.appendChild(row);
      });
      count.textContent = 'Mostrando ' + rows.length + ' de ' + historial.length;
    }

    $('#form-filtros').addEventListener('submit', function (e) { e.preventDefault(); render(); });
    [fDesde, fHasta, fEstado, fEspacio].forEach(function (f) { f.addEventListener('change', render); });
    $('#btn-limpiar').addEventListener('click', function () {
      fDesde.value = ''; fHasta.value = ''; fEstado.value = ''; fEspacio.value = '';
      render();
      fDesde.focus();
    });
    render();
  }

  /* ----------------------------------- PERFIL ----------------------------------- */
  function initPerfil() {
    var view = $('#perfil-vista'), form = $('#form-perfil'), btnEditar = $('#btn-editar-perfil');
    var iNom = $('#p-nombres'), iApe = $('#p-apellidos'), iCor = $('#p-correo'), iTel = $('#p-telefono');

    function iniciales() {
      var a = perfil.nombres.trim().charAt(0), b = perfil.apellidos.trim().charAt(0);
      return (a + b).toUpperCase();
    }

    function renderVista() {
      $('#perfil-avatar').textContent = iniciales();
      $('#perfil-nombre').textContent = perfil.nombres + ' ' + perfil.apellidos;
      $('#v-correo').textContent = perfil.correo;
      $('#v-telefono').textContent = perfil.telefono;
      $('#v-tipo').textContent = perfil.tipo;
      $('#v-rol').textContent = perfil.rol;
    }

    function mostrarEdicion(editar) {
      view.hidden = editar;
      form.hidden = !editar;
      btnEditar.hidden = editar;
      if (editar) {
        iNom.value = perfil.nombres; iApe.value = perfil.apellidos;
        iCor.value = perfil.correo; iTel.value = perfil.telefono;
        [iNom, iApe, iCor, iTel].forEach(function (i) { setError(i, $('#' + i.id + '-err'), ''); });
        iNom.focus();
      } else {
        btnEditar.focus();
      }
    }

    btnEditar.addEventListener('click', function () { mostrarEdicion(true); });
    $('#btn-cancelar-perfil').addEventListener('click', function () {
      mostrarEdicion(false);
      toast('Edición cancelada. No se modificó ningún dato.');
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      function check(input, msg) { setError(input, $('#' + input.id + '-err'), msg); if (msg) ok = false; }
      check(iNom, iNom.value.trim() ? '' : 'Escribe tus nombres.');
      check(iApe, iApe.value.trim() ? '' : 'Escribe tus apellidos.');
      check(iCor, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(iCor.value.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@uceva.edu.co.');
      var digits = iTel.value.replace(/[\s-]/g, '');
      check(iTel, /^\+?\d{7,15}$/.test(digits) ? '' : 'Escribe un teléfono válido (7 a 15 dígitos).');
      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }
      perfil.nombres = iNom.value.trim();
      perfil.apellidos = iApe.value.trim();
      perfil.correo = iCor.value.trim();
      perfil.telefono = iTel.value.trim();
      renderVista();
      mostrarEdicion(false);
      toast('Perfil editado de forma simulada. No se guardó nada: al recargar la página vuelven los datos de ejemplo.');
    });

    renderVista();
  }

  /* ----------------------------------- Inicio ----------------------------------- */
  var page = document.body.getAttribute('data-page');
  if (page === 'reservas') initReservas();
  else if (page === 'historial') initHistorial();
  else if (page === 'perfil') initPerfil();

  // En móvil el menú se desplaza: deja visible el ítem activo
  var activo = $('.app-nav__link.is-active');
  if (activo && activo.scrollIntoView) activo.scrollIntoView({ block: 'nearest', inline: 'center' });
})();
