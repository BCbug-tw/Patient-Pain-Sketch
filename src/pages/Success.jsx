import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Success() {
  const { t } = useTranslation();
  return (
    <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh', marginTop: '5vh' }}>
      <Card className="shadow-sm border-0 bg-white text-center p-5 w-100" style={{ maxWidth: '600px', borderRadius: '15px' }}>
        <Card.Body>
          <div className="mb-4">
            <img src="./surveyor.png" alt="完成" style={{ height: '120px', objectFit: 'contain' }} />
          </div>
          <h2 className="fw-bold text-success mb-3">{t('success_title')}</h2>
          <p className="text-secondary fs-5 mb-4">
            {t('success_message_line1')}<br />{t('success_message_line2')}
          </p>
          <div className="p-3 bg-light rounded text-muted mt-4">
            <i className="bi bi-info-circle me-2"></i>
            {t('success_close_info')}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
