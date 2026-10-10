/* ==========================================================================
   SAICI · Componente de layout (sidebar + topbar)
   Es el ÚNICO lugar donde se define la navegación y el encabezado.

   Uso en cada pantalla de escritorio (carpetas usuario/ y admin/):

     <link rel="stylesheet" href="../styles.css">
     ...
     <div class="wrap">
       <div class="app-frame">
         <div class="app-content"> ...contenido de la pantalla... </div>
       </div>
     </div>
     <script src="../layout.js"></script>

   El rol (usuario | admin) y el ítem activo se deducen de la URL.
   Las pantallas que no están en el menú (detalle, asistente, confirmación)
   simplemente no resaltan ningún ítem.
   ========================================================================== */
(function () {
  'use strict';

  // ---- Configuración editable ------------------------------------------
  var TOPBAR = {
    title: 'SAICI · Reservas UCEVA',
    subtitle: 'Hola, Laura Andrea (vista de demostración)',
    badge: 'PROTOTIPO · DATOS DE EJEMPLO'
  };
  var BRAND = { name: 'SAICI', tagline: 'Reserva de espacios universitarios' };
  var BRAND_LOGO = '../assets/uceva-imagotipo.png';
  var LOGIN = '../auth/01-login.html';

  // Subtítulo de la barra superior según el rol (se deduce de la carpeta)
  var SUBTITLES = {
    usuario: 'Hola, Laura Andrea (vista de demostración)',
    admin: 'Administración (vista de demostración)',
    laboratorio: 'Estudiante de laboratorio (vista de demostración)'
  };
  // Pantalla de inicio de cada rol: el logo lleva hasta ella
  var HOME = { usuario: '01-inicio.html', admin: '01-panel.html', laboratorio: '01-panel.html' };
  // Pantallas que no están en el menú resaltan a la pantalla de la que dependen
  var PARENT = {
    '03-detalle-espacio.html': '02-explorar-espacios.html',
    '05-confirmacion-solicitud.html': '04-asistente-reserva.html',
    '11-seleccionar-espacio.html': '04-asistente-reserva.html',
    '12-seleccionar-fecha.html': '04-asistente-reserva.html',
    '13-seleccionar-horario.html': '04-asistente-reserva.html',
    '14-conflicto-horario.html': '04-asistente-reserva.html',
    '15-validacion-reserva.html': '04-asistente-reserva.html',
    '16-inicio-cargando.html': '01-inicio.html',
    '17-error-inicio.html': '01-inicio.html',
    '19-menu-asistente-activo.html': '18-menu.html'
  };

  // section = carpeta donde vive la pantalla
  var NAV = [
    { heading: null, items: [
      { section: 'usuario', file: '01-inicio.html',           label: 'Inicio' },
      { section: 'usuario', file: '02-explorar-espacios.html', label: 'Espacios' },
      { section: 'usuario', file: '04-asistente-reserva.html', label: 'Solicitar reserva' },
      { section: 'usuario', file: '06-mis-reservas.html',      label: 'Mis reservas' },
      { section: 'usuario', file: '08-perfil.html',            label: 'Perfil' }
    ]},
    { heading: 'Usuario', items: [
      { section: 'usuario', file: '07-historial-reservas.html',  label: 'Historial de reservas' },
      { section: 'usuario', file: '09-registrar-asistencia.html', label: 'Registrar asistencia' },
      { section: 'usuario', file: '10-historial-asistencia.html', label: 'Historial de asistencia' },
      { section: 'usuario', file: '18-menu.html', label: 'Más opciones' }
    ]},
    { heading: 'Administración', items: [
      { section: 'admin', file: '01-panel.html',               label: 'Panel administrativo' },
      { section: 'admin', file: '02-gestionar-reservas.html',  label: 'Gestionar reservas' },
      { section: 'admin', file: '03-gestionar-espacios.html',  label: 'Gestionar espacios' },
      { section: 'admin', file: '04-gestionar-horarios.html',  label: 'Gestionar horarios' },
      { section: 'admin', file: '05-estadisticas-reportes.html', label: 'Estadísticas y reportes' },
      { section: 'admin', file: '06-usuarios.html',            label: 'Usuarios' },
      { section: 'admin', file: '07-menu.html', label: 'Más opciones' }
    ]},
    { heading: 'Laboratorio', items: [
      { section: 'laboratorio', file: '01-panel.html', label: 'Panel de laboratorio' },
      { section: 'laboratorio', file: '02-reservas.html', label: 'Reservas asignadas' }
    ]}
  ];
  // ----------------------------------------------------------------------

  var parts = location.pathname.split('/');
  var file = decodeURIComponent(parts[parts.length - 1] || '');
  var section = parts[parts.length - 2] || '';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function link(href, label, active) {
    var a = el('a', 'app-nav__link' + (active ? ' is-active' : ''));
    a.href = href;
    if (active) a.setAttribute('aria-current', 'page');
    a.appendChild(el('span', 'app-nav__text', label));
    return a;
  }

  function buildSidebar() {
    var side = el('div', 'app-sidebar');

    var brand = el('div', 'app-brand');
    var logo = el('img', 'app-brand__logo');
    logo.src = BRAND_LOGO;
    logo.width = 1000;
    logo.height = 302;
    logo.alt = 'UCEVA · Unidad Central del Valle del Cauca';
    var home = el('a', 'app-brand__home');
    home.href = HOME[section] || HOME.usuario;
    home.setAttribute('aria-label', 'Ir al inicio de SAICI');
    home.appendChild(logo);
    brand.appendChild(home);
    brand.appendChild(el('div', 'app-brand__name', BRAND.name));
    brand.appendChild(el('div', 'app-brand__tagline', BRAND.tagline));
    side.appendChild(brand);
    var menuToggle = el('button', 'app-menu-toggle', 'Menú');
    menuToggle.type = 'button';
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', function () {
      var open = side.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    side.appendChild(menuToggle);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && side.classList.contains('is-open')) {
        side.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });

    NAV.forEach(function (group) {
      //Logica separacion de roles
      if (section === 'usuario' && (group.heading === 'Administración' || group.heading === 'Laboratorio')) {
        return;
      }

      if (section === 'admin' && (group.heading === 'Usuario' || group.heading === null || group.heading === 'Laboratorio')) {
        return;
      }

      if (section === 'laboratorio' && (group.heading === 'Usuario' || group.heading === null || group.heading === 'Administración')) {
        return;
      }
      //Fin
      
      var nav = el('nav', 'app-nav');
      if (group.heading) {
        var h = el('div', 'app-nav__heading');
        h.appendChild(el('div', 'app-nav__heading-text', group.heading));
        nav.appendChild(h);
      }
      group.items.forEach(function (it) {
        var href = it.section === section ? it.file : '../' + it.section + '/' + it.file;
        nav.appendChild(link(href, it.label, it.section === section && (it.file === file || PARENT[file] === it.file)));
      });
      side.appendChild(nav);
    });

    side.appendChild(el('div', 'app-nav__spacer'));

    var foot = el('nav', 'app-nav');
    foot.appendChild(link(LOGIN, 'Cerrar sesión', false));
    side.appendChild(foot);
    return side;
  }

  function buildTopbar() {
    var bar = el('div', 'app-topbar');
    var titles = el('div', 'app-topbar__titles');
    titles.appendChild(el('div', 'app-topbar__title', TOPBAR.title));
    titles.appendChild(el('div', 'app-topbar__subtitle', SUBTITLES[section] || TOPBAR.subtitle));
    bar.appendChild(titles);
    var badge = el('div', 'app-badge');
    badge.appendChild(el('div', 'app-badge__text', TOPBAR.badge));
    bar.appendChild(badge);
    return bar;
  }

  var frame = document.querySelector('.app-frame');
  var content = frame && frame.querySelector(':scope > .app-content');
  if (!frame || !content) return;

  var main = el('div', 'app-main');
  main.appendChild(buildTopbar());
  main.appendChild(content);          // mueve el contenido existente

  frame.appendChild(buildSidebar());
  frame.appendChild(main);
})();
