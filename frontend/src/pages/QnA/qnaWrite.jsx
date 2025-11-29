import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import xIcon from '../../assets/images/x.png';
import qnaWriteStyle from '../../assets/styles/qnaWrite.module.css';
import Modal from '../../components/Modal/Modal';
import MypageNav from '../../components/MypageNavBar/MypageNav';

function QnaWrite() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]); 
    const [previewImages, setPreviewImages] = useState([]); 
    const [isLoading, setIsLoading] = useState(false); 

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

    const MAX_INDIVIDUAL_FILE_SIZE = 5 * 1024 * 1024; 
    for (const file of files) { 
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
            event.target.value = null; 
            return; 
        }
    }

    if (files.length > 0 && (selectedFiles.length + files.length > 3)) {
        setModalProps({
            title: '첨부파일 개수 초과',
            message: `이미지는 최대 3개까지 첨부할 수 있습니다. (현재 ${selectedFiles.length}개 선택됨, ${files.length}개 시도)`,
            confirmText: '확인',
            type: 'warning',
            confirmButtonType: 'primary',
            onConfirm: () => setIsModalOpen(false) 
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

    const handleSubmit = async (event) => { 
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

        setIsLoading(true); 

        const token = localStorage.getItem('token');
        if (!token) {
            setModalProps({
                title: "인증 오류", message: "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'blackButton', 
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
            setIsLoading(false); 
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
                    setIsModalOpen(false); 
                    navigate('/qna');
                },
                onCancel: () => setIsModalOpen(false), 
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
        return () => {
            previewImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewImages]); 

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
                                    disabled={isLoading} 
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
                                    disabled={isLoading} 
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
                                    style={{ display: 'none' }} 
                                    disabled={selectedFiles.length >= 3 || isLoading} 
                                />
                                <div className={qnaWriteStyle.imagePreviewContainer}>
                                    {previewImages.map((previewUrl, index) => (
                                        <div key={previewUrl} className={qnaWriteStyle.imagePreviewItem}> 
                                            <img src={previewUrl} alt={`미리보기 ${index + 1}`} className={qnaWriteStyle.previewImage} />
                                            <button
                                                type="button"
                                                className={qnaWriteStyle.removeImageButton}
                                                onClick={() => !isLoading && handleRemoveImage(index)} 
                                                title="이미지 제거"
                                                disabled={isLoading} 
                                            >
                                                <img src={xIcon} alt="제거" className={qnaWriteStyle.removeIcon} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedFiles.length < 3 && (
                                        <div
                                            className={`${qnaWriteStyle.imagePlaceholder} ${isLoading ? qnaWriteStyle.disabledPlaceholder : ''}`} 
                                            onClick={() => !isLoading && document.getElementById('qnaFormImages').click()} 
                                            role="button"
                                            tabIndex={isLoading ? -1 : 0} 
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
                    if (!modalProps.onConfirm && !modalProps.onCancel) {
                        setIsModalOpen(false);
                    } else if (modalProps.onConfirm && !modalProps.cancelText) { 
                         setIsModalOpen(false);
                    } else {
                        setIsModalOpen(false);
                    }
                }}
                {...modalProps}
            />
        </>
    );
}

export default QnaWrite;