import { Link, useLocation } from "react-router-dom";
import styles from '../../assets/styles/SuccessID.module.css';


function SuccessID() {
  const location = useLocation();
  const { userId } = location.state || {};
  return (
    <div className={styles.container}>
    
      <div className={styles.wrapper}>
        <h1 className={styles.title}>아이디 찾기 성공!</h1>

        <h1 className={styles.content}>회원님의 아이디</h1>
        <h1 className={styles.content2}>{userId}</h1>

        <Link to="/login" className={styles.submitBtn}>
          Login
        </Link>
        <Link to="/findpwd" className={styles.pwdBtn}>
          비밀번호 찾기
        </Link>
      </div>
    </div>
  );
}

export default SuccessID;
