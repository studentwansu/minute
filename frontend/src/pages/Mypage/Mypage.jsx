import axios from 'axios';
import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link } from "react-router-dom";
import calStyles from "../../assets/styles/CalendarPage.module.css";
import '../../assets/styles/MyCalendar.css';
import styles from "../../assets/styles/Mypage.module.css";
import MypageNav from "../../components/MypageNavBar/MypageNav";
import FiveDayForecast from '../Calendar/FiveDayForecast';

function Mypage2() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const [userInfo, setUserInfo] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8080/api/v1/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }, withCredentials: true
    })
      .then(res => {
        console.log(res.data);

        const data = res.data;


        if (data.code === "SU") {
          setUserInfo({
            userName: data.userName,
            userNickName: data.userNickName,
            profileImage: data.profileImage,
            userPhone: data.userPhone,
            userEmail: data.userEmail
          });

        } else {
          alert("사용자 정보를 불러오는데 실패했습니다.");
        }
      })
      .catch(() => alert("서버와 연결 실패"));
  }, [userId, token]);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA');
  })

  const [dailyData, setDailyData] = useState({
    plans: []
  });

  // 선택된 날짜
  const [value, onChange] = useState(new Date());
  // 보이는 달(월 초)가 바뀔 때 업데이트
  const [activeStartDate, setActiveStartDate] = useState(value);
  // dot 데이터
  const [dotData, setDotData] = useState({});

  // 날짜 포맷 맞춰주는 함수 (yyyy-mm-dd)
  const formatDate = date => date.toLocaleDateString('en-CA');

  // 달 변경 시 dotData 가져오기
  useEffect(() => {
    if (!token) return;
    const yearMonth = `${activeStartDate.getFullYear()}-${String(activeStartDate.getMonth() + 1).padStart(2, '0')}`;

    fetch(`http://localhost:8080/api/v1/mypage/dots?yearMonth=${yearMonth}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(dataArray => {
        console.log("raw dotData: ", dataArray);
        // 배열을 {'2025-05-20':'plan',...} 형태의 map으로 변환
        const map = dataArray.reduce((acc, { date, type }) => {
          acc[date] = type;
          return acc;
        }, {});
        console.log('mapped dotData:', map)
        setDotData(map);
      })
      .catch(err => console.error("dot 불러오기 실패", err));
  }, [activeStartDate, token]);

  // 선택된 날짜 변경 시 plans 가져오기
  useEffect(() => {
    if (!token || !selectedDate) return;

    fetch(
      `http://localhost:8080/api/v1/mypage/plans?date=${selectedDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(plansArray => {
        console.log("plans 확인: ", plansArray);
        setDailyData({
          plans: Array.isArray(plansArray) ? plansArray : []
        });
      })
      .catch(err => console.error("마이페이지 일정 불러오기 실패", err));
  }, [selectedDate, token]);

  // 이미지 유효성 검사 함수
  const hasValidImage = (img) => {
    return img && typeof img === "string" && img.trim() !== "" && img.trim() !== "null" && img.trim() !== "undefined";
  };

  if (!userInfo) {
    return <div>로딩중...</div>;
  }

  return (
    <>
      <MypageNav />
      <div className={styles.layout}>
        <div className={styles.container}>
          <div className={styles.leftWrap}>
            <div className={styles.profileWrap}>
              <div className={styles.profileContent}>
                <div className={styles.profile}>
                  <h1 className={styles.profileNickName}>{userInfo?.userNickName || "닉네임"} 님</h1>
                  <div className={styles.profileImg}>
                    {(!imgError && (hasValidImage(profileImage) || hasValidImage(userInfo.profileImage))) ? (
                      <img
                        className={styles.img2}
                        src={hasValidImage(profileImage) ? profileImage : `http://localhost:8080${userInfo.profileImage}?t=${Date.now()}`}
                        alt="프로필"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className={styles.defaultProfile}>
                        프로필 사진을<br />업로드 하세요
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>{userInfo?.userName || "이름"}</p>
                  <p className={styles.profileNumber}>{userInfo?.userPhone || "전화번호"}</p>
                  <p className={styles.profileEmail}>{userInfo?.userEmail || "이메일"}</p>
                </div>

              </div>
              <div className={styles.profileNavbar}>
                <ul>
                  {/* 여기다가 링크 연결하세요 */}
                  <li>
                    <Link to="/checkinfo">정보수정</Link>
                  </li>
                  <li>
                    <Link to="/freeboard?tab=myActivity">내가쓴글</Link>
                  </li>
                  <li>
                    <Link to="/qna">나의문의</Link>
                  </li>
                  <li>
                    <Link to="/bookmark">북마크</Link>
                  </li>
                  <li>
                    <Link to="/Like">기록</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className={styles.planWrap}>
              <div className={styles.planLeftWrap}>
                <div className={styles.calendar}>
                  <Calendar
                    locale="en"
                    onChange={date => {
                      onChange(date);
                      setSelectedDate(formatDate(date));
                    }}
                    value={value}
                    // ② 달 네비게이션(<,>) 클릭 시 호출
                    onActiveStartDateChange={({ activeStartDate }) => {
                      setActiveStartDate(activeStartDate);
                    }}
                    next2Label={null}
                    prev2Label={null}
                    showNeighboringMonth={false}
                    tileContent={({ date, view }) => {
                      if (view !== 'month') return null;
                      const key = formatDate(date);
                      const type = dotData[key];
                      if (!type) return null;

                      return (
                        <div className="dot-container">
                          {(type === 'plan' || type === 'both') && <div className="dot plan-dot" />}
                          {(type === 'checklist' || type === 'both') && <div className="dot checklist-dot" />}
                        </div>
                      );
                    }}
                  />
                </div>
                <div className={styles.planList}>
                  <FiveDayForecast />
                </div>
              </div>
              <div className={styles.planRightWrap}>
                <button className={styles.editButton}>
                  <Link to={`/calendar?date=${selectedDate}`}>
                    <img src="/src/assets/images/editing.png" alt="수정" />
                  </Link>
                </button>
                {/* 선택된 날짜의 일정 미리보기 */}
                <div className={styles.plan}>
                  {dailyData.plans.length === 0
                    ? <p>등록된 일정이 없습니다.</p>
                    : // 문자열 "HH:MM" 포맷이므로 localeCompare 만으로도 순서대로 정렬이 가능합니다.
                    [...dailyData.plans]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(plan => (
                        <div
                          key={plan.planId}
                          className={calStyles.planCard}
                          style={{ background: '#FADADD', marginBottom: '8px' }}
                        >
                          <h4 className={calStyles.planTitle}>{plan.title}</h4>
                          <small className={calStyles.planTime}>
                            {plan.startTime.slice(0, 5)} - {plan.endTime.slice(0, 5)}
                          </small>
                        </div>
                      ))
                  }

                </div>
              </div>
            </div>
          </div>
          <div className={styles.rightWrap}>
            <div className={styles.mapWrap}>
              <ul>
                <li className={styles.mapItem}>
                  <Link to="/area/gyeonggido" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/1.png" alt="맵 경기도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/gangwondo" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/2.png" alt="맵 강원도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/gyeongsandbuk" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/3.png" alt="맵 경상북도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/chungcheongbuk" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/4.png" alt="맵 충청북도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/chungcheongnam" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/5.png" alt="맵 충청남도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/jeollabuk" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/6.png" alt="맵 전라북도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li>
                  <img src="/src/assets/images/7.png" alt="맵 " />
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/gyeongsangnam" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/8.png" alt="맵 경상남도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/jeollanam" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/9.png" alt="맵 전라남도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
                <li className={styles.mapItem}>
                  <Link to="/area/jeju" className={styles.linkStyle}>
                    <div className={styles.imageWrapper}>
                      <img src="/src/assets/images/10.png" alt="맵 제주도" />
                      <button className={styles.mapButton}></button>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Mypage2;