// src/pages/Board/FreeboardWrite.jsx
import axios from 'axios'; // axios import
import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import banner from "../../assets/images/banner.png";
import freeboardWriteStyle from "../../assets/styles/freeboardWrite.module.css";
import Modal from '../../components/Modal/Modal';

const API_BASE_URL = "http://localhost:8080/api/v1"; // API 기본 URL

function FreeboardWrite() {
    const freeboardPath = "/freeboard";
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 상태

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary', onCancel: () => setIsModalOpen(false)
    });

    const getToken = () => localStorage.getItem("token");
    // isUserLoggedIn 함수는 ProtectedRoute에서 이미 사용하고 있을 수 있지만, 
    // 만약 페이지 내에서도 추가적인 UI 제어가 필요하면 사용할 수 있습니다.
    // const isUserLoggedIn = () => !!getToken(); 

    const handleSubmit = async (event) => {
        event.preventDefault(); 
        if (!title.trim()) {
            setModalProps({
                title: '입력 오류', message: '제목을 입력해주세요.', confirmText: '확인',
                type: 'warning', confirmButtonType: 'primary'
            });
            setIsModalOpen(true);
            return;
        }
        if (!content.trim()) {
            setModalProps({
                title: '입력 오류', message: '내용을 입력해주세요.', confirmText: '확인',
                type: 'warning', confirmButtonType: 'primary'
            });
            setIsModalOpen(true);
            return;
        }

        setIsSubmitting(true); // 제출 시작
        const token = getToken();
        if (!token) {
            setModalProps({
                title: '인증 오류', message: '로그인이 필요합니다. 로그인 페이지로 이동합니다.', 
                confirmText: '확인', type: 'error',
                onConfirm: () => navigate('/login')
            });
            setIsModalOpen(true);
            setIsSubmitting(false);
            return;
        }

        try {
            // API 호출: 새 게시글 생성
            // 백엔드 FreeboardPostRequestDTO는 { "postTitle": title, "postContent": content } 형식
            await axios.post(
                `${API_BASE_URL}/board/free`, 
                { postTitle: title, postContent: content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setModalProps({
                title: '등록 완료', message: '게시글이 성공적으로 등록되었습니다.',
                confirmText: '확인', type: 'success', confirmButtonType: 'primary',
                onConfirm: () => {
                    setIsModalOpen(false); // 모달을 먼저 닫고 이동
                    navigate(freeboardPath); 
                },
                cancelText: null // 등록 완료에는 취소 버튼 불필요
            });
            setIsModalOpen(true);

        } catch (err) {
            console.error("Error creating post:", err);
            let errorMessage = "게시글 등록에 실패했습니다.";
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = err.response.data.message;
            } else if (err.response && err.response.status === 401) {
                errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
                 setModalProps({ title: '인증 오류', message: errorMessage, type: 'error', onConfirm: () => navigate("/login")});
            } else if (err.response && err.response.status === 403) {
                errorMessage = "글을 작성할 권한이 없습니다.";
                 setModalProps({ title: '권한 없음', message: errorMessage, type: 'error'});
            } else {
                 setModalProps({ title: '등록 실패', message: errorMessage, type: 'error'});
            }
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false); // 제출 종료
        }
    };

    const handleCancel = () => {
        if (title.trim() || content.trim()) {
            setModalProps({
                title: '작성 취소', message: '작성을 취소하시겠습니까?\n입력하신 내용은 저장되지 않습니다.',
                confirmText: '예, 취소합니다', cancelText: '계속 작성',
                onConfirm: () => { setIsModalOpen(false); navigate(freeboardPath); },
                onCancel: () => setIsModalOpen(false), // 취소 버튼 클릭 시 모달만 닫기
                type: 'warning', confirmButtonType: 'danger', cancelButtonType: 'secondary'
            });
            setIsModalOpen(true);
        } else {
            navigate(freeboardPath); 
        }
    };

    return (
        <>
            <div className={freeboardWriteStyle.background}>
                <div className={freeboardWriteStyle.title}>
                    <Link to={freeboardPath} className={freeboardWriteStyle.titleLink}>
                        <h1>자유게시판</h1>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className={freeboardWriteStyle.contentArea}> 
                    <div className={freeboardWriteStyle.img}>
                        <img src={banner} alt="자유게시판배너" />
                    </div>

                    <div className={freeboardWriteStyle.content}>
                        <label htmlFor="postTitle" className={freeboardWriteStyle.label}>
                            제목
                        </label>
                        <input
                            type="text"
                            id="postTitle"
                            className={freeboardWriteStyle.info}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            disabled={isSubmitting} // 제출 중 비활성화
                        />

                        <label
                            htmlFor="postContent"
                            className={`${freeboardWriteStyle.label} ${freeboardWriteStyle.contentLabel}`}
                        >
                            내용
                        </label>
                        <textarea
                            id="postContent"
                            className={freeboardWriteStyle.textbox}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="내용을 입력하세요"
                            rows="10"
                            disabled={isSubmitting} // 제출 중 비활성화
                        ></textarea>

                        <div className={freeboardWriteStyle.wirte}>
                            <button
                                type="button" 
                                onClick={handleCancel}
                                className={`${freeboardWriteStyle.submitButton} ${freeboardWriteStyle.cancelButton || ''}`} 
                                style={{ marginRight: '10px' }}
                                disabled={isSubmitting} // 제출 중 비활성화
                            >
                                취소
                            </button>
                            <button
                                type="submit" 
                                className={freeboardWriteStyle.submitButton} 
                                disabled={isSubmitting || !title.trim() || !content.trim()} // 제출 중 또는 내용 미입력 시 비활성화
                            >
                                {isSubmitting ? '등록 중...' : '작성'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    // 확인 후 이동하는 경우 onConfirm에서 처리하므로, 여기서는 onConfirm을 null로 만들 필요 없음
                }}
                {...modalProps}
            />
        </>
    );
}

export default FreeboardWrite;