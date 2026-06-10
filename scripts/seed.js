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

  // Strapi v4: los admins usan /admin/login, NO /api/auth/local
  const res = await post('/admin/login', {
    email: IDENTIFIER,
    password: PASSWORD,
  });

  if (res.status !== 200 || !res.body?.data?.token) {
    console.error('❌  Autenticación fallida:', res.body?.error?.message || JSON.stringify(res.body));
    process.exit(1);
  }

  console.log(`✅  Autenticado como: ${res.body.data.user?.email}`);
  return res.body.data.token;
}

// ── Helpers de seeding ────────────────────────────────────────────────────────
// Usa la Admin Content-Manager API (requiere token de admin, no de users-permissions)

const CM = '/content-manager/collection-types';

async function findBySlug(uid, slug, token) {
  const res = await get(`${CM}/${uid}?page=1&pageSize=1&filters[$and][0][slug][$eq]=${encodeURIComponent(slug)}`, token);
  const items = res.body?.results;
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function findByCodigo(uid, codigo, token) {
  const res = await get(`${CM}/${uid}?page=1&pageSize=1&filters[$and][0][codigo][$eq]=${encodeURIComponent(codigo)}`, token);
  const items = res.body?.results;
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}

async function createEntry(uid, data, token) {
  const res = await post(`${CM}/${uid}`, data, token);
  if (res.status === 200 || res.status === 201) {
    return res.body;
  }
  throw new Error(`POST ${CM}/${uid} → ${res.status}: ${JSON.stringify(res.body?.error || res.body)}`);
}

async function publishEntry(uid, id, token) {
  const res = await post(`${CM}/${uid}/${id}/actions/publish`, {}, token);
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

// ── DATOS: FAQs ───────────────────────────────────────────────────────────────

const FAQS = [
  { pregunta: '¿Qué modelos de camiones Foton están disponibles en Chile?', respuesta: 'Foton Chile comercializa actualmente una línea completa de vehículos comerciales a través de su distribuidor oficial Andes Motor: el Aumark S (camión liviano multipropósito), el 1827 Chasis (camión de distribución regional), el 1827 Volquete, el Auman 1522, el Auman GTL para transporte de largo recorrido, y el e 614 Eléctrico, el primer camión eléctrico de la marca disponible en el país. Puedes ver las especificaciones completas de cada modelo en nuestra página de modelos.', categoria: 'vehiculos', orden: 1, activa: true },
  { pregunta: '¿Cuál es el camión más adecuado para mi tipo de negocio?', respuesta: 'La elección depende del uso principal, la carga habitual y la ruta de operación. El Aumark S es ideal para distribución urbana y reparto; el 1827 para construcción y distribución regional; el Auman 1522 para trabajo pesado 6x4; el Auman GTL para larga distancia; y el e 614 Eléctrico para operaciones urbanas de última milla. Nuestros asesores pueden orientarte según el tonelaje, radio de operación y presupuesto.', categoria: 'vehiculos', orden: 2, activa: true },
  { pregunta: '¿Los camiones Foton cumplen las normativas de emisiones en Chile?', respuesta: 'Sí. Todos los vehículos Foton comercializados en Chile cumplen con la normativa de emisiones Euro V vigente, exigida por el Ministerio del Medio Ambiente para vehículos de transporte de carga. El modelo e 614 Eléctrico opera con cero emisiones directas, siendo una opción elegible para zonas de restricción vehicular en la Región Metropolitana.', categoria: 'vehiculos', orden: 3, activa: true },
  { pregunta: '¿Dónde puedo hacer una prueba de manejo?', respuesta: 'Puedes solicitar una prueba de manejo en cualquiera de nuestras sucursales, sujeto a disponibilidad del modelo y coordinación previa. Te recomendamos agendar una visita para garantizar que el camión que deseas conocer esté disponible el día que te convenga.', categoria: 'vehiculos', orden: 4, activa: true },
  { pregunta: '¿Foton fabrica camiones refrigerados o con carrocería especial?', respuesta: 'Foton produce chasis y vehículos base que pueden ser carrozados por terceros homologados. Trabajamos con carrozadores especializados para soluciones como frío, furgón, plataforma, volcador y más. Si necesitas un equipamiento específico, cuéntanos tu operación y gestionamos una solución a medida.', categoria: 'vehiculos', orden: 5, activa: true },
  { pregunta: '¿Cómo inicio el proceso de compra de un camión Foton?', respuesta: 'Puedes iniciar el proceso de tres formas: completando el formulario de cotización online, escribiéndonos por WhatsApp, o visitando directamente cualquiera de nuestras sucursales. Un asesor comercial te contactará en un plazo máximo de 24 horas hábiles con una cotización personalizada.', categoria: 'compra', orden: 6, activa: true },
  { pregunta: '¿Ofrecen financiamiento propio o trabajan con entidades bancarias?', respuesta: 'Trabajamos con múltiples alternativas de financiamiento: leasing operativo, leasing financiero y crédito comercial a través de alianzas con entidades bancarias y empresas de factoring especializadas en flota. También gestionamos subsidios para vehículos eléctricos cuando aplica.', categoria: 'compra', orden: 7, activa: true },
  { pregunta: '¿Cuál es el plazo de entrega habitual de un camión?', respuesta: 'Para modelos disponibles en stock, el plazo de entrega es de 5 a 10 días hábiles tras la confirmación del pedido y la aprobación del financiamiento (si aplica). Para unidades bajo pedido con configuración especial o carrozado adicional, el plazo varía entre 30 y 90 días.', categoria: 'compra', orden: 8, activa: true },
  { pregunta: '¿Puedo comprar un camión Foton si tengo empresa en regiones fuera de Santiago?', respuesta: 'Sí. Tenemos presencia nacional con sucursales en la Región Metropolitana y cobertura comercial en regiones a través de nuestra red de atención. El proceso de cotización y trámite se puede gestionar completamente de forma remota, con coordinación de entrega en la ubicación acordada.', categoria: 'compra', orden: 9, activa: true },
  { pregunta: '¿Aceptan vehículo en parte de pago?', respuesta: 'Evaluamos la recepción de vehículos usados en parte de pago caso a caso, dependiendo del modelo, año, kilometraje y estado general. Te recomendamos mencionarlo desde el inicio de la cotización para que tu asesor gestione la tasación y lo incluya en la propuesta comercial.', categoria: 'compra', orden: 10, activa: true },
  { pregunta: '¿Cuánto tiempo de garantía tiene un camión Foton nuevo?', respuesta: 'Los camiones Foton nuevos cuentan con garantía oficial de 2 años o 100.000 km (lo que ocurra primero), cubriendo defectos de fabricación en motor, caja de cambios, diferencial y componentes estructurales. La garantía es válida en toda la red de servicio técnico autorizado Andes Motor en Chile.', categoria: 'garantia', orden: 11, activa: true },
  { pregunta: '¿Qué cubre y qué no cubre la garantía?', respuesta: 'Cubre: defectos de fabricación en tren motriz, sistema eléctrico, frenos, dirección y carrocería de fábrica. No cubre: desgaste normal de consumibles (neumáticos, pastillas, filtros, aceite), daños por accidente, mal uso, cargas sobre el límite permitido, modificaciones no autorizadas, ni falta de mantenimiento preventivo.', categoria: 'garantia', orden: 12, activa: true },
  { pregunta: '¿La garantía se pierde si realizo el mantenimiento fuera de la red Andes Motor?', respuesta: 'El mantenimiento preventivo fuera de la red autorizada puede poner en riesgo la garantía si se demuestra que el servicio no fue ejecutado correctamente o se utilizaron repuestos no originales. Para proteger tu garantía, te recomendamos siempre realizar los servicios en nuestra red de talleres autorizados con repuestos originales Foton.', categoria: 'garantia', orden: 13, activa: true },
  { pregunta: '¿Cómo hacer efectiva la garantía si mi camión presenta una falla?', respuesta: 'Contáctanos de inmediato por WhatsApp o llama al (+56 2) 2 720 2221. Nuestro equipo de post venta evaluará la situación, gestionará el ingreso al taller más cercano o coordinará asistencia en ruta si el vehículo no puede desplazarse. Ten a mano el número de chasis y los documentos de compra.', categoria: 'garantia', orden: 14, activa: true },
  { pregunta: '¿Con qué frecuencia debo realizar el mantenimiento preventivo?', respuesta: 'Como norma general, los camiones Foton requieren su primer servicio a las 5.000 km y luego cada 10.000 km o cada 6 meses, lo que ocurra primero. En operaciones exigentes (minería, caminos de tierra, altas cargas) se recomienda reducir este intervalo. Consulta el manual del propietario de tu modelo específico.', categoria: 'postventa', orden: 15, activa: true },
  { pregunta: '¿Tienen repuestos originales disponibles en Chile?', respuesta: 'Sí. Mantenemos un stock permanente de repuestos originales Foton en nuestro centro de distribución en Santiago. Para modelos de alta rotación, los repuestos más críticos están disponibles de forma inmediata. Para piezas de menor rotación, el plazo de abastecimiento es de 7 a 21 días hábiles.', categoria: 'postventa', orden: 16, activa: true },
  { pregunta: '¿Ofrecen servicio técnico a domicilio o asistencia en ruta?', respuesta: 'Contamos con un servicio de asistencia en ruta para vehículos con garantía activa en la Región Metropolitana y zonas de cobertura directa. Para regiones, coordinamos con nuestra red de talleres asociados. Ante una emergencia, llama directamente al (+56 2) 2 720 2221 o escríbenos por WhatsApp.', categoria: 'postventa', orden: 17, activa: true },
  { pregunta: '¿Puedo agendar un servicio de mantenimiento online?', respuesta: 'Sí. Puedes agendar tu próximo servicio en línea seleccionando el tipo de mantención, la fecha preferida y la sucursal más conveniente para ti. También puedes coordinar directamente por WhatsApp si prefieres atención personalizada.', categoria: 'postventa', orden: 18, activa: true },
  { pregunta: '¿Cuánto demora normalmente un servicio de mantenimiento?', respuesta: 'Un servicio de mantención estándar (cambio de aceite, filtros y revisión general) toma entre 2 y 4 horas. Intervenciones más complejas pueden requerir 1 a 2 días. Te informamos el tiempo estimado al momento de ingresar el vehículo y te avisamos cuando esté listo.', categoria: 'postventa', orden: 19, activa: true },
  { pregunta: '¿Cuál es la autonomía real del camión eléctrico e 614?', respuesta: 'El Foton e 614 tiene una autonomía certificada de hasta 208 km en condiciones estándar. En operaciones urbanas reales con ciclos de parada y arranque, la autonomía efectiva se sitúa entre 150 y 180 km, suficiente para la mayoría de las rutas de distribución urbana en una sola carga nocturna.', categoria: 'electricos', orden: 20, activa: true },
  { pregunta: '¿Qué tipo de cargador necesito y cuánto tarda en cargarse?', respuesta: 'El e 614 acepta carga en corriente alterna (CA) trifásica y carga rápida en corriente continua (CC). Con cargador AC trifásico industrial (22 kW), la carga completa tarda aproximadamente 6 a 8 horas. Con cargador rápido DC, puede alcanzar el 80% de carga en menos de 2 horas. Asesoramos en la instalación de infraestructura de carga en tu empresa.', categoria: 'electricos', orden: 21, activa: true },
  { pregunta: '¿Existen beneficios o subsidios para la compra del camión eléctrico en Chile?', respuesta: 'Sí. Los vehículos eléctricos de uso comercial pueden acceder a reducción del impuesto de primera categoría, exención de restricción vehicular en la RM y acceso a programas de fomento del Ministerio de Energía. Nuestros asesores te guían en la evaluación de cada beneficio aplicable a tu caso.', categoria: 'electricos', orden: 22, activa: true },
  { pregunta: '¿Cuánto se ahorra en costos operativos con un camión eléctrico vs. uno diésel?', respuesta: 'En operaciones urbanas de alta frecuencia, el costo energético del e 614 es hasta un 70% menor que el de un camión diésel equivalente. A esto se suma una reducción de hasta un 60% en costos de mantenimiento. El retorno de inversión frente al diferencial de precio de compra suele alcanzarse entre los 3 y 5 años según la operación.', categoria: 'electricos', orden: 23, activa: true },
];

// ── DATOS: Soluciones ─────────────────────────────────────────────────────────

const SOLUCIONES = [
  {
    titulo: 'Última Milla Urbana',
    slug: 'ultima-milla-urbana',
    descripcion: 'Distribución ágil en ciudad, parking fácil y bajo consumo. El Aumark S lidera la eficiencia en el reparto urbano con hasta 140 HP y 3.500 kg de carga útil.',
    categoria: 'urbano',
    orden: 1,
    activa: true,
  },
  {
    titulo: 'Distribución Regional',
    slug: 'distribucion-regional',
    descripcion: 'Motor Cummins Euro V, cabina confort y carga de hasta 12.600 kg. El 1827 es el referente del transporte interurbano en Chile con presencia en las principales rutas del país.',
    categoria: 'distribucion',
    orden: 2,
    activa: true,
  },
  {
    titulo: 'Industrial y Minería',
    slug: 'industrial-mineria',
    descripcion: 'Tracción 6×4, chasis de alta resistencia y componentes Cummins diseñados para las condiciones más exigentes. El Auman 1522 opera donde otros no pueden.',
    categoria: 'industrial',
    orden: 3,
    activa: true,
  },
  {
    titulo: 'Construcción y Obras',
    slug: 'construccion-obras',
    descripcion: 'Caja volcadora hidráulica para mover tierra, escombros y materiales en obra. Alta capacidad de carga, transmisión robusta y sistema volcador de 6 m³.',
    categoria: 'construccion',
    orden: 4,
    activa: true,
  },
  {
    titulo: 'Electromovilidad',
    slug: 'electromovilidad',
    descripcion: 'Cero emisiones directas, carga en menos de 2 horas y hasta un 70% de ahorro en costos operativos versus diésel. El Foton e 614 es el futuro del reparto urbano ya disponible hoy.',
    categoria: 'electromovilidad',
    orden: 5,
    activa: true,
  },
  {
    titulo: 'Flotas Empresariales',
    slug: 'flotas-empresariales',
    descripcion: 'Para operadores que no pueden parar: el Auman GTL cubre larga distancia con motor Cummins ISM 400 HP, cabina full comfort y el soporte técnico nacional de Andes Motor.',
    categoria: 'flotas',
    orden: 6,
    activa: true,
  },
];

// ── Runners ───────────────────────────────────────────────────────────────────

// UIDs de los content types (singularName del schema.json)
const UID_MODELO    = 'api::modelo.modelo';
const UID_NOTICIA   = 'api::noticia.noticia';
const UID_SUCURSAL  = 'api::sucursal.sucursal';
const UID_GLOBAL    = 'api::global.global';    // singleType

async function seedModelos(token) {
  console.log('\n🚛  Seeding modelos...');
  let created = 0;
  let skipped = 0;

  for (const modelo of MODELOS) {
    const existing = await findBySlug(UID_MODELO, modelo.slug, token);
    if (existing) {
      console.log(`   ⏭  Modelo "${modelo.nombre}" ya existe — omitiendo`);
      skipped++;
      continue;
    }

    const entry = await createEntry(UID_MODELO, modelo, token);
    await publishEntry(UID_MODELO, entry.id, token);
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
    const existing = await findBySlug(UID_NOTICIA, noticia.slug, token);
    if (existing) {
      console.log(`   ⏭  Noticia "${noticia.titulo.slice(0, 50)}..." ya existe — omitiendo`);
      skipped++;
      continue;
    }

    const entry = await createEntry(UID_NOTICIA, noticia, token);
    await publishEntry(UID_NOTICIA, entry.id, token);
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
    const existing = await findByCodigo(UID_SUCURSAL, sucursal.codigo, token);
    if (existing) {
      console.log(`   ⏭  Sucursal "${sucursal.nombre}" ya existe — omitiendo`);
      skipped++;
      continue;
    }

    const entry = await createEntry(UID_SUCURSAL, sucursal, token);
    // Sucursales no tienen publishedAt en el schema, se guardan como draft automáticamente.
    // Publicar igual para dejarlas activas:
    await publishEntry(UID_SUCURSAL, entry.id, token);
    console.log(`   ✅  Sucursal creada: ${sucursal.nombre} (id: ${entry.id})`);
    created++;
  }

  console.log(`   📊  Sucursales: ${created} creadas, ${skipped} omitidas`);
}

async function seedGlobal(token) {
  console.log('\n🌐  Seeding configuración global...');
  // global es singleType → admin API usa /content-manager/single-types/{uid}
  const ST = `/content-manager/single-types/${UID_GLOBAL}`;

  const existing = await get(ST, token);
  const exists = existing.status === 200 && existing.body?.id;

  if (exists) {
    console.log('   ⏭  Global ya existe — actualizando con PUT...');
    const res = await put(ST, GLOBAL_CONFIG, token);
    if (res.status === 200) {
      // Publicar
      await post(`${ST}/actions/publish`, {}, token);
      console.log('   ✅  Global actualizado y publicado');
    } else {
      console.error('   ❌  Error actualizando global:', JSON.stringify(res.body?.error || res.body));
    }
    return;
  }

  // Si no existe, un PUT a single-type también crea el registro
  const res = await put(ST, GLOBAL_CONFIG, token);
  if (res.status === 200 || res.status === 201) {
    await post(`${ST}/actions/publish`, {}, token);
    console.log('   ✅  Global creado y publicado');
  } else {
    console.error('   ❌  Error creando global:', JSON.stringify(res.body?.error || res.body));
  }
}

// UIDs adicionales
const UID_FAQ      = 'api::faq.faq';
const UID_SOLUCION = 'api::solucion.solucion';

async function seedFaqs(token) {
  console.log('\n❓  Seeding FAQs...');

  // Verificar si ya existe alguna FAQ
  const check = await get(`${CM}/${UID_FAQ}?page=1&pageSize=1`, token);
  const total = check.body?.pagination?.total ?? check.body?.results?.length ?? 0;
  if (total > 0) {
    console.log(`   ⏭  FAQs ya existen (${total} encontradas) — omitiendo`);
    return;
  }

  let created = 0;
  for (const faq of FAQS) {
    try {
      const entry = await createEntry(UID_FAQ, faq, token);
      await publishEntry(UID_FAQ, entry.id, token);
      created++;
    } catch (e) {
      console.error(`   ❌  Error creando FAQ: ${faq.pregunta.slice(0, 50)}...`, e.message);
    }
  }
  console.log(`   📊  FAQs: ${created} creadas`);
}

async function seedSoluciones(token) {
  console.log('\n💡  Seeding soluciones...');
  let created = 0;
  let skipped = 0;

  for (const sol of SOLUCIONES) {
    const existing = await findBySlug(UID_SOLUCION, sol.slug, token);
    if (existing) {
      console.log(`   ⏭  Solución "${sol.titulo}" ya existe — omitiendo`);
      skipped++;
      continue;
    }
    const entry = await createEntry(UID_SOLUCION, sol, token);
    await publishEntry(UID_SOLUCION, entry.id, token);
    console.log(`   ✅  Solución creada: ${sol.titulo}`);
    created++;
  }
  console.log(`   📊  Soluciones: ${created} creadas, ${skipped} omitidas`);
}

// ── DATOS: Banners (Hero Slider Home) ─────────────────────────────────────────

const UID_BANNER = 'api::banner.banner';

const BANNERS = [
  {
    titulo: 'Innovación en Movimiento',
    subtitulo: 'Bienvenido a un viaje donde la innovación se encuentra en cada curva del camino',
    descripcion: 'Descubre la línea completa de camiones Foton para distribución, construcción e industria.',
    ctaTexto: 'Cotizar Ahora',
    ctaUrl: '/cotizar',
    orden: 1,
    activo: true,
  },
  {
    titulo: 'Electromovilidad al Servicio de tu Empresa',
    subtitulo: 'El e 614 llega para transformar la logística urbana de Chile',
    descripcion: '208 km de autonomía · Carga en 45 minutos · 0 emisiones · Mayor ahorro operativo.',
    ctaTexto: 'Ver e 614 Eléctrico',
    ctaUrl: '/modelos/detail?model=e614',
    orden: 2,
    activo: true,
  },
  {
    titulo: 'Red de Servicio Técnico en Todo Chile',
    subtitulo: 'Más de 30 centros autorizados para mantener tu flota siempre operativa',
    descripcion: 'Técnicos certificados por Foton International. Repuestos originales garantizados en todo el país.',
    ctaTexto: 'Ver Sucursales',
    ctaUrl: '/sucursales',
    orden: 3,
    activo: true,
  },
];

async function seedBanners(token) {
  console.log('\n🖼️   Seeding banners (hero slider)...');

  const check = await get(`${CM}/${UID_BANNER}?page=1&pageSize=1`, token);
  const total = check.body?.pagination?.total ?? check.body?.results?.length ?? 0;
  if (total > 0) {
    console.log(`   ⏭  Banners ya existen (${total} encontrados) — omitiendo`);
    return;
  }

  let created = 0;
  for (const banner of BANNERS) {
    try {
      const entry = await createEntry(UID_BANNER, banner, token);
      await publishEntry(UID_BANNER, entry.id, token);
      created++;
    } catch (e) {
      console.error(`   ❌  Error creando banner: ${banner.titulo}`, e.message);
    }
  }
  console.log(`   📊  Banners: ${created} creados`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     Foton Chile CMS — Seeder Script     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Target: ${BASE_URL}`);

  const token = await authenticate();

  await seedGlobal(token);
  await seedBanners(token);
  await seedModelos(token);
  await seedNoticias(token);
  await seedSucursales(token);
  await seedFaqs(token);
  await seedSoluciones(token);

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
