/* ==========================================================================
   SAICI · Acceso — validaciones y flujo de DEMOSTRACIÓN
   - No hay fetch, XMLHttpRequest ni ninguna llamada al backend o a APIs.
   - Todo ocurre en el navegador; el flujo avanza con redirecciones simuladas.
   - Cada pantalla se identifica con <body data-page="...">.
   ========================================================================== */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var LETTERS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
  var NAME_RE = new RegExp('^[' + LETTERS + '][' + LETTERS + " '’.-]*$");
  var PASS_MIN = 8;
  var OTP_LENGTH = 6;
  var DEMO_OTP = '123456';

  function $(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------ *
   *  Reglas de validación: devuelven '' si es válido, o el mensaje que
   *  le dice a la persona QUÉ debe corregir.
   * ------------------------------------------------------------------ */
  var rules = {
    email: function (v) {
      v = v.trim();
      if (!v) return 'Escribe tu correo electrónico.';
      if (/\s/.test(v)) return 'El correo no debe tener espacios. Revísalo, por ejemplo: nombre@correo.com.';
      if (v.indexOf('@') === -1) return 'Al correo le falta el símbolo @. Ejemplo: nombre@correo.com.';
      if (!EMAIL_RE.test(v)) return 'El correo no es válido. Debe tener la forma nombre@correo.com.';
      return '';
    },

    loginPassword: function (v) {
      return v ? '' : 'Escribe tu contraseña.';
    },

    nombres: function (v) {
      v = v.trim();
      if (!v) return 'Escribe tus nombres.';
      if (!NAME_RE.test(v)) return 'Los nombres solo pueden tener letras y espacios. Quita los números o símbolos.';
      if (v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length < 2) return 'Los nombres deben tener al menos 2 letras.';
      return '';
    },

    apellidos: function (v) {
      v = v.trim();
      if (!v) return 'Escribe tus apellidos.';
      if (!NAME_RE.test(v)) return 'Los apellidos solo pueden tener letras y espacios. Quita los números o símbolos.';
      if (v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length < 2) return 'Los apellidos deben tener al menos 2 letras.';
      return '';
    },

    telefono: function (v) {
      v = v.trim();
      if (!v) return 'Escribe tu teléfono celular de 10 dígitos. Ejemplo: 3001234567.';
      if (/\D/.test(v)) return 'El teléfono solo debe tener números: sin espacios, guiones, paréntesis ni +57.';
      if (v.length !== 10) {
        return 'El teléfono debe tener 10 dígitos y escribiste ' + v.length + '. ' +
          (v.length < 10 ? 'Te faltan ' + (10 - v.length) + '.' : 'Sobran ' + (v.length - 10) + '.');
      }
      return '';
    },

    newPassword: function (v) {
      if (!v) return 'Crea una contraseña de al menos ' + PASS_MIN + ' caracteres.';
      if (v.length < PASS_MIN) {
        return 'La contraseña es muy corta: tiene ' + v.length + ' de ' + PASS_MIN + ' caracteres. Agrega al menos ' +
          (PASS_MIN - v.length) + ' más.';
      }
      return '';
    },

    confirmOf: function (passId) {
      return function (v) {
        if (!v) return 'Repite la contraseña para confirmarla.';
        if (v !== $(passId).value) return 'Las contraseñas no coinciden. Escribe exactamente la misma en los dos campos.';
        return '';
      };
    },

    terms: function (checked) {
      return checked ? '' : 'Debes aceptar el tratamiento de datos personales para crear tu cuenta.';
    }
  };

  /* ------------------------------------------------------------------ *
   *  Motor de formularios: mensaje por campo + resumen + foco al error
   * ------------------------------------------------------------------ */
  function initForm(form, fields, onValid) {
    var summary = form.querySelector('.summary');
    var touched = {};

    function wrapOf(id) { return form.querySelector('[data-field="' + id + '"]'); }

    function setError(id, msg) {
      var wrap = wrapOf(id), input = $(id), err = $(id + '-error');
      if (msg) {
        wrap.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        err.textContent = msg;
        err.hidden = false;
      } else {
        wrap.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        err.textContent = '';
        err.hidden = true;
      }
    }

    function check(f) {
      var el = $(f.id);
      var msg = f.rule(el.type === 'checkbox' ? el.checked : el.value);
      setError(f.id, msg);
      return msg;
    }

    function hideSummaryIfClean() {
      if (summary && !summary.hidden && !form.querySelector('.is-invalid')) summary.hidden = true;
    }

    function showSummary(errors) {
      if (!summary) return;
      summary.innerHTML = '';
      var title = document.createElement('p');
      title.className = 'summary-title';
      title.textContent = errors.length === 1
        ? 'Hay 1 campo por completar o corregir:'
        : 'Hay ' + errors.length + ' campos por completar o corregir:';
      var list = document.createElement('ul');
      errors.forEach(function (e) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + e.f.id;
        a.textContent = e.f.name;
        a.addEventListener('click', function (ev) { ev.preventDefault(); $(e.f.id).focus(); });
        li.appendChild(a);
        list.appendChild(li);
      });
      summary.appendChild(title);
      summary.appendChild(list);
      summary.hidden = false;
    }

    // Si la persona está presionando un botón/enlace, no se valida al salir del campo:
    // el mensaje desplazaría el botón y el clic se perdería. El envío valida todo igualmente.
    var pressing = false;
    form.addEventListener('pointerdown', function (e) { pressing = !!e.target.closest('button, a'); });
    document.addEventListener('pointerup', function () { setTimeout(function () { pressing = false; }, 0); });
    document.addEventListener('pointercancel', function () { pressing = false; });

    fields.forEach(function (f) {
      var el = $(f.id);
      el.addEventListener('blur', function () {
        if (pressing) return;
        touched[f.id] = true; check(f); hideSummaryIfClean();
      });
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
        if (touched[f.id] || wrapOf(f.id).classList.contains('is-invalid')) check(f);
        (f.revalidate || []).forEach(function (otherId) {
          var other = fields.filter(function (x) { return x.id === otherId; })[0];
          if (other && (touched[otherId] || wrapOf(otherId).classList.contains('is-invalid')) && $(otherId).value) check(other);
        });
        hideSummaryIfClean();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = [];
      fields.forEach(function (f) {
        touched[f.id] = true;
        var msg = check(f);
        if (msg) errors.push({ f: f, msg: msg });
      });
      if (errors.length) {
        showSummary(errors);
        $(errors[0].f.id).focus();
        return;
      }
      if (summary) summary.hidden = true;
      onValid();
    });
  }

  /* Botón "Ver / Ocultar" de contraseña */
  function initPasswordToggles() {
    var toggles = document.querySelectorAll('[data-toggle-password]');
    Array.prototype.forEach.call(toggles, function (btn) {
      var input = $(btn.getAttribute('data-toggle-password'));
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Ocultar' : 'Ver';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
        btn.setAttribute('aria-label', (show ? 'Ocultar' : 'Mostrar') + ' ' + btn.getAttribute('data-label'));
      });
    });
  }

  /* Lista de requisitos que se marca mientras se escribe */
  function initRequirements(passId, confirmId) {
    function mark(name, ok) {
      var li = document.querySelector('[data-req="' + name + '"]');
      if (!li) return;
      li.classList.toggle('is-met', ok);
      li.querySelector('.req-icon').textContent = ok ? '✓' : '';
      li.querySelector('.req-state').textContent = ok ? 'Cumplido: ' : 'Pendiente: ';
    }
    function update() {
      var p = $(passId).value, c = $(confirmId).value;
      mark('length', p.length >= PASS_MIN);
      mark('match', c.length > 0 && c === p);
    }
    $(passId).addEventListener('input', update);
    $(confirmId).addEventListener('input', update);
  }

  function busy(btn, text, then, ms) {
    btn.disabled = true;
    btn.textContent = text;
    setTimeout(then, ms || 600);
  }

  function showFlashFromQuery() {
    var flash = $('flash');
    if (!flash) return;
    var q = new URLSearchParams(location.search);
    var msg = '';
    if (q.get('registro') === 'ok') msg = 'Tu cuenta fue creada (demostración). Ya puedes iniciar sesión.';
    if (q.get('reset') === 'ok') msg = 'Tu contraseña fue actualizada (demostración). Inicia sesión con la nueva contraseña.';
    if (msg) { flash.textContent = msg; flash.hidden = false; }
  }

  /* ------------------------------------------------------------------ *
   *  Pantallas
   * ------------------------------------------------------------------ */
  var pages = {
    /* 01 · Login — solo demostración */
    login: function () {
      showFlashFromQuery();
      initForm($('login-form'), [
        { id: 'email', name: 'Correo electrónico', rule: rules.email },
        { id: 'password', name: 'Contraseña', rule: rules.loginPassword }
      ], function () {
        var email = $('email').value.trim().toLowerCase();
        // Demostración: cualquier correo válido + contraseña entra.
        // Un correo que empiece por "admin" abre el panel administrativo.
        var destino = email.indexOf('admin') === 0 ? '../admin/01-panel.html' : '../usuario/01-inicio.html';
        busy($('btn-submit'), 'Ingresando…', function () { location.href = destino; }, 500);
      });
    },

    /* 02 · Registro */
    registro: function () {
      initForm($('registro-form'), [
        { id: 'nombres', name: 'Nombres', rule: rules.nombres },
        { id: 'apellidos', name: 'Apellidos', rule: rules.apellidos },
        { id: 'email', name: 'Correo electrónico', rule: rules.email },
        { id: 'telefono', name: 'Teléfono', rule: rules.telefono },
        { id: 'password', name: 'Contraseña', rule: rules.newPassword, revalidate: ['confirm'] },
        { id: 'confirm', name: 'Confirmar contraseña', rule: rules.confirmOf('password') },
        { id: 'terms', name: 'Aceptación de tratamiento de datos', rule: rules.terms }
      ], function () {
        busy($('btn-submit'), 'Creando cuenta…', function () { location.href = '01-login.html?registro=ok'; });
      });
      initRequirements('password', 'confirm');
    },

    /* 03 · Recuperar contraseña: solicitar código */
    solicitar: function () {
      initForm($('solicitar-form'), [
        { id: 'email', name: 'Correo electrónico', rule: rules.email }
      ], function () {
        var email = $('email').value.trim();
        busy($('btn-submit'), 'Enviando código…', function () {
          location.href = '04-recuperar-verificar-otp.html?email=' + encodeURIComponent(email);
        });
      });
    },

    /* 04 · Verificar código (OTP de 6 dígitos) */
    otp: function () {
      var form = $('otp-form');
      var boxes = Array.prototype.slice.call(document.querySelectorAll('.otp .control'));
      var group = $('otp-group');
      var err = $('otp-error');
      var summary = form.querySelector('.summary');

      // Correo enmascarado (solo viene por la URL, no se guarda en ningún lado)
      var email = new URLSearchParams(location.search).get('email') || '';
      if (EMAIL_RE.test(email)) {
        var parts = email.split('@');
        $('email-target').textContent = parts[0].charAt(0) + '•••@' + parts[1];
      }

      function value() { return boxes.map(function (b) { return b.value; }).join(''); }

      function setError(msg, markBoxes) {
        if (msg) {
          err.textContent = msg;
          err.hidden = false;
          group.classList.add('is-invalid');
          boxes.forEach(function (b) { b.setAttribute('aria-invalid', 'true'); });
        } else {
          err.textContent = '';
          err.hidden = true;
          group.classList.remove('is-invalid');
          boxes.forEach(function (b) { b.removeAttribute('aria-invalid'); });
        }
        if (summary && !msg) summary.hidden = true;
      }

      boxes.forEach(function (box, i) {
        box.addEventListener('input', function () {
          var raw = box.value;
          var digits = raw.replace(/\D/g, '');
          if (raw && !digits) {
            box.value = '';
            setError('El código solo tiene números. Escribe un dígito del 0 al 9.');
            return;
          }
          // Si se pegó o autocompletó más de un dígito, se reparte entre las casillas
          if (digits.length > 1) {
            digits.slice(0, OTP_LENGTH - i).split('').forEach(function (d, k) { boxes[i + k].value = d; });
            boxes[Math.min(i + digits.length, OTP_LENGTH - 1)].focus();
          } else {
            box.value = digits;
            if (digits && i < OTP_LENGTH - 1) boxes[i + 1].focus();
          }
          if (group.classList.contains('is-invalid')) setError('');
        });

        box.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !box.value && i > 0) { boxes[i - 1].focus(); boxes[i - 1].value = ''; }
          else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); boxes[i - 1].focus(); }
          else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) { e.preventDefault(); boxes[i + 1].focus(); }
        });

        box.addEventListener('focus', function () { box.select(); });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = value();
        var missing = OTP_LENGTH - code.length;
        if (code.length === 0) {
          setError('Escribe el código de ' + OTP_LENGTH + ' dígitos que enviamos a tu correo.');
          boxes[0].focus();
        } else if (missing > 0) {
          var firstEmpty = boxes.filter(function (b) { return !b.value; })[0];
          setError('El código está incompleto: te ' + (missing === 1 ? 'falta 1 dígito' : 'faltan ' + missing + ' dígitos') +
            ' de ' + OTP_LENGTH + '.');
          firstEmpty.focus();
        } else if (code !== DEMO_OTP) {
          setError('El código no es correcto. Revisa el correo y vuelve a escribirlo, o solicita uno nuevo.');
          boxes.forEach(function (b) { b.value = ''; });
          boxes[0].focus();
        } else {
          setError('');
          busy($('btn-submit'), 'Verificando…', function () { location.href = '05-recuperar-nueva-contrasena.html'; });
        }
      });

      // Reenviar con enfriamiento de 30 s (simulado)
      var resend = $('resend');
      var status = $('status');
      var timer;
      function cooldown(sec) {
        resend.disabled = true;
        (function tick() {
          if (sec <= 0) { resend.disabled = false; resend.textContent = 'Reenviar código'; return; }
          resend.textContent = 'Reenviar en ' + sec + ' s';
          sec -= 1;
          timer = setTimeout(tick, 1000);
        })();
      }
      resend.addEventListener('click', function () {
        clearTimeout(timer);
        status.textContent = 'Te enviamos un nuevo código (simulado). Úsalo en lugar del anterior.';
        setError('');
        boxes.forEach(function (b) { b.value = ''; });
        boxes[0].focus();
        cooldown(30);
      });
      cooldown(30);
    },

    /* 05 · Restablecer contraseña */
    reset: function () {
      var form = $('reset-form');
      initForm(form, [
        { id: 'password', name: 'Nueva contraseña', rule: rules.newPassword, revalidate: ['confirm'] },
        { id: 'confirm', name: 'Confirmar contraseña', rule: rules.confirmOf('password') }
      ], function () {
        busy($('btn-submit'), 'Guardando…', function () {
          form.hidden = true;
          $('reset-intro').hidden = true;
          var ok = $('success');
          ok.hidden = false;
          $('go-login').focus();
        });
      });
      initRequirements('password', 'confirm');
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggles();
    var page = document.body.getAttribute('data-page');
    if (pages[page]) pages[page]();
  });
})();
