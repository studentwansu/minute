import axios from 'axios';
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/LO3.png";
import HamburgerMenu from "./HamburgerMenu";
import HeaderStyle from "./Header.module.css";


function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

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

  //로그아웃
  const handleLogout = () => {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  setUserId('');  // userId 초기화 추가
  window.location.href = "/";
};

  return (
    <div className={HeaderStyle.header}>
      <div className={HeaderStyle.container}>
        <div className={HeaderStyle.icons}>
          <Link to="/" onClick={handleLogoClick}>
            <img src={logo} alt="logo" className={HeaderStyle.logo} />
          </Link>
          <HamburgerMenu isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
        <div className={HeaderStyle.auth}>
          {isLoggedIn === null ? null : isLoggedIn ? (
            <>
              <p className={HeaderStyle.id}>{userId}님 환영합니다!</p>
              <p onClick={handleLogout} className={HeaderStyle.logout}>로그아웃</p>
              <Link to="/mypage">
                <p className={HeaderStyle.mypage}>마이페이지</p>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <p className={HeaderStyle.login}>로그인</p>
              </Link>
              <Link to="/signupform">
                <p className={HeaderStyle.signup}>회원가입</p>
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Header;
