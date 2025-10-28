// src/pages/QnA/QnaWrite.jsx
import axios from 'axios'; // 페이지마다 직접 임포트
import { useEffect, useState } from 'react'; // React import 확인 (기존 코드에 React가 명시적으로 import 안되어있다면 추가)
import { Link, useNavigate } from 'react-router-dom';
import xIcon from '../../assets/images/x.png';
import qnaWriteStyle from '../../assets/styles/qnaWrite.module.css';
import Modal from '../../components/Modal/Modal';
import MypageNav from '../../components/MypageNavBar/MypageNav';

function QnaWrite() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]); // File 객체 목록
    const [previewImages, setPreviewImages] = useState([]); // Object URL 목록
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '확인',
        cancelText: null,
        type: 'default',
        confirmButtonType: 'primary',
        cancelButtonType: 'secondary'
    });

    const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    // --- 프론트엔드 개별 파일 크기 제한 로직 (예: 5MB) --- START
    const MAX_INDIVIDUAL_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    for (const file of files) { // 새로 선택된 파일들에 대해서만 검사
        if (file.size > MAX_INDIVIDUAL_FILE_SIZE) {
            setModalProps({
                title: '파일 크기 초과',
                message: `"${file.name}" 파일의 크기가 너무 큽니다. 파일당 최대 ${MAX_INDIVIDUAL_FILE_SIZE / 1024 / 1024}MB까지 첨부할 수 있습니다.`,
                confirmText: '확인',
                type: 'warning',
                confirmButtonType: 'primary',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
            event.target.value = null; // 파일 입력 초기화
            return; // 함수 종료
        }
    }
    // --- 프론트엔드 개별 파일 크기 제한 로직 --- END

    if (files.length > 0 && (selectedFiles.length + files.length > 3)) {
        setModalProps({
            title: '첨부파일 개수 초과',
            message: `이미지는 최대 3개까지 첨부할 수 있습니다. (현재 ${selectedFiles.length}개 선택됨, ${files.length}개 시도)`,
            confirmText: '확인',
            type: 'warning',
            confirmButtonType: 'primary',
            onConfirm: () => setIsModalOpen(false) // 모달 확인 시 닫기
        });
        setIsModalOpen(true);
        event.target.value = null;
        return;
    }
    
    const filesToAdd = files.slice(0, 3 - selectedFiles.length);

    if (filesToAdd.length > 0) {
        setSelectedFiles(prevFiles => [...prevFiles, ...filesToAdd]);
        const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));
        setPreviewImages(prevPreviews => [...prevPreviews, ...newPreviewUrls]);
    }
    event.target.value = null;
};
    const handleRemoveImage = (indexToRemove) => {
        URL.revokeObjectURL(previewImages[indexToRemove]);
        setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setPreviewImages(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (event) => { // async 추가
        event.preventDefault();
        if (!title.trim()) {
            setModalProps({ title: '입력 오류', message: '제목을 입력해주세요.', confirmText: '확인', type: 'warning', confirmButtonType: 'primary', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
            return;
        }
        if (!content.trim()) {
            setModalProps({ title: '입력 오류', message: '내용을 입력해주세요.', confirmText: '확인', type: 'warning', confirmButtonType: 'primary', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true);
            return;
        }

        setIsLoading(true); // 로딩 시작

        const token = localStorage.getItem('token');
        if (!token) {
            setModalProps({
                title: "인증 오류", message: "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'blackButton', // 버튼 타입 일치
                onConfirm: () => { setIsModalOpen(false); navigate('/login'); }
            });
            setIsModalOpen(true);
            setIsLoading(false);
            return;
        }

        const qnaCreateRequestData = {
            inquiryTitle: title,
            inquiryContent: content,
        };

        const formData = new FormData();
        formData.append(
            'qnaCreateRequest',
            new Blob([JSON.stringify(qnaCreateRequestData)], { type: 'application/json' })
        );

        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await axios.post('/api/v1/qna', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.status === 201 && response.data) {
                setModalProps({
                    title: '등록 완료', message: '문의가 성공적으로 등록되었습니다.', confirmText: '확인', type: 'success', confirmButtonType: 'primary',
                    onConfirm: () => {
                        setIsModalOpen(false);
                        // 성공 시 상태 초기화는 navigate 전에 할 필요 없음 (페이지 이동 시 컴포넌트 언마운트)
                        navigate(`/qnaDetail/${response.data.inquiryId}`);
                    }
                });
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error creating QnA:", error);
            let errorMessage = "문의 등록 중 오류가 발생했습니다.";
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            setModalProps({
                title: "등록 실패", message: errorMessage, confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => {
                    setIsModalOpen(false);
                    if (error.response && error.response.status === 401) navigate('/login');
                }
            });
            setIsModalOpen(true);
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    const handleCancel = () => {
        if (title.trim() || content.trim() || selectedFiles.length > 0) {
            setModalProps({
                title: '작성 취소',
                message: '작성을 취소하시겠습니까?\n입력하신 내용은 저장되지 않습니다.',
                confirmText: '예, 취소합니다',
                cancelText: '계속 작성',
                onConfirm: () => {
                    // previewImages.forEach(url => URL.revokeObjectURL(url)); // cleanup useEffect에서 처리
                    setIsModalOpen(false); // 모달 먼저 닫기
                    navigate('/qna');
                },
                onCancel: () => setIsModalOpen(false), // 모달 닫기 추가
                type: 'warning',
                confirmButtonType: 'danger',
                cancelButtonType: 'secondary'
            });
            setIsModalOpen(true);
        } else {
            navigate('/qna');
        }
    };

    useEffect(() => {
        // 컴포넌트 언마운트 시 Object URL 해제 (메모리 누수 방지)
        return () => {
            previewImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewImages]); // previewImages가 변경될 때마다 이전 URL들을 해제하는 것은 아님, 언마운트 시 현재 URL들 해제

    return (
        <>
            <MypageNav />
            <div className={qnaWriteStyle.layout}>
                <div className={qnaWriteStyle.container}>
                    <div className={qnaWriteStyle.background}>
                        <div className={qnaWriteStyle.title}>
                            <Link to="/qna" className={qnaWriteStyle.pageTitleLink}>
                                <h1>Q&A</h1>
                            </Link>
                        </div>

                        <form onSubmit={handleSubmit} className={qnaWriteStyle.contentArea}>
                            <div className={qnaWriteStyle.info}>
                                <label htmlFor="qnaFormTitle" className={qnaWriteStyle.label}>제목</label>
                                <input
                                    type="text"
                                    id="qnaFormTitle"
                                    className={qnaWriteStyle.inputField}
                                    placeholder="제목을 입력해주세요"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    disabled={isLoading} // 로딩 중 비활성화
                                />
                            </div>

                            <div className={qnaWriteStyle.textbox}>
                                <label htmlFor="qnaFormContent" className={qnaWriteStyle.label}>내용</label>
                                <textarea
                                    id="qnaFormContent"
                                    className={qnaWriteStyle.textareaField}
                                    placeholder="내용을 입력해주세요."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    rows="10"
                                    disabled={isLoading} // 로딩 중 비활성화
                                ></textarea>
                            </div>

                            <div className={qnaWriteStyle.imgSection}>
                                <label htmlFor="qnaFormImages" className={qnaWriteStyle.label}>
                                    이미지 첨부 (현재 {selectedFiles.length}개 / 최대 3개)
                                </label>
                                <input
                                    type="file"
                                    id="qnaFormImages"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }} // 숨겨진 input
                                    disabled={selectedFiles.length >= 3 || isLoading} // 로딩 중 또는 파일 개수 초과 시 비활성화
                                />
                                <div className={qnaWriteStyle.imagePreviewContainer}>
                                    {previewImages.map((previewUrl, index) => (
                                        <div key={previewUrl} className={qnaWriteStyle.imagePreviewItem}> {/* 사용자가 제공한 key={previewUrl} 사용 */}
                                            <img src={previewUrl} alt={`미리보기 ${index + 1}`} className={qnaWriteStyle.previewImage} />
                                            <button
                                                type="button"
                                                className={qnaWriteStyle.removeImageButton}
                                                onClick={() => !isLoading && handleRemoveImage(index)} // 로딩 중 아닐 때만 동작
                                                title="이미지 제거"
                                                disabled={isLoading} // 로딩 중 비활성화
                                            >
                                                <img src={xIcon} alt="제거" className={qnaWriteStyle.removeIcon} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedFiles.length < 3 && (
                                        <div
                                            className={`${qnaWriteStyle.imagePlaceholder} ${isLoading ? qnaWriteStyle.disabledPlaceholder : ''}`} // 로딩 시 스타일 변경 위한 클래스 (선택적)
                                            onClick={() => !isLoading && document.getElementById('qnaFormImages').click()} // 로딩 중 아닐 때만 동작
                                            role="button"
                                            tabIndex={isLoading ? -1 : 0} // 로딩 중 포커스 불가
                                            onKeyPress={(e) => { if (!isLoading && (e.key === 'Enter' || e.key === ' ')) document.getElementById('qnaFormImages').click(); }}
                                        >
                                            + 이미지 추가 ({selectedFiles.length}/3)
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={qnaWriteStyle.buttons}>
                                <button type="button" onClick={handleCancel} className={`${qnaWriteStyle.actionButton} ${qnaWriteStyle.cancelButton}`} disabled={isLoading}>
                                    취소
                                </button>
                                <button type="submit" className={`${qnaWriteStyle.actionButton} ${qnaWriteStyle.submitButton}`} disabled={isLoading}>
                                    {isLoading ? "등록 중..." : "작성"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    // 모달의 onConfirm/onCancel 핸들러가 있으면 그것들이 setIsModalOpen(false)를 호출할 것이므로,
                    // 여기서는 기본 닫기 동작만 처리하거나, 혹은 onConfirm/onCancel이 없을 경우에만 닫도록 할 수 있습니다.
                    // 현재는 onConfirm, onCancel에서 setIsModalOpen(false)를 호출하도록 되어 있으므로,
                    // onClose는 사용자가 외부 클릭 등으로 닫는 경우를 대비해 둘 수 있습니다. (Modal 구현에 따라 다름)
                    // 여기서는 onConfirm/onCancel 핸들러가 모달을 닫도록 유도하고, onClose는 단순 닫기로 남겨둡니다.
                    if (!modalProps.onConfirm && !modalProps.onCancel) {
                        setIsModalOpen(false);
                    } else if (modalProps.onConfirm && !modalProps.cancelText) { // 확인 버튼만 있는 경우
                         // 사용자가 닫기 버튼(X)을 누를 때의 동작을 onConfirm과 동일하게 할지, 아니면 그냥 닫을지 결정
                         // 여기서는 그냥 닫도록 함.
                         setIsModalOpen(false);
                    } else {
                        // 확인/취소 버튼이 모두 있는 경우, X 버튼으로 닫을 때의 기본 동작
                        setIsModalOpen(false);
                    }
                }}
                {...modalProps}
            />
        </>
    );
}

export default QnaWrite;