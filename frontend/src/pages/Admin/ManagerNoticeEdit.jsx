import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../assets/styles/ManagerNoticeEdit.module.css';
import Modal from '../../components/Modal/Modal';

const API_BASE_URL = "/api/v1";

function ManagerNoticeEdit() {
    const { id: noticeId } = useParams(); 
    const navigate = useNavigate();

    const [isImportant, setIsImportant] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    const [originalPostData, setOriginalPostData] = useState(null); 
    const [isLoading, setIsLoading] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false); 


    const [isModalOpen, setIsModalOpen] = useState({ state: false, config: {} });

    const getToken = () => localStorage.getItem("token");

    const fetchNoticeDataForEdit = useCallback(async () => {
        setIsLoading(true);
        const token = getToken();
        if (!token) {
            setIsLoading(false);
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "인증 오류", 
                    message: "관리자 로그인이 필요합니다. 로그인 페이지로 이동합니다.", 
                    confirmText: "확인",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate("/login"); }, 
                    type: 'error' 
                } 
            });
            return;
        }

        if (!noticeId || noticeId.trim() === "" || isNaN(Number(noticeId))) {
            setIsLoading(false);
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "오류", 
                    message: "수정할 공지사항 ID가 유효하지 않습니다. 목록으로 돌아갑니다.", 
                    confirmText: "확인",
                    type: 'error', 
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate('/admin/managerNotice'); } 
                } 
            });
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/notices/${noticeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = response.data;
            
            const dateObj = new Date(data.noticeCreatedAt);
            const formattedDate = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

            setTitle(data.noticeTitle);
            setContent(data.noticeContent);
            setIsImportant(data.noticeIsImportant);
            setOriginalPostData({ 
                title: data.noticeTitle,
                content: data.noticeContent,
                isImportant: data.noticeIsImportant,
                author: data.authorNickname, 
                views: data.noticeViewCount,
                createdAt: formattedDate,
                rawCreatedAt: data.noticeCreatedAt 
            });
        } catch (error) {
            console.error("Error fetching notice for edit:", error);
            const errorMsg = error.response?.data?.message || "공지사항 정보를 불러오는 데 실패했습니다.";
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "데이터 로딩 실패", 
                    message: errorMsg + " 목록으로 돌아갑니다.", 
                    confirmText: "확인",
                    type: 'error', 
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate('/admin/managerNotice'); } 
                } 
            });
            setOriginalPostData(null); 
        } finally {
            setIsLoading(false);
        }
    }, [noticeId, navigate]);

    useEffect(() => {
        fetchNoticeDataForEdit();
    }, [fetchNoticeDataForEdit]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!title.trim()) {
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "입력 오류", 
                    message: "제목을 입력해주세요.", 
                    confirmText: "확인", 
                    type: "warning", 
                    onConfirm: () => setIsModalOpen({ state: false, config: {} }) 
                } 
            });
            return;
        }
        if (!content.trim()) {
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "입력 오류", 
                    message: "내용을 입력해주세요.", 
                    confirmText: "확인", 
                    type: "warning", 
                    onConfirm: () => setIsModalOpen({ state: false, config: {} }) 
                } 
            });
            return;
        }

        const token = getToken();
        if (!token) {
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "인증 오류", 
                    message: "관리자 로그인이 필요합니다.", 
                    confirmText: "로그인으로 이동",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate("/login"); }, 
                    type: 'error' 
                } 
            });
            return;
        }

        if (originalPostData && title === originalPostData.title && content === originalPostData.content && isImportant === originalPostData.isImportant) {
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: '변경 없음', 
                    message: '수정된 내용이 없습니다.', 
                    confirmText: "확인",
                    type: 'info', 
                    onConfirm: () => setIsModalOpen({ state: false, config: {} }) 
                } 
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`${API_BASE_URL}/notices/${noticeId}`, 
                { noticeTitle: title, noticeContent: content, noticeIsImportant: isImportant },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsModalOpen({
                state: true,
                config: {
                    title: "수정 완료", 
                    message: "공지사항이 성공적으로 수정되었습니다.", 
                    confirmText: "상세보기로 이동",
                    type: "success", 
                    onConfirm: () => { 
                        setIsModalOpen({ state: false, config: {} }); 
                        navigate(`/admin/managerNoticeDetail/${noticeId}`); 
                    }
                }
            });
            setOriginalPostData(prev => ({
                ...prev, 
                title: title,
                content: content,
                isImportant: isImportant
            }));
        } catch (error) {
            console.error('Error updating notice:', error);
            const errorMsg = error.response?.data?.message || '공지사항 수정 중 오류가 발생했습니다.';
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: '수정 실패', 
                    message: errorMsg, 
                    confirmText: "확인",
                    type: 'error', 
                    onConfirm: () => setIsModalOpen({ state: false, config: {} }) 
                } 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        const hasChanges = originalPostData && (title !== originalPostData.title ||
                                              content !== originalPostData.content ||
                                              isImportant !== originalPostData.isImportant);

        const navigateBack = () => {
            if (noticeId) {
                navigate(`/admin/managerNoticeDetail/${noticeId}`);
            } else {
                navigate('/admin/managerNotice'); 
            }
        };

        if (hasChanges) {
            setIsModalOpen({
                state: true,
                config: {
                    title: "수정 취소",
                    message: "변경사항이 저장되지 않았습니다.\n정말로 수정을 취소하시겠습니까?",
                    confirmText: "예, 취소합니다",
                    cancelText: "계속 수정",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigateBack(); },
                    onCancel: () => setIsModalOpen({ state: false, config: {} }),
                    type: "warning",
                    confirmButtonType: 'danger',
                    cancelButtonType: 'secondary'
                }
            });
        } else {
            navigateBack();
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <main className={styles.editContentCard}><p>데이터를 불러오는 중...</p></main>
            </div>
        );
    }
    
    if (!originalPostData && !isLoading) {
        return (
            <div className={styles.container}>
                <main className={styles.editContentCard}>
                    <div className={styles.pageHeader}><h1 className={styles.pageTitleText}>공지사항 수정</h1></div>
                    <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
                        공지사항(ID: {noticeId}) 정보를 찾을 수 없거나 불러오는 데 실패했습니다.
                    </p>
                    <div className={styles.actionsBar} style={{justifyContent: 'center'}}>
                        <button type="button" className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => navigate('/admin/managerNotice')}>목록으로</button>
                    </div>
                </main>
            </div>
        );
    }
    
    return (
        <>
            <div className={styles.container}>
                <main className={styles.editContentCard}>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitleText}>공지사항 수정</h1>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.editForm}>
                        <div className={styles.metadataSection}>
                            <div className={styles.leftMeta}>
                                <label className={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        checked={isImportant}
                                        onChange={(e) => setIsImportant(e.target.checked)}
                                        className={styles.checkboxInput}
                                        disabled={isSubmitting}
                                    />
                                    <span className={styles.checkboxLabel}>중요 공지</span>
                                </label>
                            </div>
                            <div className={styles.rightMeta}>
                                <span>작성자: {originalPostData?.author || 'N/A'}</span>
                                <span>조회수: {originalPostData?.views || 0}</span>
                                <span>작성일: {originalPostData?.createdAt || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div className={styles.titleInputSection}>
                             <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={styles.titleInput}
                                placeholder="제목을 입력하세요"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className={styles.contentSection}>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={styles.contentTextarea}
                                placeholder="내용을 입력하세요"
                                rows={15}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className={styles.actionsBar}>
                            <button 
                                type="button" 
                                className={`${styles.actionButton} ${styles.cancelButton}`} 
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                취소
                            </button>
                            <button 
                                type="submit" 
                                className={`${styles.actionButton} ${styles.submitButton}`}
                                disabled={isSubmitting || !title.trim() || !content.trim()} 
                            >
                                {isSubmitting ? "수정 중..." : "수정 완료"}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
            <Modal
                isOpen={isModalOpen.state}
                onClose={() => setIsModalOpen({ state: false, config: {} })}
                {...isModalOpen.config}
            />
        </>
    );
}

export default ManagerNoticeEdit;