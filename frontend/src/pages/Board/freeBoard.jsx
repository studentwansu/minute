// src/pages/FreeBoard/FreeBoard.jsx
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import banner from "../../assets/images/banner.png";
import FreeBoardStyle from "../../assets/styles/freeboard.module.css";

import Modal from "../../components/Modal/Modal";
import Pagination from "../../components/Pagination/Pagination";

import reportOffIcon from "../../assets/images/able-alarm.png";
import likeOffIcon from "../../assets/images/b_thumbup.png";
import reportOnIcon from "../../assets/images/disable-alarm.png";
import searchButtonIcon from "../../assets/images/search_icon.png";
import likeOnIcon from "../../assets/images/thumbup.png";

const API_BASE_URL = "http://localhost:8080/api/v1";

function FreeBoard() {
    const [searchParams] = useSearchParams(); // URL 파라미터를 읽기 위한 Hook

    const [activeTab, setActiveTab] = useState(() => {
        // URL에 'tab' 파라미터가 'myActivity'이면 'myActivity'를, 아니면 'all'을 기본값으로 설정
        return searchParams.get('tab') === 'myActivity' ? 'myActivity' : 'all';
    });

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = 10;

    const [sortOption, setSortOption] = useState("latest");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSearch, setCurrentSearch] = useState("");

    const [myContentType, setMyContentType] = useState("myPosts");

    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    const getToken = () => localStorage.getItem("token");
    const getUserId = () => localStorage.getItem("userId");
    const isUserLoggedIn = () => !!getToken();

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");
            return `${year}.${month}.${day}`;
        } catch (e) {
            console.warn("Error formatting date:", dateString, e);
            return "N/A"; // 날짜 파싱 오류 시 대체 텍스트
        }
    };

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        let url = "";
        const params = {
            page: currentPage - 1,
            size: itemsPerPage,
        };
        let defaultSortField = "postId,desc";

        const headers = {};
        const token = getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (activeTab === "all") {
            url = `${API_BASE_URL}/board/free`;
            if (currentSearch) params.searchKeyword = currentSearch;
            params.sort = sortOption === "latest" ? "postId,desc" :
                sortOption === "views" ? "postViewCount,desc" :
                    sortOption === "likes" ? "postLikeCount,desc" : defaultSortField;
        } else if (activeTab === "myActivity") {
            const currentUserId = getUserId();
            if (!currentUserId) {
                setIsModalOpen(true);
                setModalProps({
                    title: "로그인 필요", message: "내 활동을 보려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
                    confirmText: "로그인", cancelText: "취소", onConfirm: () => navigate("/login"), type: 'warning'
                });
                setIsLoading(false); setItems([]); setTotalPages(0); setCurrentPage(1); return;
            }

            if (myContentType === "myPosts") {
                url = `${API_BASE_URL}/board/free`;
                params.authorUserId = currentUserId;
                if (currentSearch) params.searchKeyword = currentSearch;
                params.sort = sortOption === "latest" ? "postId,desc" :
                    sortOption === "views" ? "postViewCount,desc" :
                        sortOption === "likes" ? "postLikeCount,desc" : defaultSortField;
            } else if (myContentType === "myComments") {
                url = `${API_BASE_URL}/board/free/comments/by-user`; // 이 API는 @AuthenticationPrincipal을 사용합니다.
                defaultSortField = "commentCreatedAt,desc";
                params.sort = sortOption === "latest" ? "commentCreatedAt,desc" :
                    sortOption === "likes" ? "commentLikeCount,desc" : defaultSortField;
                // "내 댓글"의 경우, 백엔드 AdminMyCommentFilterDTO와 연동하여 검색 기능 추가 가능
                // if (currentSearch) params.searchKeyword = currentSearch; // 예시: 필터 DTO에 맞게 전달
            }
        } else {
            setIsLoading(false); return;
        }

        if (!url) { // url이 설정되지 않은 경우 (예: activeTab이 예상치 못한 값)
            setIsLoading(false); setItems([]); setTotalPages(0); setCurrentPage(1);
            setError("잘못된 접근입니다.");
            return;
        }

        try {
            const response = await axios.get(url, { params, headers });
            const data = response.data;
            if (data && data.content) {
                setItems(data.content);
                setTotalPages(data.totalPages || 0);
                setCurrentPage(data.currentPage ? data.currentPage : 1); // 백엔드가 1-based currentPage
            } else {
                setItems([]); setTotalPages(0); setCurrentPage(1);
            }
        } catch (err) {
            console.error("Error fetching items:", err);
            const errorMsg = err.response?.data?.message || "데이터를 불러오는 데 실패했습니다.";
            setError(errorMsg);
            setItems([]); setTotalPages(0); setCurrentPage(1);
            if (err.response?.status === 401 && activeTab === "myActivity") { // 내 활동 조회 시 토큰 만료 등
                setModalProps({
                    title: "인증 오류", message: "세션이 만료되었거나 인증에 실패했습니다. 다시 로그인해주세요.",
                    confirmText: "로그인", onConfirm: () => navigate("/login"), type: 'error'
                });
                setIsModalOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeTab, sortOption, currentSearch, myContentType, navigate]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleTabClick = (tabName) => {
        if (tabName === "myActivity" && !isUserLoggedIn()) {
            setIsModalOpen(true);
            setModalProps({
                title: "로그인 필요", message: "내 활동을 보려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
                confirmText: "로그인", cancelText: "취소", onConfirm: () => navigate("/login"), type: 'warning'
            });
            return;
        }
        setActiveTab(tabName); setCurrentPage(1);
        setMyContentType(tabName === "myActivity" ? "myPosts" : "myPosts"); // 기본값 myPosts
        setSortOption("latest"); // 탭 변경 시 정렬 초기화
        setCurrentSearch(""); setSearchQuery("");
    };

    const handleMyContentTypeChange = (e) => {
        setMyContentType(e.target.value);
        setCurrentPage(1);
        setSortOption("latest");
    };

    const handleSortChange = (e) => {
        setSortOption(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchInputChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setCurrentSearch(searchQuery);
    };

    const handleItemLikeToggle = async (e, itemId, itemType) => {
        e.stopPropagation();
        if (!isUserLoggedIn()) {
            setIsModalOpen(true);
            setModalProps({
                title: "로그인 필요", message: "좋아요 기능은 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
                confirmText: "로그인", cancelText: "취소", onConfirm: () => navigate("/login"), type: 'warning'
            });
            return;
        }

        const endpoint = itemType === "comment"
            ? `${API_BASE_URL}/board/free/comments/${itemId}/like`
            : `${API_BASE_URL}/board/free/${itemId}/like`;

        try {
            const token = getToken();
            const response = await axios.post(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;

            setItems(prevItems => prevItems.map(item => {
                const currentItemIdField = itemType === "comment" ? "commentId" : "postId";
                if (item[currentItemIdField] === itemId) {
                    return {
                        ...item,
                        likedByCurrentUser: data.likedByCurrentUser,
                        ...(itemType === "comment"
                            ? { commentLikeCount: data.currentLikeCount }
                            : { postLikeCount: data.currentLikeCount })
                    };
                }
                return item;
            }));
        } catch (err) {
            console.error(`Error toggling ${itemType} like:`, err);
            const errorMsg = err.response?.data?.message || "좋아요 처리에 실패했습니다.";
            setModalProps({ title: "오류", message: errorMsg, type: 'error' });
            setIsModalOpen(true);
        }
    };

    const processActualPostReport = async (postIdToReport) => {
        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/board/free/${postIdToReport}/report`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(prevItems => prevItems.map(p =>
                p.postId === postIdToReport // 게시글 신고만 처리
                    ? { ...p, reportedByCurrentUser: true }
                    : p
            ));
            setModalProps({
                title: "신고 완료", message: `게시글 ID ${postIdToReport}이(가) 성공적으로 신고되었습니다.`,
                confirmText: "확인", type: "success", confirmButtonType: 'primary'
            });
        } catch (err) {
            console.error("Error reporting post:", err);
            setModalProps({ title: "오류", message: err.response?.data?.message || "신고 처리에 실패했습니다.", type: 'error' });
        } finally {
            setIsModalOpen(true);
        }
    };

    const handlePostReportToggle = (e, postId, postTitle) => {
        e.stopPropagation();
        if (!isUserLoggedIn()) {
            setIsModalOpen(true);
            setModalProps({
                title: "로그인 필요", message: "신고 기능은 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
                confirmText: "로그인", cancelText: "취소", onConfirm: () => navigate("/login"), type: 'warning'
            });
            return;
        }

        const postToReport = items.find(p => p.postId === postId && !(activeTab === "myActivity" && myContentType === "myComments"));
        if (postToReport && postToReport.reportedByCurrentUser) {
            setModalProps({
                title: "알림", message: "이미 신고한 게시글입니다.",
                confirmText: "확인", type: "warning", confirmButtonType: 'primary'
            });
            setIsModalOpen(true); return;
        }

        setModalProps({
            title: "게시글 신고", message: `"${postTitle}" (ID: ${postId}) 게시글을 정말로 신고하시겠습니까?\n신고는 취소할 수 없습니다.`,
            onConfirm: () => processActualPostReport(postId),
            confirmText: "신고하기", cancelText: "취소", type: "warning", confirmButtonType: 'danger'
        });
        setIsModalOpen(true);
    };

    const handleRowClick = (item) => {
        const isCommentView = activeTab === "myActivity" && myContentType === "myComments";
        if (isCommentView) {
            if (item.postId) {
                navigate(`/freeboardDetail/${item.postId}?commentId=${item.commentId}`);
            } else {
                console.warn("Original post ID not found for this comment, cannot navigate.");
            }
        } else { // 게시글 클릭 시
            navigate(`/freeboardDetail/${item.postId}`);
        }
    };

    const handleWriteButtonClick = () => {
        if (!isUserLoggedIn()) {
            setIsModalOpen(true);
            setModalProps({
                title: "로그인 필요", message: "글을 작성하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
                confirmText: "로그인", cancelText: "취소", onConfirm: () => navigate("/login"), type: 'warning'
            });
            return;
        }
        navigate("/freeboardWrite");
    };

    return (
        <>
            <div className={FreeBoardStyle["board-container"]}>
                {/* Header, Banner, Controls 등 이전과 동일 */}
                <div className={FreeBoardStyle["board-header"]}>
                    <Link to="/freeboard" className={FreeBoardStyle["board-title-link"]}><h1>자유게시판</h1></Link>
                    <nav className={FreeBoardStyle["board-navigation"]}>
                        <button className={`${FreeBoardStyle["nav-button"]} ${activeTab === "all" ? FreeBoardStyle["active-tab"] : FreeBoardStyle["inactive-tab"]}`} onClick={() => handleTabClick("all")}>전체 목록</button>
                        <button className={`${FreeBoardStyle["nav-button"]} ${activeTab === "myActivity" ? FreeBoardStyle["active-tab"] : FreeBoardStyle["inactive-tab"]}`} onClick={() => handleTabClick("myActivity")}>내 활동</button>
                    </nav>
                </div>
                <div className={FreeBoardStyle["board-banner"]}><img src={banner} alt="게시판 배너" /></div>

                <div className={FreeBoardStyle["board-controls"]}>
                    <div className={FreeBoardStyle["controls-left"]}>
                        <select name="sortOrder" id="sortOrderSelect" className={`${FreeBoardStyle["sort-select"]} ${FreeBoardStyle["control-element"]}`} value={sortOption} onChange={handleSortChange}>
                            <option value="latest">최신순</option>
                            {!(activeTab === "myActivity" && myContentType === "myComments") && <option value="views">조회순</option>}
                            <option value="likes">좋아요순</option>
                        </select>

                        {activeTab === "myActivity" && (
                            <select name="myContentType" id="myContentTypeSelect" className={`${FreeBoardStyle["type-select"]} ${FreeBoardStyle["control-element"]}`} value={myContentType} onChange={handleMyContentTypeChange}>
                                <option value="myPosts">내 게시글</option>
                                <option value="myComments">내 댓글</option>
                            </select>
                        )}
                    </div>
                    <form onSubmit={handleSearchSubmit} className={FreeBoardStyle["search-area"]}>
                        <input type="text" placeholder="Search" className={`${FreeBoardStyle["search-input"]} ${FreeBoardStyle["control-element"]}`} aria-label="게시글 검색" value={searchQuery} onChange={handleSearchInputChange} />
                        <button type="submit" className={`${FreeBoardStyle["search-button"]} ${FreeBoardStyle["control-element"]}`} aria-label="검색"><img src={searchButtonIcon} alt="검색 아이콘" className={FreeBoardStyle["search-button-icon"]} /></button>
                    </form>
                </div>

                <div className={FreeBoardStyle["board-list-container"]}>
                    <table className={FreeBoardStyle["board-table"]}>
                        <thead>
                            <tr>
                                <th scope="col">NO</th>
                                <th scope="col">타입</th>
                                <th scope="col">제목/내용</th>
                                <th scope="col">작성자</th>
                                <th scope="col">날짜</th>
                                {/* "내 활동" 탭에서 "내 댓글" 보기 시 조회수 컬럼 숨김 */}
                                {!(activeTab === "myActivity" && myContentType === "myComments") && <th scope="col">조회수</th>}
                                <th scope="col">좋아요</th>
                                <th scope="col">신고</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={activeTab === "myActivity" && myContentType === "myComments" ? "7" : "8"}>로딩 중...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={activeTab === "myActivity" && myContentType === "myComments" ? "7" : "8"}>{error}</td></tr>
                            ) : items.length > 0 ? (
                                items.map((item, index) => {
                                    const isMyActivityTab = activeTab === "myActivity";
                                    const isCommentViewInMyActivity = isMyActivityTab && myContentType === "myComments";

                                    const itemId = isCommentViewInMyActivity ? item.commentId : item.postId;
                                    const itemTitleOrContent = isCommentViewInMyActivity ? item.commentContent : item.postTitle;
                                    const displayTitle = itemTitleOrContent?.length > 30 ? itemTitleOrContent.substring(0, 30) + "..." : itemTitleOrContent;

                                    const typeText = isCommentViewInMyActivity ? "댓글" : "글";
                                    const author = item.userNickName || "알 수 없는 사용자";
                                    const date = formatDate(isCommentViewInMyActivity ? item.commentCreatedAt : item.postCreatedAt);
                                    const views = isCommentViewInMyActivity ? "-" : (item.postViewCount !== undefined ? item.postViewCount : "-");
                                    const likes = isCommentViewInMyActivity ? (item.commentLikeCount || 0) : (item.postLikeCount || 0);
                                    const isLiked = item.likedByCurrentUser || false;

                                    // 신고 가능 여부 및 상태 결정
                                    let canReport = false;
                                    let isAlreadyReportedByMe = false;
                                    let isMyOwnItem = false;

                                    if (isUserLoggedIn()) {
                                        const loggedInUserId = getUserId();
                                        isMyOwnItem = item.userId === loggedInUserId; // item.userId는 게시글/댓글 작성자 ID
                                    }

                                    if (!isCommentViewInMyActivity) { // 게시글인 경우 (전체목록 탭 또는 내 활동-내 게시글 탭)
                                        if (isMyActivityTab) { // 내 활동 - 내 게시글 탭: 내 글이므로 신고 불가
                                            canReport = false;
                                        } else { // 전체 목록 탭
                                            canReport = !isMyOwnItem; // 내 글이 아니면 신고 가능
                                            if (canReport) {
                                                isAlreadyReportedByMe = item.reportedByCurrentUser || false;
                                            }
                                        }
                                    }
                                    // isCommentViewInMyActivity (내 활동 - 내 댓글)의 경우 canReport는 false로 유지 (신고 버튼 없음)


                                    return (
                                        <tr key={itemId || `item-${index}-${Date.now()}`} onClick={() => handleRowClick(item)} className={FreeBoardStyle["board-row"]}>
                                            <td>{itemId}</td>
                                            <td>{typeText}</td>
                                            <td className={FreeBoardStyle["post-title"]} onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}>
                                                <Link to={isCommentViewInMyActivity ? `/freeboardDetail/${item.postId}?commentId=${item.commentId}` : `/freeboardDetail/${item.postId}`}>
                                                    {displayTitle}
                                                    {isCommentViewInMyActivity && item.postTitle && <span className={FreeBoardStyle["comment-original-post"]}> (원본글: {item.postTitle?.length > 10 ? item.postTitle.substring(0, 10) + "..." : item.postTitle})</span>}
                                                </Link>
                                            </td>
                                            <td>{author}</td>
                                            <td>{date}</td>
                                            {/* "내 활동" 탭에서 "내 댓글" 보기 시 조회수 컬럼 숨김 */}
                                            {!(isCommentViewInMyActivity) && <td>{views}</td>}
                                            <td>
                                                <button
                                                    className={`${FreeBoardStyle["like-button"]} ${isLiked ? FreeBoardStyle.toggled : ""}`}
                                                    onClick={(e) => handleItemLikeToggle(e, itemId, isCommentViewInMyActivity ? "comment" : "post")}
                                                    aria-pressed={isLiked}
                                                    aria-label={isLiked ? "좋아요 취소" : "좋아요"}
                                                >
                                                    <img src={isLiked ? likeOnIcon : likeOffIcon} alt={isLiked ? "좋아요 된 상태" : "좋아요 안된 상태"} className={FreeBoardStyle["button-icon"]} />
                                                </button>
                                                <span className={FreeBoardStyle["like-count"]}>{likes}</span>
                                            </td>
                                            <td>
                                                {/* 신고 버튼 렌더링 조건:
                                                    1. "내 활동" 탭이 아닐 때 (즉, "전체 목록" 탭일 때)
                                                        AND 내 글이 아닐 때 신고 버튼을 보여준다.
                                                    2. "내 활동" 탭의 "내 게시글" 보기일 때는 내 글이므로 신고 버튼을 보여주지 않는다. (canReport = false)
                                                    3. "내 활동" 탭의 "내 댓글" 보기일 때는 신고 버튼을 보여주지 않는다. (canReport = false)
                                                */}
                                                {/* "전체 목록" 탭이고, "게시글"이며, "내 글"이 아닐 때만 신고 버튼을 활성화된 형태로 고려.
                                                   그 외 (내 활동 탭 전체, 전체 목록 탭의 내 글)는 "-" 표시.
                                                */}
                                                {(canReport && !isMyActivityTab && !isCommentViewInMyActivity) ? (
                                                    <button
                                                        className={`${FreeBoardStyle["report-button"]} ${isAlreadyReportedByMe ? FreeBoardStyle.toggled : ""}`}
                                                        onClick={(e) => handlePostReportToggle(e, itemId, itemTitleOrContent)}
                                                        aria-pressed={isAlreadyReportedByMe}
                                                        disabled={isAlreadyReportedByMe} // 내가 이미 신고했으면 비활성화
                                                        aria-label={isAlreadyReportedByMe ? "신고됨" : "신고하기"}
                                                    >
                                                        <img src={isAlreadyReportedByMe ? reportOnIcon : reportOffIcon} alt={isAlreadyReportedByMe ? "신고 된 상태" : "신고 안된 상태"} className={FreeBoardStyle["button-icon"]} />
                                                    </button>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={activeTab === "myActivity" && myContentType === "myComments" ? "7" : "8"}>표시할 내용이 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer (Pagination, Write Button) - 이전과 동일 */}
                <div className={FreeBoardStyle["board-footer"]}>
                    <div className={FreeBoardStyle["pagination-wrapper"]}>
                        {totalPages > 0 && (<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />)}
                    </div>
                    <div className={FreeBoardStyle["write-button-container"]}>
                        <button onClick={handleWriteButtonClick} className={FreeBoardStyle["write-button"]}>작성</button>
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalProps} />
        </>
    );
}

export default FreeBoard;