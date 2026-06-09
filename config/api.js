'use strict';

module.exports = ({ env }) => ({
  rest: {
    maxLimit: env.int('API_LIMIT_PAGINATION_LIMIT_MAX', 100),
    defaultLimit: env.int('API_LIMIT_PAGINATION_LIMIT_DEFAULT', 25),
    withCount: true,
  },
});
