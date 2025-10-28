import axios from 'axios';
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/LO3.png";
import HeaderStyle from "./adminHeader.module.css"; // CSS 모듈 경로 확인

function AdminHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();


  //로그아웃
  const handleLogout = () => {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  setUserId('');  // userId 초기화 추가
  window.location.href = "/login";
  };
  

  // 키보드로도 로그아웃을 실행할 수 있도록 하는 핸들러
  const handleLogoutKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleLogout();
    }
  };

    //토큰으로 로그인 상태 관리
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // 로고 클릭 시 메뉴바 닫기
  const handleLogoClick = () => {
    setIsOpen(false);
  };

  //사용자 정보 가져오기
useEffect(() => {
  if (!isLoggedIn) {
    setUserId('');
    return;
  }

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://localhost:8080/api/v1/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      setUserId(response.data.userId);
    } catch (error) {
      console.error('로그인 사용자 정보 불러오기 실패:', error);
    }
  };

  fetchUser();
  }, [isLoggedIn]);

  return (
    <div className={HeaderStyle.header}>
      <div className={HeaderStyle.container}>
        <div className={HeaderStyle.icons}>
          <Link to="/admin">
            <img src={logo} alt="logo" className={HeaderStyle.logo} />
          </Link>
        </div>
        <div className={HeaderStyle.auth}>
          {isLoggedIn === null || userId === null ? null : isLoggedIn ? (
            <>
              <p className={HeaderStyle.welcomeMessage}>
                {userId} 관리자님 환영합니다!
              </p>
              <p
                onClick={handleLogout}
                onKeyDown={handleLogoutKeyPress}
                className={HeaderStyle.logoutLink}
                role="button"
                tabIndex={0}
              >
                로그아웃
              </p>
            </>
          ) : (
            <Link to="/login">
              <p className={HeaderStyle.login}>로그인</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminHeader;