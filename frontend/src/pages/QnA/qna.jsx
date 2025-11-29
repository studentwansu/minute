import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import searchButtonIcon from "../../assets/images/search_icon.png";
import qnaStyle from "../../assets/styles/qna.module.css";
import Modal from '../../components/Modal/Modal';
import MypageNav from '../../components/MypageNavBar/MypageNav';
import Pagination from "../../components/Pagination/Pagination";

function Qna() {
    const [qnaPage, setQnaPage] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary', cancelButtonType: 'secondary'
    });

    const [filters, setFilters] = useState({
        startDate: searchParams.get('startDate') || '',
        endDate: searchParams.get('endDate') || '',
        status: searchParams.get('status') || '', 
        searchTerm: searchParams.get('searchTerm') || ''
    });
    const currentPage = parseInt(searchParams.get('page') || '0', 10); 
    const itemsPerPage = 15; 

    const fetchQnaData = useCallback(async (currentFilters, page) => {
        setIsLoading(true);
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

        try {
            const params = {
                page: page,
                size: itemsPerPage,
                sort: 'inquiryCreatedAt,desc',
                searchTerm: currentFilters.searchTerm || undefined, 
                statusFilter: currentFilters.status || undefined,
                startDate: currentFilters.startDate || undefined,
                endDate: currentFilters.endDate || undefined,
            };

            const response = await axios.get('/api/v1/qna', {
                headers: { 'Authorization': `Bearer ${token}` },
                params 
            });
            setQnaPage(response.data);
        } catch (error) {
            console.error("Error fetching Q&A data:", error);
            let errorMessage = "문의 목록을 불러오는 중 문제가 발생했습니다.";
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            setModalProps({
                title: "오류 발생", message: errorMessage, confirmText: "확인",
                type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => {
                    setIsModalOpen(false);
                    if (error.response && error.response.status === 401) navigate('/login');
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
            status: searchParams.get('status') || '',
            searchTerm: searchParams.get('searchTerm') || ''
        };
        setFilters(newFilters);
        const newCurrentPage = parseInt(searchParams.get('page') || '0', 10);
        fetchQnaData(newFilters, newCurrentPage);
    }, [searchParams, fetchQnaData]); 

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const newSearchParams = new URLSearchParams();
        if (filters.startDate) newSearchParams.set('startDate', filters.startDate);
        if (filters.endDate) newSearchParams.set('endDate', filters.endDate);
        if (filters.status) newSearchParams.set('status', filters.status);
        if (filters.searchTerm) newSearchParams.set('searchTerm', filters.searchTerm);
        newSearchParams.set('page', '0'); 
        setSearchParams(newSearchParams);
    };

    const handlePageChange = (pageNumber) => { 
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', pageNumber.toString());
        setSearchParams(newSearchParams);
    };

    const handleRowClick = (qnaId) => {
        navigate(`/qnaDetail/${qnaId}`);
    };

    const getStatusText = (status) => {
        if (status === 'PENDING') return '대기';
        if (status === 'ANSWERED') return '완료';
        return status; 
    };

    return (
        <>
            <MypageNav />
            <div className={qnaStyle.layout}>
                <div className={qnaStyle.container}>
                    <div className={qnaStyle.inner}>
                        <div className={qnaStyle.title}>
                            <Link to="/qna" className={qnaStyle.pageTitleLink}><h1>Q&A</h1></Link>
                        </div>

                        <form onSubmit={handleSearch} className={qnaStyle.searchbar}>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={qnaStyle.dateFilter} />
                            <span className={qnaStyle.dateSeparator}>~</span>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={qnaStyle.dateFilter} />
                            <select name="status" value={filters.status} onChange={handleFilterChange} className={qnaStyle.statusSelect}>
                                <option value="">상태 (전체)</option>
                                <option value="ANSWERED">완료</option>
                                <option value="PENDING">대기</option>
                            </select>
                            <div className={qnaStyle.searchInputGroup}>
                                <input
                                    type="text"
                                    name="searchTerm"
                                    placeholder="검색어를 입력하세요"
                                    value={filters.searchTerm}
                                    onChange={handleFilterChange}
                                    className={qnaStyle.searchInput}
                                />
                                <button type="submit" className={qnaStyle.searchBtn} disabled={isLoading}>
                                    <img src={searchButtonIcon} alt="검색" className={qnaStyle.searchIcon} />
                                </button>
                            </div>
                        </form>

                        <table className={qnaStyle.table}>
                            <thead>
                                <tr>
                                    <th>상태</th>
                                    <th>작성자</th>
                                    <th>제목</th>
                                    <th>날짜</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="4" style={{ textAlign: "center" }}>로딩 중...</td></tr>
                                ) : qnaPage && qnaPage.content && qnaPage.content.length > 0 ? (
                                    qnaPage.content.map(qna => (
                                        <tr key={qna.inquiryId} onClick={() => handleRowClick(qna.inquiryId)} className={qnaStyle.clickableRow}>
                                            <td>
                                                <span className={`${qnaStyle.statusBadge} ${qna.inquiryStatus === 'ANSWERED' ? qnaStyle.completed : qnaStyle.pending}`}>
                                                    {getStatusText(qna.inquiryStatus)}
                                                </span>
                                            </td>
                                            <td>{qna.authorNickname}</td>
                                            <td className={qnaStyle.tableTitleCell}>
                                                <Link to={`/qnaDetail/${qna.inquiryId}`} className={qnaStyle.titleLink} onClick={(e) => e.stopPropagation()}>
                                                    {qna.inquiryTitle} {qna.hasAttachments && "📎"}
                                                </Link>
                                            </td>
                                            <td>{new Date(qna.inquiryCreatedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" style={{ textAlign: "center" }}>{isModalOpen ? "오류로 인해 내용을 표시할 수 없습니다." : "등록된 문의사항이 없습니다."}</td></tr>
                                )}
                            </tbody>
                        </table>

                        <div className={qnaStyle.bottomControls}>
                            <div className={qnaStyle.paginationContainerInBottomControls}>
                                {!isModalOpen && qnaPage && qnaPage.totalPages > 0 && qnaPage.content?.length > 0 && (
                                    <Pagination
                                        currentPage={qnaPage.number} 
                                        totalPages={qnaPage.totalPages}
                                        onPageChange={handlePageChange} 
                                    />
                                )}
                            </div>
                            <div className={qnaStyle.writeButtonContainerInBottomControls}>
                                <Link to="/qnaWrite" className={qnaStyle.writeButton}>작성</Link>
                            </div>
                        </div>
                    </div>
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

export default Qna;