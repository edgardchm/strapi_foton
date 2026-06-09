'use strict';

/**
 * Auth Middleware — helpers de autorización reutilizables.
 * Constitution: validación de permisos ANTES de cualquier operación.
 */

/**
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 * @param {string[]} allowedRoles - Roles permitidos (ej: ['Admin', 'Editor'])
 */
const requireRole = (allowedRoles) => {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.throw(401, 'Authentication required');
    }

    const userRole = user.role?.type;
    if (!allowedRoles.includes(userRole)) {
      return ctx.throw(403, `Role '${userRole}' is not authorized for this action`);
    }

    await next();
  };
};

/**
 * Verifica que el usuario esté autenticado (cualquier rol).
 */
const requireAuth = async (ctx, next) => {
  if (!ctx.state.user) {
    return ctx.throw(401, 'Authentication required');
  }
  await next();
};

module.exports = { requireRole, requireAuth };
