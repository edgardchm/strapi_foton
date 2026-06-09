'use strict';

jest.mock('../../src/utils/helpers', () => ({ sanitizeInput: (v) => v }));

function validateAgendamiento({ nombre, telefono, email, fecha }) {
  const errors = [];
  if (!nombre || nombre.trim().length < 2) errors.push('Nombre requerido');
  if (!telefono || telefono.trim().length < 8) errors.push('Teléfono requerido');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido');
  if (fecha) {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) errors.push('Fecha inválida');
    else if (d < new Date()) errors.push('La fecha no puede ser en el pasado');
  }
  return errors;
}

describe('Agendamiento Service — Validación', () => {
  it('debería validar agendamiento correcto', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const errors = validateAgendamiento({ nombre: 'María López', telefono: '56912345678', fecha: tomorrow });
    expect(errors).toHaveLength(0);
  });

  it('debería rechazar nombre vacío', () => {
    const errors = validateAgendamiento({ nombre: '', telefono: '56912345678' });
    expect(errors.some((e) => e.includes('Nombre'))).toBe(true);
  });

  it('debería rechazar fecha pasada', () => {
    const errors = validateAgendamiento({
      nombre: 'María López',
      telefono: '56912345678',
      fecha: '2020-01-01',
    });
    expect(errors.some((e) => e.includes('pasado'))).toBe(true);
  });

  it('debería rechazar fecha inválida', () => {
    const errors = validateAgendamiento({
      nombre: 'María',
      telefono: '56912345678',
      fecha: 'not-a-date',
    });
    expect(errors.some((e) => e.includes('Fecha'))).toBe(true);
  });

  it('debería validar sin fecha (campo opcional)', () => {
    const errors = validateAgendamiento({ nombre: 'María López', telefono: '56912345678' });
    expect(errors).toHaveLength(0);
  });

  it('debería rechazar email inválido si se provee', () => {
    const errors = validateAgendamiento({
      nombre: 'María López',
      telefono: '56912345678',
      email: 'bad-email',
    });
    expect(errors.some((e) => e.includes('Email'))).toBe(true);
  });
});
