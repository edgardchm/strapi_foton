'use strict';

/**
 * Middleware de seguridad para endpoints de importación Excel.
 * Adaptado de Soueast — verifica:
 *   1. Autenticación JWT (users-permissions)
 *   2. Rol de administrador
 *   3. MIME type válido para archivos
 *   4. Tamaño máximo de archivo
 */
module.exports = () => {
  return async (ctx, next) => {
    const MAX_FILE_SIZE = parseInt(
      process.env.MAX_IMPORT_FILE_SIZE || String(10 * 1024 * 1024) // 10MB default
    );

    // 1. Verificar autenticación
    if (!ctx.state.user) {
      return ctx.throw(401, 'Autenticación requerida para importar datos');
    }

    // 2. Verificar rol de administrador
    const role = ctx.state.user.role;
    const isAdmin =
      role &&
      (role.type === 'admin' ||
        role.type === 'superadmin' ||
        role.name === 'Super Admin' ||
        role.name === 'Admin');

    if (!isAdmin) {
      return ctx.throw(403, 'Solo administradores pueden importar datos');
    }

    // 3. Validación de archivo en rutas POST con archivo
    if (ctx.method === 'POST' && ctx.request.files?.file) {
      const file = ctx.request.files.file;

      const ALLOWED_MIME_TYPES = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv',
        'application/csv',
        'text/plain', // algunos clientes envían CSV como text/plain
      ];

      const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv'];
      const fileExt = (file.name || file.originalFilename || '')
        .split('.')
        .pop()
        .toLowerCase();

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.includes(fileExt)) {
        return ctx.throw(400, 'Solo se permiten archivos .xlsx, .xls o .csv');
      }

      if (file.size > MAX_FILE_SIZE) {
        const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
        const fileMB = (file.size / 1024 / 1024).toFixed(2);
        return ctx.throw(
          400,
          `Archivo demasiado grande. Máximo: ${maxMB}MB, recibido: ${fileMB}MB`
        );
      }
    }

    // 4. Exponer info de usuario al contexto
    ctx.state.importUser = {
      id: ctx.state.user.id,
      username: ctx.state.user.username || ctx.state.user.email,
      email: ctx.state.user.email,
    };

    await next();
  };
};
