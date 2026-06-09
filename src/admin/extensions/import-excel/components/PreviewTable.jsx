import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div``;
const Stats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;
const StatCard = styled.div`
  padding: 12px 20px;
  border-radius: 8px;
  background: ${(p) => p.$bg || '#f5f5f5'};
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.$color || '#333'};
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 24px;
`;
const Th = styled.th`
  background: #f0f0f0;
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #e0e0e0;
  font-weight: 600;
`;
const Td = styled.td`
  padding: 8px 12px;
  border: 1px solid #e8e8e8;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ErrorRow = styled.tr`
  background: #fff8f8;
`;
const ErrorCell = styled.td`
  padding: 8px 12px;
  border: 1px solid #ffe0e0;
  color: #cf1322;
  font-size: 12px;
`;
const Actions = styled.div`
  display: flex;
  gap: 12px;
`;
const Btn = styled.button`
  padding: 10px 28px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: ${(p) => (p.$primary ? '#271fe0' : '#f5f5f5')};
  color: ${(p) => (p.$primary ? '#fff' : '#333')};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  &:hover:not(:disabled) {
    background: ${(p) => (p.$primary ? '#1a14a8' : '#e8e8e8')};
  }
`;

export const PreviewTable = ({ data, importType, onConfirm, onCancel, loading }) => {
  const { preview, stats, token, tokenExpiresAt } = data;
  const validCols = preview.validRows[0] ? Object.keys(preview.validRows[0]).filter(k => !k.startsWith('_')) : [];

  return (
    <Wrap>
      <Stats>
        <StatCard $bg="#e3f9e5" $color="#2c7a3a">✅ Válidas: {stats.valid}</StatCard>
        <StatCard $bg={stats.invalid > 0 ? '#fff0f0' : '#f5f5f5'} $color={stats.invalid > 0 ? '#cf1322' : '#333'}>
          ❌ Con errores: {stats.invalid}
        </StatCard>
        <StatCard $bg="#fffbe6" $color="#ad6800">⚠️ Duplicados: {stats.duplicates}</StatCard>
        <StatCard>Total: {stats.total}</StatCard>
      </Stats>

      {preview.validRows.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            Vista previa (primeras {preview.validRows.length} filas válidas)
          </h3>
          <Table>
            <thead>
              <tr>{validCols.map(c => <Th key={c}>{c}</Th>)}</tr>
            </thead>
            <tbody>
              {preview.validRows.map((row, i) => (
                <tr key={i}>
                  {validCols.map(c => <Td key={c} title={String(row[c] ?? '')}>{String(row[c] ?? '-')}</Td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {preview.errorRows.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#cf1322' }}>
            Filas con errores ({preview.errorRows.length})
          </h3>
          <Table>
            <thead>
              <tr><Th>Fila</Th><Th>Identificador</Th><Th>Errores</Th></tr>
            </thead>
            <tbody>
              {preview.errorRows.map((row, i) => (
                <ErrorRow key={i}>
                  <Td>{row._rowNumber}</Td>
                  <Td>{row.slug || row.codigo || row.titulo || '-'}</Td>
                  <ErrorCell>{row._errors?.join(' | ')}</ErrorCell>
                </ErrorRow>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
        Token expira: {new Date(tokenExpiresAt).toLocaleTimeString('es-CL')}
        {' '}— {data.validCount} filas serán importadas
      </p>

      <Actions>
        {stats.valid > 0 && (
          <Btn $primary disabled={loading} onClick={onConfirm}>
            {loading ? 'Importando...' : `✅ Confirmar importación (${stats.valid} filas)`}
          </Btn>
        )}
        <Btn disabled={loading} onClick={onCancel}>Cancelar</Btn>
      </Actions>
    </Wrap>
  );
};
