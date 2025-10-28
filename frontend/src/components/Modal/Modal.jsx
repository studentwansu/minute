// src/components/Modal/Modal.jsx
import { useEffect } from 'react';
import styles from './Modal.module.css'; // 사용자님이 지정하신 경로

function Modal({
  isOpen,
  onClose, // 모달을 닫는 함수 (필수)
  title,   // 모달 제목 (선택)
  message, // 모달 메시지 (문자열 또는 ReactNode)
  children, // message 대신 또는 추가로 복잡한 내용을 넣을 때 사용
  onConfirm, // 확인 버튼 클릭 시 실행될 함수
  confirmText = '확인', // 확인 버튼 텍스트
  cancelText, // 취소 버튼 텍스트 (이 값이 있으면 확인창, 없으면 알림창 스타일)
  onCancel,   // 취소 버튼 클릭 시 실행될 함수 (없으면 기본적으로 onClose 호출)
  type = 'default', // 모달 타입 ('error', 'success', 'warning', 'adminDefault', 'adminConfirm' 등 스타일링에 활용 가능)
  hideCloseButton = false, // X 닫기 버튼 숨김 여부
  confirmButtonType = 'primary', // 'primary', 'danger' 등 버튼 스타일 구분용
  cancelButtonType = 'secondary', // 'secondary'
}) {
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; // 스크롤 방지
      document.addEventListener('keydown', handleEscKey);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose(); // 확인 후 기본적으로 모달 닫힘
  };

  const handleInternalCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose(); // 취소 시 항상 모달 닫힘
  };

  return (
    <div
      className={`${styles.modalOverlay} ${styles[type] || ''}`} // 타입별 오버레이 스타일도 가능하도록
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={message || children ? 'modal-description' : undefined}
    >
      <div className={`${styles.modalContent} ${styles[`content-${type}`] || ''}`} onClick={handleContentClick}>
        {!hideCloseButton && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            &times;
          </button>
        )}

        {title && <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>}

        {(message || children) && (
          <div id="modal-description" className={styles.modalBody}>
            {typeof message === 'string' ? <p className={styles.modalMessage}>{message}</p> : message}
            {children}
          </div>
        )}

        <div className={styles.modalActions}>
          {cancelText && (
            <button
              type="button"
              className={`${styles.modalButton} ${styles[cancelButtonType] || styles.cancelButton}`}
              onClick={handleInternalCancel}
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
             <button
                type="button"
                className={`${styles.modalButton} ${styles[confirmButtonType] || styles.confirmButton}`}
                onClick={handleConfirm}
             >
               {confirmText}
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;