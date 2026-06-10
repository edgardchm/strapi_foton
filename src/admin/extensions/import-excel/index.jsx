import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';

// ── Tipos disponibles ─────────────────────────────────────────────────
const IMPORT_TYPES = [
  { value: 'sucursal', label: 'Sucursales' },
  { value: 'modelo-version', label: 'Versiones de Modelo' },
];

const IMPORT_MODES = [
  { value: 'upsert', label: 'Upsert (crear o actualizar)' },
  { value: 'create', label: 'Solo crear nuevos' },
  { value: 'update', label: 'Solo actualizar existentes' },
];

const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', RESULT: 'result' };

// ── Helpers ───────────────────────────────────────────────────────────
function getJwt() {
  // Strapi v4 admin guarda el token en localStorage bajo la clave 'jwtToken'
  // o en el store de Strapi admin SDK
  try {
    const raw = window.localStorage.getItem('jwtToken');
    if (raw) return raw;
    // fallback: buscar en las claves de strapi-admin
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.includes('userInfo')) {
        const val = JSON.parse(window.localStorage.getItem(k) || '{}');
        if (val.token) return val.token;
      }
    }
  } catch (_) {}
  return '';
}

// ── Styled Components ─────────────────────────────────────────────────
const Container = styled.div`
  padding: 32px;
  max-width: 900px;
`;
const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #271fe0;
  margin-bottom: 6px;
`;
const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 28px;
`;
const Row = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
const Select = styled.select`
  padding: 9px 13px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 220px;
  &:focus { outline: none; border-color: #271fe0; }
`;
const DropZone = styled.div`
  border: 2px dashed ${(p) => (p.$over ? '#271fe0' : '#ccc')};
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  background: ${(p) => (p.$over ? '#f0f0ff' : '#fafafa')};
  transition: all 0.2s;
  margin-bottom: 16px;
`;
const DropText = styled.p`
  color: #666;
  font-size: 14px;
  margin: 8px 0 0;
`;
const FileName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #271fe0;
`;
const Btn = styled.button`
  padding: 10px 22px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: ${(p) => (p.$secondary ? '#f0f0f0' : '#271fe0')};
  color: ${(p) => (p.$secondary ? '#333' : '#fff')};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  margin-right: 8px;
  &:hover:not(:disabled) { opacity: 0.85; }
`;
const ErrorBox = styled.div`
  padding: 12px 16px;
  background: #fff0f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #cf1322;
  font-size: 13px;
  margin-bottom: 16px;
`;
const InfoBox = styled.div`
  padding: 14px 18px;
  background: #f6f9ff;
  border: 1px solid #d0dbff;
  border-radius: 8px;
  margin-bottom: 20px;
`;
const InfoRow = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
`;
const Stat = styled.div`
  font-size: 13px;
  color: #333;
  span {
    font-weight: 700;
    font-size: 18px;
    color: ${(p) => p.$color || '#271fe0'};
    display: block;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 20px;
`;
const Th = styled.th`
  text-align: left;
  padding: 8px 10px;
  background: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
`;
const Td = styled.td`
  padding: 7px 10px;
  border-bottom: 1px solid #f0f0f0;
  color: ${(p) => (p.$error ? '#cf1322' : 'inherit')};
`;
const TemplateLink = styled.a`
  font-size: 12px;
  color: #271fe0;
  text-decoration: underline;
  display: inline-block;
  margin-top: 4px;
`;

