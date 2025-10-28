import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import deleteIcon from "../../assets/images/searchDelete.png";
import divStyle from "./SearchBar.module.css";

  // 지역명과 페이지 슬러그 매핑
  const regionList = [
    {name:"경기도", slug:"gyeonggido"},
    {name:"강원도", slug:"gangwondo"},
    {name:"경상북도", slug:"gyeongsangbuk"},
    {name:"경상남도", slug:"gyeongsangnam"},
    {name:"충청북도", slug:"chungcheongbuk"},
    {name:"충청남도", slug:"chungcheongnam"},
    {name:"전라북도", slug:"jeollabuk"},
    {name:"전라남도", slug:"jeollanam"},
    {name:"제주도", slug:"jeju"},
    {name:"부산", slug:"busan"},
    {name:"서울", slug:"seoul"},
  ]

/**
 *  @param {{ showTitle?: boolean; compact?: boolean; className?: string; textboxClassName?: string }} props
 *  - showTitle: 타이틀 표시 여부 (기본 true)
 *  - compact: compact 모드일 때 CSS 변화 (기본 false)
 *  - className: 추가 컨테이너 클래스
 *  - textboxClassName: textbox에 추가할 클래스
 */

function SearchBar({showTitle=true, compact = false, className = '', textboxClassName =''}) {
  
  const token = localStorage.getItem("token") || "";
  const userId = localStorage.getItem("userId") || "";
  const isLoggedIn = Boolean(token && userId);

  const containerRef = useRef(null); // 검색창 영역, 바깥영역 클릭했을 때 드롭다운을 닫기 위해 
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");  // 검색 입력값
  const [recent,setRecent] = useState([]); // 최근 검색어 리스트 
  const [popular, setPopular] = useState([]); // 인기 검색어 리스트
  const [open, setOpen] = useState(false);  // 드롭다운 여부
  const [isSearching, setIsSearching] = useState(false);  // 검색여부

  // container , textbox 클래스 조합
   const containerClass = [
    divStyle.search,
    compact ? divStyle.searchCompact : '',
    className
  ].filter(Boolean).join(' ');

  const textboxClass = [
    divStyle.textbox,
    compact ? divStyle.textboxCompact : '',
    textboxClassName
  ].filter(Boolean).join(' ');


  // 검색창 클릭시 최근,인기검색어 조회
  const loadSuggestions = async() => {
    // 로그인 안된 경우 최근 검색어,
    if (!isLoggedIn) {
      // 비로그인 시: popular만 빈 배열이 아닌, API에서 받아오도록
    setRecent([]);    // 최근 검색어는 무조건 빈 배열
    
    try {
      const res = await axios.get("/api/v1/search/popular");
      // 백엔드에 popular 전용 엔드포인트를 하나 추가했다 가정
      setPopular(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
    } catch (err) {
      console.error("인기 검색어 조회 실패", err);
      setPopular([]);
    } finally {
      setOpen(true);
    }
    return;
  }
    // 로그인: recent + popular 둘 다 가져오기
    try {
    
      const res = await axios.get("/api/v1/search/suggestions", {
        params: {userId},
        headers:{Authorization:`Bearer ${token}`}
      });
      console.log("suggestions 응답:", res);
      
      const recentKeywords = Array.isArray(res.data.recentKeywords)
        ? res.data.recentKeywords.slice(0,5) : [] ;
      
      const popularKeywords = Array.isArray(res.data.popularKeywords)
        ? res.data.popularKeywords.slice(0,5) : [];

      console.log("recent",recentKeywords);
      console.log("popular",popularKeywords);
      
      setRecent(recentKeywords);
      setPopular(popularKeywords);
    }catch(err){
     console.error("검색 조회 실패:" , err);
     setRecent([]);
     setPopular([]);
    }finally{
      setOpen(true);
    }
  }

  // 검색 기록 저장 
  const saveSearch = async(term) => {
    console.log("saveSearch 호출", term); 
    try{
      await axios.post("/api/v1/search",
        {userId, keyword:term},
        {headers: {Authorization:`Bearer${token}`}})
    }catch(e){
      console.error("검색 저장 실패",e);
      
    }
  }

  // 검색 실행 또는 지역 페이지로 이동
  const handleSearchTerm = async(term) => {
    // 중복 호출 가드
    if (isSearching) return;
    setIsSearching(true);

    console.log("handleSearchTerm 호출");
    const kw = term ? term.trim() : searchInput.trim();
     if (!kw) {
      setIsSearching(false);
      return;
    }
    try {
    // 검색한건 다 저장
    await saveSearch(kw);

    // region에 해당하면 지역 페이지로, 아니라면 일반 검색 결과로
    const region = regionList.find((r) => r.name === kw);

     if (region && token) {
      // 로그인 상태 && 지역명인 경우 지역 페이지로
      // replace: true 옵션을 주면 “현재 히스토리”를 대체
      navigate(`/area/${region.slug}`);
    } else {
      // 로그인 안 했거나 일반 검색어인 경우 결과 페이지로
      navigate(`/search?query=${encodeURIComponent(kw)}`);
    }  
    // 입력값 유지 및 드롭다운 닫기
    setSearchInput(kw);
    setOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

   // 특정 검색 기록 삭제
  const handleDelete = async(searchId) => {
    try{
      await axios.delete(`/api/v1/search/history/${searchId}`,
        {
          headers: {Authorization: `Bearer ${token}`}
        }
      );
      loadSuggestions();
      // setRecent(prev => prev.filter(item => item.searchId !== searchId));
    }catch(e){
      console.error("삭제 실패", e);
      
    }
  }

   // 외부 클릭 시 드롭다운 닫기
  useEffect(()=>{
    const handleClickOutside =(e) =>{
      if(containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown",handleClickOutside);
    return () => document.removeEventListener("mousedown",handleClickOutside);
  },[]);

   return (
   <div className={containerClass} ref={containerRef}>
      {showTitle && <h1 className={divStyle.mainTitle}>MIN:UTE</h1>}
      <div className={textboxClass}>
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          className={divStyle.searchInput}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={loadSuggestions}
          // onKeyDown={e=> e.key === "Enter" && handleSearchTerm()}
          onKeyUp={e => {
            if (e.key === "Enter") {
              handleSearchTerm();
            }
          }}
        />
        {open && (
          <div className={divStyle.dropdown}>
            <div className={divStyle.section}>
              <div className={divStyle.sectionTitle}>최근 검색어</div>
              {recent.length > 0 
                ? recent.map(item => (
                  <div key={item.searchId} 
                  className={divStyle.suggestionItem}
                  onClick={()=>{handleSearchTerm(item.keyword)}}>
                    <span>{item.keyword}</span>
                    <button 
                    className={divStyle.deleteButton}
                    onClick={(e)=>{
                      e.stopPropagation();
                      handleDelete(item.searchId);
                    }}>
                      <img src={deleteIcon} alt="삭제" className={divStyle.deleteIcon} />
                    </button>
                  </div>
                )
              ) : (
                <div className={divStyle.empty}>검색 기록이 없습니다</div>
              )}
            </div>
            <div className={divStyle.section}>
              <div className={divStyle.sectionTitle}>인기 검색어</div>
              {popular.length > 0 ?
                popular.map((keyword, idx) => (
                  <div
                    key={idx}
                    className={divStyle.suggestionItem}
                    onClick={() => {
                      handleSearchTerm(keyword)
                    }}
                  >
                    {keyword}
                  </div>
            )) : (
              <div className={divStyle.empty}>인기 검색어가 없습니다.</div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default SearchBar;
