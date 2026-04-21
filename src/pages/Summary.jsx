import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';

export default function Summary({ sessionData, setSessionData }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Protect route
  useEffect(() => {
    if (!sessionData?.chartImages || Object.keys(sessionData.chartImages).length === 0) {
      navigate('/');
    }
  }, [sessionData, navigate]);

  if (!sessionData?.chartImages || Object.keys(sessionData.chartImages).length === 0) return null;

  const chartEntries = Object.entries(sessionData.chartImages);

  const handleProcessPdf = async (action) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [595, 842]
      });

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.replace(/-/g, '/');
      };

      // Draw Patient Information on the first blank page
      const drawInfoPageImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 595 * 2;
        canvas.height = 842 * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 595, 842);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px "Microsoft JhengHei", "PingFang TC", sans-serif';
        ctx.fillText(t('home_title'), 50, 80);

        ctx.beginPath();
        ctx.moveTo(50, 100);
        ctx.lineTo(545, 100);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '16px "Microsoft JhengHei", "PingFang TC", sans-serif';
        let y = 140;
        const lineSpacing = 35;

        ctx.fillText(`${t('full_name')}: ${sessionData.fullName || ''}`, 50, y);
        y += lineSpacing;
        ctx.fillText(`${t('patient_id')}: ${sessionData.patientId || ''}`, 50, y);
        y += lineSpacing;
        ctx.fillText(`${t('dob')}: ${formatDate(sessionData.dob)}`, 50, y);
        y += lineSpacing;
        ctx.fillText(`${t('date')}: ${formatDate(sessionData.date)}`, 50, y);
        y += lineSpacing;
        ctx.fillText(`${t('survey_type')}: ${t(`survey_${sessionData.survey || 'FU'}`)}`, 50, y);

        y += lineSpacing;
        ctx.fillText(`${t('marked_charts')}:`, 50, y);
        chartEntries.forEach(([chartId]) => {
          y += 28;
          ctx.fillText(`- ${t(`term_${chartId.replace(' ', '_')}`)}`, 70, y);
        });

        return canvas.toDataURL('image/jpeg', 0.9);
      };

      // Draw Chart Title on the chart pages
      const drawChartTitleImage = (titleText) => {
        const canvas = document.createElement('canvas');
        canvas.width = 595 * 2;
        canvas.height = 842 * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.clearRect(0, 0, 595, 842);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px "Microsoft JhengHei", "PingFang TC", sans-serif';

        const textWidth = ctx.measureText(titleText).width;
        // Center the title horizontally, near the top
        ctx.fillText(titleText, (595 - textWidth) / 2, 40);

        return canvas.toDataURL('image/png');
      };

      // Helper to compress image
      const compressImage = (base64Str, quality = 0.6) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.src = base64Str;
        });
      };

      // 1. Add Info Page
      const infoImg = drawInfoPageImage();
      pdf.addImage(infoImg, 'JPEG', 0, 0, 595, 842, undefined, 'FAST');

      // 2. Add Chart Pages
      for (const [chartId, originalDataUrl] of chartEntries) {
        const dataUrl = await compressImage(originalDataUrl);
        pdf.addPage();

        const titleText = t(`term_${chartId.replace(' ', '_')}`);
        const titleImg = drawChartTitleImage(titleText);

        // Get image properties to maintain aspect ratio
        const props = pdf.getImageProperties(dataUrl);
        const imgWidth = props.width;
        const imgHeight = props.height;

        // Calculate scaled dimensions (PDF is 595x842)
        const maxWidth = 595 - 40; // 20px padding left/right
        const maxHeight = 842 - 100; // Leave room for title at top (y=60) and some margin

        const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        const printWidth = imgWidth * ratio;
        const printHeight = imgHeight * ratio;

        // Center horizontally
        const startX = (595 - printWidth) / 2;
        // Start vertically below the title
        const startY = 80;

        pdf.addImage(dataUrl, 'JPEG', startX, startY, printWidth, printHeight, undefined, 'FAST');

        // Draw Title Overlay (transparent background)
        pdf.addImage(titleImg, 'PNG', 0, 0, 595, 842, undefined, 'FAST');
      }

      const namePart = sessionData.fullName ? `${sessionData.fullName}_` : '';
      const datePart = (sessionData.date || '').replace(/-/g, '');
      const pid = sessionData.patientId || 'EmptyPID';
      const surveySuffix = sessionData.survey ? `_${sessionData.survey.toLowerCase()}` : '';
      const filename = `PPS_${pid}_${namePart}${datePart}${surveySuffix}.pdf`;

      const pdfBlob = pdf.output('blob');

      if (action === 'DOWNLOAD') {
        const blob = new Blob([pdfBlob], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setHasDownloaded(true);
        setIsUploading(false);
      } else if (action === 'UPLOAD_ONLY') {
        if (sessionData.recordId) {
          await uploadToRedcap(pdfBlob);
        } else {
          setIsUploading(false);
          setUploadError(t('upload_error_not_bound'));
        }
      }

    } catch (err) {
      setIsUploading(false);
      setUploadError('處理 PDF 時發生錯誤: ' + err.message);
    }
  };

  const uploadToRedcap = async (pdfBlob) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', pdfBlob, `PPS_record_${sessionData.recordId}.pdf`);
      formData.append('record_id', sessionData.recordId);
      if (sessionData.survey) {
        formData.append('survey', sessionData.survey);
      }

      // 取用環境變數中的後端 API URL (如果未設定則視為本機開發)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`上傳失敗，錯誤碼：${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || t('upload_error_server'));
      }
      setUploadSuccess(true);

      // Delay navigation slightly so the patient sees the green success message
      setTimeout(() => {
        navigate('/success');
      }, 1500);

    } catch (err) {
      setUploadError(err.message);
      setIsUploading(false); // Only set to false on error so spinner/disabled lock persists during redirect delay
    }
  };

  const handleRestart = () => {
    if (!hasDownloaded) {
      setShowModal(true);
    } else {
      performRestart();
    }
  };

  const performRestart = () => {
    setSessionData({
      patientId: '',
      fullName: '',
      dob: '',
      date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }),
      selectedCharts: [],
      chartImages: {},
      marksData: {}
    });
    navigate('/');
  };

  const handleEditChart = (chartId, index) => {
    navigate('/detail', { state: { editChartIndex: index, directEdit: true } });
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-primary mb-2">
          {t('summary_title')}
          <span className="ms-2 badge bg-primary fs-6 fw-normal" style={{ verticalAlign: 'middle' }}>
            {t(`survey_${sessionData.survey || 'FU'}`)}
          </span>
        </h2>

        <div className="mx-auto mb-4 p-2 text-center text-secondary" style={{ maxWidth: '700px', fontSize: '14px' }}>
          <i className="bi bi-info-circle me-2"></i>
          {t('summary_instr')}
        </div>
      </div>

      <div className="row mb-5 justify-content-center g-4">
        {chartEntries.map(([chartId, dataUrl], index) => (
          <div className="col-lg-6" key={chartId}>
            <div className="card h-100 shadow-sm border-0 position-relative">
              <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                <span>{t(`term_${chartId.replace(' ', '_')}`)}</span>
                <Button
                  variant="light"
                  size="sm"
                  className="ms-2 px-3 fw-bold"
                  onClick={() => handleEditChart(chartId, index)}
                >
                  {t('edit')}
                </Button>
              </div>
              <div className="card-body text-center bg-light p-2">
                <img
                  src={dataUrl}
                  alt={chartId}
                  className="img-fluid rounded border"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessionData.recordId && isUploading && (
        <div className="text-center mb-4 text-secondary">
          <Spinner animation="border" size="sm" className="me-2" />
          {t('uploading')} (Record: {sessionData.recordId})...
        </div>
      )}
      {sessionData.recordId && uploadSuccess && (
        <Alert variant="success" className="text-center shadow-sm w-75 mx-auto mb-4">
          <i className="bi bi-check-circle-fill me-2"></i>
          {t('upload_success')}
        </Alert>
      )}
      {sessionData.recordId && uploadError && (
        <Alert variant="danger" className="text-center shadow-sm w-75 mx-auto mb-4">
          {t('upload_fail')}{uploadError}
        </Alert>
      )}

      {sessionData.recordId && !isUploading && !uploadSuccess && !uploadError && (
        <div className="text-center text-muted mb-3" style={{ fontSize: '0.9rem' }}>
          <i className="bi bi-check2-circle me-1 text-success"></i>
          {t('prep_upload')} (Record ID: <strong className="text-dark">{sessionData.recordId}</strong>)
        </div>
      )}

      <div className="d-flex justify-content-center gap-4">
        <Button variant="outline-primary" size="lg" onClick={() => handleProcessPdf('DOWNLOAD')} disabled={isUploading}>
          {t('download_pdf')}
        </Button>
        <Button variant="primary" size="lg" onClick={() => handleProcessPdf('UPLOAD_ONLY')} disabled={isUploading}>
          {t('confirm_and_upload')}
        </Button>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('restart_warning_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('restart_warning_msg')}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {t('cancel')}
          </Button>
          <Button variant="danger" onClick={performRestart}>
            {t('restart_confirm')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
