(function (global) {
  'use strict';

  var SPACES = [
    {
      id: 'sistemas-1',
      name: 'Laboratorio de Sistemas 1',
      type: 'Laboratorio',
      location: 'Edificio de Sistemas, sala 204',
      capacity: 24,
      resources: 'Equipos de cómputo y conectividad',
      availability: 'Disponible',
      status: 'Disponible',
      schedule: 'Lunes a viernes, 8:00 a. m. – 6:00 p. m.',
      icon: '⌘',
      color: 'linear-gradient(135deg, #DCEBDD 0%, #F4F7EB 100%)',
      accent: '#246D38'
    },
    {
      id: 'redes',
      name: 'Laboratorio de Redes',
      type: 'Laboratorio',
      location: 'Bloque académico, laboratorio B-12',
      capacity: 20,
      resources: 'Conectividad especializada y equipos de red',
      availability: 'Ocupado',
      status: 'Ocupado ahora',
      schedule: 'Lunes a viernes, 9:00 a. m. – 5:00 p. m.',
      icon: '⌘',
      color: 'linear-gradient(135deg, #DCEBDD 0%, #F4F7EB 100%)',
      accent: '#8A5B06'
    },
    {
      id: 'biblioteca-estudio',
      name: 'Sala de estudio biblioteca',
      type: 'Sala de estudio',
      location: 'Biblioteca central, segundo piso',
      capacity: 8,
      resources: 'Mesas individuales y acceso a conectividad',
      availability: 'Disponible',
      status: 'Disponible',
      schedule: 'Lunes a domingo, 7:00 a. m. – 9:00 p. m.',
      icon: '▤',
      color: 'linear-gradient(135deg, #DCEBDD 0%, #F4F7EB 100%)',
      accent: '#246D38'
    },
    {
      id: 'aula-innovacion',
      name: 'Aula de innovación',
      type: 'Aula',
      location: 'Bloque de ingeniería, aula 101',
      capacity: 30,
      resources: 'Pizarra digital y equipos multimedia',
      availability: 'Disponible',
      status: 'Disponible',
      schedule: 'Lunes a viernes, 7:30 a. m. – 6:30 p. m.',
      icon: '▣',
      color: 'linear-gradient(135deg, #EEF5E1 0%, #F7F3E8 100%)',
      accent: '#246D38'
    },
    {
      id: 'sala-grupos',
      name: 'Sala de trabajo en grupos',
      type: 'Sala',
      location: 'Edificio de humanidades, nivel 3',
      capacity: 12,
      resources: 'Mesas colaborativas y televisores',
      availability: 'Disponible',
      status: 'Disponible',
      schedule: 'Lunes a sábado, 8:00 a. m. – 7:00 p. m.',
      icon: '▦',
      color: 'linear-gradient(135deg, #E9F1E8 0%, #F5F6EF 100%)',
      accent: '#246D38'
    },
    {
      id: 'auditorio',
      name: 'Auditorio universitario',
      type: 'Auditorio',
      location: 'Campus central, edificio cultural',
      capacity: 60,
      resources: 'Escenario, sonido y proyectores',
      availability: 'Ocupado',
      status: 'Ocupado ahora',
      schedule: 'Lunes a viernes, 8:00 a. m. – 8:00 p. m.',
      icon: '◫',
      color: 'linear-gradient(135deg, #F3EBD7 0%, #F7F4EB 100%)',
      accent: '#8A5B06'
    },
    {
      id: 'laboratorio-quimica',
      name: 'Laboratorio de Química',
      type: 'Laboratorio',
      location: 'Edificio científico, laboratorio 3',
      capacity: 16,
      resources: 'Materiales de laboratorio y estaciones de trabajo',
      availability: 'Disponible',
      status: 'Disponible',
      schedule: 'Martes a sábado, 8:00 a. m. – 5:00 p. m.',
      icon: '◎',
      color: 'linear-gradient(135deg, #EAF3EC 0%, #F4F6F2 100%)',
      accent: '#246D38'
    },
    {
      id: 'taller-creativo',
      name: 'Taller creativo',
      type: 'Sala',
      location: 'Centro de innovación, módulo 2',
      capacity: 14,
      resources: 'Computadores y herramientas de diseño',
      availability: 'Disponible',
      status: 'Disponible',
      schedule: 'Lunes a viernes, 9:00 a. m. – 6:00 p. m.',
      icon: '◈',
      color: 'linear-gradient(135deg, #EAF1E8 0%, #F1F5F0 100%)',
      accent: '#246D38'
    }
  ];

  function normalizeText(value) {
    return String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function filterSpaces(options) {
    var filters = options || {};
    var query = normalizeText(filters.query || '');
    var type = filters.type || 'Todos';
    var availability = filters.availability || 'Todas';

    return SPACES.filter(function (space) {
      var matchesQuery = !query || [
        space.name,
        space.location,
        space.resources,
        space.type
      ].some(function (field) {
        return normalizeText(field).indexOf(query) !== -1;
      });

      var matchesType = type === 'Todos' || space.type === type;
      var matchesAvailability = availability === 'Todas' || space.availability === availability;

      return matchesQuery && matchesType && matchesAvailability;
    });
  }

  function getSpaceById(id) {
    return SPACES.find(function (space) { return space.id === id; });
  }

  var api = { SPACES, filterSpaces, getSpaceById, normalizeText };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.SAICI = global.SAICI || {};
  global.SAICI.spaces = api;
})(typeof window !== 'undefined' ? window : globalThis);
