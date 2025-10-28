import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from '../../api/apiClient.js';
import MypageNav from "../../components/MypageNavBar/MypageNav";
import Modal from "../../components/Modal/Modal";
import bookmarkStyle from "../../assets/styles/bookmark.module.css";

const Bookmark = () => {
    const navigate = useNavigate();
    const { folderId: urlFolderId } = useParams();

    // --- State 정의 ---
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [selectedFolderVideos, setSelectedFolderVideos] = useState([]);

    // 폴더 액션 관련 State
    const [folderIdPendingAction, setFolderIdPendingAction] = useState(null);
    const [newFolderName, setNewFolderName] = useState("");
    const [renameFolderName, setRenameFolderName] = useState("");
    
    // 영상 액션 관련 State
    const [videoToDelete, setVideoToDelete] = useState(null);

    // 모달 제어 관련 State
    const [isLoading, setIsLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteVideoModalOpen, setIsDeleteVideoModalOpen] = useState(false);

    // --- 데이터 로딩 useEffect ---
    useEffect(() => {
        // 폴더 목록 로딩: /api/v1/folder
        apiClient.get("/v1/folder")
            .then((res) => {
                console.log("폴더 데이터 수신:", res.data);
                setFolders(Array.isArray(res.data) ? res.data : []);
            })
            .catch((err) => console.error("***** 폴더 목록 로딩 오류 *****:", err));
    }, []);

    useEffect(() => {
        if (urlFolderId) {
            const id = parseInt(urlFolderId, 10);
            if (isNaN(id)) {
                navigate("/bookmark", { replace: true });
                return;
            }
            setSelectedFolderId(id);
            // 특정 폴더의 영상 목록 로딩: /api/v1/bookmarks/folder/{folderId}/videos
            apiClient.get(`/v1/bookmarks/folder/${id}/videos`)
                .then((res) => setSelectedFolderVideos(Array.isArray(res.data) ? res.data : []))
                .catch((err) => {
                    console.error(`폴더 ID ${id}의 영상 목록 로딩 실패:`, err);
                    setSelectedFolderVideos([]);
                });
        } else {
            setSelectedFolderId(null);
            setSelectedFolderVideos([]);
        }
    }, [urlFolderId, navigate]);

    // --- 클릭 및 이벤트 핸들러 ---
    
    const handleVideoClick = (video) => {
        const videoId = video.videoId || video.video_id || video.youtubeVideoId;
        if (videoId) {
            navigate(`/shorts/video/${videoId}`, { 
                state: { 
                    list: selectedFolderVideos 
                } 
            });
        } else {
            console.error("ID를 찾을 수 없는 영상 객체입니다:", video);
        }
    };

    const handleFolderClick = (folderId) => {
        if (typeof folderId === 'undefined' || folderId === null) return;
        setIsLoading(true);
        setTimeout(() => {
            navigate(`/bookmark/${folderId}`);
            setIsLoading(false);
        }, 300);
    };

    // --- 북마크 삭제 관련 함수 ---
    const handleOpenDeleteVideoModal = (video) => {
        setVideoToDelete(video);
        setIsDeleteVideoModalOpen(true);
    };

    const handleDeleteVideoConfirm = () => {
        if (!videoToDelete || !urlFolderId) return;
        const videoIdToDelete = videoToDelete.videoId || videoToDelete.video_id || videoToDelete.youtubeVideoId;
        
        // 북마크 삭제: /api/v1/bookmarks/folder/{folderId}/video/{videoId}
        apiClient.delete(`/v1/bookmarks/folder/${urlFolderId}/video/${videoIdToDelete}`)
            .then(() => {
                setSelectedFolderVideos(prev => prev.filter(v => (v.videoId || v.video_id || v.youtubeVideoId) !== videoIdToDelete));
                alert("북마크에서 삭제되었습니다.");
            })
            .catch(err => {
                console.error("북마크 삭제 실패:", err);
                alert("삭제에 실패했습니다.");
            })
            .finally(() => {
                setIsDeleteVideoModalOpen(false);
                setVideoToDelete(null);
            });
    };

    // --- 폴더 관리 함수들 (추가, 이름 변경, 삭제) ---
    const handleAddFolder = () => setIsAddModalOpen(true);
    const handleAddModalCancel = () => {
        setNewFolderName("");
        setIsAddModalOpen(false);
    };
    const handleAddModalSubmit = () => {
        const name = newFolderName.trim().slice(0, 10);
        if (name) {
            // 폴더 추가: /api/v1/folder
            apiClient.post("/v1/folder", { folderName: name })
                .then((res) => {
                    setFolders((prev) => [res.data, ...prev]);
                    handleAddModalCancel();
                })
                .catch((err) => {
                    console.error("***** 폴더 추가 실패 *****:", err);
                    alert("폴더 추가에 실패했습니다.");
                });
        }
    };
    const handleOpenOptionsModal = (folderId) => {
        setFolderIdPendingAction(folderId);
        const folder = folders.find((f) => f.folderId === folderId);
        if (folder) setRenameFolderName(folder.folderName);
        setIsOptionsModalOpen(true);
    };
    const handleOpenRenameModal = () => {
        setIsOptionsModalOpen(false);
        setIsRenameModalOpen(true);
    };
    const handleRenameModalCancel = () => {
        setRenameFolderName("");
        setIsRenameModalOpen(false);
        setFolderIdPendingAction(null);
    };

    const handleRenameModalSubmit = () => {
        const newName = renameFolderName.trim().slice(0, 10);
        if (newName && folderIdPendingAction !== null) {
            // 폴더 이름 변경: /api/v1/folder/{folderId}
            apiClient.put(`/v1/folder/${folderIdPendingAction}`, { folderName: newName })
                .then(() => {
                    setFolders((prev) => prev.map((f) => f.folderId === folderIdPendingAction ? { ...f, folderName: newName } : f));
                    handleRenameModalCancel();
                })
                .catch((err) => {
                    console.error("***** 폴더 이름 변경 실패 *****:", err);
                    alert("이름 변경에 실패했습니다. 다시 로그인 후 시도해주세요.");
                    handleRenameModalCancel();
                });
        }
    };

    const handleDeleteFolder = () => {
        setIsOptionsModalOpen(false);
        setIsDeleteModalOpen(true);
    };
    const handleDeleteModalCancel = () => {
        setIsDeleteModalOpen(false);
        setFolderIdPendingAction(null);
    };

    const handleDeleteModalSubmit = () => {
        const idToDelete = folderIdPendingAction;
        if (idToDelete === null) {
            console.error("삭제할 폴더 ID가 없습니다. 상태가 초기화된 것 같습니다.");
            return;
        }
        // 폴더 삭제: /api/v1/folder/{folderId}
        apiClient.delete(`/v1/folder/${idToDelete}`)
            .then(() => {
                setFolders((prev) => prev.filter((f) => f.folderId !== idToDelete));
                if (urlFolderId && parseInt(urlFolderId, 10) === idToDelete) {
                    navigate("/bookmark", { replace: true });
                }
                handleDeleteModalCancel();
                alert("폴더가 삭제되었습니다.");
            })
            .catch((err) => {
                console.error("***** 폴더 삭제 실패 *****:", err);
                alert("폴더 삭제에 실패했습니다. 다시 로그인 후 시도해주세요.");
                handleDeleteModalCancel();
            });
    };

    const currentFolderName = urlFolderId ? folders.find(f => f.folderId === parseInt(urlFolderId, 10))?.folderName || "" : "";

    return (
        <>
            <MypageNav />
            <div className={bookmarkStyle.layout}>
                <div className={bookmarkStyle.container}>
                    <div className={bookmarkStyle.container2}>
                        <main className={bookmarkStyle.mainContent}>
                            <header className={bookmarkStyle.header}>
                                <h1>{urlFolderId ? `MY BOOKMARK - ${currentFolderName}` : "MY BOOKMARK"}</h1>
                                {!urlFolderId && <div className={bookmarkStyle.buttons}><button className={bookmarkStyle.btn} onClick={handleAddFolder}>폴더 추가</button></div>}
                            </header>

                            <section className={bookmarkStyle.bookmarkGrid}>
                                {isLoading ? <div className={bookmarkStyle.loading}>로딩 중...</div>
                                : urlFolderId ? (
                                        selectedFolderVideos.length === 0 ? <div className={bookmarkStyle.emptyState}>이 폴더에 영상이 없습니다.</div>
                                        : (
                                            selectedFolderVideos.map((video, index) => {
                                                const videoId = video.videoId || video.video_id || video.youtubeVideoId;
                                                const videoTitle = video.videoTitle || video.title;
                                                const thumbnailUrl = video.thumbnailUrl || video.thumbnail_url;

                                                return (
                                                    <div key={videoId || `video-${index}`} className={bookmarkStyle.bookmarkItem}>
                                                        <div className={bookmarkStyle.bookmarkCard} onClick={() => handleVideoClick(video)}>
                                                            <div className={bookmarkStyle.placeholderImage}>
                                                                {thumbnailUrl ? (
                                                                    <img src={thumbnailUrl} alt={videoTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                                                                ) : <div className={bookmarkStyle.defaultThumbnail}></div>}
                                                            </div>
                                                        </div>
                                                        <div className={bookmarkStyle.bookmarkFooter}>
                                                            <div className={bookmarkStyle.bookmarkTitle}>{videoTitle || "제목 없음"}</div>
                                                            <div className={bookmarkStyle.bookmarkOptions} onClick={(e) => { e.stopPropagation(); handleOpenDeleteVideoModal(video); }}>
                                                                ⋯
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )
                                ) : (
                                        folders.map((f) => (
                                            <div key={f.folderId} className={bookmarkStyle.bookmarkItem} onClick={() => handleFolderClick(f.folderId)}>
                                                <div className={bookmarkStyle.bookmarkCard}>
                                                    <div className={bookmarkStyle.placeholderImage}>
                                                        {f.randomThumbnailUrl ? (
                                                            <img 
                                                                src={f.randomThumbnailUrl} 
                                                                alt={`${f.folderName} 썸네일`} 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div style={{width: '100%', height: '100%', backgroundColor: '#00bcd4'}}></div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={bookmarkStyle.bookmarkFooter}>
                                                    <div className={bookmarkStyle.bookmarkTitle}>{f.folderName}</div>
                                                    <div className={bookmarkStyle.bookmarkOptions} onClick={(e) => { e.stopPropagation(); handleOpenOptionsModal(f.folderId); }}>⋯</div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </section>

                            {/* 이하 모달들 */}
                            <Modal isOpen={isAddModalOpen} onClose={handleAddModalCancel} title="폴더 추가" onConfirm={handleAddModalSubmit} confirmText="확인" cancelText="취소">
                                <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} maxLength={10} placeholder="폴더 이름을 입력하세요 (최대 10자)" className={bookmarkStyle.modalInput}/>
                            </Modal>
                            
                            <Modal 
                                isOpen={isOptionsModalOpen} 
                                onClose={() => setIsOptionsModalOpen(false)}
                                title="폴더 옵션" 
                                confirmText="이름 변경" 
                                cancelText="삭제" 
                                onConfirm={handleOpenRenameModal} 
                                onCancel={handleDeleteFolder}
                            >
                                <p>폴더에 대한 작업을 선택하세요.</p>
                            </Modal>

                            <Modal isOpen={isRenameModalOpen} onClose={handleRenameModalCancel} title="폴더 이름 변경" onConfirm={handleRenameModalSubmit} confirmText="변경" cancelText="취소">
                                <input type="text" value={renameFolderName} onChange={(e) => setRenameFolderName(e.target.value)} maxLength={10} placeholder="새 폴더 이름을 입력하세요 (최대 10자)" className={bookmarkStyle.modalInput}/>
                            </Modal>
                            <Modal isOpen={isDeleteModalOpen} onClose={handleDeleteModalCancel} title="폴더 삭제" onConfirm={handleDeleteModalSubmit} confirmText="삭제" cancelText="취소">
                                <p>{`'${folders.find(f => f.folderId === folderIdPendingAction)?.folderName || ""}' 폴더를 삭제하시겠습니까?`}<br />(폴더 내 북마크도 모두 삭제됩니다.)</p>
                            </Modal>
                            <Modal isOpen={isDeleteVideoModalOpen} onClose={() => setIsDeleteVideoModalOpen(false)} title="북마크 삭제" onConfirm={handleDeleteVideoConfirm} confirmText="삭제" cancelText="취소">
                                <p>{`'${videoToDelete?.videoTitle || videoToDelete?.title || "선택한 영상"}'을(를)`}<br />이 폴더에서 삭제하시겠습니까?</p>
                            </Modal>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Bookmark;