// ── Componente Principal ──────────────────────────────────────────────
const ImportExcelPage = () => {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [importType, setImportType] = useState('sucursal');
  const [importMode, setImportMode] = useState('upsert');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const reset = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Formato no soportado. Use .xlsx, .xls o .csv');
      return;
    }
    setFile(f);
    setError(null);
  };

  // ── Preview (POST /api/import-excel/preview) ──────────────────────
  const handlePreview = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', importType);

      const res = await fetch('/api/import-excel/preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getJwt()}` },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || json.message || 'Error al procesar el archivo');

      setPreview(json);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [file, importType]);

  // ── Confirm: re-sube el mismo archivo (POST /api/import-excel/confirm) ──
  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', importType);
      fd.append('mode', importMode);

      const res = await fetch('/api/import-excel/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getJwt()}` },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok && res.status !== 207) {
        throw new Error(json.error?.message || json.message || 'Error al importar');
      }

      setResult(json);
      setStep(STEPS.RESULT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [file, importType, importMode]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Container>
      <Title>📊 Importar Excel</Title>
      <Subtitle>
        Importa sucursales o versiones de modelo desde .xlsx, .xls o .csv. Máximo 10MB.
      </Subtitle>

      {error && <ErrorBox>⚠️ {error}</ErrorBox>}

      {/* PASO 1: Configurar y subir */}
      {step === STEPS.UPLOAD && (
        <>
          <Row>
            <Field>
              <Label>Tipo de datos</Label>
              <Select value={importType} onChange={(e) => setImportType(e.target.value)}>
                {IMPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Modo</Label>
              <Select value={importMode} onChange={(e) => setImportMode(e.target.value)}>
                {IMPORT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </Field>
          </Row>

          <TemplateLink href={`/api/import-excel/template/${importType}`} download>
            ⬇ Descargar plantilla para {IMPORT_TYPES.find((t) => t.value === importType)?.label}
          </TemplateLink>

          <DropZone
            $over={dragOver}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <div style={{ fontSize: 32 }}>📁</div>
            {file
              ? <DropText>Archivo seleccionado: <FileName>{file.name}</FileName></DropText>
              : <DropText>Arrastra un archivo aquí o haz clic para seleccionar</DropText>
            }
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </DropZone>

          <Btn onClick={handlePreview} disabled={!file || loading}>
            {loading ? 'Procesando…' : 'Vista previa →'}
          </Btn>
        </>
      )}

      {/* PASO 2: Preview */}
      {step === STEPS.PREVIEW && preview && (
        <>
          <InfoBox>
            <InfoRow>
              <Stat><span>{preview.summary?.totalRows ?? 0}</span>Filas totales</Stat>
              <Stat $color="#2c7a3a"><span>{preview.summary?.validRows ?? 0}</span>Válidas</Stat>
              <Stat $color="#cf1322"><span>{preview.summary?.invalidRows ?? 0}</span>Con errores</Stat>
              <Stat $color="#d46b08"><span>{preview.statistics?.validPercentage ?? 0}%</span>Listos</Stat>
            </InfoRow>
          </InfoBox>

          {preview.preview?.validRows?.length > 0 && (
            <>
              <Label>Primeras filas válidas (máx. 5)</Label>
              <Table>
                <thead>
                  <tr>
                    {Object.keys(preview.preview.validRows[0]).filter(k => !k.startsWith('_')).map((k) => (
                      <Th key={k}>{k}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.validRows.map((row, i) => (
                    <tr key={i}>
                      {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
                        <Td key={k}>{String(v ?? '')}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          {preview.preview?.invalidRows?.length > 0 && (
            <>
              <Label style={{ color: '#cf1322' }}>Filas con errores (máx. 5)</Label>
              <Table>
                <thead>
                  <tr><Th>Fila</Th><Th>Error</Th></tr>
                </thead>
                <tbody>
                  {preview.preview.invalidRows.map((row, i) => (
                    <tr key={i}>
                      <Td>{row._rowNumber ?? i + 2}</Td>
                      <Td $error>{row._errors?.join('; ') ?? row.errors?.join('; ') ?? 'Error'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          {(preview.summary?.readyToImport ?? 0) === 0 ? (
            <ErrorBox>No hay filas válidas para importar. Revisa los errores e inténtalo de nuevo.</ErrorBox>
          ) : (
            <Btn onClick={handleConfirm} disabled={loading}>
              {loading ? 'Importando…' : `✓ Confirmar e importar ${preview.summary?.readyToImport} filas`}
            </Btn>
          )}
          <Btn $secondary onClick={reset} disabled={loading}>Cancelar</Btn>
        </>
      )}

      {/* PASO 3: Resultado */}
      {step === STEPS.RESULT && result && (
        <>
          <InfoBox>
            <InfoRow>
              <Stat $color="#2c7a3a"><span>{result.summary?.created ?? 0}</span>Creados</Stat>
              <Stat $color="#1677ff"><span>{result.summary?.updated ?? 0}</span>Actualizados</Stat>
              <Stat $color="#cf1322"><span>{result.summary?.errors ?? 0}</span>Errores</Stat>
            </InfoRow>
          </InfoBox>

          {result.errors?.length > 0 && (
            <>
              <Label style={{ color: '#cf1322' }}>Errores de importación</Label>
              <Table>
                <thead><tr><Th>Fila</Th><Th>Error</Th></tr></thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <Td>{e.rowNumber ?? e.rowIndex}</Td>
                      <Td $error>{e.error}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          <Btn onClick={reset}>Nueva importación</Btn>
        </>
      )}
    </Container>
  );
};

export default ImportExcelPage;
