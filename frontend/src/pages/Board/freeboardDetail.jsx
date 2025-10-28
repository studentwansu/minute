// src/pages/Board/FreeboardDetail.jsx
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import freeboardDetailStyle from '../../assets/styles/freeboardDetail.module.css';

import reportOffIcon from "../../assets/images/able-alarm.png";
import likeOffIcon from "../../assets/images/b_thumbup.png";
import reportOnIcon from "../../assets/images/disable-alarm.png";
import likeOnIcon from "../../assets/images/thumbup.png";

import Modal from '../../components/Modal/Modal';
import Pagination from '../../components/Pagination/Pagination';

const API_BASE_URL = "http://localhost:8080/api/v1";

function FreeboardDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentPageInfo, setCommentPageInfo] = useState({
        currentPage: 1,
        totalPages: 0,
        totalElements: 0,
    });
    const commentsPerPage = 5;

    const [commentInput, setCommentInput] = useState('');
    const [isLoadingPost, setIsLoadingPost] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [error, setError] = useState(null);

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [currentEditText, setCurrentEditText] = useState('');
    const editInputRef = useRef(null);
    const commentsEndRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary', onCancel: () => setIsModalOpen(false)
    });

    const getToken = () => localStorage.getItem("token");
    const getLoggedInUserId = () => localStorage.getItem("userId");
    const isUserLoggedIn = () => !!getToken();

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return `${date.getFullYear().toString().slice(-2)}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
        } catch (e) {
            return "N/A";
        }
    };

    const fetchPostDetail = useCallback(async () => {
        setIsLoadingPost(true);
        setError(null);
        try {
            const headers = {};
            const token = getToken();
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await axios.get(`${API_BASE_URL}/board/free/${postId}`, { headers });
            setPost(response.data);
        } catch (err) {
            console.error("Error fetching post detail:", err);
            setError(err.response?.data?.message || "게시글을 불러오는 데 실패했습니다. 존재하지 않거나 삭제된 게시글일 수 있습니다.");
            setPost(null);
        } finally {
            setIsLoadingPost(false);
        }
    }, [postId]);

    const fetchComments = useCallback(async (page = 1) => {
        if (!postId) return;
        setIsLoadingComments(true);
        try {
            const headers = {};
            const token = getToken();
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await axios.get(`${API_BASE_URL}/board/free/${postId}/comments`, {
                params: { page: page - 1, size: commentsPerPage, sort: "commentCreatedAt,asc" },
                headers
            });
            const data = response.data;
            setComments(data.content || []);
            setCommentPageInfo({
                currentPage: data.currentPage ? data.currentPage + 1 : 1,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0,
            });
        } catch (err) {
            console.error("Error fetching comments:", err);
            setComments([]);
            setCommentPageInfo({ currentPage: 1, totalPages: 0, totalElements: 0 });
        } finally {
            setIsLoadingComments(false);
        }
    }, [postId, commentsPerPage]);

    // [수정된 부분] 새로운 데이터 로딩 useEffect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const targetCommentId = params.get('commentId');

        const initializePage = async () => {
            // 게시글 정보를 먼저 불러옵니다.
            await fetchPostDetail();

            let pageToFetch = 1; // 기본적으로 댓글 1페이지를 불러옵니다.

            // 만약 URL에 commentId가 있다면, 해당 댓글이 속한 페이지를 조회합니다.
            if (targetCommentId) {
                try {
                    // 백엔드에 새로 만든 API를 호출합니다.
                    const response = await axios.get(`${API_BASE_URL}/board/free/comments/page`, {
                        params: {
                            commentId: targetCommentId,
                            size: commentsPerPage // 기존에 정의된 페이지 당 댓글 수 변수
                        },
                        // ▼▼▼ 이 부분이 정확히 있는지 확인해주세요 ▼▼▼
                        headers: { Authorization: `Bearer ${getToken()}` }
                    });
                    pageToFetch = response.data.page; // 백엔드로부터 받은 페이지 번호
                    console.log(`Target comment is on page: ${pageToFetch}`);
                } catch (err) {
                    console.error("해당 댓글의 페이지 번호를 가져오는 데 실패했습니다:", err);
                    // 실패 시에도 기본 1페이지를 로드하도록 pageToFetch는 1로 유지됩니다.
                }
            }

            // 최종적으로 결정된 페이지의 댓글 목록을 불러옵니다.
            fetchComments(pageToFetch);
        };

        initializePage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId, location.search]);

    // 기존 스크롤 useEffect (이 로직은 이제 정상 동작합니다)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const targetCommentId = params.get('commentId');
        if (targetCommentId && comments.length > 0) {
            const commentElement = document.getElementById(`comment-${targetCommentId}`);
            if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [location.search, comments]);

    useEffect(() => {
        if (editingCommentId && editInputRef.current) {
            editInputRef.current.focus();
            const len = editInputRef.current.value.length;
            editInputRef.current.selectionStart = len;
            editInputRef.current.selectionEnd = len;
        }
    }, [editingCommentId]);

    const handleCommentPageChange = (pageNumber) => {
        fetchComments(pageNumber);
    };

    const handlePostLikeClick = async () => {
        if (!isUserLoggedIn()) {
            setModalProps({
                title: "로그인 필요", message: "좋아요는 로그인 후 가능합니다.",
                type: 'warning', confirmText: "로그인", cancelText: "취소",
                onConfirm: () => navigate("/login")
            });
            setIsModalOpen(true);
            return;
        }

        if (!post) return;
        try {
            const token = getToken();
            const response = await axios.post(`${API_BASE_URL}/board/free/${post.postId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setPost(prevPost => ({
                ...prevPost,
                likedByCurrentUser: data.likedByCurrentUser,
                postLikeCount: data.currentLikeCount,
            }));
        } catch (err) {
            setModalProps({ title: "오류", message: err.response?.data?.message || "좋아요 처리에 실패했습니다.", type: 'error' });
            setIsModalOpen(true);
        }
    };

    const processPostReport = async () => {
        if (!isUserLoggedIn() || !post || post.userId === getLoggedInUserId() || post.reportedByCurrentUser) return;
        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/board/free/${post.postId}/report`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setPost(prev => ({ ...prev, reportedByCurrentUser: true }));
            setModalProps({ title: '신고 완료', message: '게시물이 성공적으로 신고되었습니다.', type: 'success', confirmButtonType: 'primary' });
        } catch (err) {
            setModalProps({ title: '오류', message: err.response?.data?.message || "게시글 신고에 실패했습니다.", type: 'error' });
        } finally {
            setIsModalOpen(true);
        }
    };
    const handlePostReportClick = () => {
        if (!isUserLoggedIn()) {
            setModalProps({ title: "로그인 필요", message: "신고는 로그인 후 가능합니다.", type: 'warning', onConfirm: () => navigate("/login") });
            setIsModalOpen(true); return;
        }
        if (!post || post.reportedByCurrentUser || post.userId === getLoggedInUserId()) return;
        setModalProps({
            title: '게시물 신고', message: '이 게시물을 신고하시겠습니까?\n신고 후에는 취소할 수 없습니다.',
            onConfirm: processPostReport, confirmText: '신고하기', cancelText: '취소', type: 'warning', confirmButtonType: 'danger'
        });
        setIsModalOpen(true);
    };

    const handlePostEditClick = () => {
        if (post && isUserLoggedIn() && post.userId === getLoggedInUserId()) {
            navigate(`/freeboardEdit/${post.postId}`);
        } else if (!isUserLoggedIn()) {
            setModalProps({ title: "로그인 필요", message: "수정은 로그인 후 가능합니다.", type: 'warning', onConfirm: () => navigate("/login") });
            setIsModalOpen(true);
        } else {
            setModalProps({ title: '권한 없음', message: '본인이 작성한 글만 수정할 수 있습니다.', type: 'error' });
            setIsModalOpen(true);
        }
    };

    const processPostDelete = async () => {
        if (!isUserLoggedIn() || !post || post.userId !== getLoggedInUserId()) return;
        try {
            const token = getToken();
            await axios.delete(`${API_BASE_URL}/board/free/${post.postId}`, { headers: { Authorization: `Bearer ${token}` } });
            setModalProps({ title: '삭제 완료', message: '게시글이 삭제되었습니다.', onConfirm: () => navigate('/freeboard'), type: 'success', confirmButtonType: 'primary' });
            setIsModalOpen(true);
        } catch (err) {
            setModalProps({ title: '오류', message: err.response?.data?.message || "게시글 삭제에 실패했습니다.", type: 'error' });
            setIsModalOpen(true);
        }
    };
    const handlePostDeleteClick = () => {
        if (post && isUserLoggedIn() && post.userId === getLoggedInUserId()) {
            setModalProps({
                title: '게시글 삭제', message: `"${post.postTitle}" 게시글을 정말로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`,
                onConfirm: processPostDelete, confirmText: '삭제', cancelText: '취소', type: 'warning', confirmButtonType: 'danger'
            });
            setIsModalOpen(true);
        } else if (!isUserLoggedIn()) {
            setModalProps({ title: "로그인 필요", message: "삭제는 로그인 후 가능합니다.", type: 'warning', onConfirm: () => navigate("/login") });
            setIsModalOpen(true);
        } else {
            setModalProps({ title: '권한 없음', message: '본인이 작성한 글만 삭제할 수 있습니다.', type: 'error' });
            setIsModalOpen(true);
        }
    };

    const handleCommentLikeToggle = async (commentId) => {
        if (!isUserLoggedIn()) {
            setModalProps({
                title: "로그인 필요", message: "좋아요는 로그인 후 가능합니다.",
                type: 'warning', confirmText: "로그인", cancelText: "취소",
                onConfirm: () => navigate("/login")
            });
            setIsModalOpen(true);
            return;
        }
        try {
            const token = getToken();
            const response = await axios.post(`${API_BASE_URL}/board/free/comments/${commentId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setComments(prevComments => prevComments.map(c =>
                c.commentId === commentId ? { ...c, likedByCurrentUser: data.likedByCurrentUser, commentLikeCount: data.currentLikeCount } : c
            ));
        } catch (err) {
            setModalProps({ title: "오류", message: err.response?.data?.message || "댓글 좋아요 처리에 실패했습니다.", type: 'error' });
            setIsModalOpen(true);
        }
    };

    const processCommentReport = async (commentIdToReport) => {
        if (!isUserLoggedIn()) return;
        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/board/free/comments/${commentIdToReport}/report`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setComments(prev => prev.map(c => c.commentId === commentIdToReport ? { ...c, reportedByCurrentUser: true } : c));
            setModalProps({ title: '신고 완료', message: `댓글 ID ${commentIdToReport}이(가) 신고되었습니다.`, type: 'success', confirmButtonType: 'primary' });
        } catch (err) {
            setModalProps({ title: '오류', message: err.response?.data?.message || "댓글 신고에 실패했습니다.", type: 'error' });
        } finally {
            setIsModalOpen(true);
        }
    };
    const handleCommentReportClick = (comment) => {
        if (!isUserLoggedIn()) {
            setModalProps({ title: "로그인 필요", message: "신고는 로그인 후 가능합니다.", type: 'warning', onConfirm: () => navigate("/login") });
            setIsModalOpen(true); return;
        }

        if (comment.reportedByCurrentUser || comment.userId === getLoggedInUserId() || comment.authorRole === 'ADMIN') {
            if (comment.userId === getLoggedInUserId()) {
                setModalProps({ title: '신고 불가', message: '자신의 댓글은 신고할 수 없습니다.', type: 'warning' });
                setIsModalOpen(true);
            } else if (comment.authorRole === 'ADMIN') {
                setModalProps({ title: '신고 불가', message: '관리자 댓글은 신고할 수 없습니다.', type: 'warning' });
                setIsModalOpen(true);
            } else if (comment.reportedByCurrentUser) {
                setModalProps({ title: '알림', message: '이미 신고한 댓글입니다.', type: 'info' });
                setIsModalOpen(true);
            }
            return;
        }
        setModalProps({
            title: '댓글 신고', message: '이 댓글을 신고하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
            onConfirm: () => processCommentReport(comment.commentId), confirmText: '신고하기', cancelText: '취소', type: 'warning', confirmButtonType: 'danger'
        });
        setIsModalOpen(true);
    };

    const processCommentDelete = async (commentIdToDelete) => {
        if (!isUserLoggedIn()) return;
        try {
            const token = getToken();
            await axios.delete(`${API_BASE_URL}/board/free/comments/${commentIdToDelete}`, { headers: { Authorization: `Bearer ${token}` } });
            setModalProps({ title: '삭제 완료', message: '댓글이 삭제되었습니다.', type: 'success', confirmButtonType: 'primary' });
            setIsModalOpen(true);

            const newTotalElements = Math.max(0, (commentPageInfo.totalElements || 0) - 1);
            const newTotalPages = Math.ceil(newTotalElements / commentsPerPage);

            let pageToFetch = commentPageInfo.currentPage;
            if (pageToFetch > newTotalPages && newTotalPages > 0) {
                pageToFetch = newTotalPages;
            }
            fetchComments(pageToFetch);

        } catch (err) {
            setModalProps({ title: '오류', message: err.response?.data?.message || "댓글 삭제에 실패했습니다.", type: 'error' });
            setIsModalOpen(true);
        }
    };
    const handleCommentDeleteClick = (comment) => {
        if (isUserLoggedIn() && comment.userId === getLoggedInUserId()) {
            setModalProps({
                title: '댓글 삭제', message: `댓글을 정말로 삭제하시겠습니까?`,
                onConfirm: () => processCommentDelete(comment.commentId), confirmText: '삭제', cancelText: '취소', type: 'warning', confirmButtonType: 'danger'
            });
            setIsModalOpen(true);
        } else if (!isUserLoggedIn()) {
            setModalProps({ title: "로그인 필요", message: "삭제는 로그인 후 가능합니다.", type: 'warning', onConfirm: () => navigate("/login") });
            setIsModalOpen(true);
        } else {
            setModalProps({ title: '권한 없음', message: '본인이 작성한 댓글만 삭제할 수 있습니다.', type: 'error' });
            setIsModalOpen(true);
        }
    };

    const handleCommentInputChange = (event) => setCommentInput(event.target.value);

    const handleCommentFormSubmit = async (event) => {
        event.preventDefault();
        if (!isUserLoggedIn()) {
            setModalProps({ title: "로그인 필요", message: "댓글 작성은 로그인 후 가능합니다.", type: 'warning', onConfirm: () => navigate("/login") });
            setIsModalOpen(true); return;
        }
        if (!commentInput.trim()) {
            setModalProps({ title: '입력 오류', message: '댓글 내용을 입력해주세요.', type: 'warning' });
            setIsModalOpen(true); return;
        }

        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/board/free/${postId}/comments`,
                { commentContent: commentInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCommentInput('');

            const newTotalComments = commentPageInfo.totalElements + 1;
            const newTotalPages = Math.ceil(newTotalComments / commentsPerPage);
            fetchComments(newTotalPages > 0 ? newTotalPages : 1);

            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);

        } catch (err) {
            setModalProps({ title: '오류', message: err.response?.data?.message || "댓글 등록에 실패했습니다.", type: 'error' });
            setIsModalOpen(true);
        }
    };

    const handleCommentDoubleClick = (comment) => {
        if (isUserLoggedIn() && comment.userId === getLoggedInUserId()) {
            setEditingCommentId(comment.commentId);
            setCurrentEditText(comment.commentContent);
        }
    };
    const handleCommentEditChange = (event) => setCurrentEditText(event.target.value);

    const saveCommentEdit = async (commentId) => {
        if (!isUserLoggedIn()) return false;
        if (!currentEditText.trim()) {
            setModalProps({ title: '입력 오류', message: '댓글 내용은 비워둘 수 없습니다.', type: 'warning' });
            setIsModalOpen(true);
            const originalComment = comments.find(c => c.commentId === commentId);
            if (originalComment) setCurrentEditText(originalComment.commentContent);
            return false;
        }

        try {
            const token = getToken();
            const response = await axios.put(`${API_BASE_URL}/board/free/comments/${commentId}`,
                { commentContent: currentEditText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments(prevComments =>
                prevComments.map(c => c.commentId === commentId ? { ...c, ...response.data, likedByCurrentUser: c.likedByCurrentUser } : c)
            );
            setEditingCommentId(null);
            return true;
        } catch (err) {
            setModalProps({ title: '오류', message: err.response?.data?.message || "댓글 수정에 실패했습니다.", type: 'error' });
            setIsModalOpen(true);
            return false;
        }
    };
    const cancelCommentEdit = () => { setEditingCommentId(null); };
    const handleCommentEditKeyDown = (commentId, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            saveCommentEdit(commentId);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelCommentEdit();
        }
    };

    if (isLoadingPost) return <div className={freeboardDetailStyle.loadingContainer}>게시글을 불러오는 중입니다...</div>;
    if (error) return <div className={freeboardDetailStyle.errorContainer}>오류: {error} <button onClick={() => { fetchPostDetail(); fetchComments(1); }}>다시 시도</button></div>;
    if (!post) return <div className={freeboardDetailStyle.errorContainer}>게시글을 찾을 수 없습니다. <Link to="/freeboard">목록으로</Link></div>;

    const isPostAuthor = isUserLoggedIn() && post.userId === getLoggedInUserId();

    return (
        <>
            <div className={freeboardDetailStyle.pageContainer}>
                <div className={freeboardDetailStyle.boardLinkContainer}>
                    <Link to="/freeboard"><h2>자유게시판</h2></Link>
                </div>

                <div className={freeboardDetailStyle.postContentContainer}>
                    <h1 className={freeboardDetailStyle.postTitle}>{post.postTitle}</h1>
                    <div className={freeboardDetailStyle.postMeta}>
                        <div>
                            <span className={freeboardDetailStyle.postAuthor}> {post.userNickName || '알 수 없는 사용자'}</span>
                            <span className={freeboardDetailStyle.postCreatedAt}>{formatDate(post.postCreatedAt)}</span>
                        </div>
                    </div>
                    <div className={freeboardDetailStyle.postSubMeta}>
                        <div className={freeboardDetailStyle.postStats}>
                            <button
                                onClick={handlePostLikeClick}
                                className={`${freeboardDetailStyle.iconButton} ${post.likedByCurrentUser ? freeboardDetailStyle.liked : ''}`}
                                title={post.likedByCurrentUser ? "좋아요 취소" : "좋아요"}
                            >
                                <img src={post.likedByCurrentUser ? likeOnIcon : likeOffIcon} alt="좋아요" className={freeboardDetailStyle.buttonIcon} />
                            </button>
                            <span className={freeboardDetailStyle.countText}>좋아요: {post.postLikeCount}</span>
                            <span className={freeboardDetailStyle.countText}>조회수: {post.postViewCount}</span>
                        </div>
                        {!isPostAuthor && (
                            <button
                                onClick={handlePostReportClick}
                                className={`${freeboardDetailStyle.iconButton} ${post.reportedByCurrentUser ? freeboardDetailStyle.reported : ''}`}
                                disabled={post.reportedByCurrentUser}
                                title={post.reportedByCurrentUser ? "신고됨" : "신고하기"}
                            >
                                <img src={post.reportedByCurrentUser ? reportOnIcon : reportOffIcon} alt="신고" className={freeboardDetailStyle.buttonIcon} />
                            </button>
                        )}
                    </div>
                    <div className={freeboardDetailStyle.postBody}>
                        {post.postContent.split('\n').map((line, index) => (
                            <React.Fragment key={`post-line-${index}`}>{line}{index < post.postContent.split('\n').length - 1 && <br />}</React.Fragment>
                        ))}
                    </div>
                    {isPostAuthor && (
                        <div className={freeboardDetailStyle.postActions}>
                            <button onClick={handlePostEditClick} className={`${freeboardDetailStyle.actionButton} ${freeboardDetailStyle.editButton}`}>수정</button>
                            <button onClick={handlePostDeleteClick} className={`${freeboardDetailStyle.actionButton} ${freeboardDetailStyle.deleteButton}`}>삭제</button>
                        </div>
                    )}
                </div>

                <form className={freeboardDetailStyle.commentInputContainer} onSubmit={handleCommentFormSubmit}>
                    <textarea
                        placeholder={isUserLoggedIn() ? "따뜻한 댓글을 남겨주세요 :)" : "댓글을 작성하려면 로그인해주세요."}
                        className={freeboardDetailStyle.commentTextarea}
                        value={commentInput}
                        onChange={handleCommentInputChange}
                        rows="3"
                    />
                    <button type="submit" className={freeboardDetailStyle.commentSubmitButton} disabled={!commentInput.trim()}>등록</button>
                </form>

                <div className={freeboardDetailStyle.commentListContainer}>
                    <h3>댓글 ({commentPageInfo.totalElements || 0})</h3>
                    {isLoadingComments ? <p>댓글 로딩 중...</p> : comments.length > 0 ? (
                        comments.map(comment => {
                            const isOwnComment = isUserLoggedIn() && comment.userId === getLoggedInUserId();
                            const isAdminComment = comment.authorRole === 'ADMIN';
                            const isCommentReportedByCurrentUser = comment.reportedByCurrentUser || false;

                            return (
                                <div key={comment.commentId} id={`comment-${comment.commentId}`} className={freeboardDetailStyle.commentItem}>
                                    <div className={freeboardDetailStyle.commentMeta}>
                                        <div>
                                            <span className={`${freeboardDetailStyle.commentAuthor} ${isAdminComment ? freeboardDetailStyle.adminAuthor : ''}`}>
                                                {comment.userNickName || '알 수 없는 사용자'}
                                                {isAdminComment && <span className={freeboardDetailStyle.adminBadge}>관리자</span>}
                                            </span>
                                            <span className={freeboardDetailStyle.commentCreatedAt}>{formatDate(comment.commentCreatedAt)}</span>
                                        </div>
                                        {isOwnComment && !isAdminComment && editingCommentId !== comment.commentId && (
                                            <div className={freeboardDetailStyle.commentUserActions}>
                                                <button
                                                    onClick={() => handleCommentDoubleClick(comment)}
                                                    className={`${freeboardDetailStyle.actionButton} ${freeboardDetailStyle.editCommentButton}`}>
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleCommentDeleteClick(comment)}
                                                    className={`${freeboardDetailStyle.actionButton} ${freeboardDetailStyle.deleteButton} ${freeboardDetailStyle.commentDeleteButton}`}>
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingCommentId === comment.commentId && isOwnComment ? (
                                        <div className={freeboardDetailStyle.commentEditForm}>
                                            <textarea
                                                ref={editInputRef}
                                                className={freeboardDetailStyle.commentEditTextarea}
                                                value={currentEditText}
                                                onChange={handleCommentEditChange}
                                                onKeyDown={(e) => handleCommentEditKeyDown(comment.commentId, e)}
                                                rows="3"
                                            />
                                            <div className={freeboardDetailStyle.editActionsContainer}>
                                                <button type="button" onClick={() => saveCommentEdit(comment.commentId)} className={`${freeboardDetailStyle.actionButton} ${freeboardDetailStyle.saveCommentButton}`}>저장</button>
                                                <button type="button" onClick={() => cancelCommentEdit()} className={`${freeboardDetailStyle.actionButton} ${freeboardDetailStyle.cancelEditButton}`}>취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p
                                            className={freeboardDetailStyle.commentContent}
                                            onDoubleClick={() => isOwnComment && !isAdminComment && handleCommentDoubleClick(comment)}
                                            title={isOwnComment && !isAdminComment ? "더블클릭하여 수정" : ""}
                                        >
                                            {comment.commentContent.split('\n').map((line, index) => (
                                                <React.Fragment key={`comment-line-${comment.commentId}-${index}`}>{line}{index < comment.commentContent.split('\n').length - 1 && <br />}</React.Fragment>
                                            ))}
                                        </p>
                                    )}

                                    <div className={freeboardDetailStyle.commentActions}>
                                        <div>
                                            <button
                                                onClick={() => handleCommentLikeToggle(comment.commentId)}
                                                className={`${freeboardDetailStyle.iconButton} ${comment.likedByCurrentUser ? freeboardDetailStyle.liked : ''}`}
                                                title={comment.likedByCurrentUser ? "좋아요 취소" : "좋아요"}
                                            >
                                                <img src={comment.likedByCurrentUser ? likeOnIcon : likeOffIcon} alt="댓글 좋아요" className={freeboardDetailStyle.buttonIcon} />
                                            </button>
                                            <span className={freeboardDetailStyle.countText}>{comment.commentLikeCount}</span>
                                        </div>
                                        {!isOwnComment && !isAdminComment && (
                                            <button
                                                onClick={() => handleCommentReportClick(comment)}
                                                className={`${freeboardDetailStyle.iconButton} ${isCommentReportedByCurrentUser ? freeboardDetailStyle.reported : ''}`}
                                                disabled={isCommentReportedByCurrentUser}
                                                title={isCommentReportedByCurrentUser ? "신고됨" : "신고하기"}
                                            >
                                                <img src={isCommentReportedByCurrentUser ? reportOnIcon : reportOffIcon} alt="댓글 신고" className={freeboardDetailStyle.buttonIcon} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className={freeboardDetailStyle.noComments}>
                            등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!
                        </p>
                    )}
                </div>

                {commentPageInfo.totalElements > 0 && commentPageInfo.totalPages > 1 && (
                    <div className={freeboardDetailStyle.commentPaginationContainer}>
                        <Pagination
                            currentPage={commentPageInfo.currentPage}
                            totalPages={commentPageInfo.totalPages}
                            onPageChange={handleCommentPageChange}
                            pageNeighbours={1}
                        />
                    </div>
                )}
                <div ref={commentsEndRef} />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                {...modalProps}
            />
        </>
    );
}

export default FreeboardDetail;