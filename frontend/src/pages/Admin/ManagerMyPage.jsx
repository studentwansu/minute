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

  const [qnaCount, setQnaCount] = useState(0);         
  const [noticeCount, setNoticeCount] = useState(0);   


  useEffect(() => {

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


  axios.get("http://localhost:8080/api/v1/user/all")
    .then(res => {
      const userList = res.data.body.userList || [];
      setTotalUsersCount(userList.length);

      const reportedCount = userList.filter(user => (user.userReport || 0) >= 1).length;
      setReportedUsersCount(reportedCount);
    })
    .catch(err => {
      console.error("회원 목록 조회 실패:", err);
    });

    axios.get("http://localhost:8080/api/v1/mypage/admin/stats", {
      headers: { 
        Authorization: `Bearer ${token}`,
      }
    })
    .then(res => {
      const statsData = res.data; 
      setQnaCount(statsData.qnaCount);
      setNoticeCount(statsData.noticeCount);
    })
    .catch(err => {
      console.error("관리자 통계 정보 조회 실패:", err);

    });


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
              <div>문의수<br /><strong>{qnaCount}건</strong></div> 
              <div>공지사항수<br /><strong>{noticeCount}건</strong></div> 
              <div>신고회원<br /><strong>{reportedUsersCount}명</strong></div>
            </div>

            
          </main>
        </div>
      </div>
      
</>

  );
};

export default ManagerMyPage;
