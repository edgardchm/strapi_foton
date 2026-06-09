'use strict';

module.exports = {
  routes: [
    { method: 'POST', path: '/contactos', handler: 'contacto.create', config: { auth: false } },
    { method: 'GET', path: '/contactos', handler: 'contacto.find', config: { policies: [] } },
    { method: 'GET', path: '/contactos/:id', handler: 'contacto.findOne', config: { policies: [] } },
    { method: 'PUT', path: '/contactos/:id', handler: 'contacto.update', config: { policies: [] } },
  ],
};
