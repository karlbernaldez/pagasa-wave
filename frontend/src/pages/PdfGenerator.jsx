import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const buttonStyle = {
  padding: '14px 26px',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg, #1f4b99, #1b2b61)',
  color: '#fff',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(27, 43, 97, 0.35)',
};

const wrapperStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f4f7fc',
};

const PdfGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/pdf/generate`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'WaveLab_ChartsReport.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      window.alert('Unable to generate PDF right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <button type="button" style={buttonStyle} onClick={handleGeneratePdf} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate PDF'}
      </button>
    </div>
  );
};

export default PdfGenerator;
