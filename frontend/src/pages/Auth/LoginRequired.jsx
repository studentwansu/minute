import img from '../../assets/images/waring.png';
import styles from "../../assets/styles/LoginRequired.module.css";

const LoginRequired = () => {
  return (
    <div className={styles.container}>
      <div className={styles.boxf}>
      <h1 className={styles.logo}>MIN:UTE</h1>
      <div className={styles.keyimg}>
            <img className={styles.img1} src={img}/>
        </div>
      <h2 className={styles.title}>로그인이 필요합니다</h2>
      <div className={styles.box}>
        <p>해당 서비스는 로그인이 필요합니다.<br />
        MIN:UTE 에 가입하여 다양한 서비스를 이용하세요.</p>
      </div>
      <button className={styles.button}>Login</button>
    </div>
    </div>
  );
};

export default LoginRequired;