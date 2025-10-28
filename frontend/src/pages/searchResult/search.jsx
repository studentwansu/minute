import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../../assets/styles/search.module.css";
import SearchBar from "../../components/MainSearchBar/SearchBar";

function Search() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const location = useLocation();
  // URL 쿼리에서 검색어 추출
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query") || "";

  useEffect(() => {
    if (!query) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    const config = {
      params: { keyword: query },
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    };

    axios
      .get("/api/v1/videos", config)
      .then((res) => {
        setVideos(res.data || []);
      })
      .catch((err) => {
        console.error("검색 API 호출 실패:", err);
        setError(err);
        setVideos([]);
      })
      .finally(() => {
        setLoading(false);
        // 검색어가 바뀔 때마다 항상 1페이지로 초기화
        setCurrentPage(1);
      });
  }, [query]);

  // 페이지네이션 계산
  const totalItems = videos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = videos.slice(startIdx, startIdx + itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // 스크롤을 위로 올리고 싶으면 아래처럼 추가할 수 있습니다.
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <SearchBar
          showTitle={false}
          compact={true}
          className={styles.searchCompact}
          textboxClassName={styles.textboxCompact}
        />

        {loading && <div className={styles.status}>로딩 중...</div>}

        {error && (
          <div className={styles.status}>
            에러 발생: {error.message}
          </div>
        )}

        {!loading && !error && (
          <>
            {query && (
              <h2 className={styles.title}>
                “{query}” 검색 결과 ({totalItems})
              </h2>
            )}

            <div className={styles.grid}>
              {currentItems.map((video) => (
                <Link
                  key={video.videoId}
                  to={`/shorts/${video.videoId}`}
                  replace
                  state={{
                    origin: location.pathname + location.search,
                    list: videos,
                  }}
                  className={styles.gridItem}
                >
                  <div className={styles.thumbnailWrapper}>
                    <img
                      src={video.thumbnailUrl}
                      alt={video.videoTitle}
                      className={styles.thumbnail}
                    />
                  </div>
                  <div className={styles.textWrapper}>
                    <h3>{video.videoTitle}</h3>
                    {/* 필요한 경우 채널 이름 등 추가 가능 */}
                    {/* <p>{video.channelName}</p> */}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={
                        currentPage === number ? styles.active : ""
                      }
                    >
                      {number}
                    </button>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;
