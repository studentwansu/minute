// src/pages/Admin/Qna/ManagerQnaDetail.jsx
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import reportOffIcon from '../../assets/images/able-alarm.png';
import reportOnIcon from '../../assets/images/disable-alarm.png';
import styles from '../../assets/styles/ManagerQnaDetail.module.css';
import Modal from '../../components/Modal/Modal';

function ManagerQnaDetail() {
    const { qnaId } = useParams(); // App.jsx에서 :qnaId로 설정되어 있어야 함
    const navigate = useNavigate();

    console.log("[ManagerQnaDetail] Component mounted. qnaId from useParams:", qnaId);

    const [qnaPost, setQnaPost] = useState(null);
    const [adminReplyContent, setAdminReplyContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isEditingAdminAnswer, setIsEditingAdminAnswer] = useState(false);
    const [editedAdminAnswerContent, setEditedAdminAnswerContent] = useState('');
    const adminAnswerEditInputRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    const fetchQnaDetailForAdmin = useCallback(async (idToFetch) => { // 파라미터로 idToFetch 받도록 수정
        console.log("[ManagerQnaDetail] fetchQnaDetailForAdmin called with idToFetch:", idToFetch);
        setIsLoading(true);
        setQnaPost(null); // API 호출 전 이전 데이터 초기화 (선택적)

        const token = localStorage.getItem('token');
        if (!token) {
            console.error("[ManagerQnaDetail] No token found.");
            setIsLoading(false);
            setModalProps({
                title: "인증 오류", message: "관리자 로그인이 필요합니다.",
                confirmText: "확인", type: "adminError", confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); navigate('/login'); }
            });
            setIsModalOpen(true);
            return;
        }

        try {
            console.log(`[ManagerQnaDetail] Attempting to fetch: /api/v1/admin/qna/${idToFetch}`);
            const response = await axios.get(`/api/v1/admin/qna/${idToFetch}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("[ManagerQnaDetail] API response data:", response.data);
            setQnaPost(response.data);
            if (response.data && response.data.reply) {
                setEditedAdminAnswerContent(response.data.reply.replyContent);
            } else {
                setEditedAdminAnswerContent('');
            }
        } catch (error) {
            console.error("[ManagerQnaDetail] Error fetching QnA detail for admin:", error.response || error.message || error);
            let errorMessage = "문의 상세 정보를 불러오는 중 오류가 발생했습니다.";
            if (error.response) {
                if (error.response.status === 401) errorMessage = "인증에 실패했거나 세션이 만료되었습니다. 다시 로그인해주세요.";
                else if (error.response.status === 403) errorMessage = "해당 정보에 접근할 권한이 없습니다.";
                else if (error.response.status === 404) errorMessage = `ID [${idToFetch}]에 해당하는 문의를 찾을 수 없습니다.`;
                else if (error.response.data && error.response.data.message) errorMessage = error.response.data.message;
            }
            setModalProps({
                title: "데이터 로드 오류", message: errorMessage, confirmText: "목록으로 돌아가기",
                type: "adminError", confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); navigate('/admin/managerQna'); }
            });
            setIsModalOpen(true);
            setQnaPost(null); // 오류 시 qnaPost 확실히 null 처리
        } finally {
            console.log("[ManagerQnaDetail] fetchQnaDetailForAdmin finished. Setting isLoading to false.");
            setIsLoading(false);
        }
    }, [navigate]); // qnaId를 의존성 배열에서 제거하고, 호출 시 명시적으로 받도록 함

    useEffect(() => {
        console.log("[ManagerQnaDetail] useEffect [qnaId] triggered. Current qnaId:", qnaId);
        if (qnaId && qnaId !== "undefined" && qnaId !== "null") {
            fetchQnaDetailForAdmin(qnaId); // 인자로 qnaId 전달
        } else {
            console.error("[ManagerQnaDetail] useEffect - qnaId is missing or invalid:", qnaId);
            setIsLoading(false);
            setModalProps({ 
                title: "오류", 
                message: "잘못된 접근입니다. 문의 ID가 제공되지 않았습니다. 목록으로 돌아갑니다.", 
                confirmText: "확인", 
                type: "adminError", 
                confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); navigate('/admin/managerQna'); }
            });
            setIsModalOpen(true);
        }
    }, [qnaId, fetchQnaDetailForAdmin, navigate]); // fetchQnaDetailForAdmin은 useCallback으로 감싸져 있으므로 의존성 추가

    useEffect(() => {
        if (isEditingAdminAnswer && adminAnswerEditInputRef.current) {
            console.log("[ManagerQnaDetail] Focusing on admin answer edit input.");
            adminAnswerEditInputRef.current.focus();
            const len = adminAnswerEditInputRef.current.value.length;
            adminAnswerEditInputRef.current.selectionStart = len;
            adminAnswerEditInputRef.current.selectionEnd = len;
        }
    }, [isEditingAdminAnswer]);

    const handleReplyContentChange = (e) => setAdminReplyContent(e.target.value);

    const handleSubmitReply = async () => {
        console.log("[ManagerQnaDetail] handleSubmitReply called.");
        if (!adminReplyContent.trim()) {
            setModalProps({ title: '입력 오류', message: '답변 내용을 입력해주세요.', confirmText: '확인', type: 'adminWarning', confirmButtonType: 'primary', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true); return;
        }
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            await axios.post(`/api/v1/admin/qna/${qnaId}/replies`, 
                { replyContent: adminReplyContent },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setModalProps({
                title: '답변 등록 완료', message: '답변이 성공적으로 등록되었습니다.', confirmText: '확인',
                type: 'adminSuccess', confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); fetchQnaDetailForAdmin(qnaId); setAdminReplyContent(''); }
            });
            setIsModalOpen(true);
        } catch (error) {
            console.error("[ManagerQnaDetail] Error submitting reply:", error.response || error);
            let errMsg = "답변 등록 중 오류가 발생했습니다.";
            if (error.response && error.response.data && error.response.data.message) errMsg = error.response.data.message;
            else if (error.response && error.response.status === 409) errMsg = "이미 답변이 등록된 문의입니다.";
            setModalProps({ title: "등록 실패", message: errMsg, confirmText: "확인", type: "adminError", onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminAnswerDoubleClick = () => {
        if (qnaPost && qnaPost.reply && !isSubmitting) { // 제출 중 아닐 때만
            console.log("[ManagerQnaDetail] Double-clicked to edit admin answer.");
            setEditedAdminAnswerContent(qnaPost.reply.replyContent);
            setIsEditingAdminAnswer(true);
        }
    };

    const handleEditedAdminAnswerChange = (e) => setEditedAdminAnswerContent(e.target.value);

    const handleSaveAdminAnswerEdit = async () => {
        console.log("[ManagerQnaDetail] handleSaveAdminAnswerEdit called.");
        if (!editedAdminAnswerContent.trim()) {
            setModalProps({ title: '입력 오류', message: '답변 내용은 비워둘 수 없습니다.', confirmText: '확인', type: 'adminWarning', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true); return;
        }
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        const replyId = qnaPost?.reply?.replyId;
        if (!replyId) { 
            console.error("[ManagerQnaDetail] No replyId found for saving edit.");
            setModalProps({ title: "오류", message: "답변 ID를 찾을 수 없어 수정할 수 없습니다.", confirmText: "확인", type: "adminError", onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
            setIsSubmitting(false); 
            return; 
        }
        try {
            await axios.put(`/api/v1/admin/qna/replies/${replyId}`, 
                { replyContent: editedAdminAnswerContent },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setModalProps({
                title: '답변 수정 완료', message: '답변이 성공적으로 수정되었습니다.', confirmText: '확인',
                type: 'adminSuccess', confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); fetchQnaDetailForAdmin(qnaId); setIsEditingAdminAnswer(false); }
            });
            setIsModalOpen(true);
        } catch (error) {
            console.error("[ManagerQnaDetail] Error updating reply:", error.response || error);
            let errMsg = "답변 수정 중 오류가 발생했습니다.";
            if (error.response && error.response.data && error.response.data.message) errMsg = error.response.data.message;
            setModalProps({ title: "수정 실패", message: errMsg, confirmText: "확인", type: "adminError", onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCancelAdminAnswerEdit = () => {
        console.log("[ManagerQnaDetail] Canceled admin answer edit.");
        if (qnaPost && qnaPost.reply) setEditedAdminAnswerContent(qnaPost.reply.replyContent);
        setIsEditingAdminAnswer(false);
    };

    const confirmDeleteAdminAnswer = () => {
        console.log("[ManagerQnaDetail] confirmDeleteAdminAnswer called.");
        const replyId = qnaPost?.reply?.replyId;
        if (!replyId) {
            console.error("[ManagerQnaDetail] No replyId found for deletion.");
             setModalProps({ title: "오류", message: "삭제할 답변 정보가 없습니다.", confirmText: "확인", type: "adminError", onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
            return;
        }
        setModalProps({
            title: '답변 삭제 확인', message: '정말로 이 답변을 삭제하시겠습니까?',
            onConfirm: async () => {
                setIsModalOpen(false);
                setIsSubmitting(true);
                const token = localStorage.getItem('token');
                try {
                    await axios.delete(`/api/v1/admin/qna/replies/${replyId}`, 
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    setModalProps({
                        title: '답변 삭제 완료', message: '답변이 성공적으로 삭제되었습니다.', confirmText: '확인',
                        type: 'adminSuccess', confirmButtonType: 'primary',
                        onConfirm: () => { setIsModalOpen(false); fetchQnaDetailForAdmin(qnaId); setEditedAdminAnswerContent(''); setIsEditingAdminAnswer(false); }
                    });
                    setIsModalOpen(true);
                } catch (error) {
                    console.error("[ManagerQnaDetail] Error deleting reply:", error.response || error);
                    let errMsg = "답변 삭제 중 오류가 발생했습니다.";
                    if (error.response && error.response.data && error.response.data.message) errMsg = error.response.data.message;
                     setModalProps({ title: "삭제 실패", message: errMsg, confirmText: "확인", type: "adminError", onConfirm: () => setIsModalOpen(false) });
                    setIsModalOpen(true);
                } finally {
                    setIsSubmitting(false);
                }
            },
            confirmText: '삭제', cancelText: '취소',
            type: 'adminConfirm', confirmButtonType: 'danger',
            onCancel: () => setIsModalOpen(false)
        });
        setIsModalOpen(true);
    };

    const confirmCreateAdminReport = () => {
        console.log("[ManagerQnaDetail] confirmCreateAdminReport called.");
        if (!qnaPost) {
            console.error("[ManagerQnaDetail] qnaPost is null, cannot report.");
            return;
        }
        if (qnaPost.reportedByCurrentUserAdmin) {
            setModalProps({ title: '알림', message: '이미 관리자님께서 신고 처리한 문의입니다.', confirmText: '확인', type: 'adminInfo', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
            return;
        }
        setModalProps({
            title: '문의 신고 확인', message: `문의 ID ${qnaPost.inquiryId}를 신고 처리하시겠습니까?`,
            onConfirm: async () => {
                setIsModalOpen(false);
                setIsSubmitting(true);
                const token = localStorage.getItem('token');
                try {
                    await axios.post(`/api/v1/admin/qna/${qnaPost.inquiryId}/reports`, {}, 
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    setModalProps({
                        title: '신고 접수 완료', message: `문의 ID ${qnaPost.inquiryId} 신고가 접수되었습니다.`, confirmText: '확인',
                        type: 'adminSuccess', confirmButtonType: 'primary',
                        onConfirm: () => { setIsModalOpen(false); fetchQnaDetailForAdmin(qnaId); }
                    });
                    setIsModalOpen(true);
                } catch (error) {
                    console.error("[ManagerQnaDetail] Error creating admin report:", error.response || error);
                    let errMsg = "문의 신고 중 오류가 발생했습니다.";
                    if (error.response && error.response.status === 409) errMsg = error.response.data.message || "이미 신고된 문의입니다.";
                    else if (error.response && error.response.data && error.response.data.message) errMsg = error.response.data.message;
                    setModalProps({ title: "신고 실패", message: errMsg, confirmText: "확인", type: "adminError", onConfirm: () => setIsModalOpen(false) });
                    setIsModalOpen(true);
                } finally {
                    setIsSubmitting(false);
                }
            },
            confirmText: '신고 실행', cancelText: '취소',
            type: 'adminConfirm', confirmButtonType: 'danger',
            onCancel: () => setIsModalOpen(false)
        });
        setIsModalOpen(true);
    };
    
    const handleAdminAnswerEditKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); handleSaveAdminAnswerEdit();
        } else if (event.key === 'Escape') {
            event.preventDefault(); handleCancelAdminAnswerEdit();
        }
    };

    const getStatusText = (status) => (status === 'ANSWERED' ? '답변완료' : (status === 'PENDING' ? '미답변' : status));
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

    // --- 렌더링 로직 ---
    if (isLoading) {
        console.log("[ManagerQnaDetail] Rendering: Loading state");
        return <div className={styles.container}><main className={styles.detailContentCard}><div className={styles.loadingContainer}>데이터를 불러오는 중입니다...</div></main></div>;
    }
    
    // qnaPost가 null이고, 모달도 닫혀있고, 로딩도 끝난 상태 -> 데이터 없음 또는 로드 실패
    if (!qnaPost && !isModalOpen && !isLoading) {
        console.log("[ManagerQnaDetail] Rendering: Error or No Data state (qnaPost is null, no modal, not loading)");
        return (
            <div className={styles.container}>
                <main className={styles.detailContentCard}>
                    <div className={styles.pageHeader}>
                        <Link to="/admin/managerQna" className={styles.toListLink}>
                            <h1>문의 관리</h1>
                        </Link>
                    </div>
                    <div className={styles.errorContainer}>
                        문의글 정보를 불러올 수 없거나, 유효한 문의 ID가 아닙니다.
                        <br />
                        <Link to="/admin/managerQna">목록으로 돌아가기</Link>
                    </div>
                </main>
            </div>
        );
    }

    // qnaPost가 null이지만 모달이 열려있는 경우, 모달이 화면을 가리므로 null 반환하여 현재 화면 유지
    if (!qnaPost && isModalOpen) {
        console.log("[ManagerQnaDetail] Rendering: null (qnaPost is null, but modal is open)");
        // Modal 컴포넌트가 루트 레벨에서 렌더링되므로, 여기서는 null을 반환하여
        // 현재 컴포넌트의 렌더링을 중단하고 모달만 보이도록 함.
        // 또는 <Modal ... /> 만 반환할 수도 있음. (Modal 구현에 따라 다름)
        return (
             <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    // 모달 닫기 로직 (필요시 onConfirm/onCancel에서 이미 처리)
                    if (!modalProps.onConfirm && !modalProps.onCancel) setIsModalOpen(false);
                    else if (modalProps.onConfirm && !modalProps.cancelText) setIsModalOpen(false);
                    else setIsModalOpen(false);
                }}
                {...modalProps}
            />
        );
    }
    
    // qnaPost가 정상적으로 로드된 경우
    if (qnaPost) {
      console.log("[ManagerQnaDetail] Rendering: Main content with qnaPost:", qnaPost);
    } else {
      // 이 경우는 거의 발생하지 않아야 함 (위의 조건들에서 걸러짐)
      console.error("[ManagerQnaDetail] Rendering: Fallback - qnaPost is unexpectedly null here.");
      return <div>오류: 문의 데이터를 표시할 수 없습니다.</div>;
    }


    return (
        <>
            <div className={styles.container}>
                <main className={styles.detailContentCard}>
                    <div className={styles.pageHeader}>
                        <Link to="/admin/managerQna" className={styles.toListLink}>
                            <h1>문의 관리</h1>
                        </Link>
                    </div>

                    <div className={styles.userQuestionArea}>
                        <div className={styles.infoBar}>
                            <div className={styles.infoBarLeft}>
                                <span className={`${styles.statusTag} ${qnaPost.inquiryStatus === 'ANSWERED' ? styles.answered : styles.unanswered}`}>
                                    {getStatusText(qnaPost.inquiryStatus)}
                                </span>
                                <h2 className={styles.postTitle}>{qnaPost.inquiryTitle}</h2>
                            </div>
                            <button
                                onClick={confirmCreateAdminReport}
                                className={`${styles.iconButton} ${styles.qnaReportButton} ${qnaPost.reportedByCurrentUserAdmin || qnaPost.reportCount > 0 ? styles.reportedActive : ''}`}
                                title={
                                    qnaPost.reportedByCurrentUserAdmin ? "관리자님께서 이미 신고한 문의입니다." :
                                    (qnaPost.reportCount > 0 ? `다른 신고 ${qnaPost.reportCount}건 접수됨 (클릭하여 추가 신고)` : "문의글 신고하기")
                                }
                                disabled={qnaPost.reportedByCurrentUserAdmin || isSubmitting}
                            >
                                <img
                                    src={(qnaPost.reportedByCurrentUserAdmin || qnaPost.reportCount > 0) ? reportOnIcon : reportOffIcon}
                                    alt="신고 상태"
                                    className={styles.buttonIcon}
                                />
                            </button>
                        </div>
                        <div className={styles.metaInfo}>
                            <span className={styles.author}>작성자: {qnaPost.authorNickname} (ID: {qnaPost.authorUserId})</span>
                            <span className={styles.createdAt}>작성일: {formatDate(qnaPost.inquiryCreatedAt)}</span>
                        </div>

                        <div className={styles.contentBody}>
                            {(qnaPost.inquiryContent || "").split('\n').map((line, index) => (
                                <React.Fragment key={`q-line-${index}`}>{line}{index < (qnaPost.inquiryContent || "").split('\n').length -1 &&<br />}</React.Fragment>
                            ))}
                        </div>

                        {qnaPost.attachments && qnaPost.attachments.length > 0 && (
                            <div className={styles.imageAttachmentSection}>
                                <p className={styles.attachmentTitle}>첨부파일:</p>
                                <div className={styles.imageList}>
                                    {qnaPost.attachments.map((att, index) => (
                                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" key={`att-${att.imgId || index}`}>
                                            <img src={att.fileUrl} alt={att.originalFilename || `첨부이미지 ${index + 1}`} className={styles.attachedImage} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.adminResponseArea}>
                        {qnaPost.reply && !isEditingAdminAnswer ? (
                            <div className={styles.answerDisplaySection}>
                                <div className={styles.answerHeader}>
                                    <h4 className={styles.responseTitle}>등록된 답변</h4>
                                    <button onClick={confirmDeleteAdminAnswer} className={`${styles.button} ${styles.deleteAnswerButton}`} disabled={isSubmitting}>삭제</button>
                                </div>
                                <div className={styles.adminAnswerItem} onDoubleClick={!isSubmitting ? handleAdminAnswerDoubleClick : undefined} title="더블클릭하여 수정">
                                    <div className={styles.adminAnswerMeta}>
                                        <span className={styles.adminAnswerAuthor}>{qnaPost.reply.replierNickname}</span>
                                        <span className={styles.adminAnswerDate}>{formatDate(qnaPost.reply.replyCreatedAt)}</span>
                                    </div>
                                    <div className={styles.adminAnswerContent}>
                                        {(qnaPost.reply.replyContent || "").split('\n').map((line, index) => (
                                            <React.Fragment key={`ans-line-${index}`}>{line}{index < (qnaPost.reply.replyContent || "").split('\n').length -1 && <br />}</React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : isEditingAdminAnswer ? (
                            <div className={styles.answerEditSection}>
                                <h4 className={styles.responseTitle}>답변 수정</h4>
                                <textarea
                                    ref={adminAnswerEditInputRef}
                                    className={styles.answerTextarea}
                                    value={editedAdminAnswerContent}
                                    onChange={handleEditedAdminAnswerChange}
                                    onKeyDown={handleAdminAnswerEditKeyDown}
                                    rows="8"
                                    disabled={isSubmitting}
                                ></textarea>
                                <div className={`${styles.buttonGroup} ${styles.editButtonGroup}`}>
                                    <button type="button" onClick={handleCancelAdminAnswerEdit} className={`${styles.button} ${styles.cancelButton}`} disabled={isSubmitting}>
                                        취소
                                    </button>
                                    <button type="button" onClick={handleSaveAdminAnswerEdit} className={`${styles.button} ${styles.submitButton}`} disabled={isSubmitting}>
                                        {isSubmitting ? "수정 중..." : "수정 완료"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.answerInputSection}>
                                <h4 className={styles.responseTitle}>답변 작성</h4>
                                <textarea
                                    className={styles.answerTextarea}
                                    value={adminReplyContent}
                                    onChange={handleReplyContentChange}
                                    placeholder="답변을 입력하세요..."
                                    rows="10"
                                    disabled={isSubmitting}
                                ></textarea>
                                <div className={styles.buttonGroup}>
                                    <button type="button" onClick={handleSubmitReply} className={`${styles.button} ${styles.submitButton}`} disabled={isSubmitting}>
                                        {isSubmitting ? "등록 중..." : "답변 등록"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    if (modalProps.onConfirm && !modalProps.cancelText) setIsModalOpen(false);
                    else if (modalProps.onConfirm && modalProps.onCancel) setIsModalOpen(false);
                    else setIsModalOpen(false);
                }}
                {...modalProps}
            />
        </>
    );
}

export default ManagerQnaDetail;