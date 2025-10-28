import { Link } from "react-router-dom";
import styles from "../../assets/styles/SignUpForm.module.css";

const SignupComplete = () => {

  return (
    <div className={styles.pageWrapper}>
    <div className={styles.container}>
  
      <div className={styles.content2}>
        <h1 className={styles.title2}>Sign Up</h1>

        <div className={styles.progressBar}>
          <div className={styles.circle}></div>
          <div className={styles.line}></div>
          <div className={styles.circle}></div>
          <div className={styles.line}></div>
          <div className={styles.circleActive}></div>
        </div>

        <div className={styles.textBox2}>
          <p className={styles.mainText}>회원가입이 완료되었습니다.</p>
          <p className={styles.subText}>로그인 후 MIN:UTE의 다양한 서비스를 이용하실 수 있습니다.</p>
        </div>
        <Link to="/login" className={styles.loginButton}>
          Login
        </Link>

      </div>
    </div>
    </div>
  );
};

export default SignupComplete;
