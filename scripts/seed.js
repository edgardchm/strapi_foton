#!/usr/bin/env node
'use strict';

/**
 * Seeder — Foton Chile CMS
 * ========================
 * Carga el contenido real extraído de IA-Foton (Angular) en Strapi.
 *
 * Uso:
 *   STRAPI_URL=https://strapifoton-production.up.railway.app \
 *   STRAPI_IDENTIFIER=admin@foton.cl \
 *   STRAPI_PASSWORD=TuPassword123 \
 *   node scripts/seed.js
 *
 * O en desarrollo local (Strapi corriendo en :1337):
 *   STRAPI_IDENTIFIER=admin@foton.cl STRAPI_PASSWORD=TuPassword123 node scripts/seed.js
 *
 * El script es IDEMPOTENTE:
 *   - Verifica existencia por slug/codigo antes de crear.
 *   - Si el registro ya existe, lo omite (no duplica).
 *   - Para forzar re-creación, borra manualmente en el admin.
 *
 * Seguridad:
 *   - Lee credenciales SOLO desde variables de entorno.
 *   - Nunca hardcodea contraseñas ni tokens.
 */

const https = require('https');
const http = require('http');
const url = require('url');

// ── Configuración ─────────────────────────────────────────────────────────────

const BASE_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const IDENTIFIER = process.env.STRAPI_IDENTIFIER;
const PASSWORD = process.env.STRAPI_PASSWORD;

if (!IDENTIFIER || !PASSWORD) {
  console.error('\n❌  Faltan variables de entorno:\n');
  console.error('   STRAPI_IDENTIFIER  — email del admin de Strapi');
  console.error('   STRAPI_PASSWORD    — contraseña del admin\n');
  console.error('Ejemplo:');
  console.error('   STRAPI_IDENTIFIER=admin@foton.cl STRAPI_PASSWORD=MiClave123 node scripts/seed.js\n');
  process.exit(1);
}

// ── Helpers HTTP ──────────────────────────────────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(`${BASE_URL}${path}`);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.path,
      method,
      headers,
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function get(path, token) {
  return request('GET', path, null, token);
}

async function post(path, body, token) {
  return request('POST', path, body, token);
}

async function put(path, body, token) {
  return request('PUT', path, body, token);
}

// ── Autenticación ─────────────────────────────────────────────────────────────

async function authenticate() {
  console.log(`\n🔐  Autenticando en ${BASE_URL}...`);

  const res = await post('/api/auth/local', {
    identifier: IDENTIFIER,
    password: PASSWORD,
  });

  if (res.status !== 200 || !res.body.jwt) {
    console.error('❌  Autenticación fallida:', res.body?.error?.message || JSON.stringify(res.body));
    process.exit(1);
  }

  console.log(`✅  Autenticado como: ${res.body.user?.email}`);
  return res.body.jwt;
}

// ── Helpers de seeding ────────────────────────────────────────────────────────

