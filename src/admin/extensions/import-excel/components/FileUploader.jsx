import React, { useRef, useState } from 'react';
import styled from 'styled-components';

const DropZone = styled.div`
  border: 2px dashed ${(p) => (p.$dragging ? '#271fe0' : '#ddd')};
  border-radius: 10px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  background: ${(p) => (p.$dragging ? '#f0f4ff' : '#fafafa')};
  transition: all 0.2s;
  &:hover { border-color: #271fe0; background: #f0f4ff; }
`;

const DropText = styled.p`
  font-size: 15px;
  color: #555;
  margin: 0;
`;

const DropSub = styled.p`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileName = styled.div`
  margin-top: 12px;
  font-size: 13px;
  color: #271fe0;
  font-weight: 600;
`;

const Button = styled.button`
  margin-top: 20px;
  padding: 10px 28px;
  background: #271fe0;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  &:hover:not(:disabled) { background: #1a14a8; }
`;

export const FileUploader = ({ onUpload, loading }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      alert('Solo se aceptan archivos .xlsx o .xls');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera el máximo de 5MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <DropZone
        $dragging={dragging}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <DropText>📂 Arrastra tu archivo aquí o haz clic para seleccionar</DropText>
        <DropSub>Formatos aceptados: .xlsx, .xls — Máximo 5MB</DropSub>
        {selectedFile && <FileName>✅ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</FileName>}
      </DropZone>

      <FileInput
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {selectedFile && (
        <Button
          disabled={loading}
          onClick={() => onUpload(selectedFile)}
        >
          {loading ? 'Procesando...' : '🔍 Previsualizar Importación'}
        </Button>
      )}
    </div>
  );
};
