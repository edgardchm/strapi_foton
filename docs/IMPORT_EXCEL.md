# Importación Excel — Guía de Uso

## Flujo de 3 Fases

### Fase 1: CARGA + PREVIEW
1. Ir a Admin Panel → "Importar Excel"
2. Seleccionar tipo: Modelos | Sucursales | Noticias
3. Descargar plantilla (botón azul)
4. Completar plantilla con datos
5. Subir archivo (.xlsx o .xls, máx 5MB)
6. El sistema valida y muestra:
   - ✅ Filas válidas con preview
   - ❌ Filas con errores (con descripción por fila y campo)
   - ⚠️ Duplicados detectados

### Fase 2: CONFIRMACIÓN
7. Revisar el preview
8. Corregir filas con error en el Excel (opcional)
9. Hacer clic en "Confirmar importación"
10. El token expira en 15 minutos

### Fase 3: RESULTADO
11. Ver resumen: Creados / Actualizados / Fallidos
12. Revisar errores detallados si hay fallidos

---

## Plantillas

### Modelos (`modelos`)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| nombre | texto | ✅ | Mín. 2 chars |
| slug | texto | ✅ | URL-friendly único |
| categoria | enum | ✅ | livianos/medianos/pesados/electricos |
| descripcion | texto | | Descripción larga |
| precioDesde | número | | Precio en CLP |
| potencia | texto | | Ej: "215 HP" |
| torque | texto | | Ej: "850 Nm" |
| combustible | texto | | Diésel / Eléctrico |
| destacado | booleano | | true/false/1/0 |
| activo | booleano | | true por defecto |
| orden | número | | Orden de display |

### Sucursales (`sucursales`)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| nombre | texto | ✅ | Nombre completo |
| codigo | texto | ✅ | Código único ej: RM-001 |
| direccion | texto | | Dirección completa |
| region | texto | | |
| comuna | texto | | |
| telefono | texto | | Con código país |
| email | email | | Formato válido |
| latitud | decimal | | -90 a 90 |
| longitud | decimal | | -180 a 180 |
| activa | booleano | | true por defecto |

### Noticias (`noticias`)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| titulo | texto | ✅ | Mín. 5 chars |
| slug | texto | ✅ | URL-friendly único |
| bajada | texto | | Resumen corto |
| categoria | enum | | empresa/productos/etc |
| autor | texto | | |
| destacada | booleano | | |
| activa | booleano | | true por defecto |

---

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| slug "x" duplicado | Slug ya existe en BD | Cambia el slug |
| nombre muy corto | < 2 caracteres | Nombre más descriptivo |
| categoría inválida | Valor no en enum | Usar exactamente: livianos/medianos/pesados/electricos |
| email inválido | Formato incorrecto | Verificar formato user@domain.com |
| latitud fuera de rango | > 90 o < -90 | Verificar coordenadas de Chile |
| Token expirado | > 15 min desde preview | Subir archivo nuevamente |

---

## Endpoints API
```
POST /api/import-excel/preview    # Subir y previsualizar
POST /api/import-excel/confirm    # Confirmar (requiere token)
GET  /api/import-excel/template/:type  # Descargar plantilla
```
