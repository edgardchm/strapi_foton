'use strict';

/**
 * Bootstrap de Strapi-Foton
 * Configura permisos públicos de lectura para el frontend Angular (IA-Foton).
 * Solo read, no escritura pública.
 */
module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    await setPublicPermissions(strapi);
  },
};

/**
 * Endpoints de lectura que el frontend puede consumir sin autenticación.
 * Estructura: { uid: [acciones] }
 */
const PUBLIC_READ_PERMISSIONS = {
  'api::modelo.modelo':               ['find', 'findOne'],
  'api::modelo-version.modelo-version': ['find', 'findOne'],
  'api::noticia.noticia':             ['find', 'findOne'],
  'api::sucursal.sucursal':           ['find', 'findOne'],
  'api::banner.banner':               ['find', 'findOne'],
  'api::solucion.solucion':           ['find', 'findOne'],
  'api::pagina.pagina':               ['find', 'findOne'],
  'api::faq.faq':                     ['find', 'findOne'],
  'api::global.global':               ['find'],
};

async function setPublicPermissions(strapi) {
  try {
    // Obtener el rol Public
    const publicRole = await strapi.entityService.findMany(
      'plugin::users-permissions.role',
      { filters: { type: 'public' }, limit: 1 }
    );

    if (!publicRole || publicRole.length === 0) {
      strapi.log.warn('[Bootstrap] Rol "public" no encontrado, omitiendo permisos.');
      return;
    }

    const roleId = publicRole[0].id;

    // Obtener permisos actuales del rol Public
    const existingPermissions = await strapi.entityService.findMany(
      'plugin::users-permissions.permission',
      { filters: { role: roleId }, limit: 500 }
    );

    const existingSet = new Set(
      existingPermissions.map((p) => `${p.action}`)
    );

    const toCreate = [];

    for (const [uid, actions] of Object.entries(PUBLIC_READ_PERMISSIONS)) {
      for (const action of actions) {
        const actionKey = `${uid}.${action}`;
        if (!existingSet.has(actionKey)) {
          toCreate.push({ action: actionKey, role: roleId });
        }
      }
    }

    if (toCreate.length === 0) {
      strapi.log.info('[Bootstrap] Permisos públicos ya configurados.');
      return;
    }

    for (const perm of toCreate) {
      await strapi.entityService.create('plugin::users-permissions.permission', {
        data: perm,
      });
    }

    strapi.log.info(`[Bootstrap] ${toCreate.length} permisos públicos configurados.`);
  } catch (err) {
    strapi.log.error(`[Bootstrap] Error configurando permisos: ${err.message}`);
  }
}
