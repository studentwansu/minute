// src/pages/Main.jsx

import { useEffect, useState } from "react";
import divStyle from "../../assets/styles/Main.module.css";
import Header from "../../components/Header/Header";
import SearchBar from "../../components/MainSearchBar/SearchBar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Main() {
  // ── 1) useNavigate 선언 ─────────────────────────────
  const navigate = useNavigate();

  // ── 2) 로그인 여부 확인 ─────────────────────────────
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const isLoggedIn = Boolean(token && userId);

  console.log("[Main] isLoggedIn:", isLoggedIn, "token:", token);

  // ── 3) 상태 정의 ────────────────────────────────────
  // (1) 추천 영상 (로그인 시)
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [visibleRecommended, setVisibleRecommended] = useState(5);

  // (2) 인기 영상 (비로그인 시)
  const [popularVideos, setPopularVideos] = useState([]);
  const [visiblePopular, setVisiblePopular] = useState(5);

  // (3) 최신 영상 (비로그인 시)
  const [latestVideos, setLatestVideos] = useState([]);
  const [visibleLatest, setVisibleLatest] = useState(5);

  // (4) 로딩 상태
  const [loading, setLoading] = useState(true);

  // (5) 관심없음 dislike 목록
  const [dislikes, setDislikes] = useState({});


    // ── 4) “관심없음(dislike) 목록” 가져오기 ──────────────────
    useEffect(() => {
      if (!isLoggedIn) {
        // 로그인 안 되어 있으면 관심없음 목록 조회 안 함
        return;
      }
  
      axios
        .get(`/api/v1/auth/${userId}/dislikes`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const dislikeMap = {};
          res.data.forEach((video) => {
            dislikeMap[video.videoId] = true;
          });
          setDislikes(dislikeMap);
        })
        .catch((err) => {
          console.error("디스라이크 목록 불러오기 실패:", err.response || err.message);
          setDislikes({});
        });
    }, [isLoggedIn, token, userId]);

  // ── 5) 컴포넌트 마운트 시 API 호출 및 dislike 필터링 ─────────────────────
  useEffect(() => {
    setLoading(true);

    if (isLoggedIn) {
      // ──── 5-1) 로그인 상태: 추천 영상 API 호출 ───────────
      axios
        .get("/api/v1/videos", {
          headers: { Authorization: `Bearer ${token}` },
          params: { userId },
        })
        .then((res) => {
          // 받아온 추천 영상 리스트에서 dislike에 걸린 것 필터링
          const allRecs = res.data || [];
          // dislike 표시한 영상은 거르고 나머지만 저장
          const filteredRecs = allRecs.filter((video) => !dislikes[video.videoId]);
          setRecommendedVideos(filteredRecs);
        })
        .catch((err) => {
          console.error("추천 영상 API 에러:", err.response || err.message);
          setRecommendedVideos([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // ──── 5-2) 비로그인 상태: 인기 영상 + 최신 영상 병렬 호출 ────
      const fetchPopular = axios.get("/api/v1/videos");
    
      const fetchLatest = axios.get("/api/v1/videos/latest"); 

      Promise.all([fetchPopular, fetchLatest])
      .then(([resPopular, resLatest]) => {
        // 인기 영상 필터
        const popList = Array.isArray(resPopular.data) ? resPopular.data : [];
        const filteredPop = popList.filter((video) => !dislikes[video.videoId]);
        setPopularVideos(filteredPop);

        // 최신 영상 필터
        const latList = Array.isArray(resLatest.data) ? resLatest.data : [];
        const filteredLat = latList.filter((video) => !dislikes[video.videoId]);
        setLatestVideos(filteredLat);
      })
      .catch((err) => {
        if (err.response) {
          console.error("인기·최신 API 응답 실패 상태 코드:", err.response.status);
          console.error("인기·최신 API 응답 실패 내용:", err.response.data);
        } else {
          console.error("API 요청 중 에러 발생:", err.message);
        }
        setPopularVideos([]);
        setLatestVideos([]);
      })
      .finally(() => {
        setLoading(false);
        console.log("[Main] 인기+최신 useEffect 끝, loading=false");
      });
    }
  }, [isLoggedIn, token, userId, dislikes]);
 
  // ── 5) “더보기” 핸들러 ─────────────────────────────────
  const handleLoadMoreRecommended = () => {
    setVisibleRecommended((prev) => Math.min(prev + 5, recommendedVideos.length));
  };
  const handleLoadMorePopular = () => {
    setVisiblePopular((prev) => Math.min(prev + 5, popularVideos.length));
  };
  const handleLoadMoreLatest = () => {
    setVisibleLatest((prev) => Math.min(prev + 5, latestVideos.length));
  };

  // ── 6) 화면 렌더링 ────────────────────────────────────
  return (
    <>
      <Header />
      <div className={divStyle.main}>
        <SearchBar />

        {loading ? (
          <div className={divStyle.loadingWrapper}>
          <div className={divStyle.spinner} />
        </div>
        ) : isLoggedIn ? (
          // ── 6-1) 로그인 시: “추천 영상” 섹션 하나만 ───────────
          <div className={divStyle.videoList}>
            <h2 className={divStyle.sectionTitle}>추천 영상</h2>
            <ul>
              {recommendedVideos.slice(0, visibleRecommended).map((video) => (
                <li
                  key={video.videoId}
                  className={divStyle.videoItem}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/shorts/${video.videoId}`, {
                      state: {
                        origin: "main",
                        list: recommendedVideos,
                      },
                    })
                  }
                >
                  <img
                    className={divStyle.videoThumbnail}
                    src={video.thumbnailUrl || "https://via.placeholder.com/220x124"}
                    alt={video.videoTitle || "제목 없음"}
                  />
                  <div className={divStyle.videoTitle}>
                    {video.videoTitle || "제목 없음"}
                  </div>
                  <p className={divStyle.videoDescription}>
                    {video.videoDescription || ""}
                  </p>
                </li>
              ))}
            </ul>
            {visibleRecommended < recommendedVideos.length && (
              <button
                className={divStyle.loadMoreButton}
                onClick={handleLoadMoreRecommended}
              >
                더보기
              </button>
            )}
          </div>
        ) : (
          // ── 6-2) 비로그인 시: “인기 영상” + “최신 영상” 두 섹션 ─────
          <>
            {/* ── 6-2-1) 인기 영상 섹션 ──────────────── */}
            <div className={divStyle.videoList}>
              <h2 className={divStyle.sectionTitle}>인기 영상</h2>
              <ul>
                {popularVideos.slice(0, visiblePopular).map((video) => (
                  <li
                    key={video.videoId}
                    className={divStyle.videoItem}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/shorts/${video.videoId}`, {
                        state: {
                          origin: "main-popular",
                          list: popularVideos,
                        },
                      })
                    }
                  >
                    <img
                      className={divStyle.videoThumbnail}
                      src={video.thumbnailUrl || "https://via.placeholder.com/220x124"}
                      alt={video.videoTitle || "제목 없음"}
                    />
                    <div className={divStyle.videoTitle}>
                      {video.videoTitle || "제목 없음"}
                    </div>
                    <p className={divStyle.videoDescription}>
                      {video.videoDescription || ""}
                    </p>
                  </li>
                ))}
              </ul>
              {visiblePopular < popularVideos.length && (
                <button
                  className={divStyle.loadMoreButton}
                  onClick={handleLoadMorePopular}
                >
                  더보기
                </button>
              )}
            </div>

            {/* ── 6-2-2) 최신 영상 섹션 ──────────────── */}
            <div className={divStyle.videoList}>
              <h2 className={divStyle.sectionTitle}>최신 영상</h2>
              <ul>
                {latestVideos.slice(0, visibleLatest).map((video) => (
                  <li
                    key={video.videoId}
                    className={divStyle.videoItem}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/shorts/${video.videoId}`, {
                        state: {
                          origin: "main-latest",
                          list: latestVideos,
                        },
                      })
                    }
                  >
                    <img
                      className={divStyle.videoThumbnail}
                      src={video.thumbnailUrl || "https://via.placeholder.com/220x124"}
                      alt={video.videoTitle || "제목 없음"}
                    />
                    <div className={divStyle.videoTitle}>
                      {video.videoTitle || "제목 없음"}
                    </div>
                    <p className={divStyle.videoDescription}>
                      {video.videoDescription || ""}
                    </p>
                  </li>
                ))}
              </ul>
              {visibleLatest < latestVideos.length && (
                <button
                  className={divStyle.loadMoreButton}
                  onClick={handleLoadMoreLatest}
                >
                  더보기
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Main;
