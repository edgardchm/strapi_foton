'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::import-log.import-log', {
  config: {
    find: { middlewares: [] },
    findOne: { middlewares: [] },
    create: { middlewares: [] },
    update: { middlewares: [] },
    delete: { middlewares: [] },
  },
});
