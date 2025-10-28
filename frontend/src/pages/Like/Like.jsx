import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import styles from "../../assets/styles/Like.module.css";
import Modal from "../../components/Modal/Modal";
import MypageNav from "../../components/MypageNavBar/MypageNav";

const VIDEO_WIDTH = 220;
const GAP = 20;
const VISIBLE_COUNT = 6;
const SCROLL_STEP = VIDEO_WIDTH + GAP;

function Like() {
  const navigate = useNavigate();
  const [likedVideos, setLikedVideos] = useState([]);
  const [recentWatched, setRecentWatched] = useState([]);
  const [filter, setFilter] = useState("전체");

  const [modal, setModal] = useState({ show: false, index: -1, type: null, videoId: null });

  const [toastMessage, setToastMessage] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setIsToastOpen(true);
    setTimeout(() => {
      setIsToastOpen(false);
    }, 2500); // 2.5초 후 자동 닫힘
  };

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId"); 

  useEffect(() => {
    if (!token || !userId) {
      console.warn("Like.jsx: 로그인 정보가 없어 API를 호출하지 않습니다.");
      return;
    }
   
    // 좋아요 영상 가져오기 (원래대로)
    axios
      .get(`/api/v1/auth/${userId}/likes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setLikedVideos(res.data || []))
      .catch(err => console.error("좋아요 영상 API 에러:", err));

    // 시청 기록 가져오기 + 중복 제거 + 정렬
    axios
      .get(`/api/v1/auth/${userId}/watch-history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const rawList = res.data || [];
        const dedupedMap = rawList.reduce((acc, video) => {
          const vid = video.videoId;
          const prev = acc[vid];
          if (!prev || new Date(video.watchedAt) > new Date(prev.watchedAt)) {
            acc[vid] = video;
          }
          return acc;
        }, {});
        const dedupedList = Object.values(dedupedMap);
        dedupedList.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
        setRecentWatched(dedupedList);
      })
      .catch(err => {
        console.error("시청 기록 API 에러:", err.response?.status, err.response?.data || err.message);
        setRecentWatched([]);
      });
  }, [token, userId]);

  const scroll = (containerId, direction) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const newScrollLeft = container.scrollLeft + direction * SCROLL_STEP;
    container.scrollTo({ left: Math.min(Math.max(newScrollLeft, 0), maxScrollLeft), behavior: 'smooth' });
  };

  const closeAllModals = () => {
    setModal({ show: false, index: -1, type: null, videoId: null });
  };

  const handleDelete = async () => {
    const { type, videoId: videoIdToDelete } = modal; // videoId 직접 사용

    if (!videoIdToDelete || !type) {
      console.error("삭제할 영상의 ID 또는 타입 정보가 없습니다.");
      closeAllModals();
      return;
    }

    let url = "";
    if (type === "like") {
      url = `/api/v1/auth/${userId}/videos/${videoIdToDelete}/like`;
    } else if (type === "history") {
      url = `/api/v1/auth/${userId}/watch-history/${videoIdToDelete}`;
    } else {
      console.error("알 수 없는 삭제 타입입니다:", type);
      closeAllModals();
      return;
    }

    try {
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      if (type === "like") {
        setLikedVideos(prev => prev.filter(video => video.videoId !== videoIdToDelete));
        showToast("좋아요 목록에서 삭제되었습니다.");
      } else {
        setRecentWatched(prev => prev.filter(video => video.videoId !== videoIdToDelete));
        showToast("시청 기록에서 삭제되었습니다.");
      }
    } catch (err) {
      console.error(`${type} 삭제 API 에러:`, err);
      showToast("삭제 중 오류가 발생했습니다.");
    }
    closeAllModals();
  };

  // 최근선택 시 7일이내 필터링
  const getFilteredVideos = () => {
    if (filter === "최근") {
      const oneWeekAgo = new Date(); // 지금 이 시각
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // 7일 전 이 시각까지 포함
  
      return likedVideos
        .filter(video => new Date(video.createdAt) >= oneWeekAgo)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return likedVideos;
  };

  const renderVideos = (videoList, containerId, type) => (
    <div className={styles.videoListWrapper}>
      {videoList.length > VISIBLE_COUNT && (
        <button className={styles.arrow} onClick={() => scroll(containerId, -1)}>‹</button>
      )}
      <div className={styles.videoList} id={containerId}>
        {videoList.map((video, idx) => (
          <div key={video.videoId || `video-${idx}`} className={styles.videoItem}
          // onClick={() => navigate(`/shorts/${video.videoId}`)} 
          onClick={() =>
              navigate(`/shorts/${video.videoId}`, {
                state: { origin: type, list: videoList },
              })
            }
          >
            <div className={styles.thumbnailWrapper}>
              <img 
                src={video.thumbnailUrl || "https://via.placeholder.com/220x124"} // 기본 이미지 추가
                alt={video.videoTitle || "제목 없음"} 
                className={styles.thumbnail} 
                loading="lazy" 
              />
            </div>
            <div className={styles.textWrapper}>
              <span className={styles.videoTitleText}>{video.videoTitle || "제목 없음"}</span>
              <button className={styles.moreBtn} 
              onClick={(e) => {
                e.stopPropagation();
                setModal({ show: true, index: idx, type, videoId: video.videoId });
              }}>
                ⋯
              </button>
            </div>
          </div>
        ))}
      </div>
      {videoList.length >= VISIBLE_COUNT && (
        <button className={styles.arrow} onClick={() => scroll(containerId, 1)}>›</button>
      )}
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <MypageNav />
      <div className={styles.mainContent}>
        <h1 className={styles.header}>좋아요 한 영상</h1>
        <div className={styles.filterMenu}>
          {['전체', '최근'].map(f => (
            <button key={f} className={`${styles.filterButton} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        {getFilteredVideos().length > 0 ? renderVideos(getFilteredVideos(), 'likedVideoList', 'like') : <p className={styles.noData}>좋아요 한 영상이 없습니다.</p>}

        <h2 className={styles.sectionTitle}>최근 시청한 영상</h2>
        {recentWatched.length
          ? renderVideos(
              [...recentWatched].sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)), // ← 여기 정렬
              'recentVideoList',
              'history'
            )
          : <p className={styles.noData}>최근 시청한 영상이 없습니다.</p>}

          <Modal
            isOpen={modal.show}
            onClose={closeAllModals}
            title={modal.type === "like" ? "좋아요 한 영상 삭제" : "시청 기록 삭제"}
            message="정말 삭제하시겠습니까?"
            confirmText="삭제"
            cancelText="취소"
            onConfirm={handleDelete}
            onCancel={closeAllModals}
            hideCloseButton={false}
          >
          {/* <div className={styles.optionsContainer}>
            <button className={styles.optionButton} onClick={handleDelete}>
              {modal.type === "like" ? "좋아요 목록에서 삭제" : "시청 기록에서 삭제"}
            </button>
          </div> */}
        </Modal>

        {/* 삭제 완료 토스트용 모달 */}
        <Modal
          isOpen={isToastOpen}
          onClose={() => setIsToastOpen(false)}
          hideCloseButton={true}
          cancelText={null}
          onConfirm={null}
          message={toastMessage}
          type="success"  // 스타일이 있다면 'success' 타입 지정
        />
      </div>
    </div>
  );
}
export default Like;