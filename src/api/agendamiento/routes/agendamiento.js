'use strict';

module.exports = {
  routes: [
    { method: 'POST', path: '/agendamientos', handler: 'agendamiento.create', config: { auth: false } },
    { method: 'GET', path: '/agendamientos', handler: 'agendamiento.find', config: { policies: [] } },
    { method: 'GET', path: '/agendamientos/:id', handler: 'agendamiento.findOne', config: { policies: [] } },
    { method: 'PUT', path: '/agendamientos/:id', handler: 'agendamiento.update', config: { policies: [] } },
  ],
};
