// src/pages/Admin/ReportedPosts.jsx
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import searchButtonIcon from "../../assets/images/search_icon.png";
import styles from '../../assets/styles/ReportedPosts.module.css';
import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';

const API_BASE_URL = '/api/v1'; // Vite 프록시 사용 시

function ReportedPosts() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [reportedItems, setReportedItems] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const initialTab = searchParams.get('tab') || 'post';
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    
    const [activeContentTypeTab, setActiveContentTypeTab] = useState(initialTab);
    const [filters, setFilters] = useState({
        startDate: searchParams.get('startDate') || '',
        endDate: searchParams.get('endDate') || '',
        hideFilter: searchParams.get('hideFilter') || (initialTab === 'qna' ? 'all' : (searchParams.get('hideFilter') || 'all')),
        searchTerm: searchParams.get('searchTerm') || ''
    });
    const [currentPageUI, setCurrentPageUI] = useState(initialPage);
    const itemsPerPage = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const fetchReportedItems = useCallback(async (tab, page, currentFilters) => {
        console.log(`[ReportedPosts] Fetching items for tab: ${tab}, UI page: ${page}, filters:`, currentFilters);
        setIsLoading(true);
        setError(null);
        const headers = getAuthHeaders();

        if (!headers.Authorization) {
            setIsLoading(false);
            setModalProps({
                title: '인증 오류', message: '로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.',
                confirmText: '확인', onConfirm: () => { setIsModalOpen(false); navigate('/login'); },
                type: 'error', confirmButtonType: 'primary',
            });
            setIsModalOpen(true);
            return;
        }
        
        let endpoint = '';
        // 기본적으로 searchKeyword를 사용, qna 탭일 때만 searchTerm으로 변경하고 searchKeyword 삭제
        const params = {
            page: page - 1, 
            size: itemsPerPage,
            searchKeyword: currentFilters.searchTerm.trim() || undefined, 
        };

        if (tab === 'post') {
            endpoint = '/board/free/reports/posts';
            if (currentFilters.startDate) params.postStartDate = currentFilters.startDate;
            if (currentFilters.endDate) params.postEndDate = currentFilters.endDate;
            if (currentFilters.hideFilter !== 'all') params.isHidden = currentFilters.hideFilter === '숨김';
        } else if (tab === 'comment') {
            endpoint = '/board/free/reports/comments';
            if (currentFilters.startDate) params.commentCreatedAtStartDate = currentFilters.startDate;
            if (currentFilters.endDate) params.commentCreatedAtEndDate = currentFilters.endDate;
            if (currentFilters.hideFilter !== 'all') params.isHidden = currentFilters.hideFilter === '숨김';
        } else if (tab === 'qna') { 
            endpoint = '/admin/qna/reported-items'; 
            if (currentFilters.startDate) params.qnaCreationStartDate = currentFilters.startDate;
            if (currentFilters.endDate) params.qnaCreationEndDate = currentFilters.endDate;
            
            // ⭐ 문의 탭 검색어 파라미터명 변경
            if (currentFilters.searchTerm.trim()) {
                params.searchTerm = currentFilters.searchTerm.trim(); // 'searchTerm'으로 설정
            }
            delete params.searchKeyword; // 공통으로 설정된 searchKeyword 삭제
        } else {
            console.warn(`[ReportedPosts] Unknown tab: ${tab}. Clearing items.`);
            setIsLoading(false);
            setReportedItems([]); setTotalPages(0); setTotalItems(0);
            return;
        }

        console.log("[ReportedPosts] Requesting endpoint:", endpoint, "with params:", params);

        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, { params, headers });
            const data = response.data;
            console.log("[ReportedPosts] API Response for tab", tab, ":", data);
            console.log("[ReportedPosts] API Response data.totalElements:", data?.totalElements, "(type:", typeof data?.totalElements, ")");
            console.log("[ReportedPosts] API Response data.number (0-based page):", data?.number, "(type:", typeof data?.number, ")");

            if (data && data.content) {
                const mappedItems = data.content.map(item => {
                    console.log(`[ReportedPosts] Mapping item for tab ${tab}:`, JSON.stringify(item)); 

                    const commonProps = {
                        authorId: item.authorUserId || item.authorId, 
                        authorNickname: item.authorNickname,
                        reportCount: item.reportCount,
                    };

                    let rawDateValue;
                    let specificProps = {};

                    if (tab === 'post') {
                        rawDateValue = item.postCreatedAt || item.createdAt || item.originalPostDate; 
                        specificProps = {
                            id: item.postId || item.id, 
                            itemType: '게시글',
                            originalPostId: item.postId || item.id,
                            titleOrContentSnippet: item.postTitle || item.titleOrContentSnippet,
                            hiddenStatus: item.hidden ? '숨김' : '공개', 
                            isItemHiddenBoolean: item.hidden === true, 
                        };
                    } else if (tab === 'comment') {
                        rawDateValue = item.commentCreatedAt || item.createdAt || item.originalPostDate;
                        specificProps = {
                            id: item.commentId || item.id,
                            itemType: '댓글',
                            originalPostId: item.originalPostId, 
                            titleOrContentSnippet: item.commentContent || item.titleOrContentSnippet,
                            hiddenStatus: item.hidden ? '숨김' : '공개',
                            isItemHiddenBoolean: item.hidden === true,
                        };
                    } else if (tab === 'qna') {
    rawDateValue = item.originalPostDate || item.inquiryCreatedAt || item.createdAt;
    specificProps = {
        id: item.id,
        // itemType: item.itemType || '문의', // 기존 코드
        itemType: '문의', // 수정된 코드: 'qna' 탭의 아이템 타입을 항상 '문의'로 통일
        originalPostId: item.id,
        titleOrContentSnippet: item.titleOrContentSnippet,
    };
                    }
                    return {
                        ...commonProps,
                        ...specificProps,
                        originalPostDateValue: rawDateValue,
                    };
                });
                setReportedItems(mappedItems);
                setTotalPages(data.totalPages || 0);

                const newTotalItems = Number(data.totalElements);
                setTotalItems(isNaN(newTotalItems) ? 0 : newTotalItems); 
                
                const newCurrentPageApi = Number(data.number);
                setCurrentPageUI(isNaN(newCurrentPageApi) ? 1 : newCurrentPageApi + 1);

            } else {
                console.warn("[ReportedPosts] API response data or content is missing for tab", tab, ":", data);
                setReportedItems([]); setTotalPages(0); setTotalItems(0);
            }
        } catch (err) {
            console.error(`[ReportedPosts] Error fetching items for tab ${tab}:`, err.response || err);
            setError(err.response?.data?.message || '데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
            setReportedItems([]); setTotalPages(0); setTotalItems(0);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                 setModalProps({ title: '인증/권한 오류', message: '접근 권한이 없거나 세션이 만료되었습니다.', onConfirm: () => {setIsModalOpen(false); navigate('/login');}, type: 'error' });
                setIsModalOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [itemsPerPage, navigate]);

    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') || 'post';
        const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
        const newFilters = {
            startDate: searchParams.get('startDate') || '',
            endDate: searchParams.get('endDate') || '',
            hideFilter: searchParams.get('hideFilter') || (tabFromUrl === 'qna' ? 'all' : (searchParams.get('hideFilter') || 'all')),
            searchTerm: searchParams.get('searchTerm') || ''
        };

        if (activeContentTypeTab !== tabFromUrl) setActiveContentTypeTab(tabFromUrl);
        if (currentPageUI !== pageFromUrl) setCurrentPageUI(pageFromUrl);
        setFilters(newFilters); 
        
        fetchReportedItems(tabFromUrl, pageFromUrl, newFilters);
    }, [searchParams, fetchReportedItems]);


    const handleTabChange = (newTab) => {
        const newSearchParams = new URLSearchParams(); 
        newSearchParams.set('tab', newTab);
        newSearchParams.set('page', '1');
        
        if (filters.startDate) newSearchParams.set('startDate', filters.startDate);
        if (filters.endDate) newSearchParams.set('endDate', filters.endDate);
        if (filters.searchTerm) newSearchParams.set('searchTerm', filters.searchTerm);
        
        if (newTab !== 'qna') {
            newSearchParams.set('hideFilter', filters.hideFilter);
        }
        if (newTab === 'qna') {
            setFilters(prev => ({...prev, hideFilter: 'all'}));
        }

        setSearchParams(newSearchParams);
    };
    
    const handleLocalFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', '1'); 
        
        if (filters.startDate) newSearchParams.set('startDate', filters.startDate); else newSearchParams.delete('startDate');
        if (filters.endDate) newSearchParams.set('endDate', filters.endDate); else newSearchParams.delete('endDate');
        if (filters.searchTerm) newSearchParams.set('searchTerm', filters.searchTerm); else newSearchParams.delete('searchTerm');
        
        if (activeContentTypeTab !== 'qna') {
            if (filters.hideFilter && filters.hideFilter !== 'all') {
                newSearchParams.set('hideFilter', filters.hideFilter);
            } else {
                newSearchParams.delete('hideFilter');
            }
        } else {
            newSearchParams.delete('hideFilter'); 
        }
        setSearchParams(newSearchParams);
    };
    
    const handlePageChange = (newPage) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', newPage.toString());
        setSearchParams(newSearchParams);
    };

    const processToggleHiddenStatus = async (itemId, currentIsHiddenBoolean, itemType) => {
        if (itemType === '문의') {
            console.warn("[ReportedPosts] Toggling hidden status for QnA is not supported.");
            return;
        }
        setIsLoading(true);
        const newIsHidden = !currentIsHiddenBoolean;
        let endpoint = '';
        if (itemType === '게시글') endpoint = `/board/free/posts/${itemId}/visibility`;
        else if (itemType === '댓글') endpoint = `/board/free/comments/${itemId}/visibility`;
        
        try {
            await axios.patch(`${API_BASE_URL}${endpoint}`, { isHidden: newIsHidden }, { headers: getAuthHeaders() });
            setModalProps({ title: "상태 변경 완료", message: `항목 ID '${itemId}'의 상태가 "${newIsHidden ? '숨김' : '공개'}"(으)로 변경되었습니다.`, onConfirm: () => { setIsModalOpen(false); fetchReportedItems(activeContentTypeTab, currentPageUI, filters);}, type: "adminSuccess" });
            setIsModalOpen(true);
        } catch (err) {
            setModalProps({ title: "오류", message: err.response?.data?.message || "상태 변경 중 오류가 발생했습니다.", confirmText: "확인", onConfirm: () => setIsModalOpen(false), type: "error" });
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleToggleHiddenStatus = (e, item) => {
        e.stopPropagation();
        if (item.itemType === '문의') return; 
        
        const { id, titleOrContentSnippet, isItemHiddenBoolean, itemType } = item;
        const newStatusString = isItemHiddenBoolean ? '공개' : '숨김';
        const currentStatusString = isItemHiddenBoolean ? '숨김' : '공개';
        const snippet = titleOrContentSnippet && titleOrContentSnippet.length > 15 ? `${titleOrContentSnippet.substring(0, 15)}...` : titleOrContentSnippet;

        setModalProps({
            title: "숨김 상태 변경 확인",
            message: `"${snippet}" (${itemType} ID: ${id}) 항목의 상태를 "${currentStatusString}"에서 "${newStatusString}"(으)로 변경하시겠습니까?`,
            onConfirm: () => { setIsModalOpen(false); processToggleHiddenStatus(id, isItemHiddenBoolean, item.itemType); },
            cancelText: "취소", onCancel: () => setIsModalOpen(false),
            type: "adminConfirm", confirmButtonType: !isItemHiddenBoolean ? 'danger' : 'primary'
        });
        setIsModalOpen(true);
    };

    const handleRowClick = (item) => {
        if (item.itemType === '게시글') {
            navigate(`/admin/managerFreeboardDetail/${item.originalPostId}`);
        } else if (item.itemType === '댓글') {
            navigate(`/admin/managerFreeboardDetail/${item.originalPostId}?commentFocusId=${item.id}`);
        } else if (item.itemType === '문의') {
            navigate(`/admin/managerQnaDetail/${item.id}`);
        }
    };

    const formatDate = (dateInput) => {
        if (!dateInput) return '-';
        try {
            const dateObj = new Date(dateInput);
            if (isNaN(dateObj.getTime())) {
                console.warn("[ReportedPosts] formatDate received an invalid date input:", dateInput);
                return '-';
            }
            return dateObj.toLocaleDateString('ko-KR');
        } catch (e) {
            console.error("[ReportedPosts] Error formatting date:", dateInput, e);
            return '-';
        }
    };

    return (
        <>
            <div className={styles.container}>
                <main className={styles.reportedPostsContentCard}>
                    <h1 className={styles.pageTitle}>신고된 콘텐츠 관리</h1>

                    <div className={styles.tabContainer}>
                        <button className={`${styles.tabButton} ${activeContentTypeTab === 'post' ? styles.activeTab : ''}`} onClick={() => handleTabChange('post')}>게시글</button>
                        <button className={`${styles.tabButton} ${activeContentTypeTab === 'comment' ? styles.activeTab : ''}`} onClick={() => handleTabChange('comment')}>댓글</button>
                        <button className={`${styles.tabButton} ${activeContentTypeTab === 'qna' ? styles.activeTab : ''}`} onClick={() => handleTabChange('qna')}>문의</button>
                    </div>

                    <form onSubmit={handleSearch} className={styles.filterBar}>
                        <input type="date" name="startDate" className={styles.filterElement} value={filters.startDate} onChange={handleLocalFilterChange} />
                        <span className={styles.dateSeparator}>~</span>
                        <input type="date" name="endDate" className={styles.filterElement} value={filters.endDate} onChange={handleLocalFilterChange} />
                        
                        {activeContentTypeTab !== 'qna' && (
                            <select name="hideFilter" className={`${styles.filterElement} ${styles.filterSelect}`} value={filters.hideFilter} onChange={handleLocalFilterChange}>
                                <option value="all">숨김상태 (전체)</option>
                                <option value="공개">공개</option>
                                <option value="숨김">숨김</option>
                            </select>
                        )}
                        
                        <input type="text" name="searchTerm" placeholder="ID, 닉네임, 내용 검색" className={`${styles.filterElement} ${styles.filterSearchInput}`} value={filters.searchTerm} onChange={handleLocalFilterChange} />
                        <button type="submit" className={styles.filterSearchButton} disabled={isLoading}>
                            <img src={searchButtonIcon} alt="검색" className={styles.searchIcon} />
                        </button>
                    </form>

                    {isLoading && <div className={styles.loadingSpinner}>로딩 중...</div>}
                    {error && !isLoading && <div className={styles.errorMessage}>오류: {error} <button onClick={() => fetchReportedItems(activeContentTypeTab, currentPageUI, filters)}>재시도</button></div>}
                    
                    {!isLoading && !error && (
                        <table className={styles.reportsTable}>
                            <thead>
                                <tr>
                                    <th>NO</th>
                                    <th>작성자ID</th>
                                    <th>닉네임</th>
                                    <th className={styles.titleColumn}>제목/내용</th>
                                    <th>작성일</th>
                                    <th>누적신고</th>
                                    {activeContentTypeTab !== 'qna' && <th>상태(숨김)</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {reportedItems.length > 0 ? (
                                    reportedItems.map((item, index) => {
                                        const calculatedNo = totalItems - ((currentPageUI - 1) * itemsPerPage) - index;
                                        if (isNaN(calculatedNo)) {
                                            console.warn("[ReportedPosts] Calculated 'NO' is NaN for item:", item, 
                                                "Debug info:", { totalItems, currentPageUI, itemsPerPage, index }
                                            );
                                        }
                                        return (
                                            <tr key={`${item.itemType}-${item.id}`} onClick={() => handleRowClick(item)} className={styles.clickableRow}>
                                                <td>{isNaN(calculatedNo) ? '-' : calculatedNo}</td>
                                                <td>{item.authorId}</td>
                                                <td>{item.authorNickname}</td>
                                                <td className={styles.contentSnippetCell}>
                                                    {item.titleOrContentSnippet && item.titleOrContentSnippet.length > 30
                                                        ? `${item.titleOrContentSnippet.substring(0, 30)}...`
                                                        : item.titleOrContentSnippet}
                                                </td>
                                                <td>{formatDate(item.originalPostDateValue)}</td>
                                                <td>{item.reportCount}</td>
                                                {activeContentTypeTab !== 'qna' && (
                                                    <td>
                                                        <button
                                                            onClick={(e) => handleToggleHiddenStatus(e, item)}
                                                            className={`${styles.status} ${item.isItemHiddenBoolean ? styles.inactiveStatus : styles.activeStatus }`}
                                                            title={`${item.hiddenStatus} 상태 (클릭하여 변경)`}
                                                            disabled={isLoading}
                                                        >
                                                            {item.hiddenStatus}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : ( <tr><td colSpan={activeContentTypeTab !== 'qna' ? 7 : 6}>표시할 신고된 항목이 없습니다.</td></tr> )}
                            </tbody>
                        </table>
                    )}
                     <div className={styles.pagination}>
                        {totalPages > 0 && !isLoading && reportedItems.length > 0 && (
                            <Pagination
                                currentPage={currentPageUI}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </main>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalProps} />
        </>
    );
}

export default ReportedPosts;