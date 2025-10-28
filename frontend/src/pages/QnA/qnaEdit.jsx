// src/pages/QnA/QnaEdit.jsx
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import xIcon from '../../assets/images/x.png';
import qnaEditStyle from '../../assets/styles/qnaEdit.module.css';
import Modal from '../../components/Modal/Modal';
import MypageNav from '../../components/MypageNavBar/MypageNav';

const API_BASE_URL = "/api/v1"; // 프록시 설정을 활용하기 위해 상대 경로로 변경

const EMPTY_QNA_FOR_EDIT = {
    title: '',
    content: '',
    attachments: [] // API 응답의 attachments 필드를 따름
};

function QnaEdit() {
    const { qnaId } = useParams(); // URL 파라미터에서 qnaId 가져오기
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    
    // 기존 첨부파일 상태 (API에서 받아온 형태 유지 또는 프론트엔드 UI용으로 가공)
    // API 응답의 attachments: [{ imgId: 1, fileUrl: '...', originalFilename: '...' }, ...]
    const [existingAttachments, setExistingAttachments] = useState([]); 
    
    // 삭제할 기존 첨부파일의 ID 목록
    const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState([]); 
    
    // 새로 추가할 파일 객체 목록
    const [newSelectedFiles, setNewSelectedFiles] = useState([]); 
    // 새로 추가할 파일의 미리보기 URL 목록
    const [newPreviewImages, setNewPreviewImages] = useState([]); 

    // 원본 데이터 (취소 시 변경 여부 확인용)
    const [originalData, setOriginalData] = useState(EMPTY_QNA_FOR_EDIT);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 로딩 상태

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({
        title: '', message: '', onConfirm: null, confirmText: '확인',
        cancelText: null, type: 'default', confirmButtonType: 'primary',
        cancelButtonType: 'secondary', onCancel: () => setIsModalOpen(false)
    });

    // 기존 QnA 데이터 로드 함수
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
            return null; // 데이터 로드 실패 시 null 반환
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
            // ⭐ 수정: QnA 상세 조회 API 엔드포인트로 변경
            const response = await axios.get(`${API_BASE_URL}/qna/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("[QnaEdit fetchQnaDataForEdit] API Response:", response.data);
            
            // 답변 완료된 문의는 수정 불가
            if (response.data && response.data.inquiryStatus === 'ANSWERED') {
                setIsLoading(false);
                setModalProps({
                    title: "수정 불가", message: "이미 답변이 완료된 문의는 수정할 수 없습니다. 상세 페이지로 돌아갑니다.",
                    confirmText: "확인", type: "info", confirmButtonType: 'blackButton',
                    onConfirm: () => { setIsModalOpen(false); navigate(`/qnaDetail/${id}`); }
                });
                setIsModalOpen(true);
                return null; // 수정 페이지 로드 중단
            }
            return response.data; // 성공 시 데이터 반환
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
            return null; // 데이터 로드 실패 시 null 반환
        } finally {
            // setIsLoading(false); // fetchQnaDataForEdit를 호출하는 useEffect에서 최종적으로 처리
        }
    }, [navigate]);


    useEffect(() => {
        // 상태 초기화
        setTitle(''); setContent(''); 
        setExistingAttachments([]); 
        setAttachmentIdsToDelete([]); 
        setNewSelectedFiles([]); 
        setNewPreviewImages([]);
        setOriginalData(EMPTY_QNA_FOR_EDIT);

        if (qnaId) {
            fetchQnaDataForEdit(qnaId).then(data => {
                if (data) { // 데이터 로드 성공 시 (수정 불가가 아닌 경우 포함)
                    setTitle(data.inquiryTitle);
                    setContent(data.inquiryContent);
                    // API 응답의 attachments는 { imgId, fileUrl, originalFilename, createdAt } 형태
                    setExistingAttachments(data.attachments || []); 
                    setOriginalData({ 
                        title: data.inquiryTitle,
                        content: data.inquiryContent,
                        attachments: data.attachments || [] // 원본 첨부파일 정보 저장
                    });
                } else {
                    // fetchQnaDataForEdit 내부에서 이미 모달 처리 및 네비게이션이 되었을 수 있음
                    // 빈 양식으로 남겨두거나, 혹은 여기서도 목록으로 보낼 수 있음
                    // navigate('/qna'); // 예를 들어, 데이터 로드 실패 시 무조건 목록으로 보낸다면
                }
            }).finally(() => {
                setIsLoading(false); // 모든 API 호출 및 상태 설정 후 로딩 종료
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
        
        // --- 프론트엔드 개별 파일 크기 제한 로직 (예: 5MB) --- START
        const MAX_INDIVIDUAL_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        for (const file of files) { // 새로 선택된 파일들에 대해서만 검사
            if (file.size > MAX_INDIVIDUAL_FILE_SIZE) {
                setModalProps({
                    title: '파일 크기 초과',
                    message: `"${file.name}" 파일의 크기가 너무 큽니다. 파일당 최대 ${MAX_INDIVIDUAL_FILE_SIZE / 1024 / 1024}MB까지 첨부할 수 있습니다.`,
                    confirmText: '확인', type: 'warning', confirmButtonType: 'primary',
                    onConfirm: () => setIsModalOpen(false)
                });
                setIsModalOpen(true);
                event.target.value = null; // 파일 입력 초기화
                return; // 함수 종료
            }
        }
        // --- 프론트엔드 개별 파일 크기 제한 로직 --- END

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
        event.target.value = null; // 같은 파일 재선택 가능하도록
    };

    const handleRemoveExistingImage = (imageIdToRemove) => {
        // 이미 삭제 목록에 있는지 확인 (중복 추가 방지)
        if (!attachmentIdsToDelete.includes(imageIdToRemove)) {
            setAttachmentIdsToDelete(prevDeleted => [...prevDeleted, imageIdToRemove]);
        }
    };

    const handleRemoveNewImage = (indexToRemove) => {
        URL.revokeObjectURL(newPreviewImages[indexToRemove]); // 메모리 해제
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
        
        setIsSubmitting(true); // 제출 시작
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
            attachmentIdsToDelete: attachmentIdsToDelete, // 삭제할 기존 첨부파일 ID 목록
        };

        const formData = new FormData();
        formData.append(
            'qnaUpdateRequest',
            new Blob([JSON.stringify(qnaUpdateRequestData)], { type: 'application/json' })
        );

        newSelectedFiles.forEach(file => {
            formData.append('newFiles', file); // 백엔드 컨트롤러의 @RequestPart("newFiles")와 일치
        });

        try {
            // ⭐ 수정: QnA 수정 API 엔드포인트로 변경
            const response = await axios.put(`${API_BASE_URL}/qna/${qnaId}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type은 FormData 사용 시 axios가 자동으로 설정
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
                } else if (err.response.status === 409) { // 예: 답변완료된 문의 수정 시도 (백엔드에서 IllegalStateException 발생 시)
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
                    // 403, 404의 경우 현재 페이지에 머무르거나, 목록으로 보낼 수 있음 (현재는 머무름)
                }
            });
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false); // 제출 종료
        }
    };

    const handleCancel = () => {
        const titleChanged = title !== originalData.title;
        const contentChanged = content !== originalData.content;
        
        // 기존 첨부파일 변경 여부 확인
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
        // 컴포넌트 언마운트 시 새 이미지 미리보기 URL 해제
        return () => {
            newPreviewImages.forEach(url => URL.revokeObjectURL(url));
        };
    }, [newPreviewImages]);

    // 현재 화면에 보여질 기존 첨부파일 목록
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
    
    // qnaId는 있지만 데이터 로드에 실패하여 title 등이 비어있는 경우 (fetchQnaDataForEdit에서 에러 처리 후 null 반환 시)
    // 또는 qnaId 자체가 없는 경우 (useEffect에서 초기화 후 로딩 종료)
    // 이 부분은 useEffect 내부의 navigate 로직으로 대부분 커버될 수 있음.
    // if (!title && qnaId && !isModalOpen) { // 데이터 로드 실패했으나 모달이 아직 안 뜬 극히 짧은 순간 방지
    //     return (
    //         <>
    //             <MypageNav />
    //             <div className={qnaEditStyle.layout}><div className={qnaEditStyle.container}><div className={qnaEditStyle.background} style={{padding: "50px", textAlign: "center"}}>문의 정보를 표시할 수 없습니다.</div></div></div>
    //         </>
    //     );
    // }


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
                                    disabled={isSubmitting} // 제출 중 비활성화
                                />
                            </div>
                            <div className={qnaEditStyle.textbox}>
                                <label htmlFor="qnaEditFormContent" className={qnaEditStyle.label}>내용</label>
                                <textarea
                                    id="qnaEditFormContent" value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="내용을 입력해주세요." className={qnaEditStyle.textareaField}
                                    rows={10}
                                    disabled={isSubmitting} // 제출 중 비활성화
                                ></textarea>
                            </div>
                            <div className={qnaEditStyle.imgSection}>
                                <label htmlFor="qnaEditFormImages" className={qnaEditStyle.label}>
                                    이미지 첨부 (현재 {totalCurrentImageCount}개 / 최대 3개)
                                </label>
                                <input
                                    type="file" id="qnaEditFormImages" multiple accept="image/*"
                                    onChange={handleFileChange} style={{ display: 'none' }}
                                    disabled={totalCurrentImageCount >= 3 || isSubmitting} // 제출 중 또는 개수 초과 시 비활성화
                                />
                                <div className={qnaEditStyle.imagePreviewContainer}>
                                    {/* 기존 첨부파일 중 삭제되지 않은 것들 표시 */}
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
                                    {/* 새로 추가된 이미지 미리보기 */}
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
                                    {/* 이미지 추가 플레이스홀더 */}
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
                                    disabled={isSubmitting || isLoading} // 초기 로딩 중에도 비활성화
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
                    // 모달의 onConfirm/onCancel 핸들러가 있으면 그것들이 setIsModalOpen(false)를 호출
                    // 사용자가 X 버튼 등으로 닫는 경우 대비
                    if (modalProps.onConfirm && !modalProps.cancelText) { // 확인 버튼만 있는 경우
                        // modalProps.onConfirm(); // X 눌렀을 때 확인 동작을 실행할지 여부 결정
                        setIsModalOpen(false); 
                    } else if (modalProps.onConfirm && modalProps.onCancel) { // 확인/취소 모두 있는 경우
                        // modalProps.onCancel(); // X 눌렀을 때 취소 동작을 실행할지 여부 결정
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