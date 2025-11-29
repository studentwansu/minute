import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import noticeStyle from "../../assets/styles/notice.module.css";
import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';

function Notice() {
    const [noticesToDisplay, setNoticesToDisplay] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0); 

    const itemsPerPage = 10;
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: "",
        message: "",
        confirmText: "확인",
        type: "error", 
        confirmButtonType: 'blackButton',
        onConfirm: () => setIsModalOpen(false)
    });

    useEffect(() => {
        const fetchNoticesFromAPI = async () => {
            try {
                const response = await axios.get(`/api/v1/notices?page=${currentPage - 1}&size=${itemsPerPage}`);

                const data = response.data; 

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
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) { 
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
                                                onClick={(e) => e.stopPropagation()} 
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