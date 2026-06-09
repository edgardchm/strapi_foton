'use strict';

/**
 * Bootstrap — se ejecuta al iniciar Strapi.
 * Crea datos iniciales (idempotente: verifica si ya existen).
 */

module.exports = async ({ strapi }) => {
  strapi.log.info('🚀 Bootstrap Foton CMS iniciando...');

  try {
    await seedLocales(strapi);
    await seedSucursales(strapi);
    await seedBanners(strapi);
    strapi.log.info('✅ Bootstrap completado');
  } catch (error) {
    strapi.log.error('❌ Error en bootstrap:', { error: error.message });
    // No lanzar: el error no debe detener el servidor
  }
};

async function seedLocales(strapi) {
  try {
    const plugin = strapi.plugin('i18n');
    if (!plugin) return;

    const localeService = plugin.service('locales');
    const locales = await localeService.find();
    const existingCodes = locales.map((l) => l.code);

    for (const code of ['es', 'en', 'fr']) {
      if (!existingCodes.includes(code)) {
        await localeService.create({ code, name: { es: 'Español', en: 'English', fr: 'Français' }[code] });
        strapi.log.info(`Locale ${code} creado`);
      }
    }
  } catch (e) {
    strapi.log.warn('No se pudo seed locales:', e.message);
  }
}

async function seedSucursales(strapi) {
  const count = await strapi.entityService.count('api::sucursal.sucursal');
  if (count > 0) return; // Ya existen

  const sucursales = [
    {
      nombre: 'Casa Matriz — Pudahuel',
      codigo: 'RM-001',
      direccion: 'Av. Américo Vespucio #760, Pudahuel, Santiago',
      region: 'Región Metropolitana',
      comuna: 'Pudahuel',
      telefono: '+56227202221',
      email: 'matriz@fotonchile.cl',
      latitud: -33.4467,
      longitud: -70.7583,
      horario: { lunes_viernes: '08:00-18:00', sabado: '09:00-13:00', domingo: 'Cerrado' },
      servicios: ['venta', 'postventa', 'repuestos'],
      activa: true,
      orden: 1,
    },
    {
      nombre: 'Sucursal Antofagasta',
      codigo: 'ANT-001',
      direccion: 'Av. Pedro Aguirre Cerda 4990, Antofagasta',
      region: 'Región de Antofagasta',
      comuna: 'Antofagasta',
      telefono: '+5655234567',
      email: 'antofagasta@fotonchile.cl',
      latitud: -23.6509,
      longitud: -70.4000,
      horario: { lunes_viernes: '08:30-18:00', sabado: '09:00-13:00', domingo: 'Cerrado' },
      servicios: ['venta', 'postventa'],
      activa: true,
      orden: 2,
    },
  ];

  for (const s of sucursales) {
    await strapi.entityService.create('api::sucursal.sucursal', { data: s });
  }
  strapi.log.info(`Seed: ${sucursales.length} sucursales creadas`);
}

async function seedBanners(strapi) {
  const count = await strapi.entityService.count('api::banner.banner');
  if (count > 0) return;

  await strapi.entityService.create('api::banner.banner', {
    data: {
      titulo: 'Innovación en Movimiento',
      subtitulo: 'Tecnología de primer nivel para tu negocio',
      descripcion: 'Descubre la línea completa de vehículos comerciales Foton.',
      ctaTexto: 'Ver Modelos',
      ctaUrl: '/modelos',
      orden: 1,
      activo: true,
    },
  });
  strapi.log.info('Seed: 1 banner creado');
}
