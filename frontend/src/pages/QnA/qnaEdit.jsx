import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import xIcon from '../../assets/images/x.png';
import qnaEditStyle from '../../assets/styles/qnaEdit.module.css';
import Modal from '../../components/Modal/Modal';
import MypageNav from '../../components/MypageNavBar/MypageNav';

const API_BASE_URL = "/api/v1"; 

const EMPTY_QNA_FOR_EDIT = {
    title: '',
    content: '',
    attachments: [] 
};

function QnaEdit() {
    const { qnaId } = useParams(); 
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    const [existingAttachments, setExistingAttachments] = useState([]); 
    
    const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState([]); 
    
    const [newSelectedFiles, setNewSelectedFiles] = useState([]); 
    const [newPreviewImages, setNewPreviewImages] = useState([]); 

    const [originalData, setOriginalData] = useState(EMPTY_QNA_FOR_EDIT);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary', onCancel: () => setIsModalOpen(false)
    });

    const fetchQnaDataForEdit = useCallback(async (id) => {
        console.log("[QnaEdit fetchQnaDataForEdit] Called with qnaId:", id);
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
            return null; 
        }

        if (!id || id === "undefined" || id === "null") {
            setIsLoading(false);
            setModalProps({
                title: "오류", message: "유효한 문의 ID가 아닙니다. 문의 목록으로 돌아갑니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => { setIsModalOpen(false); navigate('/qna'); }
            });
            setIsModalOpen(true);
            return null;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/qna/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("[QnaEdit fetchQnaDataForEdit] API Response:", response.data);
            
            if (response.data && response.data.inquiryStatus === 'ANSWERED') {
                setIsLoading(false);
                setModalProps({
                    title: "수정 불가", message: "이미 답변이 완료된 문의는 수정할 수 없습니다. 상세 페이지로 돌아갑니다.",
                    confirmText: "확인", type: "info", confirmButtonType: 'blackButton',
                    onConfirm: () => { setIsModalOpen(false); navigate(`/qnaDetail/${id}`); }
                });
                setIsModalOpen(true);
                return null; 
            }
            return response.data; 
        } catch (err) {
            console.error("[QnaEdit fetchQnaDataForEdit] Failed to fetch QnA for edit:", err);
            let errorMessage = "문의 정보를 불러오는 중 문제가 발생했습니다.";
            let navigatePath = '/qna';
            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "인증에 실패했습니다. 다시 로그인해주세요."; navigatePath = '/login';
                } else if (err.response.status === 403) {
                    errorMessage = "해당 문의에 접근할 권한이 없습니다. 내 문의 목록으로 이동합니다.";
                } else if (err.response.status === 404) {
                    errorMessage = `수정할 문의(ID: ${id})를 찾을 수 없습니다. 내 문의 목록으로 이동합니다.`;
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setModalProps({
                title: "로드 실패", message: errorMessage, confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => { setIsModalOpen(false); navigate(navigatePath); }
            });
            setIsModalOpen(true);
            return null; 
        } finally {
        }
    }, [navigate]);


    useEffect(() => {
        setTitle(''); setContent(''); 
        setExistingAttachments([]); 
        setAttachmentIdsToDelete([]); 
        setNewSelectedFiles([]); 
        setNewPreviewImages([]);
        setOriginalData(EMPTY_QNA_FOR_EDIT);

        if (qnaId) {
            fetchQnaDataForEdit(qnaId).then(data => {
                if (data) { 
                    setTitle(data.inquiryTitle);
                    setContent(data.inquiryContent);
                    setExistingAttachments(data.attachments || []); 
                    setOriginalData({ 
                        title: data.inquiryTitle,
                        content: data.inquiryContent,
                        attachments: data.attachments || [] 
                    });
                } else {
                }
            }).finally(() => {
                setIsLoading(false); 
            });
        } else {
            setIsLoading(false);
            setModalProps({
                title: "알림", message: "수정할 문의 ID가 제공되지 않았습니다. 문의 목록으로 돌아갑니다.",
                confirmText: "확인", type: "warning", confirmButtonType: "blackButton",
                onConfirm: () => { setIsModalOpen(false); navigate('/qna'); }
            });
            setIsModalOpen(true);
        }
    }, [qnaId, fetchQnaDataForEdit, navigate]);


    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        
        const MAX_INDIVIDUAL_FILE_SIZE = 5 * 1024 * 1024; 
        for (const file of files) { 
            if (file.size > MAX_INDIVIDUAL_FILE_SIZE) {
                setModalProps({
                    title: '파일 크기 초과',
                    message: `"${file.name}" 파일의 크기가 너무 큽니다. 파일당 최대 ${MAX_INDIVIDUAL_FILE_SIZE / 1024 / 1024}MB까지 첨부할 수 있습니다.`,
                    confirmText: '확인', type: 'warning', confirmButtonType: 'primary',
                    onConfirm: () => setIsModalOpen(false)
                });
                setIsModalOpen(true);
                event.target.value = null; 
                return; 
            }
        }

        const currentVisibleExistingCount = existingAttachments.filter(att => !attachmentIdsToDelete.includes(att.imgId)).length;
        const totalCurrentImages = currentVisibleExistingCount + newSelectedFiles.length;
        
        if (files.length > 0 && (totalCurrentImages + files.length > 3)) {
            setModalProps({
                title: '첨부파일 개수 초과',
                message: `이미지는 최대 3개까지 첨부할 수 있습니다. (현재 ${totalCurrentImages}개 선택됨, ${files.length}개 시도)`,
                confirmText: '확인', type: 'warning', confirmButtonType: 'primary',
                onConfirm: () => setIsModalOpen(false)
            });
            setIsModalOpen(true);
            event.target.value = null;
            return;
        }

        const filesToAdd = files.slice(0, 3 - totalCurrentImages);

        if (filesToAdd.length > 0) {
            setNewSelectedFiles(prevFiles => [...prevFiles, ...filesToAdd]);
            const newUrls = filesToAdd.map(file => URL.createObjectURL(file));
            setNewPreviewImages(prevPreviews => [...prevPreviews, ...newUrls]);
        }
        event.target.value = null; 
    };

    const handleRemoveExistingImage = (imageIdToRemove) => {
        if (!attachmentIdsToDelete.includes(imageIdToRemove)) {
            setAttachmentIdsToDelete(prevDeleted => [...prevDeleted, imageIdToRemove]);
        }
    };

    const handleRemoveNewImage = (indexToRemove) => {
        URL.revokeObjectURL(newPreviewImages[indexToRemove]); 
        setNewSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setNewPreviewImages(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    };

    const handleUpdateSubmit = async (event) => {
        event.preventDefault();
        if (!title.trim()) {
            setModalProps({ title: "입력 오류", message: "제목을 입력해주세요.", confirmText: "확인", type: "warning", confirmButtonType: 'blackButton', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true); return;
        }
        if (!content.trim()) {
            setModalProps({ title: "입력 오류", message: "내용을 입력해주세요.", confirmText: "확인", type: "warning", confirmButtonType: 'blackButton', onConfirm: () => setIsModalOpen(false) });
            setIsModalOpen(true); return;
        }
        
        setIsSubmitting(true); 
        const token = localStorage.getItem('token');

        if (!token) {
            setIsSubmitting(false);
            setModalProps({
                title: "인증 오류", message: "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
                confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => { setIsModalOpen(false); navigate('/login'); }
            });
            setIsModalOpen(true);
            return;
        }

        const qnaUpdateRequestData = {
            inquiryTitle: title,
            inquiryContent: content,
            attachmentIdsToDelete: attachmentIdsToDelete, 
        };

        const formData = new FormData();
        formData.append(
            'qnaUpdateRequest',
            new Blob([JSON.stringify(qnaUpdateRequestData)], { type: 'application/json' })
        );

        newSelectedFiles.forEach(file => {
            formData.append('newFiles', file); 
        });

        try {
            const response = await axios.put(`${API_BASE_URL}/qna/${qnaId}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.status === 200 && response.data) {
                setModalProps({
                    title: "수정 완료", message: "문의가 성공적으로 수정되었습니다.", confirmText: "확인",
                    type: "success", confirmButtonType: 'primary', 
                    onConfirm: () => {
                        setIsModalOpen(false);
                        navigate(qnaId ? `/qnaDetail/${qnaId}` : '/qna');
                    }
                });
                setIsModalOpen(true);
            }
        } catch (err) {
            console.error("Error updating QnA:", err);
            let errorMessage = "문의 수정 중 오류가 발생했습니다.";
             if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "인증에 실패했습니다. 다시 로그인해주세요.";
                } else if (err.response.status === 403) {
                    errorMessage = "해당 문의를 수정할 권한이 없습니다.";
                } else if (err.response.status === 404) {
                    errorMessage = "수정할 문의를 찾을 수 없습니다.";
                } else if (err.response.status === 409) { 
                    errorMessage = err.response.data.message || "이미 답변이 완료된 문의는 수정할 수 없습니다.";
                }
                 else if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            setModalProps({
                title: "수정 실패", message: errorMessage, confirmText: "확인", type: "error", confirmButtonType: 'blackButton',
                onConfirm: () => {
                    setIsModalOpen(false);
                    if (err.response && err.response.status === 401) navigate('/login');
                }
            });
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false); 
        }
    };

    const handleCancel = () => {
        const titleChanged = title !== originalData.title;
        const contentChanged = content !== originalData.content;
        
        const originalAttachmentIds = (originalData.attachments || []).map(att => att.imgId).sort();
        const currentVisibleExistingAttachmentIds = existingAttachments
            .filter(att => !attachmentIdsToDelete.includes(att.imgId))
            .map(att => att.imgId)
            .sort();
        
        const existingAttachmentsChanged = originalAttachmentIds.length !== currentVisibleExistingAttachmentIds.length ||
                                         !originalAttachmentIds.every((id, index) => id === currentVisibleExistingAttachmentIds[index]);

        const newAttachmentsAdded = newSelectedFiles.length > 0;

        if (titleChanged || contentChanged || existingAttachmentsChanged || newAttachmentsAdded) {
            setModalProps({
                title: '수정 취소', message: '변경사항이 저장되지 않았습니다. 정말 수정을 취소하시겠습니까?',
                confirmText: '예, 취소합니다', cancelText: '계속 수정',
                onConfirm: () => {
                    setIsModalOpen(false);
                    navigate(qnaId ? `/qnaDetail/${qnaId}` : '/qna');
                },
                onCancel: () => setIsModalOpen(false),
                type: 'warning', confirmButtonType: 'danger', cancelButtonType: 'secondary'
            });
            setIsModalOpen(true);
        } else {
            navigate(qnaId ? `/qnaDetail/${qnaId}` : '/qna');
        }
    };

    useEffect(() => {
        return () => {
            newPreviewImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [newPreviewImages]);

    const visibleExistingAttachments = existingAttachments.filter(att => !attachmentIdsToDelete.includes(att.imgId));
    const totalCurrentImageCount = visibleExistingAttachments.length + newPreviewImages.length;

    if (isLoading) {
        return ( 
            <>
                <MypageNav />
                <div className={qnaEditStyle.layout}><div className={qnaEditStyle.container}><div className={qnaEditStyle.background} style={{padding: "50px", textAlign: "center"}}>문의 정보를 불러오는 중입니다...</div></div></div>
            </>
        );
    }


    return (
        <>
            <MypageNav />
            <div className={qnaEditStyle.layout}>
                <div className={qnaEditStyle.container}>
                    <div className={qnaEditStyle.background}>
                        <div className={qnaEditStyle.title}>
                            <Link to="/qna" className={qnaEditStyle.pageTitleLink}>
                                <h1>Q&A 수정</h1>
                            </Link>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className={qnaEditStyle.contentArea}>
                            <div className={qnaEditStyle.info}>
                                <label htmlFor="qnaEditFormTitle" className={qnaEditStyle.label}>제목</label>
                                <input
                                    type="text" id="qnaEditFormTitle" value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="제목을 입력해주세요" className={qnaEditStyle.inputField}
                                    disabled={isSubmitting} 
                                />
                            </div>
                            <div className={qnaEditStyle.textbox}>
                                <label htmlFor="qnaEditFormContent" className={qnaEditStyle.label}>내용</label>
                                <textarea
                                    id="qnaEditFormContent" value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="내용을 입력해주세요." className={qnaEditStyle.textareaField}
                                    rows={10}
                                    disabled={isSubmitting} 
                                ></textarea>
                            </div>
                            <div className={qnaEditStyle.imgSection}>
                                <label htmlFor="qnaEditFormImages" className={qnaEditStyle.label}>
                                    이미지 첨부 (현재 {totalCurrentImageCount}개 / 최대 3개)
                                </label>
                                <input
                                    type="file" id="qnaEditFormImages" multiple accept="image/*"
                                    onChange={handleFileChange} style={{ display: 'none' }}
                                    disabled={totalCurrentImageCount >= 3 || isSubmitting} 
                                />
                                <div className={qnaEditStyle.imagePreviewContainer}>
                                    {visibleExistingAttachments.map((attachment) => (
                                        <div key={`existing-${attachment.imgId}`} className={qnaEditStyle.imagePreviewItem}>
                                            <img src={attachment.fileUrl} alt={attachment.originalFilename || `기존 이미지 ${attachment.imgId}`} className={qnaEditStyle.previewImage} />
                                            <button 
                                                type="button" 
                                                className={qnaEditStyle.removeImageButton} 
                                                onClick={() => !isSubmitting && handleRemoveExistingImage(attachment.imgId)} 
                                                title="기존 이미지 제거"
                                                disabled={isSubmitting}
                                            >
                                                <img src={xIcon} alt="제거" className={qnaEditStyle.removeIcon} />
                                            </button>
                                        </div>
                                    ))}
                                    {newPreviewImages.map((previewUrl, index) => (
                                        <div key={`new-${index}-${previewUrl}`} className={qnaEditStyle.imagePreviewItem}>
                                            <img src={previewUrl} alt={`새 미리보기 ${index + 1}`} className={qnaEditStyle.previewImage} />
                                            <button 
                                                type="button" 
                                                className={qnaEditStyle.removeImageButton} 
                                                onClick={() => !isSubmitting && handleRemoveNewImage(index)} 
                                                title="새 이미지 제거"
                                                disabled={isSubmitting}
                                            >
                                                <img src={xIcon} alt="제거" className={qnaEditStyle.removeIcon} />
                                            </button>
                                        </div>
                                    ))}
                                    {totalCurrentImageCount < 3 && (
                                        <div 
                                            className={`${qnaEditStyle.imagePlaceholder} ${isSubmitting ? qnaEditStyle.disabledPlaceholder : ''}`} 
                                            onClick={() => !isSubmitting && document.getElementById('qnaEditFormImages').click()} 
                                            role="button" 
                                            tabIndex={isSubmitting ? -1 : 0}
                                            onKeyPress={(e) => { if (!isSubmitting && (e.key === 'Enter' || e.key === ' ')) document.getElementById('qnaEditFormImages').click(); }}
                                        >
                                            + 이미지 추가
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={qnaEditStyle.buttons}>
                                <button 
                                    type="button" 
                                    onClick={handleCancel} 
                                    className={`${qnaEditStyle.actionButton} ${qnaEditStyle.cancelButton}`} 
                                    disabled={isSubmitting}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className={`${qnaEditStyle.actionButton} ${qnaEditStyle.submitButton}`} 
                                    disabled={isSubmitting || isLoading} 
                                >
                                    {isSubmitting ? "수정 중..." : "수정 완료"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    if (modalProps.onConfirm && !modalProps.cancelText) { 
                        setIsModalOpen(false); 
                    } else if (modalProps.onConfirm && modalProps.onCancel) { 
                         setIsModalOpen(false);
                    }
                     else {
                        setIsModalOpen(false);
                    }
                }} 
                {...modalProps} 
            />
        </>
    );
}

export default QnaEdit;