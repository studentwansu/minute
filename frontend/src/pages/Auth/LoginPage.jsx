import { Link, useLocation, useNavigate } from "react-router-dom";
import img from "../../assets/images/loginBg1.png";
import styles from "../../assets/styles/LoginPage.module.css";

import axios from "axios";
import { useState } from "react";

function LoginPage() {
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 전 받았던 “from” 경로가 없으면 기본 루트("/")로 보낸다
  const from = location.state?.from || "/";

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      // 로그인 요청
      const response = await axios.post(
        "http://localhost:8080/api/v1/auth/sign-in",
        { userId, userPw },{
      headers: {
        'Content-Type': 'application/json'
      },
         withCredentials: true 
    });

      const token = response.data.token;
      localStorage.setItem("userId", userId);
      localStorage.setItem("token", token);


      // 사용자 정보 조회
      const userInfoRes = await axios.get(
        `http://localhost:8080/api/v1/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const data = userInfoRes.data;

      if (data.code === "SU") {
        const userRole = data.role ?? "USER"; 
        if (userRole === "ADMIN") {
          navigate("/admin",{ replace: true }); // 관리자 페이지로 이동
        } else {
          navigate("/"); // 일반 사용자 홈으로 이동
            // 로그인 성공 후, 원래 페이지로 되돌려 보낸다
          navigate(from, { replace: true });
        }
      } else {
        setErrorMsg("사용자 정보를 불러오는 데 실패했습니다.");
      }
    } catch (err) {
      console.error(err);

      if (err.response && err.response.data) {
        const serverMsg = err.response.data.message;

        if (serverMsg === "정지된 계정입니다.") {
          setErrorMsg("정지된 계정입니다. 관리자에게 문의하세요.");
        } else {
          switch (err.response.data.code) {
            case "SF":
              setErrorMsg("존재하지 않는 아이디입니다.");
              break;
            case "IP":
              setErrorMsg("비밀번호가 올바르지 않습니다.");
              break;
            case "VF":
              setErrorMsg("입력값이 올바르지 않습니다.");
              break;
            default:
              setErrorMsg(serverMsg || "로그인 실패: 알 수 없는 오류입니다.");
          }
        }
      } else {
        setErrorMsg("서버와 통신할 수 없습니다.");
      }
    }
  };

  return (
    <form onSubmit={handleSignIn} className={styles.loginWrap}>
      <div className={styles.backImg}>
        <img className={styles.img1} src={img} alt="Login Background" />
      </div>
      <div className={styles.loginBox}>
        <Link to="/">
          <h1 className={styles.logo}>MIN:UTE</h1>
        </Link>

        <input
          type="text"
          value={userId}
          placeholder="Id"
          onChange={(e) => setUserId(e.target.value)}
          className={styles.input}
          required
          autoComplete="username"
          aria-label="User ID"
        />
        <input
          type="password"
          value={userPw}
          placeholder="Password"
          onChange={(e) => setUserPw(e.target.value)}
          className={styles.input1}
          required
          autoComplete="current-password"
          aria-label="Password"
        />

        {errorMsg && <div className={styles.err}>{errorMsg}</div>}

        <button className={styles.btn} type="submit">
          Login
        </button>

        <div className={styles.links}>
          <Link to="/findid">아이디찾기</Link> |{" "}
          <Link to="/findpwd">비밀번호찾기</Link> |{" "}
          <Link to="/SignUpForm">회원가입</Link>
        </div>
      </div>
    </form>
  );
}

export default LoginPage;