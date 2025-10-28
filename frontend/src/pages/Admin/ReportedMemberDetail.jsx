// ReportedMemberDetail.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from "../../assets/styles/ReportedMemberDetail.module.css";
import Pagination from '../../components/Pagination/Pagination';

function ReportedMemberDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [allReportItems, setAllReportItems] = useState([]); 
    const [reportsToDisplay, setReportsToDisplay] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const totalPages = Math.ceil(reportsToDisplay.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDisplayedItems = reportsToDisplay.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleVisibilityChange = (e, reportDetailId) => {
        e.stopPropagation();
        const updateLogic = (prevItems) => prevItems.map(item => {
            if (item.reportDetailId === reportDetailId) {
                return { ...item, 숨김상태: item.숨김상태 === "숨김" ? "공개" : "숨김" };
            }
            return item;
        });
        setAllReportItems(updateLogic);
        setReportsToDisplay(updateLogic);
    };

    const handleRowItemClick = (item) => {
        if (item.navigationPathPrefix && item.originalContentId) {
            navigate(`${item.navigationPathPrefix}${item.originalContentId}`);
        } else {
            console.warn("이동 경로 또는 원본 콘텐츠 ID가 없습니다:", item);
        }
    };

    const displayuserId = userId || "특정사용자";

    useEffect(() => {
    const fetchReportData = async () => {
        try {
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`http://localhost:8080/api/v1/admin/reports/member/${userId}`, {
            headers: {
            Authorization: `Bearer ${token}`
            }
        });

        const { reportedPosts, reportedComments } = response.data;

        const combinedItems = [
            ...reportedPosts.content.map((item, index) => ({
            reportDetailId: `post-${userId}-${index + 1}`,
            NO: reportedPosts.totalElements - index,
            ID: userId,
            닉네임: item.authorNickname || '알수없음',
            '제목/내용일부': `게시글 - ${(item.postTitle || '').slice(0, 10)}...`,
            작성일: item.postCreatedAt ? new Date(item.postCreatedAt).toLocaleDateString() : 'N/A',
            숨김상태: item.hidden ? "숨김" : "공개",
            originalContentType: 'freeboard',
            originalContentId: item.postId,
            navigationPathPrefix: '/admin/managerFreeboardDetail/',
            })),
            ...reportedComments.content.map((item, index) => ({
            reportDetailId: `comment-${userId}-${index + 1}`,
            NO: reportedComments.totalElements - index,
            ID: userId,
            닉네임: item.authorNickname || '알수없음',
            '제목/내용일부': `댓글 - ${(item.commentContent || '').slice(0, 10)}...`,
            작성일: item.commentCreatedAt ? new Date(item.commentCreatedAt).toLocaleDateString() : 'N/A',
            숨김상태: item.hidden ? "숨김" : "공개",
            originalContentType: 'qna',
            originalContentId: item.commentId,
            navigationPathPrefix: '/admin/managerQnaDetail/',
            }))
        ];
        console.log("combinedItems:", combinedItems);


        setAllReportItems(combinedItems);
        setReportsToDisplay(combinedItems);
console.log("reportsToDisplay:", combinedItems);

        setCurrentPage(1);
        } catch (error) {
        console.error('신고 내역 조회 실패:', error);
        }
    };

    if (userId) {
        fetchReportData();
    }
    }, [userId]);


    return (
        <div className={styles.container}>
            <div className={styles.main}>
                <section className={styles.content}>
                    <h1>신고 관리</h1>
                    <h2>신고 내역 상세 - {displayuserId}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>NO</th>
                                <th>ID</th>
                                <th>닉네임</th>
                                <th>제목/내용일부</th>
                                <th>작성일</th>
                                <th>숨김상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDisplayedItems.length > 0 ? (
                                currentDisplayedItems.map((row) => (
                                    <tr key={row.reportDetailId} onClick={() => handleRowItemClick(row)} className={styles.clickableRow}>
                                        <td>{row.NO}</td>
                                        <td>{row.ID}</td>
                                        <td>{row.닉네임}</td>
                                        <td>{row['제목/내용일부']}</td>
                                        <td>{row.작성일}</td>
                                        <td>
                                            <button
                                                className={`${styles.status} ${row.숨김상태 === "숨김" ? styles.hidden : styles.public}`}
                                                onClick={(e) => handleVisibilityChange(e, row.reportDetailId)}
                                                title={`클릭하여 상태 변경: ${row.숨김상태 === "숨김" ? "공개로" : "숨김으로"}`}
                                            >
                                                {row.숨김상태}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">표시할 신고 내역이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className={styles.pagination}>
                        {totalPages > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ReportedMemberDetail;
