import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import reportOffIcon from '../../assets/images/able-alarm.png';
import reportOnIcon from '../../assets/images/disable-alarm.png';
import searchButtonIcon from '../../assets/images/search_icon.png';
import styles from '../../assets/styles/ManagerQna.module.css';
import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';

function ManagerQna() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams(); 

    const [qnaPage, setQnaPage] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        startDate: searchParams.get('startDate') || '',
        endDate: searchParams.get('endDate') || '',
        statusFilter: searchParams.get('statusFilter') || 'all', 
        searchTerm: searchParams.get('searchTerm') || ''
    });
    const currentPageForApi = parseInt(searchParams.get('page') || '0', 10); 
    const itemsPerPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    const fetchManagerQnaData = useCallback(async (currentFilters, page) => {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
            setIsLoading(false);
            setModalProps({
                title: "인증 오류", message: "관리자 로그인이 필요합니다.",
                confirmText: "확인", type: "adminError", confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); navigate('/login'); } 
            });
            setIsModalOpen(true);
            return;
        }
        
        const apiStatusFilter = currentFilters.statusFilter === 'all' ? undefined : currentFilters.statusFilter;

        try {
            const params = {
                page: page,
                size: itemsPerPage,
                sort: 'inquiryCreatedAt,desc', 
                searchTerm: currentFilters.searchTerm || undefined,
                statusFilter: apiStatusFilter,
                startDate: currentFilters.startDate || undefined,
                endDate: currentFilters.endDate || undefined,
            };

            const response = await axios.get('/api/v1/admin/qna', { 
                headers: { 'Authorization': `Bearer ${token}` },
                params
            });
            setQnaPage(response.data);
        } catch (error) {
            console.error("Error fetching manager Q&A data:", error);
            let errorMessage = "문의 목록을 불러오는 중 문제가 발생했습니다.";
            if (error.response) {
                if (error.response.status === 401) errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
                else if (error.response.status === 403) errorMessage = "접근 권한이 없습니다.";
                else if (error.response.data && error.response.data.message) errorMessage = error.response.data.message;
            }
            setModalProps({
                title: "오류 발생", message: errorMessage, confirmText: "확인",
                type: "adminError", confirmButtonType: 'primary',
                onConfirm: () => {
                    setIsModalOpen(false);
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) navigate('/login'); // 또는 관리자 홈
                }
            });
            setIsModalOpen(true);
            setQnaPage(null);
        } finally {
            setIsLoading(false);
        }
    }, [itemsPerPage, navigate]);

    useEffect(() => {
        const newFilters = {
            startDate: searchParams.get('startDate') || '',
            endDate: searchParams.get('endDate') || '',
            statusFilter: searchParams.get('statusFilter') || 'all',
            searchTerm: searchParams.get('searchTerm') || ''
        };
        setFilters(newFilters);
        const newCurrentPage = parseInt(searchParams.get('page') || '0', 10);
        fetchManagerQnaData(newFilters, newCurrentPage);
    }, [searchParams, fetchManagerQnaData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const newSearchParams = new URLSearchParams();
        if (filters.startDate) newSearchParams.set('startDate', filters.startDate);
        if (filters.endDate) newSearchParams.set('endDate', filters.endDate);
        if (filters.statusFilter && filters.statusFilter !== 'all') newSearchParams.set('statusFilter', filters.statusFilter);
        if (filters.searchTerm) newSearchParams.set('searchTerm', filters.searchTerm);
        newSearchParams.set('page', '0'); 
        setSearchParams(newSearchParams);
    };

    const handlePageChange = (pageNumber) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', (pageNumber - 1).toString());
        setSearchParams(newSearchParams);
    };
    
    const handleAdminReportQna = async (qnaIdToReport) => {
        const token = localStorage.getItem('token');
        if (!token) {  return; }

        try {
            await axios.post(`/api/v1/admin/qna/${qnaIdToReport}/reports`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setModalProps({
                title: '신고 접수 완료',
                message: `문의 ID ${qnaIdToReport}에 대한 신고가 성공적으로 접수되었습니다.`,
                confirmText: '확인', type: 'adminSuccess', confirmButtonType: 'primary',
                onConfirm: () => {
                    setIsModalOpen(false);
                    fetchManagerQnaData(filters, currentPageForApi); 
                }
            });
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error reporting QnA by admin:", error);
            let errorMessage = `문의 ID ${qnaIdToReport} 신고 처리 중 오류가 발생했습니다.`;
            if (error.response) {
                if (error.response.status === 401 || error.response.status === 403) errorMessage = "권한이 없습니다.";
                else if (error.response.status === 404) errorMessage = "해당 문의를 찾을 수 없습니다.";
                else if (error.response.status === 409) errorMessage = "이미 관리자가 신고한 문의입니다."; 
                else if (error.response.data && error.response.data.message) errorMessage = error.response.data.message;
            }
            setModalProps({
                title: "신고 처리 실패", message: errorMessage, confirmText: "확인",
                type: "adminError", confirmButtonType: 'primary',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
        }
    };


    const confirmAdminReportQna = (e, qnaId, isAlreadyReportedByAdmin) => {
        e.stopPropagation();
        
        if (isAlreadyReportedByAdmin) {
            setModalProps({
                title: '알림', message: `문의 ID ${qnaId}는 이미 신고된 내역이 있습니다.`,
                confirmText: '확인', type: 'adminInfo', confirmButtonType: 'primary',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
            return;
        }

        setModalProps({
            title: '문의 신고 확인',
            message: `문의 ID ${qnaId}를 신고 처리하시겠습니까?`,
            onConfirm: () => handleAdminReportQna(qnaId),
            confirmText: '신고 실행', cancelText: '취소',
            type: 'adminConfirm', confirmButtonType: 'danger',
            onCancel: () => setIsModalOpen(false)
        });
        setIsModalOpen(true);
    };


    const handleRowClick = (qnaId) => {
        navigate(`/admin/managerQnaDetail/${qnaId}`);
    };
    
    const getStatusText = (status) => { 
        if (status === 'PENDING') return '미답변';
        if (status === 'ANSWERED') return '답변완료';
        return status;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ko-KR'); 
    };

    return (
        <>
            <div className={styles.container}>
                <main className={styles.qnaContent}>
                    <h1 className={styles.pageTitle}>문의 관리</h1>
                    <form onSubmit={handleSearch} className={styles.filterBar}>
                        <input
                            type="date" name="startDate"
                            className={styles.filterElement}
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                        <span className={styles.dateSeparator}>~</span>
                        <input
                            type="date" name="endDate"
                            className={styles.filterElement}
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                        <select
                            name="statusFilter"
                            className={`${styles.filterElement} ${styles.filterSelect}`}
                            value={filters.statusFilter}
                            onChange={handleFilterChange}
                        >
                            <option value="all">답변상태 (전체)</option>
                            <option value="ANSWERED">답변완료</option>
                            <option value="PENDING">미답변</option>
                        </select>
                        <input
                            type="text" name="searchTerm"
                            placeholder="ID, 닉네임, 제목 검색"
                            className={`${styles.filterElement} ${styles.filterSearchInput}`}
                            value={filters.searchTerm}
                            onChange={handleFilterChange}
                        />
                        <button type="submit" className={styles.filterSearchButton} disabled={isLoading}>
                            <img src={searchButtonIcon} alt="검색" className={styles.searchIcon} />
                        </button>
                    </form>
                    <table className={styles.qnaTable}>
                        <thead>
                            <tr>
                                <th>NO</th><th>작성자ID</th><th>닉네임</th>
                                <th className={styles.titleHeaderColumn}>제목</th>
                                <th>작성일</th><th>신고</th><th>답변상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" style={{ textAlign: "center" }}>로딩 중...</td></tr>
                            ) : qnaPage && qnaPage.content && qnaPage.content.length > 0 ? (
                                qnaPage.content.map((qna, index) => (
                                    <tr key={qna.inquiryId} onClick={() => handleRowClick(qna.inquiryId)} className={styles.clickableRow}>
                                        <td>{qnaPage.totalElements - (qnaPage.number * qnaPage.size) - index}</td>
                                        <td>{qna.authorUserId}</td>
                                        <td>{qna.authorNickname}</td>
                                        <td className={styles.titleDataColumn}>
                                            {qna.inquiryTitle} {qna.hasAttachments && "📎"}
                                        </td>
                                        <td>{formatDate(qna.inquiryCreatedAt)}</td>
                                        <td>
                                            <button
                                                onClick={(e) => confirmAdminReportQna(e, qna.inquiryId, qna.reportCount > 0)}
                                                className={`${styles.iconButton} ${qna.reportCount > 0 ? styles.reportActioned : ''}`}
                                                title={qna.reportCount > 0 ? `신고 ${qna.reportCount}건 접수됨` : "신고된 내역 없음 (클릭하여 신고)"}
                                            >
                                                <img
                                                    src={qna.reportCount > 0 ? reportOnIcon : reportOffIcon}
                                                    alt="신고 상태"
                                                    className={styles.buttonIcon}
                                                />
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                className={`${styles.statusButton} ${qna.inquiryStatus === 'ANSWERED' ? styles.answeredStatus : styles.unansweredStatus}`}
                                                disabled 
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {getStatusText(qna.inquiryStatus)}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : ( <tr><td colSpan="7" style={{ textAlign: "center" }}>{isModalOpen ? "오류로 인해 내용을 표시할 수 없습니다." : "표시할 문의사항이 없습니다."}</td></tr> )}
                        </tbody>
                    </table>
                    <div className={styles.pagination}>
                         {!isModalOpen && qnaPage && qnaPage.totalPages > 0 && qnaPage.content?.length > 0 && (
                            <Pagination
                                currentPage={qnaPage.number + 1}
                                totalPages={qnaPage.totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </main>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                {...modalProps}
            />
        </>
    );
}

export default ManagerQna;