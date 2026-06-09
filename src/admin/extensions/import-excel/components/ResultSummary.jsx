import React from 'react';
import styled from 'styled-components';

const Wrap = styled.div`text-align: center; padding: 32px 0;`;
const Icon = styled.div`font-size: 48px; margin-bottom: 16px;`;
const Title = styled.h2`font-size: 20px; font-weight: 700; margin-bottom: 8px; color: ${p => p.$error ? '#cf1322' : '#2c7a3a'};`;
const Stats = styled.div`display: flex; justify-content: center; gap: 24px; margin: 24px 0; flex-wrap: wrap;`;
const Stat = styled.div`
  padding: 16px 28px; border-radius: 8px; background: ${p => p.$bg || '#f5f5f5'};
  font-size: 24px; font-weight: 800; color: ${p => p.$color || '#333'};
  small { display: block; font-size: 11px; font-weight: 400; margin-top: 4px; color: #666; }
`;
const ErrorList = styled.ul`
  text-align: left; max-width: 600px; margin: 16px auto; max-height: 200px; overflow-y: auto;
  padding: 12px; background: #fff0f0; border-radius: 6px; list-style: none;
`;
const ErrorItem = styled.li`font-size: 12px; color: #cf1322; padding: 4px 0; border-bottom: 1px solid #ffe0e0;`;
const Btn = styled.button`
  margin-top: 24px; padding: 10px 28px; border-radius: 6px; font-size: 14px;
  font-weight: 600; background: #271fe0; color: white; border: none; cursor: pointer;
  &:hover { background: #1a14a8; }
`;

export const ResultSummary = ({ data, importType, onReset }) => {
  const totalOk = (data.created || 0) + (data.updated || 0);
  const hasErrors = (data.failed || 0) > 0;

  return (
    <Wrap>
      <Icon>{totalOk > 0 ? '🎉' : '⚠️'}</Icon>
      <Title $error={totalOk === 0}>
        {totalOk > 0 ? 'Importación completada' : 'Importación con errores'}
      </Title>
      <p style={{ color: '#666', fontSize: 14 }}>
        Tipo: <strong>{importType}</strong>
      </p>

      <Stats>
        <Stat $bg="#e3f9e5" $color="#2c7a3a">
          {data.created || 0}<small>Creados</small>
        </Stat>
        <Stat $bg="#e6f4ff" $color="#0050b3">
          {data.updated || 0}<small>Actualizados</small>
        </Stat>
        {hasErrors && (
          <Stat $bg="#fff0f0" $color="#cf1322">
            {data.failed || 0}<small>Fallidos</small>
          </Stat>
        )}
      </Stats>

      {hasErrors && data.errors?.length > 0 && (
        <ErrorList>
          {data.errors.map((e, i) => (
            <ErrorItem key={i}>Fila {e.row}: {e.identifier} — {e.error}</ErrorItem>
          ))}
        </ErrorList>
      )}

      <Btn onClick={onReset}>Nueva importación</Btn>
    </Wrap>
  );
};
