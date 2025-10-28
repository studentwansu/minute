import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import styles from "../../assets/styles/ManagerMyPage.module.css";

const ManagerMyPage = () => {
  const [userInfo, setUserInfo] = useState(null);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [reportedUsersCount, setReportedUsersCount] = useState(0);

  const [qnaCount, setQnaCount] = useState(0);         // 문의 수 상태
  const [noticeCount, setNoticeCount] = useState(0);   // 공지사항 수 상태

  //사용자 정보 조회
  useEffect(() => {
  // 사용자 정보 요청
  axios.get(`http://localhost:8080/api/v1/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true
  })
    .then(res => {
      const data = res.data;
      if (data.code === "SU") {
        setUserInfo({
          userName: data.userName,
          userNickName: data.userNickName,
          userPhone: data.userPhone,
          profileImage: data.profileImage,
          userEmail: data.userEmail
        });
      } else {
        alert("사용자 정보를 불러오는데 실패했습니다.");
      }
    })
    .catch(() => alert("서버와 연결 실패"));

  // 전체 회원 수 요청
  axios.get("http://localhost:8080/api/v1/user/all")
    .then(res => {
      const userList = res.data.body.userList || [];
      setTotalUsersCount(userList.length);

      // 신고 회원 수 계산
      const reportedCount = userList.filter(user => (user.userReport || 0) >= 1).length;
      setReportedUsersCount(reportedCount);
    })
    .catch(err => {
      console.error("회원 목록 조회 실패:", err);
    });

     // --- 🚨 2. 이 부분을 추가하세요 ---
    // 문의 수 및 공지사항 수 요청 (관리자 권한 필요)
    axios.get("http://localhost:8080/api/v1/mypage/admin/stats", {
      headers: { // 이 API 호출에 필요한 헤더를 독립적으로 설정합니다.
        Authorization: `Bearer ${token}`,
      }
    })
    .then(res => {
      const statsData = res.data; // { "qnaCount": 19, "noticeCount": 3 } 형태의 응답
      setQnaCount(statsData.qnaCount);
      setNoticeCount(statsData.noticeCount);
    })
    .catch(err => {
      console.error("관리자 통계 정보 조회 실패:", err);
      // 통계 정보 로드 실패 시 사용자에게 알리지 않고 콘솔에만 기록 (선택적)
    });
    // --- 🚨 추가 끝 ---

}, [userId, token]);


  return (
    <>

      <div className={styles.container}>
        <div className={styles.main}>

          <main className={styles.mypage}>
            <h2>마이페이지</h2>
           <div className={styles.box}>
              <div
                className={styles.img2}
                style={{
                  backgroundImage: `url(${
                    userInfo?.profileImage
                      ? `http://localhost:8080${userInfo.profileImage}`
                      : "프로필 사진을 지정해 보세요"
                  })`,
                }}
              />
              <div>
                <p>{userInfo?.userName || "이름"} 관리자 님</p>
                <p>{userInfo?.userEmail || "이메일"}</p>
                <p>{userInfo?.userPhone || "전화번호"}</p>
                <div className={styles.buttons}>
                  <button>
                    <Link to="/checkinfo">정보 수정</Link>
                  </button>
                  <button>
                    <Link to="/">사용자 페이지</Link>
                  </button>
                </div>
              </div>
          </div>
            <div className={styles.stats}>
              <div>회원수<br /><strong>{totalUsersCount}명</strong></div>
              {/* --- 🚨 하드코딩된 숫자 상태 변수로 변경 --- */}
              <div>문의수<br /><strong>{qnaCount}건</strong></div> 
              <div>공지사항수<br /><strong>{noticeCount}건</strong></div> 
              {/* --- 🚨 변경 끝 --- */}
              <div>신고회원<br /><strong>{reportedUsersCount}명</strong></div>
            </div>

            
          </main>
        </div>
      </div>
      
</>

  );
};

export default ManagerMyPage;
