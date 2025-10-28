// src/pages/QnA/qnaDetail.jsx
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import qnaDetailStyle from '../../assets/styles/qnaDetail.module.css';
import Modal from '../../components/Modal/Modal';
import MypageNav from '../../components/MypageNavBar/MypageNav';

const API_BASE_URL = "/api/v1"; // 프록시 설정을 활용하기 위해 상대 경로로 변경

function QnaDetail() {
    const { id: qnaId } = useParams();
    const navigate = useNavigate();
    
    const [qnaData, setQnaData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    const fetchQnaDetail = useCallback(async () => {
        console.log("[QnaDetail fetchQnaDetail] Called with qnaId:", qnaId);
        setIsLoading(true);
        setQnaData(null); 
        const token = localStorage.getItem('token');

        if (!token) {
            setIsLoading(false);
            setModalProps({
                title: "인증 오류", message: "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => { setIsModalOpen(false); navigate('/login'); }
            });
            setIsModalOpen(true);
            return;
        }

        if (!qnaId || qnaId === "undefined" || qnaId === "null") {
            console.log("[QnaDetail fetchQnaDetail] qnaId is invalid:", qnaId);
            setIsLoading(false);
            setModalProps({
                title: "오류", message: "유효한 문의 ID가 아닙니다. 문의 목록으로 돌아갑니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => { setIsModalOpen(false); navigate('/qna'); }
            });
            setIsModalOpen(true);
            return;
        }
        
        try {
            // ⭐ 수정: QnA 상세 조회 API 엔드포인트로 변경
            const response = await axios.get(`${API_BASE_URL}/qna/${qnaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("[QnaDetail fetchQnaDetail] API Response:", response.data);
            setQnaData(response.data);
        } catch (err) {
            console.error("[QnaDetail fetchQnaDetail] Failed to fetch QnA:", err);
            let errorMessage = "문의 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
            let navigatePath = '/qna'; 

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
                    navigatePath = '/login';
                } else if (err.response.status === 403) {
                    errorMessage = "해당 문의에 접근할 권한이 없습니다. 내 문의 목록으로 이동합니다.";
                } else if (err.response.status === 404) {
                    errorMessage = `요청하신 문의(ID: ${qnaId})를 찾을 수 없습니다. 내 문의 목록으로 이동합니다.`;
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setModalProps({
                title: "오류 발생", message: errorMessage, confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => {
                    setIsModalOpen(false);
                    navigate(navigatePath);
                }
            });
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    }, [qnaId, navigate]);

    useEffect(() => {
        fetchQnaDetail();
    }, [fetchQnaDetail]);

    const handleEditClick = () => {
        if (!qnaData) return;

        if (qnaData.inquiryStatus === 'PENDING') {
            navigate(`/qnaEdit/${qnaData.inquiryId}`);
        } else if (qnaData.inquiryStatus === 'ANSWERED') {
            setModalProps({
                title: "수정 불가", message: "이미 답변이 완료된 문의는 수정할 수 없습니다.",
                confirmText: "확인", type: "info", confirmButtonType: 'blackButton',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
        } else {
             setModalProps({
                title: "알림", message: "현재 상태에서는 문의를 수정할 수 없습니다.",
                confirmText: "확인", type: "warning", confirmButtonType: 'blackButton',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
        }
    };

    if (isLoading) {
        return ( 
            <>
                <MypageNav/>
                <div className={qnaDetailStyle.layout}>
                    <div className={qnaDetailStyle.container}>
                        <div className={qnaDetailStyle.background} style={{padding: "50px", textAlign: "center"}}>
                            문의 내용을 불러오는 중입니다...
                        </div>
                    </div>
                </div>
            </>
        );
    }
    
    if (!qnaData && !isModalOpen) { 
        return (
             <>
                <MypageNav/>
                <div className={qnaDetailStyle.layout}>
                    <div className={qnaDetailStyle.container}>
                        <div className={qnaDetailStyle.background} style={{padding: "50px", textAlign: "center"}}>
                           문의 정보를 불러올 수 없습니다.
                        </div>
                    </div>
                </div>
            </>
        );
    }
    
    if (!qnaData) return null; 

    const userQuestion = qnaData; 
    const adminAnswerData = qnaData.reply; 

    const getStatusText = (status) => {
        if (status === 'PENDING') return '미답변';
        if (status === 'ANSWERED') return '답변완료';
        return status;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };
    
    const canEdit = userQuestion.inquiryStatus === 'PENDING' && !isLoading;

    return (
        <>
           <MypageNav/>
           <div className={qnaDetailStyle.layout}>
                <div className={qnaDetailStyle.container}>
                    <div className={qnaDetailStyle.background}>
                        <div className={qnaDetailStyle.qnaLinkContainer}>
                            <Link to="/qna" className={qnaDetailStyle.qnaLink}>Q&A</Link>
                        </div>

                        <div className={qnaDetailStyle.contentArea}>
                            <div className={qnaDetailStyle.info}>
                                <span className={`${qnaDetailStyle.statusTag} ${userQuestion.inquiryStatus === 'ANSWERED' ? qnaDetailStyle.answered : qnaDetailStyle.unanswered}`}>
                                    {getStatusText(userQuestion.inquiryStatus)}
                                </span>
                                <span className={qnaDetailStyle.authorName}>{userQuestion.authorNickname}</span>
                                <span className={qnaDetailStyle.postTitleMain}>{userQuestion.inquiryTitle}</span>
                                <span className={qnaDetailStyle.postDate}>{formatDate(userQuestion.inquiryCreatedAt)}</span>
                            </div>

                            <div className={qnaDetailStyle.textbox}>
                                {userQuestion.inquiryContent.split('\n').map((line, index) => (
                                    <React.Fragment key={`q-${index}`}>{line}<br /></React.Fragment>
                                ))}
                            </div>

                            {userQuestion.attachments && userQuestion.attachments.length > 0 && (
                                <div className={qnaDetailStyle.imgSection}>
                                    <p className={qnaDetailStyle.attachmentTitle}>첨부 이미지:</p>
                                    <div className={qnaDetailStyle.img}> 
                                        {userQuestion.attachments.map((att, index) => (
                                            <a href={att.fileUrl} key={att.imgId || `img-${index}`} target="_blank" rel="noopener noreferrer" className={qnaDetailStyle.imageLink}>
                                                <img 
                                                    src={att.fileUrl} 
                                                    alt={att.originalFilename || `첨부이미지 ${index + 1}`} 
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {canEdit && (
                                <div className={qnaDetailStyle.qnaMainActions}>
                                    <button
                                        onClick={handleEditClick}
                                        className={`${qnaDetailStyle.actionButton} ${qnaDetailStyle.editButton}`}
                                        disabled={isLoading}
                                    >
                                        수정
                                    </button>
                                </div>
                            )}
                        </div>

                        {adminAnswerData && (
                            <div className={qnaDetailStyle.answerSection}>
                                <h4 className={qnaDetailStyle.answerTitle}>답변</h4>
                                <div className={qnaDetailStyle.adminAnswerItem}>
                                    <div className={qnaDetailStyle.adminAnswerMeta}>
                                        <span className={qnaDetailStyle.adminAnswerAuthor}>{adminAnswerData.replierNickname}</span>
                                        <span className={qnaDetailStyle.adminAnswerDate}>{formatDate(adminAnswerData.replyCreatedAt)}</span>
                                    </div>
                                    <div className={qnaDetailStyle.adminAnswerContent}>
                                        {adminAnswerData.replyContent.split('\n').map((line, index) => (
                                            <React.Fragment key={`ans-${index}`}>{line}<br /></React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    if (!modalProps.onConfirm && !modalProps.onCancel) setIsModalOpen(false);
                    else if (modalProps.onConfirm && !modalProps.cancelText) setIsModalOpen(false);
                    else setIsModalOpen(false);
                }}
                {...modalProps}
            />
        </>
    );
}

export default QnaDetail;