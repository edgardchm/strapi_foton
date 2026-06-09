import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FileUploader } from './components/FileUploader';
import { PreviewTable } from './components/PreviewTable';
import { ResultSummary } from './components/ResultSummary';

// ── Constantes ───────────────────────────────────────────────────────
const IMPORT_TYPES = [
  { value: 'modelos', label: 'Modelos de Vehículos' },
  { value: 'sucursales', label: 'Sucursales' },
  { value: 'noticias', label: 'Noticias' },
];

const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', RESULT: 'result' };

// ── Styled Components ────────────────────────────────────────────────
const Container = styled.div`
  padding: 24px;
  max-width: 1100px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #271fe0;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
`;

const StepIndicator = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
`;

const Step = styled.span`
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => (p.$active ? '#271fe0' : p.$done ? '#e3f9e5' : '#f0f0f0')};
  color: ${(p) => (p.$active ? '#fff' : p.$done ? '#2c7a3a' : '#999')};
`;

const TypeSelector = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
`;

const Select = styled.select`
  width: 280px;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #271fe0; }
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  background: #fff0f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #cf1322;
  font-size: 13px;
  margin-bottom: 16px;
`;

const TemplateLink = styled.a`
  font-size: 12px;
  color: #271fe0;
  text-decoration: underline;
  cursor: pointer;
  display: inline-block;
  margin-top: 8px;
`;

// ── Componente Principal ─────────────────────────────────────────────
const ImportExcelPage = () => {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [importType, setImportType] = useState('modelos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [resultData, setResultData] = useState(null);

  // ── Paso 1: Subir y previsualizar ──────────────────────────────────
  const handleUpload = useCallback(async (file) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      const response = await fetch('/api/import-excel/preview', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('jwtToken') || ''}`,
        },
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message || 'Error al procesar el archivo');
      }

      setPreviewData(json.data);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [importType]);

  // ── Paso 2: Confirmar importación ──────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!previewData?.token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/import-excel/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${window.localStorage.getItem('jwtToken') || ''}`,
        },
        body: JSON.stringify({ token: previewData.token }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message || 'Error al confirmar importación');
      }

      setResultData(json.data);
      setStep(STEPS.RESULT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [previewData]);

  const handleReset = () => {
    setStep(STEPS.UPLOAD);
    setPreviewData(null);
    setResultData(null);
    setError(null);
  };

  return (
    <Container>
      <Title>📊 Importar Excel</Title>
      <Subtitle>
        Importa datos masivamente desde archivos Excel (.xlsx, .xls).
        Máximo 5MB. Descarga la plantilla antes de comenzar.
      </Subtitle>

      <StepIndicator>
        <Step $active={step === STEPS.UPLOAD} $done={step !== STEPS.UPLOAD}>1. Cargar</Step>
        <Step $active={step === STEPS.PREVIEW} $done={step === STEPS.RESULT}>2. Preview</Step>
        <Step $active={step === STEPS.RESULT}>3. Resultado</Step>
      </StepIndicator>

      {error && <ErrorBanner>⚠️ {error}</ErrorBanner>}

      {step === STEPS.UPLOAD && (
        <>
          <TypeSelector>
            <Label htmlFor="import-type">Tipo de importación</Label>
            <Select
              id="import-type"
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
            >
              {IMPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <TemplateLink
              href={`/api/import-excel/template/${importType}`}
              download
            >
              Descargar plantilla para {IMPORT_TYPES.find(t => t.value === importType)?.label}
            </TemplateLink>
          </TypeSelector>

          <FileUploader onUpload={handleUpload} loading={loading} />
        </>
      )}

      {step === STEPS.PREVIEW && previewData && (
        <PreviewTable
          data={previewData}
          importType={importType}
          onConfirm={handleConfirm}
          onCancel={handleReset}
          loading={loading}
        />
      )}

      {step === STEPS.RESULT && resultData && (
        <ResultSummary
          data={resultData}
          importType={importType}
          onReset={handleReset}
        />
      )}
    </Container>
  );
};

export default ImportExcelPage;