async function findBySlug(endpoint, slug, token) {
  const res = await get(`/api/${endpoint}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`, token);
  const items = res.body?.data;
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function findByCodigo(endpoint, codigo, token) {
  const res = await get(`/api/${endpoint}?filters[codigo][$eq]=${encodeURIComponent(codigo)}&pagination[pageSize]=1`, token);
  const items = res.body?.data;
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function createEntry(endpoint, data, token) {
  const res = await post(`/api/${endpoint}`, { data }, token);
  if (res.status === 200 || res.status === 201) {
    return res.body?.data;
  }
  throw new Error(`POST /api/${endpoint} → ${res.status}: ${JSON.stringify(res.body?.error || res.body)}`);
}

async function publishEntry(endpoint, id, token) {
  const res = await put(`/api/${endpoint}/${id}`, { data: { publishedAt: new Date().toISOString() } }, token);
  return res.status === 200;
}

// ── DATOS: Modelos ────────────────────────────────────────────────────────────

const MODELOS = [
  {
    nombre: 'Aumark S',
    slug: 'aumark-s',
    categoria: 'livianos',
    resumen: 'Camión liviano ideal para distribución urbana y último kilómetro. Maniobrable, eficiente y confiable.',
    precioDesde: 28990000,
    carga: '3.500 kg',
    potencia: '140 HP',
    combustible: 'Diésel',
    transmision: 'Manual',
    destacado: true,
    activo: true,
    orden: 1,
    metadata: { uso: 'urbano distribucion', badge: 'destacado', imagenLocal: 'assets/img/foton-1827-chasis.png' },
  },
  {
    nombre: '1827 Chasis',
    slug: '1827',
    categoria: 'medianos',
    resumen: 'El más vendido de su segmento. Motor Cummins ISB 6.7L Euro V para distribución regional de alta exigencia.',
    precioDesde: 41990000,
    carga: '12.600 kg',
    potencia: '215 HP',
    motor: 'Cummins ISB 6.7L Euro V',
    combustible: 'Diésel',
    transmision: 'Manual',
    destacado: false,
    activo: true,
    orden: 2,
    metadata: { uso: 'distribucion', badge: '', imagenLocal: 'assets/img/foton-1827-chasis.png' },
  },
  {
    nombre: '1827 Volquete',
    slug: '1827-volquete',
    categoria: 'medianos',
    resumen: 'Caja volcadora hidráulica para obra, minería y movimiento de tierra.',
    precioDesde: 45990000,
    carga: '12.600 kg',
    potencia: '215 HP',
    motor: 'Volcador 6 m³',
    combustible: 'Diésel',
    transmision: 'Manual',
    destacado: false,
    activo: true,
    orden: 3,
    metadata: { uso: 'construccion', badge: '', imagenLocal: 'assets/img/auman-1522.png' },
  },
  {
    nombre: 'Auman 1522',
    slug: 'auman-1522',
    categoria: 'pesados',
    resumen: 'Tracción 6×4 para trabajo pesado. Diseñado para terrenos exigentes en industria, minería y construcción.',
    precioDesde: 41990000,
    carga: '9.500 kg',
    potencia: '220 HP',
    motor: 'Tracción 6×4',
    combustible: 'Diésel',
    transmision: 'Manual',
    destacado: false,
    activo: true,
    orden: 4,
    metadata: { uso: 'industrial construccion', badge: '', imagenLocal: 'assets/img/auman-1522.png' },
  },
  {
    nombre: 'Auman GTL',
    slug: 'auman-gtl',
    categoria: 'pesados',
    resumen: 'El tractocamión premium de largo recorrido. Cabina de lujo, máximo tonelaje, eficiencia en ruta para flotas exigentes.',
    precioDesde: 68990000,
    carga: '18.000 kg',
    potencia: '400 HP',
    motor: 'Cummins ISM',
    combustible: 'Diésel',
    transmision: 'Manual',
    destacado: false,
    activo: true,
    orden: 5,
    metadata: { uso: 'distribucion flotas', badge: '', imagenLocal: 'assets/img/foton-e614.png' },
  },
  {
    nombre: 'e 614',
    slug: 'e614',
    categoria: 'electricos',
    resumen: 'El futuro de la distribución urbana. Cero emisiones, bajo costo operativo y carga en menos de 45 minutos.',
    precioDesde: 44990000,
    carga: '3.850 kg',
    potencia: '208 km autonomía',
    motor: '0 emisiones',
    combustible: 'Eléctrico',
    transmision: 'Automático',
    destacado: true,
    activo: true,
    orden: 6,
    metadata: { uso: 'urbano electrico', badge: 'nuevo destacado', imagenLocal: 'assets/img/foton-e614.png' },
  },
];

// ── DATOS: Noticias ───────────────────────────────────────────────────────────

const NOTICIAS = [
  {
    titulo: 'Foton e 614: La revolución eléctrica llega al transporte de carga en Chile',
    slug: 'foton-e614-revolucion-electrica-transporte-carga-chile',
    bajada: 'Foton Chile presenta el e 614, el primer camión 100% eléctrico de la marca en el mercado chileno. Con 208 km de autonomía, carga rápida en 45 minutos y cero emisiones directas, redefine las posibilidades para la distribución urbana sustentable.',
    categoria: 'electromovilidad',
    fechaPublicacion: '2024-03-15T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: true,
    activa: true,
    seoTitle: 'Foton e 614 eléctrico en Chile — Foton Chile',
    seoDescription: 'El primer camión 100% eléctrico Foton en Chile. 208 km de autonomía, carga en 45 min, cero emisiones.',
  },
  {
    titulo: 'Auman GTL: El camión de largo aliento que redefine el estándar en Chile',
    slug: 'auman-gtl-camion-largo-aliento-estandar-chile',
    bajada: 'Con motor Cummins ISM 400 y cabina full comfort, el Auman GTL llega para competir de igual a igual con las marcas europeas en operaciones de larga distancia.',
    categoria: 'productos',
    fechaPublicacion: '2024-02-20T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Auman GTL tractocamión Chile — Foton Chile',
    seoDescription: 'El Auman GTL llega a Chile con motor Cummins ISM 400 y cabina full comfort para larga distancia.',
  },
  {
    titulo: 'El futuro del transporte urbano: Por qué las empresas están migrando a flota eléctrica',
    slug: 'futuro-transporte-urbano-empresas-migrando-flota-electrica',
    bajada: 'Análisis de costos operacionales, incentivos tributarios y beneficios ambientales de operar camiones 100% eléctricos en zonas de saturación ambiental.',
    categoria: 'electromovilidad',
    fechaPublicacion: '2024-01-18T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Flotas eléctricas en Chile — Foton Chile',
    seoDescription: 'Análisis completo: costos, incentivos y beneficios de migrar a flota eléctrica en Chile.',
  },
  {
    titulo: 'Foton Chile en ExpoCamión 2023: Más de 500 profesionales del transporte',
    slug: 'foton-chile-expocamion-2023-profesionales-transporte',
    bajada: 'Participamos en la feria más importante del transporte de carga en Chile, presentando toda la línea 2024 y las primeras demostraciones del camión eléctrico e 614.',
    categoria: 'eventos',
    fechaPublicacion: '2023-11-10T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Foton en ExpoCamión 2023 — Foton Chile',
    seoDescription: 'Foton Chile presentó toda la línea 2024 en ExpoCamión 2023 con más de 500 profesionales.',
  },
  {
    titulo: 'Norma Euro V en Chile: Lo que necesitas saber sobre la nueva regulación de emisiones',
    slug: 'norma-euro-v-chile-regulacion-emisiones-2024',
    bajada: 'A partir de 2024, todos los vehículos comerciales nuevos en Chile deben cumplir la norma Euro V. Foton ya lleva esta certificación en toda su línea.',
    categoria: 'empresa',
    fechaPublicacion: '2023-10-05T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Norma Euro V Chile 2024 — Foton Chile',
    seoDescription: 'Todo lo que debes saber sobre la norma Euro V en Chile. Foton ya cumple en toda su línea.',
  },
  {
    titulo: 'Nueva sucursal de servicio técnico en Concepción: Más cobertura para el sur',
    slug: 'nueva-sucursal-servicio-tecnico-concepcion-cobertura-sur',
    bajada: 'Andes Motor inaugura su tercer centro de servicio técnico autorizado Foton en Concepción, ampliando la cobertura postventa a las regiones del Biobío y La Araucanía.',
    categoria: 'postventa',
    fechaPublicacion: '2023-09-22T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Nueva sucursal Concepción — Foton Chile',
    seoDescription: 'Andes Motor inaugura servicio técnico Foton en Concepción, cubriendo Biobío y Araucanía.',
  },
  {
    titulo: 'Foton supera los 11 millones de unidades producidas: Hito histórico para la marca',
    slug: 'foton-supera-11-millones-unidades-producidas-hito-historico',
    bajada: 'Con presencia en más de 80 países, Foton Motor consolida su posición como uno de los cinco mayores fabricantes de vehículos comerciales del mundo.',
    categoria: 'empresa',
    fechaPublicacion: '2023-08-14T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: '11 millones de unidades Foton — Foton Chile',
    seoDescription: 'Foton Motor supera 11 millones de unidades con presencia en más de 80 países.',
  },
  {
    titulo: 'Aumark S: El nuevo aliado de la última milla urbana en Chile',
    slug: 'aumark-s-aliado-ultima-milla-urbana-chile',
    bajada: 'Compacto, eficiente y con el respaldo de Foton, el Aumark S llega para conquistar el segmento de distribución urbana con un precio de entrada inigualable.',
    categoria: 'productos',
    fechaPublicacion: '2023-07-03T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Aumark S distribución urbana Chile — Foton Chile',
    seoDescription: 'El Aumark S llega a Chile para la última milla con bajo costo y respaldo Foton.',
  },
  {
    titulo: 'Foton Chile en Exponor 2023: Soluciones para la minería del norte',
    slug: 'foton-chile-exponor-2023-soluciones-mineria-norte',
    bajada: 'Presentamos en Antofagasta las soluciones especializadas de Foton para el sector minero, con foco en durabilidad, eficiencia y bajo costo de mantenimiento en entornos extremos.',
    categoria: 'eventos',
    fechaPublicacion: '2023-06-20T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Foton en Exponor 2023 Antofagasta — Foton Chile',
    seoDescription: 'Foton Chile presentó soluciones para minería en Exponor 2023, Antofagasta.',
  },
  {
    titulo: 'Programa de mantenimiento preventivo Foton: Protege tu inversión',
    slug: 'programa-mantenimiento-preventivo-foton-protege-inversion',
    bajada: 'Conoce los planes de mantenimiento preventivo diseñados para maximizar la vida útil de tu vehículo Foton y minimizar los tiempos fuera de servicio.',
    categoria: 'postventa',
    fechaPublicacion: '2023-05-11T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Mantenimiento preventivo Foton Chile',
    seoDescription: 'Planes de mantenimiento Foton para maximizar vida útil y minimizar tiempos fuera de servicio.',
  },
  {
    titulo: 'Así son los buses eléctricos que se integrarán a la Línea 5 del transporte urbano de Temuco',
    slug: 'buses-electricos-linea-5-transporte-urbano-temuco',
    bajada: 'Las unidades modelo Foton U9 se convertirán en la primera flota de este tipo en operar en la capital regional de la Araucanía, como parte del programa "Renueva Tu Micro".',
    categoria: 'electromovilidad',
    fechaPublicacion: '2025-06-01T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Buses eléctricos Foton Temuco — Foton Chile',
    seoDescription: 'Foton U9 eléctricos se integran a la Línea 5 de Temuco en el programa Renueva Tu Micro.',
  },
  {
    titulo: 'Foton inaugura su primera planta de producción en Brasil y avanza en estrategia de expansión para América Latina',
    slug: 'foton-planta-produccion-brasil-expansion-america-latina',
    bajada: 'Junto con celebrar el lanzamiento de 12 millones de vehículos, la marca marcó un hito al inaugurar una instalación de casi 200 mil m² en Brasil con capacidad anual de 5 mil unidades.',
    categoria: 'internacional',
    fechaPublicacion: '2025-05-01T12:00:00.000Z',
    autor: 'Foton Chile',
    destacada: false,
    activa: true,
    seoTitle: 'Foton planta Brasil expansión Latam — Foton Chile',
    seoDescription: 'Foton inaugura planta en Brasil de 200.000 m² con capacidad para 5.000 unidades anuales.',
  },
];

// ── DATOS: Sucursales ─────────────────────────────────────────────────────────

const SUCURSALES = [
  {
    nombre: 'Santiago',
    codigo: 'SCL',
    direccion: 'Av. Américo Vespucio #760, Pudahuel, Santiago',
    region: 'Región Metropolitana',
    comuna: 'Pudahuel',
    telefono: '(+56 2) 2 720 2221',
    email: 'servicioclientes@andesmotor.cl',
    latitud: -33.4489,
    longitud: -70.6693,
    horario: {
      'Lunes–Viernes': '8:30–18:00',
      'Sábado': '9:00–13:00',
    },
    servicios: ['Ventas', 'Taller oficial', 'Repuestos', 'Post venta', 'Diagnóstico OBD', 'Eléctricos'],
    activa: true,
    orden: 1,
  },
  {
    nombre: 'Antofagasta',
    codigo: 'ANT',
    direccion: 'Av. Pedro Aguirre Cerda #4990, Antofagasta, II Región',
    region: 'Región de Antofagasta',
    comuna: 'Antofagasta',
    telefono: '(+56 55) 2 345 678',
    email: 'antofagasta@andesmotor.cl',
    latitud: -23.6509,
    longitud: -70.3975,
    horario: {
      'Lunes–Viernes': '8:30–18:00',
      'Sábado': '9:00–13:00',
    },
    servicios: ['Ventas', 'Taller oficial', 'Repuestos', 'Post venta', 'Minería'],
    activa: true,
    orden: 2,
  },
  {
    nombre: 'Concepción',
    codigo: 'CCP',
    direccion: 'Av. Autopista del Sol #1450, Concepción, VIII Región',
    region: 'Región del Biobío',
    comuna: 'Concepción',
    telefono: '(+56 41) 2 456 789',
    email: 'concepcion@andesmotor.cl',
    latitud: -36.8270,
    longitud: -73.0498,
    horario: {
      'Lunes–Viernes': '8:30–18:00',
      'Sábado': '9:00–13:00',
    },
    servicios: ['Ventas', 'Taller oficial', 'Repuestos', 'Post venta', 'Forestal'],
    activa: true,
    orden: 3,
  },
];

// ── DATOS: Global ─────────────────────────────────────────────────────────────

const GLOBAL_CONFIG = {
  siteName: 'Foton Chile',
  siteDescription: 'Distribuidor oficial de camiones Foton en Chile. Vehículos livianos, medianos, pesados y eléctricos con respaldo Andes Motor.',
  telefono: '(+56 2) 2 720 2221',
  email: 'servicioclientes@andesmotor.cl',
  direccion: 'Av. Américo Vespucio #760, Pudahuel, Santiago',
  facebook: 'https://www.facebook.com/fotoncl',
  instagram: 'https://www.instagram.com/fotonchile',
  linkedin: 'https://www.linkedin.com/company/foton-chile',
  youtube: 'https://www.youtube.com/@fotonchile',
  whatsapp: '+56227202221',
  footerTexto: 'Foton Motor es hoy el fabricante de vehículos comerciales más grande de China, con presencia en más de 80 países y más de 11 millones de unidades vendidas. En Chile, Andes Motor es el distribuidor oficial desde 2012.',
  footerCopyright: '© 2025 Foton Chile / Andes Motor. Todos los derechos reservados.',
  seoDefaultTitle: 'Foton Chile — Camiones y Vehículos Comerciales',
  seoDefaultDescription: 'Distribuidor oficial Foton en Chile. Livianos, medianos, pesados y eléctricos con respaldo de Andes Motor en Santiago, Antofagasta y Concepción.',
};

// ── Runners ───────────────────────────────────────────────────────────────────

async function seedModelos(token) {
  console.log('\n🚛  Seeding modelos...');
  let created = 0;
  let skipped = 0;

  for (const modelo of MODELOS) {
    const existing = await findBySlug('modelos', modelo.slug, token);
    if (existing) {
      console.log(`   ⏭  Modelo "${modelo.nombre}" ya existe — omitiendo`);
      skipped++;
      continue;
    }

    const entry = await createEntry('modelos', modelo, token);
    await publishEntry('modelos', entry.id, token);
    console.log(`   ✅  Modelo creado: ${modelo.nombre} (id: ${entry.id})`);
    created++;
  }

  console.log(`   📊  Modelos: ${created} creados, ${skipped} omitidos`);
}

async function seedNoticias(token) {
  console.log('\n📰  Seeding noticias...');
  let created = 0;
  let skipped = 0;

  for (const noticia of NOTICIAS) {
    const existing = await findBySlug('noticias', noticia.slug, token);
    if (existing) {
      console.log(`   ⏭  Noticia "${noticia.titulo.slice(0, 50)}..." ya existe — omitiendo`);
      skipped++;
      continue;
    }

    const entry = await createEntry('noticias', noticia, token);
    await publishEntry('noticias', entry.id, token);
    console.log(`   ✅  Noticia creada: ${noticia.titulo.slice(0, 50)}... (id: ${entry.id})`);
    created++;
  }

  console.log(`   📊  Noticias: ${created} creadas, ${skipped} omitidas`);
}

async function seedSucursales(token) {
  console.log('\n📍  Seeding sucursales...');
  let created = 0;
  let skipped = 0;

  for (const sucursal of SUCURSALES) {
    const existing = await findByCodigo('sucursales', sucursal.codigo, token);
    if (existing) {
      console.log(`   ⏭  Sucursal "${sucursal.nombre}" ya existe — omitiendo`);
      skipped++;
      continue;
    }

    const entry = await createEntry('sucursales', sucursal, token);
    console.log(`   ✅  Sucursal creada: ${sucursal.nombre} (id: ${entry.id})`);
    created++;
  }

  console.log(`   📊  Sucursales: ${created} creadas, ${skipped} omitidas`);
}

async function seedGlobal(token) {
  console.log('\n🌐  Seeding configuración global...');

  // Verificar si ya existe
  const existing = await get('/api/global', token);
  if (existing.body?.data) {
    console.log('   ⏭  Global ya existe — actualizando con PUT...');
    const res = await put('/api/global', { data: GLOBAL_CONFIG }, token);
    if (res.status === 200) {
      console.log('   ✅  Global actualizado');
    } else {
      console.error('   ❌  Error actualizando global:', res.body?.error || res.body);
    }
    return;
  }

  const res = await post('/api/global', { data: GLOBAL_CONFIG }, token);
  if (res.status === 200 || res.status === 201) {
    console.log('   ✅  Global creado');
  } else {
    console.error('   ❌  Error creando global:', res.body?.error || res.body);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     Foton Chile CMS — Seeder Script     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Target: ${BASE_URL}`);

  const token = await authenticate();

  await seedGlobal(token);
  await seedModelos(token);
  await seedNoticias(token);
  await seedSucursales(token);

  console.log('\n🎉  Seeding completado.\n');
  console.log('Próximos pasos:');
  console.log('  1. Verifica los datos en el admin de Strapi');
  console.log('  2. Sube imágenes a Media Library (assets/img/*.png → modelos)');
  console.log('  3. Asocia imágenes a cada modelo/noticia desde el admin');
  console.log(`  4. Admin: ${BASE_URL}/admin\n`);
}

main().catch((err) => {
  console.error('\n❌  Error fatal:', err.message || err);
  process.exit(1);
});
