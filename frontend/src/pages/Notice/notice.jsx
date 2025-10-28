// src/pages/Notice/notice.js

import axios from 'axios'; // axios import 추가
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import noticeStyle from "../../assets/styles/notice.module.css";
import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';

function Notice() {
    const [noticesToDisplay, setNoticesToDisplay] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0); // 전체 게시물 수

    const itemsPerPage = 10;
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: "",
        message: "",
        confirmText: "확인",
        type: "error", // 기본 타입을 에러로 설정해둘 수 있습니다.
        confirmButtonType: 'blackButton',
        onConfirm: () => setIsModalOpen(false)
    });

    useEffect(() => {
        const fetchNoticesFromAPI = async () => {
            try {
                // API 요청 시 페이지 번호는 0부터 시작하므로 (currentPage - 1)
                // 기존 (vite.config.js 공개 전 제안)
                // const response = await axios.get(`http://localhost:8080/api/notices?page=${currentPage - 1}&size=${itemsPerPage}`);

                // vite.config.js 프록시 설정 활용 (권장)
                const response = await axios.get(`/api/v1/notices?page=${currentPage - 1}&size=${itemsPerPage}`);

                // axios는 응답 데이터를 response.data에 담아줍니다.
                const data = response.data; // PageResponseDTO<NoticeListResponseDTO> 형태의 응답

                let regularNoticeCounter = 1;
                const mappedNotices = data.content.map(notice => {
                    const dateObj = new Date(notice.noticeCreatedAt);
                    const formattedDate = `${dateObj.getFullYear().toString().slice(2)}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
                    const displayNo = notice.noticeIsImportant ? '중요' : regularNoticeCounter++;

                    return {
                        id: notice.noticeId,
                        no: displayNo,
                        title: notice.noticeTitle,
                        author: notice.authorNickname,
                        views: notice.noticeViewCount,
                        date: formattedDate,
                        isImportant: notice.noticeIsImportant,
                    };
                });

                setNoticesToDisplay(mappedNotices);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);

            } catch (error) {
                console.error("Error fetching notices:", error);
                let errorMessage = "공지사항을 불러오는 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.";
                // axios 에러 처리: error.response.data.message가 서버에서 보낸 메시지일 가능성이 높음
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) { // 네트워크 에러 또는 기타 클라이언트 측 에러
                    errorMessage = error.message;
                }

                setModalProps({
                    title: "오류 발생",
                    message: errorMessage,
                    confirmText: "확인",
                    type: "error",
                    confirmButtonType: 'blackButton',
                    onConfirm: () => setIsModalOpen(false)
                });
                setIsModalOpen(true);
                setNoticesToDisplay([]);
                setTotalPages(0);
            }
        };

        fetchNoticesFromAPI();
    }, [currentPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleRowClick = (noticeId) => {
        navigate(`/noticeDetail/${noticeId}`);
    };

    return (
        <>
            <div className={noticeStyle.background}>
                {/* 상단 제목 영역 등은 기존 구조 유지한다고 가정 */}
                <div className={noticeStyle.titleArea}>
                    <h1>공지사항</h1>
                </div>
                <div className={noticeStyle.contentArea}>
                    <table className={noticeStyle.table}>
                        <thead>
                            <tr>
                                <th scope="col">NO</th>
                                <th scope="col">제목</th>
                                <th scope="col">작성자</th>
                                <th scope="col">조회수</th>
                                <th scope="col">날짜</th>
                            </tr>
                        </thead>
                        <tbody>
                            {noticesToDisplay.length > 0 ? (
                                noticesToDisplay.map(notice => (
                                    <tr
                                        key={notice.id}
                                        className={notice.isImportant ? noticeStyle.important : ''}
                                        onClick={() => handleRowClick(notice.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            {notice.isImportant ? (
                                                <span className={noticeStyle.importantTag}>중요</span>
                                            ) : (
                                                notice.no
                                            )}
                                        </td>
                                        <td className={noticeStyle.tableTitle}>
                                            <Link
                                                to={`/noticeDetail/${notice.id}`}
                                                className={noticeStyle.titleLink}
                                                onClick={(e) => e.stopPropagation()} // row 클릭과 Link 클릭 분리
                                            >
                                                {notice.title}
                                            </Link>
                                        </td>
                                        <td>{notice.author}</td>
                                        <td>{notice.views}</td>
                                        <td>{notice.date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5">
                                        {isModalOpen ? "오류로 인해 내용을 표시할 수 없습니다." : "등록된 공지사항이 없습니다."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {totalPages > 1 && !isModalOpen && (
                        <div className={noticeStyle.paginationWrapper}>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                {...modalProps}
            />
        </>
    );
}

export default Notice;