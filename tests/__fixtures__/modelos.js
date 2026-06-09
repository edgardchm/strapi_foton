'use strict';

module.exports = {
  valid: {
    nombre: 'Foton 1827 Chasis',
    slug: 'foton-1827-chasis',
    categoria: 'medianos',
    precioDesde: 41990000,
    potencia: '215 HP',
    combustible: 'Diésel',
    activo: true,
    orden: 1,
  },
  invalid: {
    nombre: 'A', // muy corto
    categoria: 'invalida',
  },
  excelRows: [
    { _rowNumber: 2, nombre: 'Foton Aumark S', slug: 'foton-aumark-s', categoria: 'livianos' },
    { _rowNumber: 3, nombre: 'Foton e614', slug: 'foton-e614', categoria: 'electricos' },
    { _rowNumber: 4, nombre: 'X', slug: 'x', categoria: 'livianos' }, // nombre muy corto
    { _rowNumber: 5, nombre: 'Modelo sin slug', slug: '', categoria: 'medianos' }, // slug vacío
    { _rowNumber: 6, nombre: 'Categoria mala', slug: 'categoria-mala', categoria: 'invalida' },
  ],
};
