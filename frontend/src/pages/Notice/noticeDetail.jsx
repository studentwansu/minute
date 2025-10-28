// src/pages/Notice/NoticeDetail.jsx

import axios from 'axios'; // axios import 추가
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import NoticeDetailStyle from "../../assets/styles/noticeDetail.module.css";
import Modal from '../../components/Modal/Modal';

const PLACEHOLDER_NOTICE = {
    id: 'placeholder',
    isImportant: false,
    title: '샘플 공지사항 제목',
    author: '시스템',
    views: 0,
    createdAt: 'YYYY.MM.DD',
    content: "요청하신 공지사항 정보를 불러올 수 없습니다.\n대신 샘플 공지사항 내용이 표시됩니다.\n\n페이지 구조 및 UI를 확인해주세요."
};

function NoticeDetail() {
    const { id: noticeId } = useParams();
    const navigate = useNavigate();
    
    console.log("NoticeDetail Component Mounted. noticeId from URL params:", noticeId);

    const [notice, setNotice] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '확인',
        cancelText: null,
        type: 'default',
        confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    useEffect(() => {
        console.log("NoticeDetail useEffect triggered. Current noticeId:", noticeId);

        if (noticeId && noticeId.trim() !== "" && !isNaN(Number(noticeId))) {
            setIsLoading(true);
            setNotice(null); 

            const fetchNoticeByIdFromAPI = async (idToFetch) => {
                console.log("Fetching API for noticeId:", idToFetch); 
                try {
                    const response = await axios.get(`/api/v1/notices/${idToFetch}`);
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
                    });

                } catch (error) {
                    console.error("Failed to fetch notice:", error);
                    setNotice(PLACEHOLDER_NOTICE); 
                    
                    let errorMessage = "요청하신 공지사항을 불러올 수 없습니다. 목록으로 돌아가거나 잠시 후 다시 시도해주세요.";
                    if (error.response && error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    setModalProps({
                        title: "데이터 로드 실패",
                        message: errorMessage,
                        confirmText: "확인",
                        type: "error",
                        confirmButtonType: 'blackButton',
                        onConfirm: () => {
                            setIsModalOpen(false);
                        }
                    });
                    setIsModalOpen(true);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchNoticeByIdFromAPI(noticeId);

        } else { 
            console.warn("NoticeId is missing, invalid, or not a number:", noticeId, ". Displaying placeholder.");
            setNotice(PLACEHOLDER_NOTICE);
            setIsLoading(false);
            setModalProps({
                title: "알림",
                message: "유효한 공지사항 ID가 제공되지 않았습니다.\n샘플 공지사항 내용을 표시합니다.",
                confirmText: "확인",
                type: "warning",
                confirmButtonType: 'blackButton',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
        }
    }, [noticeId, navigate]);

    if (isLoading) {
        return (
            <div className={NoticeDetailStyle.background}>
                <div className={NoticeDetailStyle.title}>
                    <Link to="/notice" className={NoticeDetailStyle.titleLink}><h1>공지사항</h1></Link>
                </div>
                <div className={NoticeDetailStyle.contentArea}>
                    <p className={NoticeDetailStyle.loadingMessage}>공지사항을 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    if (!notice) {
        return (
            <div className={NoticeDetailStyle.background}>
                <div className={NoticeDetailStyle.title}>
                    <Link to="/notice" className={NoticeDetailStyle.titleLink}><h1>공지사항</h1></Link>
                </div>
                <div className={NoticeDetailStyle.contentArea}>
                   <p className={NoticeDetailStyle.errorMessage}>공지사항 정보를 표시할 수 없습니다. 문제가 지속되면 관리자에게 문의해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={NoticeDetailStyle.background}>
                <div className={NoticeDetailStyle.title}>
                    <Link to="/notice" className={NoticeDetailStyle.titleLink}><h1>공지사항</h1></Link>
                </div>
                <div className={NoticeDetailStyle.contentArea}>
                    <div className={NoticeDetailStyle.content}>
                        <div className={NoticeDetailStyle.info}>
                            <div className={NoticeDetailStyle.infoLeft}>
                                {notice.isImportant && (
                                    <span className={NoticeDetailStyle.importantTag}>중요</span>
                                )}
                                <span className={NoticeDetailStyle.postTitleText}>{notice.title}</span>
                            </div>
                            <div className={NoticeDetailStyle.infoRight}>
                                <span className={NoticeDetailStyle.author}>작성자: {notice.author}</span>
                                <span className={NoticeDetailStyle.views}>조회수: {notice.views}</span>
                                <span className={NoticeDetailStyle.createdAt}>작성일: {notice.createdAt}</span>
                            </div>
                        </div>
                        <div className={NoticeDetailStyle.textbox}>
                            {typeof notice.content === 'string' ? notice.content.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    <br />
                                </React.Fragment>
                            )) : notice.content}
                        </div>
                    </div>
                    {/* "목록으로" 버튼이 제거되었습니다. */}
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                {...modalProps}
            />
        </>
    )
}

export default NoticeDetail;