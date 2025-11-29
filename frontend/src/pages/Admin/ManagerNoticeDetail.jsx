import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../../assets/styles/ManagerNoticeDetail.module.css';
import Modal from '../../components/Modal/Modal';

const API_BASE_URL = "/api/v1";

function ManagerNoticeDetail() {
    const { id: noticeId } = useParams(); 
    const navigate = useNavigate();
    
    const [notice, setNotice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false); 
    const [isModalOpen, setIsModalOpen] = useState({ state: false, config: {} });

    const getToken = () => localStorage.getItem("token");

    const fetchNoticeByIdFromAPI = useCallback(async (idToFetch) => {
        setIsLoading(true);
        setNotice(null); 

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

        if (!idToFetch || idToFetch.trim() === "" || isNaN(Number(idToFetch))) {
            setIsLoading(false);
            setIsModalOpen({
                state: true,
                config: {
                    title: "오류",
                    message: "유효한 공지사항 ID가 제공되지 않았습니다. 목록으로 돌아갑니다.",
                    confirmText: "확인",
                    type: "error",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate('/admin/managerNotice'); }
                }
            });
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/notices/${idToFetch}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = response.data;
            const dateObj = new Date(data.noticeCreatedAt);
            const formattedDate = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

            setNotice({
                id: data.noticeId,
                isImportant: data.noticeIsImportant,
                title: data.noticeTitle,
                author: data.authorNickname, 
                views: data.noticeViewCount,
                createdAt: formattedDate,
                content: data.noticeContent,
                rawCreatedAt: data.noticeCreatedAt 
            });

        } catch (err) {
            console.error("Failed to fetch notice for admin:", err);
            const errorMsg = err.response?.data?.message || "공지사항을 불러오는 데 실패했습니다.";
            setIsModalOpen({
                state: true,
                config: {
                    title: "데이터 로드 실패",
                    message: errorMsg + " 목록으로 돌아갑니다.",
                    confirmText: "확인",
                    type: "error",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate('/admin/managerNotice'); }
                }
            });
            setNotice(null); 
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (noticeId) {
            fetchNoticeByIdFromAPI(noticeId);
        } else {
            setIsLoading(false);
            setIsModalOpen({
                state: true,
                config: {
                    title: "잘못된 접근",
                    message: "공지사항 ID가 없습니다. 목록으로 돌아갑니다.",
                    confirmText: "확인",
                    type: "error",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate('/admin/managerNotice'); }
                }
            });
        }
    }, [noticeId, fetchNoticeByIdFromAPI]);

    const handleEdit = () => {
        if (!notice || !notice.id) {
            setIsModalOpen({
                state: true,
                config: {
                    title: "오류",
                    message: "수정할 공지사항 정보가 유효하지 않습니다.",
                    confirmText: "확인",
                    type: "error",
                    onConfirm: () => setIsModalOpen({ state: false, config: {} })
                }
            });
            return;
        }
        navigate(`/admin/managerNoticeEdit/${notice.id}`, { state: { noticeData: notice } });
    };

    const processDeleteNotice = async () => {
        if (!notice || !notice.id) return;
        
        const token = getToken();
        if (!token) {
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "인증 오류", 
                    message: "관리자 로그인이 필요합니다.", 
                    confirmText: "확인",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate("/login"); }, 
                    type: 'error' 
                } 
            });
            return;
        }
        
        setIsActionLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/notices/${notice.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setIsModalOpen({
                state: true,
                config: {
                    title: "삭제 완료",
                    message: `공지사항 "${notice.title}" (ID: ${notice.id})이(가) 성공적으로 삭제되었습니다.`,
                    confirmText: "목록으로 이동",
                    type: "success",
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); navigate('/admin/managerNotice'); }
                }
            });
        } catch (error) {
            console.error("Error deleting notice:", error);
            const errorMsg = error.response?.data?.message || "공지사항 삭제에 실패했습니다.";
            setIsModalOpen({ 
                state: true, 
                config: { 
                    title: "삭제 실패", 
                    message: errorMsg, 
                    confirmText: "확인",
                    type: "error", 
                    onConfirm: () => { setIsModalOpen({ state: false, config: {} }); }
                } 
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = () => {
        if (!notice || !notice.id) {
            setIsModalOpen({
                state: true,
                config: {
                    title: "오류",
                    message: "삭제할 공지사항 정보가 유효하지 않습니다.",
                    confirmText: "확인",
                    type: "error",
                    onConfirm: () => setIsModalOpen({ state: false, config: {} })
                }
            });
            return;
        }
        setIsModalOpen({
            state: true,
            config: {
                title: "공지사항 삭제 확인",
                message: `공지사항 "${notice.title}" (ID: ${notice.id})을(를) 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
                onConfirm: () => { 
                    setIsModalOpen({ state: false, config: {} }); 
                    processDeleteNotice(); 
                },
                confirmText: "삭제",
                cancelText: "취소",
                type: "warning",
                confirmButtonType: 'danger', 
                onCancel: () => setIsModalOpen({ state: false, config: {} }) 
            }
        });
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <main className={styles.managerContent}><p>공지사항을 불러오는 중입니다...</p></main>
            </div>
        );
    }

    if (!notice && !isLoading) {
        return (
            <div className={styles.container}>
                <main className={styles.managerContent}>
                    <div className={styles.pageHeader}>
                        <Link to="/admin/managerNotice" className={styles.toListLink}><h1>공지사항 관리</h1></Link>
                    </div>
                    <p>공지사항 정보를 불러오는 데 문제가 발생했습니다. 문제가 지속되면 관리자에게 문의하세요. (ID: {noticeId || 'N/A'})</p>
                    <Link to="/admin/managerNotice" className={styles.toListButton}>목록으로 돌아가기</Link>
                </main>
            </div>
        );
    }
    

    if (!notice) return null; 

    return (
        <>
            <div className={styles.container}>
                <main className={styles.managerContent}>
                    <div className={styles.pageHeader}>
                        <Link to="/admin/managerNotice" className={styles.toListLink}>
                            <h1>공지사항 관리</h1>
                        </Link>
                    </div>

                    <div className={styles.noticeDetailCard}>
                        <div className={styles.infoBar}>
                            <div className={styles.infoLeft}>
                                {notice.isImportant && (
                                    <span className={styles.importantTag}>중요</span>
                                )}
                                <h2 className={styles.noticeTitleText}>{notice.title}</h2>
                            </div>
                            <div className={styles.infoRight}>
                                <span className={styles.author}>작성자: {notice.author}</span>
                                <span className={styles.createdAt}>작성일: {notice.createdAt}</span>
                                {notice.views !== undefined && <span className={styles.views}>조회수: {notice.views}</span>}
                            </div>
                        </div>

                        <div className={styles.contentBody}>
                            {typeof notice.content === 'string' ? notice.content.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    {index < notice.content.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            )) : notice.content}
                        </div>
                    </div>

                    <div className={styles.actionsContainer}>
                        <div> 
                            <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`} disabled={isActionLoading}>수정</button>
                            <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`} disabled={isActionLoading}>삭제</button>
                        </div>
                    </div>
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

export default ManagerNoticeDetail;