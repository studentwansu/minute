import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import styles from "../../assets/styles/ShortsVideoPage.module.css";
import Header from "../../components/Header/Header";
import SearchBar from "../../components/MainSearchBar/SearchBar";

// 아이콘 임포트
import arrowIcon from "../../assets/images/arrow.png";
import starOutlinedIcon from "../../assets/images/b_star.png";
import thumbDownOutlinedIcon from "../../assets/images/b_thumbdowm.png";
import thumbUpOutlinedIcon from "../../assets/images/b_thumbup.png";
import starIcon from "../../assets/images/star.png";
import thumbDownIcon from "../../assets/images/thumbdowm.png";
import thumbUpIcon from "../../assets/images/thumbup.png";

function ShortsVideoPage() {
  // 1) URL param에서 videoId를 받아옵니다.
  const { videoId: paramVideoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // location.state가 undefined일 수 있으므로 || {} 로 기본값 처리
  // **한 번만 디스트럭처링**: origin은 가급적 pageOriginFromState라는 이름으로 재명명해서 사용하고,
  // list도 incomingListFromState라는 이름 하나로만 꺼냅니다.
  // const { origin: pageOriginFromState, list: incomingListFromState } = location.state || {};

  // RegionPage에서 state.shorts, state.startIdx 이런 식으로 보냈다면 아래처럼 읽어옵니다.
 const { shorts: incomingListFromState, startIdx: incomingStartIdx, origin: pageOriginFromState } = location.state || {};

  // 2) 로그인 여부
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 3) 좋아요/싫어요 맵
  const [likes, setLikes] = useState({});
  const [dislikes, setDislikes] = useState({});

  // 현재 재생 중인 영상의 좋아요 개수
  const [currentLikeCount, setCurrentLikeCount] = useState(0);

  // ────────────────────────────────────────────────────
  // 4) “원본 숏츠 목록(originalShorts)” + “현재 인덱스(currentOriginalIdx)”
  const [originalShorts, setOriginalShorts] = useState([]);
  const [currentOriginalIdx, setCurrentOriginalIdx] = useState(0);

  // ────────────────────────────────────────────────────
  // 5) 북마크(폴더) 관련 상태
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [folders, setFolders] = useState([]); // 폴더 목록 상태 {folderId, folderName}
  const [newFolderName, setNewFolderName] = useState("");
  const [bookmarkedVideos, setBookmarkedVideos] = useState({}); // 북마크된 비디오 ID 맵

  // ────────────────────────────────────────────────────
  // 6) 로그인 모달
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // ────────────────────────────────────────────────────
  // 7) 토스트(간단히 상태 표시)
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const openToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // ────────────────────────────────────────────────────
  // playerRef: 실제 YT.Player 인스턴스를 담는 ref
  // playerContainerRef: DOM 상의 <div> 컨테이너 ref
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);

  // ────────────────────────────────────────────────────
  // (A) originalShorts 목록이 준비되거나 변경되면 YT.Player 생성 또는 비디오 로드
  useEffect(() => {
    if (!originalShorts.length) {
      // originalShorts가 비어있으면 기존 플레이어가 있으면 파괴
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    // 현재 재생할 videoId 결정
    const currentVideoToPlayId =
      originalShorts[currentOriginalIdx]?.id?.videoId ||
      originalShorts[currentOriginalIdx]?.videoId ||
      "";

    function onYouTubeIframeAPIReady() {
      if (!playerContainerRef.current || !currentVideoToPlayId) {
        return;
      }
      // 플레이어 인스턴스가 없으면 새로 생성
      if (!playerRef.current) {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: currentVideoToPlayId,
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: (event) => event.target.playVideo(),
            onStateChange: (evt) => {
              if (evt.data === window.YT.PlayerState.ENDED) {
                evt.target.playVideo();
              }
            },
            onError: (err) => console.error("YT Player 에러", err),
          },
        });
      } else {
        // 이미 생성된 플레이어가 있으면 loadVideoById만 호출
        if (typeof playerRef.current.loadVideoById === "function") {
          playerRef.current.loadVideoById({ videoId: currentVideoToPlayId });
        }
      }
    }

    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    // (컴포넌트가 언마운트될 때만 파괴하도록 하려면 클린업에서는 제거하지 않습니다)
    return () => {
      // 빈 클린업: 언마운트 시에만 따로 파괴 로직 실행(아래 useEffect에 있음)
    };
  }, [originalShorts]);

  // 컴포넌트 언마운트 시 플레이어 정리
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      delete window.onYouTubeIframeAPIReady;
    };
  }, []);

  // ────────────────────────────────────────────────────
  // (B) currentOriginalIdx가 바뀔 때마다: playerRef가 유효하면 loadVideoById만 호출
  useEffect(() => {
    if (!originalShorts.length || currentOriginalIdx < 0 || currentOriginalIdx >= originalShorts.length) {
      return;
    }

    const nextVideoId =
      originalShorts[currentOriginalIdx]?.id?.videoId ||
      originalShorts[currentOriginalIdx]?.videoId ||
      null;

    if (playerRef.current && typeof playerRef.current.loadVideoById === "function" && nextVideoId) {
      playerRef.current.loadVideoById({ videoId: nextVideoId });
    }
  }, [currentOriginalIdx, originalShorts]);

  // ────────────────────────────────────────────────────
  // 8) 첫 번째 useEffect: 로그인 여부 확인 + 좋아요·싫어요·북마크 초기 로드
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const loggedIn = Boolean(token && userId);
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      const headers = { Authorization: `Bearer ${token}` };

      // 좋아요 목록
      axios
        .get(`/api/v1/auth/${userId}/likes`, { headers })
        .then((res) => {
          const likeMap = {};
          res.data.forEach((video) => {
            likeMap[video.videoId] = true;
          });
          setLikes(likeMap);
        })
        .catch((err) => console.error("초기 좋아요 불러오기 실패", err));

      // 싫어요 목록
      axios
        .get(`/api/v1/auth/${userId}/dislikes`, { headers })
        .then((res) => {
          const dislikeMap = {};
          res.data.forEach((video) => {
            dislikeMap[video.videoId] = true;
          });
          setDislikes(dislikeMap);
        })
        .catch((err) => console.error("초기 싫어요 불러오기 실패", err));

      // 북마크 목록
      axios
        .get(`/api/v1/bookmarks/user/mine`, { headers })
        .then((res) => {
          const bookmarkMap = {};
          res.data.forEach((videoDto) => {
            bookmarkMap[videoDto.videoId] = true;
          });
          setBookmarkedVideos(bookmarkMap);
        })
        .catch((err) => console.error("초기 북마크 불러오기 실패", err));
    }
  }, []);

  // ────────────────────────────────────────────────────
  // 9) 두 번째 useEffect: “원본 숏츠 목록(originalShorts)” 초기 로드
  //    ⇒ paramVideoId 또는 incomingListFromState가 바뀔 때마다 재실행
  useEffect(() => {
    // 먼저 location.state로부터 들어온 목록을 사용할 수 있는지 확인
    // if (Array.isArray(incomingListFromState) && incomingListFromState.length > 0) {
    //   setOriginalShorts(incomingListFromState);

    //   let initialIdx = 0;
    //   if (paramVideoId) {
    //     const idx = incomingListFromState.findIndex((item) => {
    //       const id = item?.id?.videoId || item?.videoId || null;
    //       return id === paramVideoId;
    //     });
    //     initialIdx = idx !== -1 ? idx : 0;
    //   }

    //   if (currentOriginalIdx !== initialIdx) {
    //     setCurrentOriginalIdx(initialIdx);
    //   }
    //   return;
    // }
        // 1) RegionPage에서 넘긴 shorts 배열(shorts: incomingListFromState)이 있는지 확인
    if (Array.isArray(incomingListFromState) && incomingListFromState.length > 0) {
      setOriginalShorts(incomingListFromState);

      // 2) startIdx가 있으면 그대로, 없으면 paramVideoId 기반으로 인덱스 계산
      if (typeof incomingStartIdx === "number" && incomingStartIdx >= 0) {
        setCurrentOriginalIdx(incomingStartIdx);
      } else {
        let initialIdx = 0;
        if (paramVideoId) {
          const idx = incomingListFromState.findIndex((item) => {
            const id = item?.id?.videoId || item?.videoId || null;
            return id === paramVideoId;
          });
          initialIdx = idx !== -1 ? idx : 0;
        }
        setCurrentOriginalIdx(initialIdx);
      }
      return;
    }

    // fallback: DB/API에서 가져오기
    const dbFetch = fetch(`/api/v1/youtube/db/shorts?maxResults=20`)
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);

    const apiFetch = fetch(`/api/v1/youtube/shorts?maxResults=20`)
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);

    Promise.all([dbFetch, apiFetch]).then(([dbVideos, apiVideos]) => {
      const dbItems = Array.isArray(dbVideos)
        ? dbVideos.map((v) => ({
            videoId: v.youtubeVideoId || v.videoId || v.youtube_video_id,
            videoTitle: v.title || v.videoTitle || v.video_title,
          }))
        : [];

      const allItems = [...dbItems, ...apiVideos];

      if (paramVideoId) {
        const idx = allItems.findIndex((item) => {
          const id = item?.id?.videoId || item?.videoId || null;
          return id === paramVideoId;
        });

        if (idx === -1) {
          allItems.unshift({
            id: { videoId: paramVideoId },
            snippet: {
              title: "",
              description: "",
              thumbnails: { medium: { url: "" } },
            },
          });
          setOriginalShorts(allItems);
          setCurrentOriginalIdx(0);
          return;
        } else {
          setOriginalShorts(allItems);
          setCurrentOriginalIdx(idx);
          return;
        }
      }

      setOriginalShorts(allItems);
      setCurrentOriginalIdx(0);
    });
  }, [paramVideoId, incomingListFromState, incomingStartIdx]);

  // ────────────────────────────────────────────────────
  // 10) 세 번째 useEffect: “시청 기록 저장” + 조회수·좋아요 개수 가져오기
  useEffect(() => {
    if (!originalShorts.length) return;

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const currentItem = originalShorts[currentOriginalIdx];
    const idToRecord = currentItem?.id?.videoId || currentItem?.videoId || null;

    if (!idToRecord) return;

    // (1) 로그인 사용자만 시청 기록 저장
    if (isLoggedIn && userId && token) {
      axios
        .post(
          `/api/v1/auth/${userId}/watch-history`,
          { videoId: idToRecord },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        )
        .catch((err) => console.error("시청 기록 저장 실패", err));
    }

    // (2) 조회수 증가 + 좋아요 개수까지 가져오는 API 호출
    axios
      .get(
        userId
          ? `/api/v1/videos/${idToRecord}?userId=${userId}`
          : `/api/v1/videos/${idToRecord}`
      )
      .then((res) => {
        const dto = res.data;
        setCurrentLikeCount(dto.likes || 0);
      })
      .catch((err) => {
        console.error("조회수 증가 + 좋아요 개수 API 호출 실패", err);
      });
  }, [currentOriginalIdx, originalShorts, isLoggedIn]);

  // ────────────────────────────────────────────────────
  // 11) 좋아요 클릭 핸들러
  const handleThumbUpClick = async () => {
    const currentItem = originalShorts[currentOriginalIdx];
    if (!currentItem) return;
    const currentVideoId = currentItem.id?.videoId || currentItem.videoId;
    if (!currentVideoId) return;

    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const isNowLiked = !!likes[currentVideoId];
    const isNowDisliked = !!dislikes[currentVideoId];

    try {
      if (!isNowLiked) {
        // UI 업데이트: 좋아요 추가
        setLikes((prev) => ({ ...prev, [currentVideoId]: true }));
        setCurrentLikeCount((prev) => prev + 1);

        // API 요청: 좋아요 등록
        await axios.post(
          `/api/v1/auth/${userId}/videos/${currentVideoId}/like`,
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 기존에 싫어요 상태였다면 해제
        if (isNowDisliked) {
          setDislikes((prev) => {
            const copy = { ...prev };
            delete copy[currentVideoId];
            return copy;
          });
        }
      } else {
        // UI 업데이트: 좋아요 해제
        setLikes((prev) => {
          const copy = { ...prev };
          delete copy[currentVideoId];
          return copy;
        });
        setCurrentLikeCount((prev) => (prev > 0 ? prev - 1 : 0));

        // API 요청: 좋아요 취소
        await axios.delete(
          `/api/v1/auth/${userId}/videos/${currentVideoId}/like`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error("좋아요 API 에러", err);
      // 실패 시 리버트
      if (!isNowLiked) {
        setLikes((prev) => {
          const copy = { ...prev };
          delete copy[currentVideoId];
          return copy;
        });
        setCurrentLikeCount((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setLikes((prev) => ({ ...prev, [currentVideoId]: true }));
        setCurrentLikeCount((prev) => prev + 1);
      }
      openToast("좋아요 처리 중 오류가 발생했습니다.");
    }
  };
// 관심없음
  const handleThumbDownClick = async () => {
    const currentItem = originalShorts[currentOriginalIdx];
    if (!currentItem) return;
    const videoId = currentItem.id?.videoId || currentItem.videoId;
    if (!videoId) return;
  
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
  
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const isNowDisliked = !!dislikes[videoId];
    const isNowLiked = !!likes[videoId];
  
    try {
      // ← 반드시 POST 한 번만 호출해서 토글 처리하도록 백엔드 로직에 맞춤
      const response = await axios.post(
        `/api/v1/auth/${userId}/videos/${videoId}/dislike`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // response 상태 코드가 204라면 정상 처리된 것입니다.
      console.log('싫어요 토글 응답:', response.status, response.data);
  
      if (!isNowDisliked) {
        // (1) 기존에 싫어요가 없었다면 → 이제 싫어요 “등록”
        setDislikes(prev => ({ ...prev, [videoId]: true }));
        // (2) 만약 좋아요가 켜진 상태였다면 좋아요 해제 + 좋아요 카운트 -1
        if (isNowLiked) {
          setLikes(prev => {
            const copy = { ...prev };
            delete copy[videoId];
            return copy;
          });
          setCurrentLikeCount(prev => (prev > 0 ? prev - 1 : 0));
        }
      } else {
        // (3) 기존에 싫어요가 켜져 있었다면 → 이제 싫어요 “해제”
        setDislikes(prev => {
          const copy = { ...prev };
          delete copy[videoId];
          return copy;
        });
      }
    } catch (err) {
      // err.response 가 있는지 확인하고 전체를 찍어 봅니다.
      console.error('싫어요 토글 API 에러 전체:', err);
      if (err.response) {
        console.error('→ status:', err.response.status);
        console.error('→ data:', err.response.data);
        openToast(err.response.data?.message || '관심 없음 처리 중 오류가 발생했습니다.');
      } else {
        openToast('서버와 통신 중 오류가 발생했습니다.');
      }
    }
  };
  

  // ────────────────────────────────────────────────────
  // 13) 북마크 관련 핸들러
  const handleStarClick = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    if (folders.length === 0) {
      const token = localStorage.getItem("token");
      axios
        .get(`/api/v1/folder`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setFolders(res.data);
        })
        .catch((err) => {
          console.error("북마크 폴더 불러오기 실패", err);
        });
    }
    setIsFolderOpen((prev) => !prev);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `/api/v1/folder`,
        { folderName: newFolderName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newFolder = res.data;
      setFolders((prev) => [...prev, newFolder]);
      setNewFolderName("");
      await handleSaveFolder(newFolder); // 새 폴더에 바로 저장
    } catch (err) {
      console.error("새 폴더 생성 실패", err);
    }
  };

  const handleSaveFolder = async (folder) => {
    const currentItem = originalShorts[currentOriginalIdx];
    if (!currentItem || !folder) return;
    const currentVideoId = currentItem.id?.videoId || currentItem.videoId;
    if (!currentVideoId) {
      return;
    }

    const token = localStorage.getItem("token");
    const requestDto = { folderId: folder.folderId, videoId: currentVideoId };

    try {
      await axios.post(`/api/v1/bookmarks`, requestDto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarkedVideos((prev) => ({ ...prev, [currentVideoId]: true }));
      setIsFolderOpen(false);
    } catch (err) {
      console.error("북마크 저장 실패", err.response?.data || err.message);
    }
  };

  // ────────────────────────────────────────────────────
  // 14) “이전 영상” 이동 핸들러
  const handlePrev = () => {
    if (!originalShorts.length) return;

    let prevIdx = currentOriginalIdx - 1;
    while (prevIdx >= 0) {
      const videoIdToCheck =
        originalShorts[prevIdx]?.id?.videoId || originalShorts[prevIdx]?.videoId || null;
      if (!dislikes[videoIdToCheck]) {
        setCurrentOriginalIdx(prevIdx);
        return;
      }
      prevIdx--;
    }
    // 더 이상 이전 영상이 없을 때 토스트 등으로 알려줘도 됨
    // openToast("이전 영상이 없습니다.");
  };

  // ────────────────────────────────────────────────────
  // 15) “다음 영상” 이동 핸들러
  const handleNext = () => {
    if (!originalShorts.length) return;

    let nextIdx = currentOriginalIdx + 1;
    while (nextIdx < originalShorts.length) {
      const videoIdToCheck =
        originalShorts[nextIdx]?.id?.videoId || originalShorts[nextIdx]?.videoId || null;
      if (!dislikes[videoIdToCheck]) {
        setCurrentOriginalIdx(nextIdx);
        return;
      }
      nextIdx++;
    }
    // 더 이상 다음 영상이 없을 때 토스트 등으로 알려줘도 됨
    // openToast("다음 영상이 없습니다.");
  };

  // ────────────────────────────────────────────────────
  // 16) 렌더링
  const videoObj = originalShorts[currentOriginalIdx];
  const currentVideoId = videoObj?.id?.videoId || videoObj?.videoId || null;

  // 초기 로딩 중 화면
  if (!originalShorts.length && !paramVideoId) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <SearchBar
            showTitle={false}
            compact
            className={styles.searchCompact}
            textboxClassName={styles.textboxCompact}
          />
          <div className={styles.loadingMessage}>영상 목록을 불러오는 중입니다...</div>
        </div>
      </>
    );
  }

  // 비어 있지는 않지만 currentVideoId를 못 찾는 경우(데이터 구조 문제)
  if (
    originalShorts.length > 0 &&
    !currentVideoId &&
    currentOriginalIdx >= 0 &&
    currentOriginalIdx < originalShorts.length
  ) {
    console.error(
      "DEBUG: 렌더링 - currentVideoId를 찾을 수 없습니다. videoObj:",
      videoObj,
      "currentOriginalIdx:",
      currentOriginalIdx,
      "originalShorts:",
      originalShorts
    );
    // 상황에 따라 에러 UI를 추가할 수 있음
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <SearchBar
          showTitle={false}
          compact
          className={styles.searchCompact}
          textboxClassName={styles.textboxCompact}
        />

        <div className={styles.mainContent}>
          <div className={styles.contentWrap}>
            <div
              className={styles.shortVideo}
              id="player-container"
              ref={playerContainerRef}
            ></div>

            <div className={styles.reactionWrap}>
              <ul>
                <li>
                  <img
                    src={
                      currentVideoId && likes[currentVideoId]
                        ? thumbUpIcon
                        : thumbUpOutlinedIcon
                    }
                    alt="thumbUp"
                    onClick={handleThumbUpClick}
                    className={styles.reactionIcon}
                  />
                  {currentLikeCount > 0 ? (
                    <span className={styles.reactionLabel}>
                      {currentLikeCount.toLocaleString()}
                    </span>
                  ) : (
                    <span className={styles.reactionLabel}>좋아요</span>
                  )}
                </li>
                <li>
                  <img
                    src={
                      currentVideoId && dislikes[currentVideoId]
                        ? thumbDownIcon
                        : thumbDownOutlinedIcon
                    }
                    alt="thumbDown"
                    onClick={handleThumbDownClick}
                    className={styles.reactionIcon}
                  />
                  <span className={styles.reactionLabel}>관심 없음</span>
                </li>
                <li>
                  <img
                    src={
                      currentVideoId && bookmarkedVideos[currentVideoId]
                        ? starIcon
                        : starOutlinedIcon
                    }
                    alt="bookmark"
                    onClick={handleStarClick}
                    className={styles.reactionIcon}
                  />
                  <span className={styles.reactionLabel}>북마크</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.arrowWrap}>
            <ul>
              <li>
                <img
                  src={arrowIcon}
                  alt="prev"
                  className={styles.arrowTop}
                  onClick={handlePrev}
                />
              </li>
              <li>
                <img
                  src={arrowIcon}
                  alt="next"
                  className={styles.arrowBottom}
                  onClick={handleNext}
                />
              </li>
            </ul>
          </div>

          {isFolderOpen && (
            <div className={styles.folderModal} style={{ bottom: "120px" }}>
              <div className={styles.folderInputWrap}>
                <input
                  type="text"
                  className={styles.folderInput}
                  placeholder="새 폴더 이름"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <button className={styles.folderBtn} onClick={handleAddFolder}>
                  +
                </button>
              </div>
              <ul className={styles.folderList}>
                {folders.length === 0 ? (
                  <li className={styles.emptyFolder}>폴더가 없습니다.</li>
                ) : (
                  folders.map((folder) => (
                    <li
                      key={folder.folderId}
                      className={styles.folderItem}
                      onClick={() => handleSaveFolder(folder)}
                    >
                      <span className={styles.folderName}>
                        {folder.folderName}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {isLoginModalOpen && (
          <div
            className={styles.loginModalOverlay}
            onClick={() => setIsLoginModalOpen(false)}
          >
            <div
              className={styles.loginModal}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>로그인이 필요합니다</h2>
              <button
                onClick={() =>
                  navigate("/login", {
                    state: { from: location.pathname + location.search },
                  })
                }
              >
                로그인
              </button>
            </div>
          </div>
        )}

        {showToast && (
          <div className={styles.toastWrapper}>
            <div className={styles.toast}>{toastMsg}</div>
          </div>
        )}
      </div>
    </>
  );
}

export default ShortsVideoPage;
