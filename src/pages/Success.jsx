import React from 'react';
import { Container, Card } from 'react-bootstrap';

export default function Success() {
  return (
    <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh', marginTop: '5vh' }}>
      <Card className="shadow-sm border-0 bg-white text-center p-5 w-100" style={{ maxWidth: '600px', borderRadius: '15px' }}>
        <Card.Body>
          <div className="mb-4">
            <img src="/surveyor.png" alt="完成" style={{ height: '120px', objectFit: 'contain' }} />
          </div>
          <h2 className="fw-bold text-success mb-3">問卷已完成</h2>
          <p className="text-secondary fs-5 mb-4">
            您的疼痛圖表已經成功上傳至專屬資料庫！<br />感謝您的填寫與配合。
          </p>
          <div className="p-3 bg-light rounded text-muted mt-4">
            <i className="bi bi-info-circle me-2"></i>
            本流程已全數結束，您現在可以安全地關閉此網頁視窗。
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
