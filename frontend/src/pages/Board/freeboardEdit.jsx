// src/pages/Board/FreeboardEdit.jsx
import axios from 'axios'; // axios import
import { useCallback, useEffect, useState } from 'react'; // useCallback 추가
import { Link, useNavigate, useParams } from 'react-router-dom';
import banner from "../../assets/images/banner.png";
import freeboardEditStyle from '../../assets/styles/freeboardEdit.module.css';
import Modal from '../../components/Modal/Modal';

const API_BASE_URL = "http://localhost:8080/api/v1";

function FreeboardEdit() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const freeboardPath = '/freeboard';
    // 상세 페이지 경로는 postId가 유효할 때만 설정, 아니면 목록으로
    const freeboardDetailPath = postId ? `/freeboardDetail/${postId}` : freeboardPath;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [originalData, setOriginalData] = useState(null); // 원본 데이터 보관용
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary', onCancel: () => setIsModalOpen(false)
    });

    const getToken = () => localStorage.getItem("token");
    const getLoggedInUserId = () => localStorage.getItem("userId");
    // const isUserLoggedIn = () => !!getToken(); // ProtectedRoute에서 처리 가정

    // 게시글 데이터 불러오기
    const fetchPostData = useCallback(async () => {
        if (!postId || postId === "undefined" || postId === "null") {
            setModalProps({
                title: "잘못된 접근", message: "수정할 게시물 ID가 유효하지 않습니다. 목록으로 돌아갑니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'primary', // 'blackButton'은 CSS에 정의 필요
                onConfirm: () => { setIsModalOpen(false); navigate(freeboardPath); }
            });
            setIsModalOpen(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const token = getToken();
        if (!token) { // 수정 페이지는 로그인이 필수
            setModalProps({ title: "로그인 필요", message: "게시글을 수정하려면 로그인이 필요합니다.", type: 'warning', onConfirm: () => navigate('/login') });
            setIsModalOpen(true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/board/free/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const postData = response.data; // FreeboardPostResponseDTO

            // 작성자 확인
            if (postData.userId !== getLoggedInUserId()) {
                setModalProps({
                    title: "권한 없음", message: "본인이 작성한 글만 수정할 수 있습니다. 상세 페이지로 돌아갑니다.",
                    confirmText: "확인", type: "error",
                    onConfirm: () => { setIsModalOpen(false); navigate(freeboardDetailPath); }
                });
                setIsModalOpen(true);
                setIsLoading(false);
                return;
            }

            setTitle(postData.postTitle);
            setContent(postData.postContent);
            setOriginalData({ title: postData.postTitle, content: postData.postContent }); // 원본 데이터 저장
            setIsLoading(false);
        } catch (error) {
            console.error("게시물 데이터를 불러오는 데 실패했습니다.", error);
            setIsLoading(false);
            setModalProps({
                title: "데이터 로딩 실패",
                message: `게시물 정보를 불러오는 데 실패했습니다: ${error.response?.data?.message || error.message}\n목록으로 돌아갑니다.`,
                confirmText: "확인", type: "error",
                onConfirm: () => { setIsModalOpen(false); navigate(freeboardPath); }
            });
            setIsModalOpen(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId, navigate, freeboardPath, freeboardDetailPath]); // getLoggedInUserId는 변경되지 않는다고 가정

    useEffect(() => {
        fetchPostData();
    }, [fetchPostData]);


    const handleEditSubmit = async (event) => {
        event.preventDefault();
        if (!title.trim()) { /* ... 제목 입력 오류 모달 ... */ return; }
        if (!content.trim()) { /* ... 내용 입력 오류 모달 ... */ return; }

        // 변경 사항이 있는지 확인 (선택적)
        if (originalData && title === originalData.title && content === originalData.content) {
            setModalProps({ title: '변경 없음', message: '수정된 내용이 없습니다.', type: 'info' });
            setIsModalOpen(true);
            return;
        }

        setIsSubmitting(true);
        const token = getToken();
        // ProtectedRoute에서 이미 로그인 확인을 하지만, 여기서 한 번 더 토큰 유무 확인 가능
        if (!token) { /* ... 인증 오류 모달 (fetchPostData에서 이미 처리) ... */ setIsSubmitting(false); return; }

        try {
            await axios.put(
                `${API_BASE_URL}/board/free/${postId}`,
                { postTitle: title, postContent: content }, // FreeboardPostRequestDTO 형식
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setModalProps({
                title: '수정 완료', message: '게시글이 성공적으로 수정되었습니다.',
                confirmText: '확인', type: 'success', confirmButtonType: 'primary',
                onConfirm: () => { setIsModalOpen(false); navigate(freeboardDetailPath); } // 수정 후 상세 페이지로
            });
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error updating post:', error);
            setModalProps({
                title: '수정 실패', 
                message: error.response?.data?.message || '게시글 수정 중 오류가 발생했습니다.', 
                type: 'error'
            });
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        const hasChanges = originalData && (title !== originalData.title || content !== originalData.content);
        // 상세 페이지로 돌아가거나, postId가 없다면 목록으로
        const navigateTo = postId ? freeboardDetailPath : freeboardPath; 

        if (hasChanges) {
            setModalProps({
                title: '수정 취소', message: '변경사항이 저장되지 않았습니다.\n정말로 수정을 취소하시겠습니까?',
                confirmText: '예, 취소합니다', cancelText: '계속 수정',
                onConfirm: () => { setIsModalOpen(false); navigate(navigateTo); },
                onCancel: () => setIsModalOpen(false),
                type: 'warning', confirmButtonType: 'danger', cancelButtonType: 'secondary'
            });
            setIsModalOpen(true);
        } else {
            navigate(navigateTo);
        }
    };
    
    if (isLoading) return <div className={freeboardEditStyle.loadingState}>게시물 정보를 불러오는 중...</div>;
    // postId가 없거나, fetchPostData에서 권한 없음 등으로 인해 originalData가 설정되지 않은 경우 (이미 모달이 떠있을 수 있음)
    // 또는 로딩 후에도 originalData가 여전히 null이면 (오류로 인해) 폼을 보여주지 않음.
    if (!originalData && !isLoading) { 
        // useEffect에서 이미 모달을 띄우고 리다이렉션 처리를 하므로, 
        // 이 부분은 모달이 닫힌 후의 fallback UI 또는 null을 반환할 수 있습니다.
        // 아니면 로딩 중과 동일한 메시지를 보여줄 수도 있습니다.
        // return <div className={freeboardEditStyle.loadingState}>게시물 정보를 설정할 수 없습니다.</div>;
        return null; // 모달이 모든 안내를 담당하도록 함
    }


    return (
        <>
            <div className={freeboardEditStyle.background}>
                <div className={freeboardEditStyle.title}>
                    <Link to={freeboardPath} className={freeboardEditStyle.titleLink}>
                        <h1>자유게시판</h1>
                    </Link>
                </div>

                <form onSubmit={handleEditSubmit} className={freeboardEditStyle.contentArea}> 
                    <div className={freeboardEditStyle.img}>
                        <img src={banner} alt="자유게시판배너" />
                    </div> 

                    <div className={freeboardEditStyle.content}>
                        <label htmlFor="postEditTitle" className={freeboardEditStyle.label}>제목</label> 
                        <input 
                            type="text"
                            id="postEditTitle"
                            className={freeboardEditStyle.info} 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            disabled={isSubmitting}
                        />

                        <label htmlFor="postEditContent" className={`${freeboardEditStyle.label} ${freeboardEditStyle.contentLabel}`}>내용</label>
                        <textarea 
                            id="postEditContent"
                            className={freeboardEditStyle.textbox}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="내용을 입력하세요"
                            rows="10"
                            disabled={isSubmitting}
                        ></textarea>

                        <div className={freeboardEditStyle.edit}> {/* CSS 클래스명 확인 */}
                            <button 
                                type="button"
                                onClick={handleCancel}
                                className={`${freeboardEditStyle.submitButton} ${freeboardEditStyle.cancelButton || ''}`} // cancelButton CSS 정의 필요
                                style={{ marginRight: '10px', backgroundColor: '#6c757d', borderColor: '#6c757d' }} // CSS로 옮기는 것 권장
                                disabled={isSubmitting}
                            >
                                취소
                            </button>
                            <button 
                                type="submit"
                                className={freeboardEditStyle.submitButton}
                                disabled={isSubmitting || !title.trim() || !content.trim() || (originalData && title === originalData.title && content === originalData.content) }
                            >
                                {isSubmitting ? "수정 중..." : "수정 완료"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    // 특정 모달 확인 후 자동 이동이 필요 없다면 onConfirm에서 처리
                }}
                {...modalProps}
            />
        </>
    );
}

export default FreeboardEdit;