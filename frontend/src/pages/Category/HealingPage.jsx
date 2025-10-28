import axios from 'axios';
import { useEffect, useState } from "react";
import styles from "../../assets/styles/HealingPage.module.css";
import SearchBar from "../../components/MainSearchBar/SearchBar";
import { useNavigate } from 'react-router-dom';

function HealingPage() {
  const [videos,setVideos] = useState([]);
  const [visibleItems, setVisibleItems] = useState(5);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const totalItems = videos.length;

  useEffect(() => {
    setLoading(true);
    console.log("▶ 힐링 영상 요청 시작");
    axios.get('http://localhost:8080/api/v1/videos', {
      params: { category: '힐링' }
    })
    .then(res => {
      console.log("▲ 힐링 요청 응답:", res.data);
  
      // ↓여기를 실제 응답 구조에 맞게 채우셔야 합니다
      if (Array.isArray(res.data)) {
        setVideos(res.data);
      } else if (Array.isArray(res.data.content)) {
        setVideos(res.data.content);
      } else {
        console.error('영상 데이터가 배열이 아닙니다.');
        setVideos([]);
      }
    })
    .catch(err => {
      console.error("힐링 요청 에러:", err);
      setVideos([]);
    })
    .finally(() => {
      setLoading(false);
      console.log("Loading → false");
    });
  }, []);
  

  const handleLoadMore = () => {
    setVisibleItems((prev) => Math.min(prev + 5, totalItems));
  };

  const onClickVideo = (videoId) => {
    navigate(`/shorts/${videoId}`);
  };

  return (
    <div className={styles.container}>
       <SearchBar />
    {/* 로딩 중일 때 스피너 렌더링 */}
    {loading ? (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
      </div>
    ) : (
        <div className={styles.videoList}>
          {videos.length === 0 ? (
            <p>힐링 카테고리 영상이 없습니다.</p>
          ) : (
            <ul>
              {videos.slice(0, visibleItems).map(video => (
                <li 
                  key={video.videoId} 
                  className={styles.videoItem}
                  onClick={() => onClickVideo(video.videoId)} >
                  <img
                    className={styles.videoThumbnail}
                    src={video.thumbnailUrl}
                    alt={video.videoTitle}
                  />
                  <div className={styles.videoTitle}>{video.videoTitle}</div>
                  <p className={styles.videoDescription}>
                    {video.videoDescription}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {visibleItems < videos.length && (
            <button
              className={styles.loadMoreButton}
              onClick={handleLoadMore}
            >
              더보기
            </button>
          )}
        </div>
    )}
  </div>
);
}
export default HealingPage;
